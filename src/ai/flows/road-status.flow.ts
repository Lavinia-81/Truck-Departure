'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import type { RoadStatusInput, RoadStatusOutput } from '@/lib/types';

export async function getRoadStatus(
  input: RoadStatusInput
): Promise<RoadStatusOutput> {
  const prompt = `You are a logistics expert for "The Very Group". Your task is to provide a route and traffic analysis for a truck delivery.

Analyze the route based on the following information:
- Starting Location: The Very Group, Skygate, Derby, DE74 2BB, UK
- Final Destination: ${input.destination}
${input.via ? `- Intermediate Stop (Via): ${input.via}` : ''}

Your analysis must include:
1.  "optimizedRoute": The best route from the starting location to the final destination.
2.  "estimatedTime": The estimated travel time for the entire journey.
3.  "reasoning": A brief explanation for the estimated travel time, considering current average traffic and weather conditions.
4.  "roadWarnings": A summary of any significant warnings, accidents, road closures, or severe weather. If none, state "No significant warnings."
5.  "warningLevel": Classify the severity of any issues. Must be one of: 'none', 'moderate', 'severe'.

Return the response as a single, valid JSON object, and nothing else. Do not wrap it in markdown.
`;

  try {
    const response = await ai.generate({
      model: googleAI.model('gemini-1.5-flash'),
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
