'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    'Variabila de mediu GEMINI_API_KEY nu este setată. Funcționalitățile AI nu vor fi disponibile.'
  );
}

// Inițializează plugin-ul Google AI doar dacă cheia API există.
const googleAiPlugin = apiKey ? googleAI({apiKey}) : googleAI();

export const ai = genkit({
  plugins: [googleAiPlugin],
});
