'use server';
/**
 * @fileOverview A route optimization AI agent.
 * This file contains the server-side logic for analyzing a route and providing optimization suggestions.
 * It is designed to be used as a Next.js Server Action.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the road status analysis.
// This schema is used for validating the input data.
export const RoadStatusInputSchema = z.object({
  destination: z.string().describe('The final destination of the route.'),
  via: z.string().optional().describe('The first stop on the route, if applicable.'),
  collectionTime: z.string().describe("The truck's scheduled collection time in ISO format."),
});
export type RoadStatusInput = z.infer<typeof RoadStatusInputSchema>;

// Define the output schema for the road status analysis.
// This ensures the AI model returns data in a consistent, structured format.
export const RoadStatusOutputSchema = z.object({
  optimizedRoute: z.string().describe('The suggested optimized route.'),
  estimatedTime: z.string().describe('The estimated time of arrival for the optimized route.'),
  reasoning: z.string().describe('The reasoning behind the suggested route optimization.'),
  roadWarnings: z.string().optional().describe('A summary of any warnings, accidents, or significant traffic issues on the suggested route. If there are no issues, this should state "No significant warnings."'),
  warningLevel: z.enum(['none', 'moderate', 'severe']).describe('A classification of the warning severity. "none" for no issues, "moderate" for traffic or minor delays, "severe" for accidents or road closures.'),
});
export type RoadStatusOutput = z.infer<typeof RoadStatusOutputSchema>;


/**
 * Analyzes a route in real-time using an AI model.
 * This is a Server Action that can be called directly from client components.
 * @param input The route details, conforming to RoadStatusInput schema.
 * @returns A promise that resolves to the route analysis, conforming to RoadStatusOutput schema.
 */
export async function getRoadStatus(input: RoadStatusInput): Promise<RoadStatusOutput> {
  // Define the AI prompt with structured input and output.
  // This prompt instructs the AI on its role, the data it will receive, and the format of its response.
  const roadStatusPrompt = ai.definePrompt({
    name: 'roadStatusPrompt',
    input: { schema: RoadStatusInputSchema.extend({ currentTime: z.string() }) },
    output: { schema: RoadStatusOutputSchema },
    prompt: `As an expert route logistics AI for "The Very Group," your task is to provide a real-time route analysis.

Current Time: {{{currentTime}}}

Route Details:
- Final Destination: {{{destination}}}
{{#if via}}- Via (First Stop): {{{via}}}{{/if}}
- Scheduled Collection Time: {{{collectionTime}}}

Analyze the route from the depot (assume Widnes, UK) to the final destination, considering the collection time. Provide an optimized route, a realistic estimated time of arrival (ETA), any road warnings (like traffic, accidents, closures), and a warning level. The ETA should be calculated from the collection time. If 'via' is provided, include it in the route.

Provide your response in JSON format.`,
  });

  // Define the Genkit flow. A flow orchestrates the AI call.
  const roadStatusFlow = ai.defineFlow(
    {
      name: 'roadStatusFlow',
      inputSchema: RoadStatusInputSchema,
      outputSchema: RoadStatusOutputSchema,
    },
    async (flowInput) => {
      // Execute the prompt with the current time and the input from the client.
      const { output } = await roadStatusPrompt({
        ...flowInput,
        currentTime: new Date().toISOString(),
      });
      
      if (!output) {
        throw new Error("AI failed to generate a response.");
      }

      // Return the structured output from the AI.
      return output;
    }
  );

  // Run the flow with the input provided by the client.
  return await roadStatusFlow(input);
}
