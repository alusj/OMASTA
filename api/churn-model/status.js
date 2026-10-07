import { loadChurnArtifact, summariseModel } from '../../server/churnModel.mjs';

const artifactPath = new URL('../../ml/model/churn-prototype.json', import.meta.url);

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') return response.status(405).json({ error: 'Use GET for model status.' });
  try {
    return response.status(200).json(summariseModel(await loadChurnArtifact(artifactPath)));
  } catch (error) {
    console.error('Churn model status failed:', error.message);
    return response.status(503).json({ error: 'Model is not available.' });
  }
}
