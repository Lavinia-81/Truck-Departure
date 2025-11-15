'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { GEMINI_API_KEY } from '@/config/keys';

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
  console.warn(
    'GEMINI_API_KEY is not set correctly in src/config/keys.ts. AI features will not be available.'
  );
}

export const ai = genkit({
  plugins: [googleAI(GEMINI_API_KEY ? {apiKey: GEMINI_API_KEY} : undefined)],
});
