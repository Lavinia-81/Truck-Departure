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

// Inițializăm plugin-ul o singură dată.
// Cheia API este pasată aici, dacă există.
const googleAiPlugin = googleAI(apiKey ? {apiKey} : undefined);

// Configurăm Genkit doar cu plugin-ul.
// Nu mai specificăm modelul sau cheia aici, pentru a evita configurarea invalidă.
export const ai = genkit({
  plugins: [googleAiPlugin],
});
