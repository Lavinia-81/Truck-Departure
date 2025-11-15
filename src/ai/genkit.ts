'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Next.js loads .env variables automatically into process.env.
// No need for the dotenv package here.

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn(
    'GEMINI_API_KEY is not set in .env. AI features will not be available.'
  );
}

export const ai = genkit({
  plugins: [googleAI(apiKey ? {apiKey} : undefined)],
});
