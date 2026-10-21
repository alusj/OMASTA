import { test } from 'node:test';
import assert from 'node:assert/strict';
import geo from './geo/sierraLeone.js';
import { buildRegionalModel, bandFor, simulateImpact, regionalUpdates, PROFILES } from './regional.mjs';
import { departments } from './data.js';

test('every department has a regional profile and Finance is gone', () => {
  assert.ok(!departments.includes('Finance'));
  for (const d of ['All departments', ...departments]) assert.ok(PROFILES[d], d);
});
test('district totals reconcile with the department profile', () => {
  const model = buildRegionalModel('B2C', geo);
  assert.equal(model.districts.length, 14);
  const customers = model.districts.reduce((a, d) => a + d.customers, 0);
  assert.ok(Math.abs(customers - 842600) < 20);
  const rate = model.districts.reduce((a, d) => a + d.rate * d.customers, 0) / customers;
  assert.ok(Math.abs(rate - 16.2) < 0.2, `weighted rate ${rate}`);
  for (const d of model.districts) {
    const s = d.segments;
    assert.equal(s.low + s.normal + s.high + s.leaving, d.customers);
    assert.ok(s.low > 0 && d.chiefdoms.length > 0);
  }
});
test('model is deterministic and bands follow the national rate', () => {
  assert.deepEqual(buildRegionalModel('Network', geo), buildRegionalModel('Network', geo));
  assert.equal(bandFor(13, 16), 'low');
  assert.equal(bandFor(16, 16), 'normal');
  assert.equal(bandFor(18, 16), 'high');
});
test('impact simulation never increases churn and updates point at real districts', () => {
  const model = buildRegionalModel('Orange Money', geo);
  assert.deepEqual(simulateImpact(model, []), {rate:11.8, saved:0, revenue:0});
  const full = simulateImpact(model, [1, 1, 1, 1, 1]);
  assert.ok(full.rate < 11.8 && full.saved > 0);
  for (const u of regionalUpdates(model)) assert.ok(model.districts.some(d => d.id === u.district));
});
