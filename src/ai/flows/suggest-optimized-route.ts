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

// Initialize Genkit AI instance with the API key from environment variables.
// Next.js automatically loads .env files into process.env.
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
});

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


const prompt = ai.definePrompt({
  name: 'suggestOptimizedRoutePrompt',
  input: { schema: SuggestOptimizedRouteInputSchema },
  output: { schema: SuggestOptimizedRouteOutputSchema },
  // =================================================================
  // === IMPORTANT: Model Name =======================================
  // =================================================================
  // This is the most stable and widely available model.
  // The 404 errors were likely due to configuration issues, not the model name.
  // If issues persist, verify the model name in your Google AI Studio account.
  //
  model: 'gemini-pro',
  // =================================================================

  prompt: `You are a truck route optimization expert. Analyze the following details and provide the best route.
- Current Location: {{{currentLocation}}}
- Destination: {{{destination}}}
{{#if via}}- Via: {{{via}}}{{/if}}
{{#if trafficData}}- Traffic Data: {{{trafficData}}}{{/if}}

Based on this, provide:
1.  **Optimized Route**: The most efficient route for a heavy goods vehicle.
2.  **Estimated Time**: The total estimated travel time.
3.  **Reasoning**: A brief explanation for your choice of route, considering traffic, road type, and potential stops.
4.  **Road Warnings**: A summary of current issues like accidents, closures, or heavy congestion. If none, state "No significant warnings."
5.  **Warning Level**: Classify the severity of the warnings as 'none', 'moderate', or 'severe'.`,
});

const suggestOptimizedRouteFlow = ai.defineFlow(
  {
    name: 'suggestOptimizedRouteFlow',
    inputSchema: SuggestOptimizedRouteInputSchema,
    outputSchema: SuggestOptimizedRouteOutputSchema,
  },
  async input => {
    // Check for API key at runtime to provide a clear error.
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
      throw new Error('The GEMINI_API_KEY is not configured. Please add it to your .env file.');
    }
    const { output } = await prompt(input);
    return output!;
  }
);
