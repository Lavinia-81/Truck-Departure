'use server';
/**
 * @fileOverview An AI flow to get road status for truck departures.
 *
 * - getRoadStatus - A function that gets the road status for a given destination.
 * - RoadStatusInput - The input type for the getRoadStatus function.
 * - RoadStatusOutput - The return type for the getRoadStatus function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';

const RoadStatusInputSchema = z.object({
  destination: z.string().describe('The final destination for the truck route.'),
});
export type RoadStatusInput = z.infer<typeof RoadStatusInputSchema>;

const RoadStatusOutputSchema = z.object({
  status: z.string().describe('A concise summary of the road conditions, traffic, and any expected delays.'),
  eta: z.string().describe('Estimated time of arrival, considering current conditions.'),
});
export type RoadStatusOutput = z.infer<typeof RoadStatusOutputSchema>;

export async function getRoadStatus(input: RoadStatusInput): Promise<RoadStatusOutput> {
  return roadStatusFlow(input);
}

const prompt = ai.definePrompt({
  name: 'roadStatusPrompt',
  input: { schema: RoadStatusInputSchema },
  output: { schema: RoadStatusOutputSchema },
  prompt: `You are a logistics AI assistant specializing in UK road traffic.

Your task is to provide a concise, real-time traffic report for a truck journey.

The departure point is always "The Very Group, Speke, Liverpool, UK".
The destination is: {{{destination}}}.

Based on current traffic data, road closures, and incidents, provide:
1.  A brief summary of the road status.
2.  An estimated time of arrival (ETA).

Keep the summary short and to the point.`,
});

const roadStatusFlow = ai.defineFlow(
  {
    name: 'roadStatusFlow',
    inputSchema: RoadStatusInputSchema,
    outputSchema: RoadStatusOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-preview-0514'),
      prompt: prompt.render({ input: input }).prompt,
      output: {
        schema: RoadStatusOutputSchema,
      },
    });

    return output!;
  }
);
