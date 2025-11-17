import {genkit, type Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai: Genkit = genkit({
  plugins: [googleAI()],
});
