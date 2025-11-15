"use server";
/**
 * @fileOverview Flow for suggesting an optimized truck route.
 *
 * This file defines a Genkit flow that takes a destination and collection time
 * and returns an analysis of the route, including traffic, weather, and a
 * recommendation on whether the route is optimal.
 */

import { ai, genkit } from "genkit";
import { z } from "zod";
import { googleAI } from "@genkit-ai/google-genai";
import { format } from "date-fns";
import "dotenv/config";


// Initialize Genkit with the Google AI plugin.
// This is the central configuration for our AI capabilities.
genkit({
  plugins: [
    googleAI({
      // The API key is required to authenticate with the Google AI services.
      // It is securely sourced from environment variables.
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  // Log all AI requests and responses to the console for easier debugging.
  logLevel: "debug",
  // Ensure that all AI-related data is processed in the US region.
  enableTracingAndMetrics: true,
});

// -- Input and Output Schemas --

export const SuggestOptimizedRouteInputSchema = z.object({
  destination: z.string().describe("The final destination for the truck."),
  collectionTime: z
    .string()
    .describe("The scheduled departure time in ISO 8601 format."),
});
export type SuggestOptimizedRouteInput = z.infer<
  typeof SuggestOptimizedRouteInputSchema
>;

export const SuggestOptimizedRouteOutputSchema = z.object({
  route: z.object({
    destination: z.string().describe("The destination city."),
    estimatedTravelTime: z
      .string()
      .describe("The AI's best estimate for the total travel time."),
  }),
  traffic: z.object({
    condition: z.string().describe("A summary of the traffic conditions (e.g., Light, Moderate, Heavy)."),
    incidents: z.array(z.string()).describe("A list of any reported traffic incidents, like accidents or road closures."),
  }),
  weather: z.object({
    forecast: z.string().describe("The weather forecast for the destination (e.g., Sunny, Rain, Snow)."),
    temperature: z.string().describe("The temperature at the destination, including units (e.g., 15°C)."),
  }),
  recommendation: z.object({
    isOptimal: z.boolean().describe("A boolean indicating if the AI recommends this route and time as optimal."),
    reason: z.string().describe("A brief explanation for the recommendation."),
  }),
});

export type SuggestOptimizedRouteOutput = z.infer<
  typeof SuggestOptimizedRouteOutputSchema
>;


// --------------------------------------------------------------------------
// !!! IMPORTANT - AI MODEL CONFIGURATION !!!
// --------------------------------------------------------------------------
// If you are getting a 404 Not Found error, it's because the model name below
// is not available for your API key.
//
// HOW TO FIX:
// 1. Go to Google AI Studio: https://aistudio.google.com/
// 2. Click "Create new" -> "Freeform prompt".
// 3. In the top-left corner, click the model dropdown.
// 4. Copy the exact name of an available model (e.g., 'gemini-1.5-pro-latest').
// 5. Paste that name as the value for the GEMINI_MODEL_NAME constant below.
//
const GEMINI_MODEL_NAME = 'gemini-1.5-flash-latest';
// --------------------------------------------------------------------------


// -- Main exported function --
// This is the function that our application will call.

export async function suggestOptimizedRoute(
  input: SuggestOptimizedRouteInput
): Promise<SuggestOptimizedRouteOutput> {
  // Before calling the AI, we perform a critical check for the API key.
  // This provides a clear, immediate error if the key is missing.
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add it to your .env file."
    );
  }
  
  return await routeOptimizationFlow(input);
}

// -- Genkit Prompt Definition --

const optimizationPrompt = ai.definePrompt({
  name: "routeOptimizationPrompt",
  input: { schema: SuggestOptimizedRouteInputSchema },
  output: { schema: SuggestOptimizedRouteOutputSchema },
  model: GEMINI_MODEL_NAME,
  prompt: `
    You are an expert logistics AI for a major UK distribution center.
    Your task is to provide a real-time route analysis for a truck departure.

    Analyze the route to the given destination, considering the departure time.
    Provide a realistic travel time, current traffic summary, any major incidents,
    and a weather forecast for the destination.

    Based on all factors, make a clear recommendation: is the route optimal, or
    are there significant risks (heavy traffic, severe weather, road closures)
    that make it suboptimal?

    Departure Time: ${format(new Date(), "HH:mm dd-MM-yyyy")}
    Destination: {{{destination}}}
  `,
});

// -- Genkit Flow Definition --

const routeOptimizationFlow = ai.defineFlow(
  {
    name: "routeOptimizationFlow",
    inputSchema: SuggestOptimizedRouteInputSchema,
    outputSchema: SuggestOptimizedRouteOutputSchema,
  },
  async (input) => {
    const { output } = await optimizationPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid output.");
    }
    return output;
  }
);
