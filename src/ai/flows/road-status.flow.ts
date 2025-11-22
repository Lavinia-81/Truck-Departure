'use server';

import { ai } from '@/ai/genkit';
import type { RoadStatusInput, RoadStatusOutput } from '@/lib/types';

export async function getRoadStatus(
  input: RoadStatusInput
): Promise<RoadStatusOutput> {
  const prompt = `You are an expert logistics dispatcher for "The Very Group". Your task is to analyze the potential for a driver to be late for their scheduled collection time at the depot in Widnes, UK.

Analyze the route based on the following information:
- Current Time: ${new Date().toISOString()}
- Driver's Assumed Starting Location (last delivery): ${input.destination}
- Final Arrival Location (Depot): Widnes, UK
- Scheduled Collection Time at Depot: ${input.collectionTime}
${input.via ? `- Intermediate Stop (Via): ${input.via}` : ''}

Your analysis must include:
1.  "optimizedRoute": The best route from the starting location to the Widnes depot.
2.  "estimatedTime": The estimated time of arrival (ETA) at the Widnes depot.
3.  "reasoning": A brief explanation for the ETA, considering current average traffic, and weather conditions for the route.
4.  "roadWarnings": A summary of any significant warnings, accidents, road closures, or severe weather. If none, state "No significant warnings."
5.  "warningLevel": Classify the severity of any issues. Must be one of: 'none', 'moderate', 'severe'.

Return the response as a single, valid JSON object, and nothing else. Do not wrap it in markdown.
`;

  try {
    const response = await ai.generate({
      model: 'gemini-1.5-flash',
      prompt: prompt,
      config: {
        temperature: 0.2,
      },
    });

    const jsonText = response.text();
    // Clean the response to ensure it's a valid JSON string
    // This regex finds the first '{' and the last '}' and extracts everything in between.
    const match = jsonText.match(/\{[\s\S]*\}/);

    if (!match) {
        throw new Error("No valid JSON object found in the AI response.");
    }
    
    return JSON.parse(match[0]) as RoadStatusOutput;

  } catch (error) {
    console.error("Error fetching or parsing AI response:", error);
    // In case of any error (API call, parsing, etc.), re-throw it so the component can catch it.
    throw new Error(`Failed to get traffic analysis from AI. Details: ${(error as Error).message}`);
  }
}
