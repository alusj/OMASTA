import test from 'node:test';
import assert from 'node:assert/strict';
import { loadChurnArtifact, predictChurn } from './churnModel.mjs';
test('prototype model returns a bounded explained risk',async()=>{const artifact=await loadChurnArtifact(new URL('../ml/model/churn-prototype.json',import.meta.url));const result=predictChurn(artifact,{'Account length':100,'State':'ZZ','Area code':'999'});assert.ok(result.probability>=0&&result.probability<=1);assert.equal(result.contributors.length,3);});
