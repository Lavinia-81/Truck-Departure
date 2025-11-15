'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {config} from 'dotenv';

// Load environment variables from .env file
config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn(
    'GEMINI_API_KEY is not set in .env. AI features will not be available.'
  );
}

export const ai = genkit({
  plugins: [googleAI(apiKey ? {apiKey} : undefined)],
});
