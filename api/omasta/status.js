import process from 'node:process';
import { DEFAULT_MODEL } from '../../server/omasta.mjs';

export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') return response.status(405).json({ error: 'Use GET for OMASTA status.' });
  return response.status(200).json({ configured: Boolean(process.env.GEMINI_API_KEY), provider: 'Gemini', model: process.env.GEMINI_MODEL || DEFAULT_MODEL });
}
