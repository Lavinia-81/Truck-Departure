'use server';

/**
 * @fileOverview A route optimization AI agent.
 *
 * - suggestOptimizedRoute - A function that handles the route optimization process.
 * - SuggestOptimizedRouteInput - The input type for the suggestOptimizedRoute function.
 * - SuggestOptimizedRouteOutput - The return type for the suggestOptimizedRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return suggestOptimizedRouteFlow(input);
}


const routeOptimizationPrompt = ai.definePrompt(
  {
    name: 'routeOptimizationPrompt',
    input: { schema: SuggestOptimizedRouteInputSchema },
    output: { schema: SuggestOptimizedRouteOutputSchema },
    prompt: `You are a route optimization expert for a logistics company. Your goal is to provide the best route for a truck driver.

Here are the details for the current trip:
- Destination: {{{destination}}}
- Current Location: {{{currentLocation}}}
{{#if via}}- Via (first stop): {{{via}}}{{/if}}
{{#if trafficData}}- Current Traffic Information: {{{trafficData}}}{{/if}}

Based on this information, provide the optimized route, estimated time, your reasoning, a summary of road warnings, and a warning level.`,
    config: {
        response: {
            format: 'json',
        }
    }
  },
);


const suggestOptimizedRouteFlow = ai.defineFlow(
  {
    name: 'suggestOptimizedRouteFlow',
    inputSchema: SuggestOptimizedRouteInputSchema,
    outputSchema: SuggestOptimizedRouteOutputSchema,
  },
  async input => {
    // A simple retry mechanism can be added here if needed, but for now, we'll keep it direct.
    try {
        const { output } = await routeOptimizationPrompt(input);
        if (!output) {
            throw new Error('AI returned an empty response.');
        }
        return output;
    } catch (e: any) {
        console.error('Genkit flow failed:', e);
        // Re-throw the error to be caught by the client-side caller
        throw new Error(`Route optimization failed: ${e.message}`);
    }
  }
);
