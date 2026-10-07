import { loadChurnArtifact, predictChurn } from '../../server/churnModel.mjs';

const artifactPath = new URL('../../ml/model/churn-prototype.json', import.meta.url);

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Use POST for a prediction.' });
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) return response.status(400).json({ error: 'Send one customer record as JSON.' });
  try {
    return response.status(200).json(predictChurn(await loadChurnArtifact(artifactPath), request.body));
  } catch (error) {
    console.error('Churn model prediction failed:', error.message);
    return response.status(503).json({ error: 'Model is not available.' });
  }
}
