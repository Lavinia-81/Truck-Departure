'use server';

/**
 * @fileOverview An AI agent to get road status and warnings for a given destination.
 *
 * - getRoadStatus - A function that gets the road status.
 * - RoadStatusInput - The input type for the getRoadStatus function.
 * - RoadStatusOutput - The return type for the getRoadStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const RoadStatusInputSchema = z.object({
  destination: z.string().describe('The final destination for the truck route.'),
});
type RoadStatusInput = z.infer<typeof RoadStatusInputSchema>;

const RoadStatusOutputSchema = z.object({
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
type RoadStatusOutput = z.infer<typeof RoadStatusOutputSchema>;


const roadStatusPrompt = ai.definePrompt(
  {
    name: 'roadStatusPrompt',
    input: { schema: RoadStatusInputSchema },
    output: { schema: RoadStatusOutputSchema },
    prompt: `You are a traffic analysis AI. Provide a brief summary of road conditions and an estimated time of arrival for a truck route to the following destination: {{{destination}}}.

Consider real-time traffic data, potential delays, and road closures. If there are no major issues, state "No significant warnings."`,
  }
);

const getRoadStatusFlow = ai.defineFlow(
  {
    name: 'getRoadStatusFlow',
    inputSchema: RoadStatusInputSchema,
    outputSchema: RoadStatusOutputSchema,
  },
  async (input) => {
    const { output } = await roadStatusPrompt(input);
    return output!;
  }
);

export async function getRoadStatus(input: RoadStatusInput): Promise<RoadStatusOutput> {
    return getRoadStatusFlow(input);
}
