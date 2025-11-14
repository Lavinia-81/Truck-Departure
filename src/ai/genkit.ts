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

const googleAiPlugin = googleAI(apiKey ? {apiKey} : undefined);

export const ai = genkit({
  plugins: [googleAiPlugin],
  model: googleAI.model('gemini-2.5-flash', apiKey ? {apiKey} : undefined),
});

