'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {config} from 'dotenv';

config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn(
    'GEMINI_API_KEY nu este setată în fișierul .env.local. Funcționalitățile AI nu vor fi disponibile.'
  );
}

export const ai = genkit({
  plugins: [googleAI(apiKey ? {apiKey} : undefined)],
});
