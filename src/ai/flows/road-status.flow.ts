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
  destination: z.string().describe('The final destination of the route, which is the assumed starting point for the driver returning to the depot.'),
  via: z.string().optional().describe('The first stop on the route, if applicable.'),
  collectionTime: z.string().describe("The truck's scheduled collection time in ISO format at the depot."),
});
export type RoadStatusInput = z.infer<typeof RoadStatusInputSchema>;

// Define the output schema for the road status analysis.
// This ensures the AI model returns data in a consistent, structured format.
export const RoadStatusOutputSchema = z.object({
  optimizedRoute: z.string().describe('The suggested route from the starting location to the depot.'),
  estimatedTime: z.string().describe('The estimated time of arrival at the depot (Widnes, UK).'),
  reasoning: z.string().describe('The reasoning behind the time estimate, including analysis of traffic and weather.'),
  roadWarnings: z.string().optional().describe('A summary of any warnings, accidents, or significant traffic or weather issues on the suggested route. If there are no issues, this should state "No significant warnings."'),
  warningLevel: z.enum(['none', 'moderate', 'severe']).describe('A classification of the warning severity. "none" for no issues, "moderate" for traffic or minor delays, "severe" for accidents, road closures, or severe weather.'),
});
export type RoadStatusOutput = z.infer<typeof RoadStatusOutputSchema>;

// Define the AI prompt with structured input and output.
// This prompt instructs the AI on its role, the data it will receive, and the format of its response.
const roadStatusPrompt = ai.definePrompt({
    name: 'roadStatusPrompt',
    input: { schema: RoadStatusInputSchema.extend({ currentTime: z.string() }) },
    output: { schema: RoadStatusOutputSchema },
    model: 'gemini-1.5-flash',
    prompt: `You are an expert logistics dispatcher for "The Very Group". Your goal is to determine if a driver will be late for their collection time at the depot in Widnes, UK.

Current Time: {{{currentTime}}}
Scheduled Collection Time at Depot: {{{collectionTime}}}
Driver's Assumed Current Location (their last destination): {{{destination}}}

Your task:
1.  Analyze the route FROM the driver's assumed current location ({{{destination}}}) TO the depot (Widnes, UK).
2.  Consider real-time traffic data AND current weather conditions along this route.
3.  Calculate the Estimated Time of Arrival (ETA) at the depot.
4.  Based on the ETA and the Scheduled Collection Time, determine if the driver will be late.
5.  Provide a clear "Reasoning" explaining your conclusion. Mention traffic, accidents, or weather if they are factors.
6.  Summarize any major issues in "Road Warnings".
7.  Classify the situation with a "WarningLevel".

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


/**
 * Analyzes a route in real-time using an AI model.
 * This is a Server Action that can be called directly from client components.
 * @param input The route details, conforming to RoadStatusInput schema.
 * @returns A promise that resolves to the route analysis, conforming to RoadStatusOutput schema.
 */
export async function getRoadStatus(input: RoadStatusInput): Promise<RoadStatusOutput> {
  // Run the pre-defined flow with the input provided by the client.
  return await roadStatusFlow(input);
}
