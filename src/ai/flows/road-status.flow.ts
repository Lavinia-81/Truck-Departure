'use server';
/**
 * @fileOverview A route optimization AI agent.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define schemas internally, do not export them.
const RoadStatusInputSchema = z.object({
  destination: z.string().describe('The final destination of the route.'),
  via: z.string().optional().describe('The first stop on the route, if applicable.'),
  collectionTime: z.string().describe("The truck's scheduled collection time in ISO format."),
});
type RoadStatusInput = z.infer<typeof RoadStatusInputSchema>;

const RoadStatusOutputSchema = z.object({
  optimizedRoute: z.string().describe('The suggested optimized route.'),
  estimatedTime: z.string().describe('The estimated time of arrival for the optimized route.'),
  reasoning: z.string().describe('The reasoning behind the suggested route optimization.'),
  roadWarnings: z.string().optional().describe('A summary of any warnings, accidents, or significant traffic issues on the suggested route. If there are no issues, this should state "No significant warnings."'),
  warningLevel: z.enum(['none', 'moderate', 'severe']).describe('A classification of the warning severity. "none" for no issues, "moderate" for traffic or minor delays, "severe" for accidents or road closures.'),
});
export type RoadStatusOutput = z.infer<typeof RoadStatusOutputSchema>;


const roadStatusPrompt = ai.definePrompt({
  name: 'roadStatusPrompt',
  input: { schema: RoadStatusInputSchema },
  output: { schema: RoadStatusOutputSchema },
  prompt: `As an expert route logistics AI for "The Very Group," your task is to provide a real-time route analysis.

Current Time: ${new Date().toISOString()}

Route Details:
- Final Destination: {{{destination}}}
- Via (First Stop): {{{via}}}
- Scheduled Collection Time: {{{collectionTime}}}

Analyze the route from the depot (assume Widnes, UK) to the final destination, considering the collection time. Provide an optimized route, a realistic estimated time of arrival (ETA), any road warnings (like traffic, accidents, closures), and a warning level. The ETA should be calculated from the collection time. If 'via' is provided, include it in the route.

Provide your response in JSON format.`,
});


const getRoadStatusFlow = ai.defineFlow(
  {
    name: 'getRoadStatusFlow',
    inputSchema: RoadStatusInputSchema,
    outputSchema: RoadStatusOutputSchema,
  },
  async (input) => {
    const { output } = await roadStatusPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate a response.");
    }
    return output;
  }
);


// This is the only exported function.
export async function getRoadStatus(input: RoadStatusInput): Promise<RoadStatusOutput> {
  return getRoadStatusFlow(input);
}
