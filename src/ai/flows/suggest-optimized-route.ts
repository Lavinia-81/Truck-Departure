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
import { googleAI } from '@genkit-ai/google-genai';

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
  return await suggestOptimizedRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimizedRoutePrompt',
  model: 'gemini-1.5-flash-preview',
  input: {schema: SuggestOptimizedRouteInputSchema},
  output: {schema: SuggestOptimizedRouteOutputSchema},
  prompt: `You are an AI-powered route optimization expert. Your task is to analyze the provided route details and traffic information to suggest the most efficient path.

Your primary focus is to identify and report any significant road warnings. This includes accidents, road closures, heavy congestion, or any other event that could cause major delays.

Destination: {{{destination}}}
Via (First Stop): {{{via}}}
Current Location: {{{currentLocation}}}
Traffic Data: {{{trafficData}}}

Based on this, provide:
1.  An optimized route.
2.  An estimated time of arrival.
3.  A summary of your reasoning.
4.  A clear and concise summary of all major road warnings. If there are no issues, explicitly state "No significant warnings."
5.  A 'warningLevel'. Use 'severe' for major issues like accidents or closures. Use 'moderate' for heavy traffic or minor works. Use 'none' if there are no significant issues.
`,
});

const suggestOptimizedRouteFlow = ai.defineFlow(
  {
    name: 'suggestOptimizedRouteFlow',
    inputSchema: SuggestOptimizedRouteInputSchema,
    outputSchema: SuggestOptimizedRouteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
