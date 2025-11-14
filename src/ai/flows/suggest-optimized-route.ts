'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';

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

const optimizationPrompt = ai.definePrompt(
  {
    name: 'routeOptimizationPrompt',
    inputSchema: SuggestOptimizedRouteInputSchema,
    outputSchema: SuggestOptimizedRouteOutputSchema,
    
    prompt: `You are a route optimization expert for a logistics company. Your goal is to provide the best route for a truck driver.
Based on this information, provide the optimized route, estimated time, your reasoning, a summary of road warnings, and a warning level.

Here are the details for the current trip:
- Destination: {{destination}}
- Current Location: {{currentLocation}}
{{#if via}}- Via (Stop): {{via}}{{/if}}
{{#if trafficData}}- Traffic Data: {{trafficData}}{{/if}}
`,
    
    config: {
      model: 'gemini-pro',
      response: {
        format: 'json'
      },
    },
  },
);

const suggestOptimizedRouteFlow = ai.defineFlow(
  {
    name: 'suggestOptimizedRouteFlow',
    inputSchema: SuggestOptimizedRouteInputSchema,
    outputSchema: SuggestOptimizedRouteOutputSchema,
  },
  async (input) => {
    const response = await optimizationPrompt.generate({
        input: input,
    });
    
    const output = response.output();
    if (!output) {
      throw new Error('AI failed to generate a response.');
    }
    return output;
  }
);


export async function suggestOptimizedRoute(
  input: SuggestOptimizedRouteInput
): Promise<SuggestOptimizedRouteOutput> {
  try {
    return await suggestOptimizedRouteFlow(input);
  } catch (e: any) {
    console.error('Genkit execution failed:', e);
    // Re-throw a more user-friendly error to be caught by the client-side caller.
    throw new Error(`Route optimization failed: ${e.message}`);
  }
}
