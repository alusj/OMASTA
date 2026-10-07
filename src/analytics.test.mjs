import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCustomerCSV, summariseCustomers, reviewSignals, selectCustomers, datasetTemplate, exportCustomerCSV, datasetBadge } from './analytics.mjs';
const row = 'WA,415,120,yes,no,220,100,37.4,180,80,15.3,150,70,6.75,12,4,3.24,4,true';
test('CSV maps familiar telecom headers, plans and churn outcomes', () => {
  const rows = parseCustomerCSV(datasetTemplate + '\n' + row);
  assert.equal(rows[0].areaCode, '415');
  assert.equal(rows[0].dayMinutes, 220);
  assert.equal(rows[0].internationalPlan, true);
  assert.equal(rows[0].churn, true);
  assert.equal(rows[0].department, 'B2C');
  assert.equal(summariseCustomers(rows).observedChurnRate, 100);
});
test('absent churn labels stay unknown and mixed labels use only known outcomes', () => {
  const rows = parseCustomerCSV(datasetTemplate.replace(',churn','') + '\n' + row.replace(',true',''));
  assert.equal(rows[0].churn, null);
  assert.equal(summariseCustomers(rows).observedChurnRate, null);
  assert.equal(summariseCustomers([...rows, {...rows[0],churn:false}]).observedChurnRate,0);
});
test('CSV handles quoted locations and rejects bad numeric values and missing fields', () => {
  assert.equal(parseCustomerCSV('\uFEFF'+datasetTemplate+'\r\n'+row.replace('WA','"West, Coast"'))[0].state,'West, Coast');
  assert.throws(()=>parseCustomerCSV(datasetTemplate+'\n'+row.replace(',220,',',oops,')), /dayMinutes/);
  assert.throws(()=>parseCustomerCSV(datasetTemplate+'\n'+row.replace(',220,',',-2,')), /dayMinutes/);
  assert.throws(()=>parseCustomerCSV('state,area_code\nWA,415'), /Missing columns/);
  assert.throws(()=>parseCustomerCSV(datasetTemplate+'\n'+row.replace(',yes,',',maybe,')), /internationalPlan/);
  assert.throws(()=>parseCustomerCSV(datasetTemplate+'\n'+row.replace('WA','"WA')), /Unclosed/);
});
test('empty summaries are finite and zero minutes are preserved', () => {
  const summary = summariseCustomers([]);
  assert.equal(summary.count,0);
  assert.equal(summary.averageAccountLength,0);
  assert.equal(summary.observedChurnRate,null);
  const rows = parseCustomerCSV(datasetTemplate+'\n'+row.replace(',220,',',0,'));
  assert.equal(summariseCustomers(rows).usage.day.minutes,0);
});
test('review flags explain rules rather than invented prediction scores', () => {
  const rows = parseCustomerCSV(datasetTemplate+'\n'+row);
  assert.deepEqual(reviewSignals(rows[0]), ['Repeated support calls', 'International plan review']);
});
test('customer data stays within the selected and allowed business scopes', () => {
  const base=parseCustomerCSV(datasetTemplate+'\n'+row)[0];
  const rows=[base,{...base,id:'ROW-2',department:'B2B'}];
  assert.equal(selectCustomers(rows,'All departments',['B2C']).length,1);
  assert.equal(selectCustomers(rows,'B2B',['B2C']).length,0);
  assert.equal(selectCustomers(rows,'Orange Money',['Orange Money']).length,0);
});
test('customer exports preserve usage fields and department, neutralising formula locations', () => {
  const records=parseCustomerCSV(datasetTemplate+'\n'+row);
  records[0].state='=HYPERLINK("bad")';
  records[0].department='B2B';
  const restored=parseCustomerCSV(exportCustomerCSV(records));
  assert.ok(restored[0].state.startsWith("'="));
  assert.equal(restored[0].department,'B2B');
  assert.equal(restored[0].eveningCharge,15.3);
});
test('dataset badge distinguishes an imported customer dataset from sample records', () => {
  assert.equal(datasetBadge('sample'),'Sample data');
  assert.equal(datasetBadge('imported'),'Imported dataset');
});
