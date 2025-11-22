'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {config} from 'dotenv';

config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.warn(
    'GEMINI_API_KEY is not set. AI features will not be available.'
  );
}

// Initialize the plugin once.
// The API key is passed here, if it exists.
const googleAiPlugin = googleAI(apiKey ? {apiKey} : undefined);

// Configure Genkit with just the plugin.
export const ai = genkit({
  plugins: [googleAiPlugin],
});
