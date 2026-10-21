import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { validateDataset, buildProfiles, trainModel, scoreCustomers, buyingPatterns, churnPatterns, parseMonth, districtId, predictionsCSV, TEMPLATE } from './behaviour.mjs';
import { readCSV, readXLSX } from './tabular.mjs';
import { sampleBehaviourTable } from './behaviourSample.mjs';

const departments = ['B2C', 'B2B', 'Orange Money'];
test('months and districts are normalised, including post-2017 districts', () => {
  assert.equal(parseMonth('2026-09'), '2026-09');
  assert.equal(parseMonth('2026/9/14'), '2026-09');
  assert.equal(parseMonth('09/2026'), '2026-09');
  assert.equal(parseMonth('Sept 2026'), '2026-09');
  assert.equal(parseMonth('46280'), '2026-09');
  assert.equal(parseMonth('2026-13'), null);
  assert.equal(districtId('Freetown'), 'western-area-urban');
  assert.equal(districtId('Karene'), 'bombali');
  assert.equal(districtId('Atlantis'), undefined);
});
test('template validates cleanly', () => {
  const result = validateDataset(readCSV(TEMPLATE), {departments});
  assert.ok(result.ok);
  assert.equal(result.stats.valid, 1);
  assert.equal(result.errors.length, 0);
});
test('missing required columns block the import', () => {
  const result = validateDataset([['customer_id', 'month'], ['A', '2026-01']], {departments});
  assert.equal(result.ok, false);
  assert.match(result.fatal, /recharge_count, recharge_amount/);
});
test('bad rows are excluded and reported with line numbers', () => {
  const table = readCSV('customer_id,month,recharge_count,recharge_amount,active_days,churned,department\nA,2026-01,2,40,10,no,B2C\nA,2026-01,2,40,10,no,B2C\nB,soon,1,10,5,no,B2C\nC,2026-01,-1,10,40,maybe,B2C\n+23276123456,2026-01,1,1,1,no,B2C\nD,2026-01,1,"1,200",3,,Finance\n');
  const result = validateDataset(table, {departments});
  assert.ok(result.ok);
  assert.equal(result.stats.valid, 1);
  assert.equal(result.stats.invalid, 4);
  const lines = result.errors.map(e => `${e.line}:${e.column}`);
  assert.ok(lines.includes('3:customer_id + month') && lines.includes('4:month') && lines.includes('5:recharge_count') && lines.includes('5:active_days') && lines.includes('5:churned') && lines.includes('6:customer_id'));
  assert.ok(result.warnings.some(w => w.includes('Finance')));
});
test('sample data trains a useful model and scores only active customers', () => {
  const result = validateDataset(sampleBehaviourTable(), {departments});
  assert.ok(result.ok, result.fatal);
  assert.equal(result.stats.invalid, 0);
  const profiles = buildProfiles(result.records), model = trainModel(profiles);
  assert.ok(model, 'model trains');
  assert.ok(model.metrics.auc > 0.75, `AUC ${model.metrics.auc}`);
  const scored = scoreCustomers(profiles, model);
  assert.ok(scored.every(p => p.churned !== true));
  assert.ok(scored[0].score >= scored.at(-1).score);
  assert.ok(scored.filter(p => p.band === 'high').length > 0);
  assert.match(predictionsCSV(scored.slice(0, 2), 'test').split('\n')[0], /^customer_id,district/);
  const patterns = buyingPatterns(result.records), churn = churnPatterns(profiles);
  assert.equal(patterns.months.length, 6);
  assert.ok(churn.labelled && churn.bySignal.find(s => s.key === 'spendDrop').lift > 1);
});
test('without churn labels, scoring falls back to behaviour rules', () => {
  const table = sampleBehaviourTable(80).map(r => r.slice(0, -1));
  const result = validateDataset(table, {departments}), profiles = buildProfiles(result.records);
  assert.equal(trainModel(profiles), null);
  assert.ok(result.warnings.some(w => w.includes('No churned column')));
  assert.ok(scoreCustomers(profiles, null).every(p => p.score >= 0 && p.score <= 1));
});

function zip(files) {
  const parts = [], central = []; let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBytes = Buffer.from(name), data = deflateRawSync(Buffer.from(text)), local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(8, 8); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(text.length, 22); local.writeUInt16LE(nameBytes.length, 26);
    const entry = Buffer.alloc(46); entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(8, 10); entry.writeUInt32LE(data.length, 20); entry.writeUInt16LE(nameBytes.length, 28); entry.writeUInt32LE(offset, 42);
    parts.push(local, nameBytes, data); central.push(entry, nameBytes); offset += 30 + nameBytes.length + data.length;
  }
  const dir = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length / 2, 10); end.writeUInt32LE(dir.length, 12); end.writeUInt32LE(offset, 16);
  const all = Buffer.concat([...parts, dir, end]); return all.buffer.slice(all.byteOffset, all.byteOffset + all.length);
}
test('xlsx workbooks are read from the first sheet with shared strings and gaps', async () => {
  const buffer = zip({
    'xl/workbook.xml':'<workbook><sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels':'<Relationships><Relationship Id="rId1" Type="x" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/sharedStrings.xml':'<sst><si><t>customer_id</t></si><si><t>month</t></si><si><r><t>C&amp;</t></r><r><t>1</t></r></si></sst>',
    'xl/worksheets/sheet1.xml':'<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="inlineStr"><is><t>recharge_count</t></is></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>46280</v></c></row></sheetData></worksheet>',
  });
  assert.deepEqual(await readXLSX(buffer), [['customer_id', 'month', 'recharge_count'], ['C&1', '46280', '']]);
});
test('decision insights only count assessed customers and name an owner for each action', async () => {
  const { decisionInsights, churnPatterns: cp, buyingPatterns: bp, SIGNALS } = await import('./behaviour.mjs');
  const result = validateDataset(sampleBehaviourTable(), {departments});
  const profiles = buildProfiles(result.records), model = trainModel(profiles), scored = scoreCustomers(profiles, model);
  const ins = decisionInsights({profiles, scored, churn:cp(profiles), model, patterns:bp(result.records)});
  assert.equal(ins.assessed, scored.length);
  assert.ok(ins.high <= ins.atRisk && ins.atRisk <= ins.assessed && ins.opportunities <= ins.atRisk);
  assert.equal(ins.actions.reduce((a, x) => a + x.customers, 0) <= ins.atRisk, true);
  assert.ok(ins.actions.every(a => a.owner && a.owner !== '—'));
  assert.ok(SIGNALS.some(s => s.key === 'failedPurchases'));
  assert.ok(scored.some(p => p.signals.failedPurchases));
});
