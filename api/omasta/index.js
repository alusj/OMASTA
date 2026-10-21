import process from 'node:process';
import { createOmastaReply } from '../../server/omasta.mjs';

// Best-effort per-instance limit; serverless instances do not share this map.
const requests = new Map();

export function createHandler({ reply = createOmastaReply, env = process.env } = {}) {
  return async function handler(request, response) {
    response.setHeader('Cache-Control', 'no-store');
    if (request.method !== 'POST') return response.status(405).json({ error: 'Use POST for OMASTA questions.' });
    const origin = request.headers?.origin;
    let originHost = null; try { originHost = origin && new URL(origin).host; } catch { originHost = 'invalid'; }
    if (origin && originHost !== request.headers.host) return response.status(403).json({ error: 'Use the OMASTA dashboard to ask questions.' });
    if (Number(request.headers?.['content-length'] ?? 0) > 32000) return response.status(413).json({ error: 'The request is too large. Send aggregate context only.' });
    const address = String(request.headers?.['x-forwarded-for'] ?? 'unknown').split(',')[0].trim(), now = Date.now();
    const recent = (requests.get(address) ?? []).filter(t => now - t < 60000);
    if (recent.length >= 12) return response.status(429).json({ error: 'Too many questions. Wait a minute and retry.' });
    requests.set(address, [...recent, now]);
    if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) return response.status(400).json({ error: 'Invalid JSON request.' });
    try {
      return response.status(200).json(await reply(request.body, { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL, onError: diagnostic => console.error('OMASTA provider status:', JSON.stringify(diagnostic)) }));
    } catch (error) {
      return response.status(error.status ?? 500).json({ error: error.status ? error.message : 'OMASTA is unavailable. Please retry.' });
    }
  };
}

export default createHandler();
