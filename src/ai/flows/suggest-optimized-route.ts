'use server';

/**
 * @fileOverview A route optimization AI agent.
 *
 * - suggestOptimizedRoute - A function that handles the route optimization process.
 * - SuggestOptimizedRouteInput - The input type for the suggestOptimizedRoute function.
 * - SuggestOptimizedRouteOutput - The return type for the suggestOptimizedRoute function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const SuggestOptimizedRouteInputSchema = z.object({
  destination: z.string().describe('The final destination of the route.'),
  via: z.string().optional().describe('The first stop on the route, if applicable.'),
  currentLocation: z.string().describe('The current location of the truck.'),
  trafficData: z.string().optional().describe('Real-time traffic data, if available.'),
});
export type SuggestOptimizedRouteInput = z.infer<
  typeof SuggestOptimizedRouteInputSchema
>;

const SuggestOptimizedRouteOutputSchema = z.object({
  optimizedRoute: z.string().describe('The suggested optimized route.'),
  estimatedTime: z.string().describe('The estimated time of arrival for the optimized route.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the suggested route optimization.'),
  roadWarnings: z.string().optional().describe('A summary of any warnings, accidents, or significant traffic issues on the suggested route. If there are no issues, this should state "No significant warnings."'),
  warningLevel: z.enum(['none', 'moderate', 'severe']).describe('A classification of the warning severity. "none" for no issues, "moderate" for traffic or minor delays, "severe" for accidents or road closures.'),
});
export type SuggestOptimizedRouteOutput = z.infer<
  typeof SuggestOptimizedRouteOutputSchema
>;

export async function suggestOptimizedRoute(
  input: SuggestOptimizedRouteInput
): Promise<SuggestOptimizedRouteOutput> {
  // Initialize Genkit and the Google AI plugin directly within the server action.
  // This ensures a clean, isolated configuration for each execution.
  const ai = genkit({
    plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  });

  const promptText = `You are a route optimization expert for a logistics company. Your goal is to provide the best route for a truck driver.

Here are the details for the current trip:
- Destination: ${input.destination}
- Current Location: ${input.currentLocation}
${input.via ? `- Via (first stop): ${input.via}` : ''}
${input.trafficData ? `- Current Traffic Information: ${input.trafficData}` : ''}

Based on this information, provide the optimized route, estimated time, your reasoning, a summary of road warnings, and a warning level.`;

  try {
    const response = await ai.generate({
      model: 'gemini-pro', // Using the stable 'gemini-pro' model.
      prompt: promptText,
      config: {
        response: {
            format: 'json',
            schema: SuggestOptimizedRouteOutputSchema
        },
      },
    });

    const output = response.output();
    
    if (!output) {
      throw new Error('AI returned an empty response.');
    }

    // The output is already a valid JSON object because we requested it.
    // We just need to validate it with Zod.
    const validationResult = SuggestOptimizedRouteOutputSchema.safeParse(output);
    if (!validationResult.success) {
      console.error("AI output validation failed:", validationResult.error);
      throw new Error("AI returned data in an invalid format.");
    }
    
    return validationResult.data;

  } catch (e: any) {
    console.error('Genkit execution failed:', e);
    // Re-throw a more user-friendly error to be caught by the client-side caller.
    throw new Error(`Route optimization failed: ${e.message}`);
  }
}
