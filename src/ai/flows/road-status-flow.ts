'use server';

/**
 * @fileOverview A route optimization AI agent.
 *
 * - suggestOptimizedRoute - A function that handles the route optimization process.
 * - SuggestOptimizedRouteInput - The input type for the suggestOptimizedRoute function.
 * - SuggestOptimizedRouteOutput - The return type for the suggestOptimizedRoute function.
 */
import { definePrompt } from "@genkit-ai/ai";

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

const retryPrompt = async (
  input: SuggestOptimizedRouteInput,
  retries = 3,
  delay = 1500
): Promise<SuggestOptimizedRouteOutput> => {
  for (let i = 0; i < retries; i++) {
    try {
      // Call the AI prompt; the SDK may return a string (JSON) or null.
      const prompt = `Optimize a truck route with the following details:
- Destination: ${input.destination}
- Current Location: ${input.currentLocation}
${input.via ? `- Via: ${input.via}` : ''}
${input.trafficData ? `- Traffic Data: ${input.trafficData}` : ''}
Please provide the optimized route, estimated time, reasoning, road warnings, and warning level.`;
      const response = await ai.prompt(prompt)();

      if (!response) {
        throw new Error('Empty response from AI');
      }

      // Parse the JSON string response
      return JSON.parse(response.text) as SuggestOptimizedRouteOutput;
    } catch (error: any) {
      if (error.message?.includes('503') && i < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Failed to get a valid response from AI after retries');
};

const suggestOptimizedRouteFlow = ai.defineFlow(
  {
    name: 'suggestOptimizedRouteFlow',
    inputSchema: SuggestOptimizedRouteInputSchema,
    outputSchema: SuggestOptimizedRouteOutputSchema,
  },
  async input => {
    const output = await retryPrompt(input);
    return output!;
  }
);
