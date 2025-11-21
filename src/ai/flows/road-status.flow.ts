'use server';
/**
 * @fileOverview A plant problem diagnosis AI agent.
 *
 * - diagnosePlant - A function that handles the plant diagnosis process.
 * - DiagnosePlantInput - The input type for the diagnosePlant function.
 * - DiagnosePlantOutput - The return type for the diagnosePlant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const RoadStatusInputSchema = z.object({
  destination: z.string().describe('The final destination for the truck route.'),
});
export type RoadStatusInput = z.infer<typeof RoadStatusInputSchema>;

export const RoadStatusOutputSchema = z.object({
  status: z
    .string()
    .describe(
      'A summary of any warnings, accidents, or significant traffic issues on the suggested route. If there are no issues, this should state "No significant warnings."'
    ),
  eta: z
    .string()
    .describe(
      'The estimated time of arrival (ETA) for the route, considering current conditions.'
    ),
});
export type RoadStatusOutput = z.infer<typeof RoadStatusOutputSchema>;


export const roadStatusFlow = ai.defineFlow(
  {
    name: 'roadStatusFlow',
    inputSchema: RoadStatusInputSchema,
    outputSchema: RoadStatusOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: `You are a traffic analysis AI. Provide a brief summary of road conditions and an estimated time of arrival for a truck route to the following destination: ${input.destination}.

Consider real-time traffic data, potential delays, and road closures. If there are no major issues, state "No significant warnings."`,
        output: {
            schema: RoadStatusOutputSchema,
        }
    });
    return output!;
  }
);
