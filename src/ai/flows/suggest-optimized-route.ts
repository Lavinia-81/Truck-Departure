'use server';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { genkit, type GenkitError } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';


// Define input schema
const SuggestOptimizedRouteInputSchema = z.object({
  currentLocation: z.string().describe('The starting point of the route'),
  destination: z.string().describe('The final destination of the route'),
  via: z.string().optional().describe('An optional stop between the start and destination'),
  trafficData: z.string().optional().describe('A summary of current traffic conditions'),
});

export type SuggestOptimizedRouteInput = z.infer<typeof SuggestOptimizedRouteInputSchema>;

// Define output schema
const SuggestOptimizedRouteOutputSchema = z.object({
  optimizedRoute: z.string().describe('The suggested best route, including major highways and cities.'),
  estimatedTime: z.string().describe('The estimated travel time for the suggested route.'),
  reasoning: z.string().describe('A brief explanation for why this route was chosen.'),
  roadWarnings: z.string().describe('A summary of any potential road warnings, accidents, or closures.'),
  warningLevel: z.enum(['none', 'moderate', 'severe']).describe('A classification of the severity of the road warnings.'),
});

export type SuggestOptimizedRouteOutput = z.infer<typeof SuggestOptimizedRouteOutputSchema>;


async function retryPrompt<T>(
    prompt: string, 
    schema: z.ZodType<T>,
    maxRetries = 2
): Promise<T> {
    const ai = genkit({
        plugins: [
            googleAI({
                apiKey: process.env.GEMINI_API_KEY
            }),
        ],
        logLevel: 'debug',
        enableTracingAndMetrics: true,
    });

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await ai.generate({
                model: 'gemini-pro',
                prompt: prompt,
                config: {
                    response: {
                        format: 'json',
                        schema: schema,
                    },
                },
            });

            const output = response.output();
            if (!output) {
                throw new Error('Empty response from AI');
            }
            
            // Validate the output against the schema
            const parsed = schema.safeParse(output);
            if (parsed.success) {
                return parsed.data;
            } else {
                console.error('AI output validation failed:', parsed.error);
                throw new Error(`AI output did not match the required schema: ${parsed.error.message}`);
            }

        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === maxRetries - 1) {
                throw error; // Re-throw the last error
            }
        }
    }
    throw new Error('Failed to get a valid response from the AI after multiple retries.');
}


export async function suggestOptimizedRoute(
  input: SuggestOptimizedRouteInput
): Promise<SuggestOptimizedRouteOutput> {
  
  const promptText = `You are a route optimization expert for a logistics company. Your goal is to provide the best route for a truck driver.
Based on this information, provide the optimized route, estimated time, your reasoning, a summary of road warnings, and a warning level.

Here are the details for the current trip:
- Destination: ${input.destination}
- Current Location: ${input.currentLocation}
${input.via ? `- Via (Stop): ${input.via}` : ''}
${input.trafficData ? `- Traffic Data: ${input.trafficData}` : ''}
`;

  try {
    const result = await retryPrompt(promptText, SuggestOptimizedRouteOutputSchema);
    return result;
  } catch (e: any) {
    console.error('Genkit execution failed:', e);
    // Re-throw a more user-friendly error to be caught by the client-side caller.
    throw new Error(`Route optimization failed: ${e.message}`);
  }
}
