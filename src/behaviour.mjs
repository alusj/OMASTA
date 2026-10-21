// Customer behaviour & buying-pattern engine: validates monthly behaviour datasets, builds per-customer
// profiles (trends and change signals), trains a churn model when outcomes are labelled, and produces reports.
// Pure functions only — the UI and tests share them. Uploaded rows never leave the browser.

const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const COLUMNS = [
  {key:'customerId', label:'customer_id', required:true, aliases:['customerid','subscriberid','msisdnhash','accountid','id','customer'], help:'Pseudonymous customer or account ID (no phone numbers)'},
  {key:'month', label:'month', required:true, aliases:['month','period','billingmonth','date','yearmonth'], help:'YYYY-MM, a date, or an Excel date'},
  {key:'rechargeCount', label:'recharge_count', required:true, type:'int', aliases:['rechargecount','recharges','topupcount','topups','numrecharges'], help:'Top-ups bought in the month'},
  {key:'rechargeAmount', label:'recharge_amount', required:true, type:'num', aliases:['rechargeamount','topupamount','rechargevalue','spend','totalspend','revenue'], help:'Total top-up value (SLE)'},
  {key:'district', label:'district', aliases:['district','region','location','area'], help:'One of the 16 districts'},
  {key:'department', label:'department', aliases:['department','businessunit','segment'], help:'B2C, B2B, Orange Money…'},
  {key:'tenureMonths', label:'tenure_months', type:'int', aliases:['tenuremonths','tenure','monthsonnetwork','aon'], help:'Months since activation'},
  {key:'dataSpend', label:'data_bundle_spend', type:'num', aliases:['databundlespend','dataspend','databundles'], help:'Data bundle purchases (SLE)'},
  {key:'voiceSpend', label:'voice_bundle_spend', type:'num', aliases:['voicebundlespend','voicespend','voicebundles'], help:'Voice bundle purchases (SLE)'},
  {key:'smsSpend', label:'sms_spend', type:'num', aliases:['smsspend','smsbundlespend','sms'], help:'SMS purchases (SLE)'},
  {key:'dataMb', label:'data_mb', type:'num', aliases:['datamb','datausage','datausagemb','mb'], help:'Data used (MB)'},
  {key:'voiceMinutes', label:'voice_minutes', type:'num', aliases:['voiceminutes','minutes','outgoingminutes'], help:'Voice minutes used'},
  {key:'activeDays', label:'active_days', type:'int', max:31, aliases:['activedays','daysactive'], help:'Days with any activity (0–31)'},
  {key:'omTransactions', label:'om_transactions', type:'int', aliases:['omtransactions','orangemoneytransactions','omtxn','wallettransactions'], help:'Orange Money transactions'},
  {key:'omValue', label:'om_value', type:'num', aliases:['omvalue','orangemoneyvalue','walletvalue'], help:'Orange Money value moved (SLE)'},
  {key:'complaints', label:'complaints', type:'int', aliases:['complaints','tickets','customerservicecalls','supportcontacts'], help:'Complaints or support contacts'},
  {key:'failedPurchases', label:'failed_purchases', type:'int', aliases:['failedpurchases','failedbundlepurchases','failedbundles','purchasefailures','failedtransactions'], help:'Bundle or top-up purchase attempts that failed'},
  {key:'churned', label:'churned', aliases:['churned','churn','churnflag','left'], help:'yes/no — did the customer leave? (enables model training)'},
];
export const TEMPLATE = COLUMNS.map(c => c.label).join(',') + '\nC-000001,2026-09,6,180,Bo,B2C,26,120,40,10,2400,95,24,3,450,0,1,no\n';

export const DISTRICTS = {bo:'Bo', bombali:'Bombali', bonthe:'Bonthe', kailahun:'Kailahun', kambia:'Kambia', kenema:'Kenema', koinadugu:'Koinadugu', kono:'Kono', moyamba:'Moyamba', 'port-loko':'Port Loko', pujehun:'Pujehun', tonkolili:'Tonkolili', 'western-area-rural':'Western Area Rural', 'western-area-urban':'Western Area Urban'};
const DISTRICT_ALIASES = {westernareaurban:'western-area-urban', westernurban:'western-area-urban', freetown:'western-area-urban', wau:'western-area-urban', westernarearural:'western-area-rural', westernrural:'western-area-rural', waterloo:'western-area-rural', war:'western-area-rural', portloko:'port-loko'};
// Districts created in 2017 are mapped to the parent district used by the map boundaries.
const NEW_DISTRICTS = {falaba:'koinadugu', karene:'bombali'};
export function districtId(value) {
  const n = norm(value); if (!n) return null;
  if (NEW_DISTRICTS[n]) return NEW_DISTRICTS[n];
  return DISTRICT_ALIASES[n] ?? Object.keys(DISTRICTS).find(id => norm(id) === n) ?? undefined;
}
const MONTH_NAMES = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
export function parseMonth(value) {
  const v = String(value ?? '').trim(); let m;
  if (/^\d{5}(\.\d+)?$/.test(v)) { const d = new Date(Date.UTC(1899, 11, 30) + Number(v) * 864e5); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; }
  if ((m = v.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?(?:[ T].*)?$/))) return +m[2] >= 1 && +m[2] <= 12 ? `${m[1]}-${m[2].padStart(2, '0')}` : null;
  if ((m = v.match(/^(?:\d{1,2}[-/.])?(\d{1,2})[-/.](\d{4})$/))) return +m[1] >= 1 && +m[1] <= 12 ? `${m[2]}-${m[1].padStart(2, '0')}` : null;
  if ((m = v.toLowerCase().match(/^([a-z]{3})[a-z]*[\s-]+(\d{4})$/)) && MONTH_NAMES.includes(m[1])) return `${m[2]}-${String(MONTH_NAMES.indexOf(m[1]) + 1).padStart(2, '0')}`;
  return null;
}
const yesNo = v => { const n = norm(v); return ['yes','true','1','y','churned'].includes(n) ? true : ['no','false','0','n','active','retained'].includes(n) ? false : n === '' || ['unknown','na','null'].includes(n) ? null : undefined; };
const toNumber = v => { const s = String(v ?? '').trim().replace(/^(sle|le|nle)\s*/i, '').replace(/[\s,]/g, ''); return s === '' ? null : Number(s); };

export const LIMITS = {bytes:15_000_000, rows:200_000, errorsShown:200};

// Validates a raw table (first row = headers). Bad rows are excluded and reported; the import is blocked only
// when required columns are missing or nothing valid remains.
export function validateDataset(table, {departments = ['B2C'], defaultDepartment = departments[0]} = {}) {
  const fatal = msg => ({ok:false, fatal:msg, records:[], errors:[], warnings:[], columns:[], stats:{rows:Math.max(0, table.length - 1), valid:0, invalid:0}});
  if (!table.length) return fatal('The file is empty.');
  if (table.length < 2) return fatal('The file has a header row but no data rows.');
  if (table.length - 1 > LIMITS.rows) return fatal(`Upload up to ${LIMITS.rows.toLocaleString('en-US')} rows at a time (found ${(table.length - 1).toLocaleString('en-US')}).`);
  const headers = table[0].map(norm), dupes = headers.filter((h, i) => h && headers.indexOf(h) !== i);
  if (dupes.length) return fatal(`Duplicate column names: ${[...new Set(dupes)].join(', ')}.`);
  const index = Object.fromEntries(COLUMNS.map(c => [c.key, headers.findIndex(h => c.aliases.includes(h) || h === norm(c.label))]));
  const missing = COLUMNS.filter(c => c.required && index[c.key] < 0);
  if (missing.length) return fatal(`Missing required columns: ${missing.map(c => c.label).join(', ')}. Download the template for accepted names.`);
  const columns = COLUMNS.map(c => ({...c, found:index[c.key] >= 0, source:index[c.key] >= 0 ? table[0][index[c.key]] : null}));
  const known = new Set(Object.values(index).filter(i => i >= 0)), ignored = table[0].filter((h, i) => h && !known.has(i));
  const errors = [], warnings = [], records = [], seen = new Set(), unknownDistricts = new Map(), remapped = new Set(), unknownDepartments = new Set();
  let invalid = 0, missingCells = 0, optionalCells = 0;
  const deptByNorm = Object.fromEntries(departments.map(d => [norm(d), d]));
  table.slice(1).forEach((cells, i) => {
    const line = i + 2, rowErrors = [], record = {};
    const cell = key => index[key] < 0 ? '' : String(cells[index[key]] ?? '').trim();
    record.customerId = cell('customerId');
    if (!record.customerId) rowErrors.push(['customer_id', 'is empty']);
    else if (/^\+?232\d{8}$|^0\d{8}$/.test(record.customerId.replace(/[\s-]/g, ''))) rowErrors.push(['customer_id', 'looks like a phone number — use a pseudonymous ID']);
    record.month = parseMonth(cell('month'));
    if (!record.month) rowErrors.push(['month', `"${cell('month')}" is not a recognised month`]);
    for (const c of COLUMNS.filter(c => c.type)) {
      if (index[c.key] < 0) { record[c.key] = null; continue; }
      const raw = cell(c.key), n = toNumber(raw);
      if (!c.required) { optionalCells++; if (n === null) missingCells++; }
      if (n === null) { if (c.required) rowErrors.push([c.label, 'is empty']); record[c.key] = null; continue; }
      if (!Number.isFinite(n)) rowErrors.push([c.label, `"${raw}" is not a number`]);
      else if (n < 0) rowErrors.push([c.label, 'cannot be negative']);
      else if (c.type === 'int' && !Number.isInteger(n)) rowErrors.push([c.label, 'must be a whole number']);
      else if (c.max !== undefined && n > c.max) rowErrors.push([c.label, `cannot exceed ${c.max}`]);
      record[c.key] = n;
    }
    if (index.district >= 0) {
      const raw = cell('district'), id = districtId(raw);
      if (id === undefined) unknownDistricts.set(raw, (unknownDistricts.get(raw) ?? 0) + 1);
      if (NEW_DISTRICTS[norm(raw)]) remapped.add(raw);
      record.district = id ?? null;
    } else record.district = null;
    const dept = cell('department');
    record.department = dept ? deptByNorm[norm(dept)] : defaultDepartment;
    if (dept && !record.department) { unknownDepartments.add(dept); record.department = null; }
    record.churned = index.churned < 0 ? null : yesNo(cell('churned'));
    if (record.churned === undefined) rowErrors.push(['churned', `"${cell('churned')}" must be yes/no, true/false or 1/0`]);
    const key = record.customerId + '|' + record.month;
    if (!rowErrors.length && seen.has(key)) rowErrors.push(['customer_id + month', 'duplicate row — first one kept']);
    if (rowErrors.length) { invalid++; for (const [column, problem] of rowErrors) if (errors.length < LIMITS.errorsShown * 50) errors.push({line, column, problem}); return; }
    if (!record.department) return;
    seen.add(key); records.push(record);
  });
  if (unknownDepartments.size) warnings.push(`Rows for ${[...unknownDepartments].slice(0, 4).join(', ')} were skipped — you are not assigned to ${unknownDepartments.size > 1 ? 'these departments' : 'this department'} or the name is unknown.`);
  if (unknownDistricts.size) warnings.push(`${[...unknownDistricts.values()].reduce((a, b) => a + b, 0)} rows have unrecognised districts (${[...unknownDistricts.keys()].slice(0, 4).map(d => `"${d || 'blank'}"`).join(', ')}). They are analysed but not mapped.`);
  if (remapped.size) warnings.push(`${[...remapped].join(' and ')} are shown within their former parent district on the map.`);
  const optionalMissing = columns.filter(c => !c.required && !c.found && c.key !== 'department');
  if (optionalMissing.length) warnings.push(`Optional columns not supplied: ${optionalMissing.map(c => c.label).join(', ')}. Related signals are switched off.`);
  if (ignored.length) warnings.push(`Ignored columns: ${ignored.slice(0, 6).join(', ')}${ignored.length > 6 ? '…' : ''}.`);
  const months = [...new Set(records.map(r => r.month))].sort();
  if (records.length && months.length < 2) warnings.push('Only one month supplied — trends and behaviour-change signals need at least two months.');
  const labelled = records.filter(r => r.churned !== null).length;
  if (records.length && index.churned < 0) warnings.push('No churned column — predictions use transparent behaviour rules instead of a trained model.');
  else if (records.length && labelled < records.length * 0.5) warnings.push('Fewer than half the rows have a churn outcome.');
  const customers = new Set(records.map(r => r.customerId)).size;
  const completeness = optionalCells ? 1 - missingCells / optionalCells : 1;
  const stats = {rows:table.length - 1, valid:records.length, invalid, customers, months, completeness, quality:Math.round(((records.length / (table.length - 1)) * 0.7 + completeness * 0.3) * 100)};
  if (!records.length) return {ok:false, fatal:'No valid rows remain after validation. Download the error report to fix the file.', records, errors, warnings, columns, stats};
  return {ok:true, records, errors, warnings, columns, stats};
}

const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const change = (last, prev) => prev > 0 ? Math.max(-1, Math.min(3, (last - prev) / prev)) : last > 0 ? 1 : 0;
export const SIGNALS = [
  {key:'silent', label:'Stopped buying', detail:'No top-up in the latest month', weight:0.38, color:'#e5484d'},
  {key:'spendDrop', label:'Spend down 40%+', detail:'Latest spend vs. their previous 3-month average', weight:0.22, color:'#ff7900'},
  {key:'fewerRecharges', label:'Fewer top-ups', detail:'Top-up count halved vs. their usual', weight:0.12, color:'#f4b740'},
  {key:'usageCollapse', label:'Usage collapse', detail:'Active days or data use down 40%+', weight:0.16, color:'#8b5cf6'},
  {key:'bundleDowngrade', label:'Bundle downgrade', detail:'Data bundle spend down 30%+', weight:0.09, color:'#367cf6'},
  {key:'complaints', label:'Repeat complaints', detail:'2+ complaints in the last 3 months', weight:0.13, color:'#d9363e'},
  {key:'failedPurchases', label:'Failed bundle purchases', detail:'2+ failed purchase attempts last month', weight:0.1, color:'#c2410c'},
  {key:'omDrop', label:'Wallet going quiet', detail:'Orange Money transactions down 50%+', weight:0.07, color:'#17b26a'},
];
export const SEGMENT_TYPES = [
  {key:'champion', label:'Champions', color:'#17b26a', text:'High, steady spend'},
  {key:'steady', label:'Steady', color:'#4fb7a0', text:'Stable buying pattern'},
  {key:'new', label:'New', color:'#367cf6', text:'First months on network'},
  {key:'declining', label:'Declining', color:'#ff7900', text:'Buying less than before'},
  {key:'dormant', label:'Dormant', color:'#e5484d', text:'Stopped buying'},
];
const sum = (rows, key) => rows.reduce((a, r) => a + (r[key] ?? 0), 0);

// One profile per customer from their monthly history.
export function buildProfiles(records) {
  const groups = new Map();
  for (const r of records) (groups.get(r.customerId) ?? groups.set(r.customerId, []).get(r.customerId)).push(r);
  const profiles = [...groups.values()].map(all => {
    all.sort((a, b) => a.month.localeCompare(b.month));
    // Churners are described by their behaviour BEFORE the month they left, so the model learns early warnings.
    const cut = all.findIndex(r => r.churned === true), rows = cut > 0 ? all.slice(0, cut) : all;
    const last = rows.at(-1), prev = rows.slice(-4, -1), has = key => last[key] !== null && last[key] !== undefined;
    const avg = key => mean(prev.map(r => r[key] ?? 0));
    let quietMonths = 0; for (let i = rows.length - 1; i >= 0 && !rows[i].rechargeCount; i--) quietMonths++;
    const f = {
      months:rows.length, tenure:last.tenureMonths ?? rows.length, spend:last.rechargeAmount, spendAvg:avg('rechargeAmount'),
      spendChange:prev.length ? change(last.rechargeAmount, avg('rechargeAmount')) : 0,
      rechargeChange:prev.length ? change(last.rechargeCount, avg('rechargeCount')) : 0,
      activeChange:prev.length && has('activeDays') ? change(last.activeDays, avg('activeDays')) : 0,
      dataChange:prev.length && has('dataMb') ? change(last.dataMb, avg('dataMb')) : 0,
      bundleChange:prev.length && has('dataSpend') ? change(last.dataSpend, avg('dataSpend')) : 0,
      omChange:prev.length && has('omTransactions') && avg('omTransactions') >= 2 ? change(last.omTransactions, avg('omTransactions')) : 0,
      quietMonths, complaints3m:sum(rows.slice(-3), 'complaints'), failedLast:last.failedPurchases ?? 0,
      dataShare:last.rechargeAmount ? (last.dataSpend ?? 0) / last.rechargeAmount : 0,
    };
    const signals = {
      silent:quietMonths >= 1, spendDrop:prev.length > 0 && f.spendChange <= -0.4 && quietMonths === 0,
      fewerRecharges:prev.length > 0 && f.rechargeChange <= -0.5 && quietMonths === 0,
      usageCollapse:prev.length > 0 && (f.activeChange <= -0.4 || f.dataChange <= -0.4), bundleDowngrade:prev.length > 0 && f.bundleChange <= -0.3,
      complaints:f.complaints3m >= 2, failedPurchases:f.failedLast >= 2, omDrop:f.omChange <= -0.5,
    };
    const churned = all.some(r => r.churned === true) ? true : all.some(r => r.churned === false) ? false : null;
    return {id:last.customerId, district:last.district, department:last.department, month:all.at(-1).month, history:all, features:f, signals, churned};
  });
  const spends = profiles.map(p => p.features.spend).sort((a, b) => a - b), p75 = spends[Math.floor(spends.length * 0.75)] ?? 0;
  for (const p of profiles) {
    const s = p.signals, negative = s.spendDrop || s.fewerRecharges || s.usageCollapse || s.bundleDowngrade;
    p.segment = s.silent ? 'dormant' : negative ? 'declining' : p.features.tenure <= 3 || p.features.months <= 1 ? 'new' : p.features.spend >= p75 && !s.complaints ? 'champion' : 'steady';
    p.ruleScore = 1 - SIGNALS.reduce((keep, sig) => keep * (s[sig.key] ? 1 - sig.weight : 1), 1) * (p.features.tenure < 6 ? 0.95 : 1);
  }
  return profiles;
}

// --- Churn model: L2-regularised logistic regression trained in the browser on labelled customers ---
export const FEATURES = [
  ['spendChange', 'Spend trend'], ['rechargeChange', 'Top-up frequency trend'], ['activeChange', 'Active-days trend'], ['dataChange', 'Data-use trend'],
  ['bundleChange', 'Data bundle trend'], ['omChange', 'Orange Money trend'], ['quietMonths', 'Months without top-up'], ['complaints3m', 'Recent complaints'], ['failedLast', 'Failed purchases'],
  ['logTenure', 'Tenure'], ['logSpend', 'Spend level'], ['dataShare', 'Data share of spend'],
];
const vector = p => FEATURES.map(([k]) => k === 'logTenure' ? Math.log1p(p.features.tenure) : k === 'logSpend' ? Math.log1p(p.features.spendAvg || p.features.spend) : p.features[k]);
const sigmoid = x => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));
const hashUnit = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
export function auc(scores, labels) {
  const pairs = scores.map((s, i) => [s, labels[i]]).sort((a, b) => a[0] - b[0]); let rank = 0, posRanks = 0, pos = 0;
  for (let i = 0; i < pairs.length;) { let j = i; while (j < pairs.length && pairs[j][0] === pairs[i][0]) j++; const r = (i + 1 + j) / 2; for (let k = i; k < j; k++) if (pairs[k][1]) { posRanks += r; pos++; } rank = j; i = j; }
  const neg = rank - pos; return pos && neg ? (posRanks - pos * (pos + 1) / 2) / (pos * neg) : null;
}
export function canTrain(profiles) {
  const labelled = profiles.filter(p => p.churned !== null), pos = labelled.filter(p => p.churned).length;
  return {ok:labelled.length >= 60 && pos >= 10 && labelled.length - pos >= 10, labelled:labelled.length, positives:pos};
}
export function trainModel(profiles) {
  const check = canTrain(profiles); if (!check.ok) return null;
  const labelled = profiles.filter(p => p.churned !== null);
  const split = labelled.map(p => ({p, x:vector(p), y:p.churned ? 1 : 0, test:hashUnit(p.id) < 0.25}));
  let train = split.filter(s => !s.test), test = split.filter(s => s.test);
  if (test.filter(s => s.y).length < 3 || train.filter(s => s.y).length < 5) { train = split; test = split; }
  const k = FEATURES.length, mu = Array(k).fill(0), sd = Array(k).fill(0);
  train.forEach(s => s.x.forEach((v, i) => { mu[i] += v / train.length; }));
  train.forEach(s => s.x.forEach((v, i) => { sd[i] += (v - mu[i]) ** 2 / train.length; }));
  for (let i = 0; i < k; i++) sd[i] = Math.sqrt(sd[i]) || 1;
  const z = x => x.map((v, i) => (v - mu[i]) / sd[i]);
  const pos = train.filter(s => s.y).length, wPos = train.length / (2 * pos), wNeg = train.length / (2 * (train.length - pos));
  let w = Array(k).fill(0), b = 0; const lr = 0.3, lambda = 0.2, Z = train.map(s => z(s.x));
  for (let epoch = 0; epoch < 500; epoch++) {
    const g = Array(k).fill(0); let gb = 0;
    train.forEach((s, n) => { const err = (sigmoid(b + Z[n].reduce((a, v, i) => a + v * w[i], 0)) - s.y) * (s.y ? wPos : wNeg); gb += err; Z[n].forEach((v, i) => { g[i] += err * v; }); });
    w = w.map((wi, i) => wi - lr * (g[i] / train.length + lambda * wi)); b -= lr * gb / train.length;
  }
  const model = {mu, sd, w, b, trainedOn:train.length, testedOn:test.length, holdout:test !== split};
  const testScores = test.map(s => predict(model, s.p).probability), testLabels = test.map(s => s.y);
  let best = {f1:-1, threshold:0.5};
  for (let t = 0.2; t <= 0.8; t += 0.05) { const m = confusion(testScores, testLabels, t); if (m.f1 > best.f1) best = {...m, threshold:Math.round(t * 100) / 100}; }
  model.threshold = best.threshold; model.metrics = {...confusion(testScores, testLabels, best.threshold), auc:auc(testScores, testLabels)};
  model.importance = FEATURES.map(([key, label], i) => ({key, label, weight:w[i]})).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  return model;
}
function confusion(scores, labels, t) {
  let tp = 0, fp = 0, fn = 0, tn = 0; scores.forEach((s, i) => { if (s >= t) labels[i] ? tp++ : fp++; else labels[i] ? fn++ : tn++; });
  const precision = tp + fp ? tp / (tp + fp) : 0, recall = tp + fn ? tp / (tp + fn) : 0;
  return {tp, fp, fn, tn, accuracy:(tp + tn) / (scores.length || 1), precision, recall, f1:precision + recall ? 2 * precision * recall / (precision + recall) : 0};
}
export function predict(model, profile) {
  const z = vector(profile).map((v, i) => (v - model.mu[i]) / model.sd[i]);
  const parts = z.map((v, i) => ({label:FEATURES[i][1], value:v * model.w[i]}));
  return {probability:sigmoid(model.b + parts.reduce((a, p) => a + p.value, 0)), reasons:parts.filter(p => p.value > 0.05).sort((a, b) => b.value - a.value).slice(0, 3).map(p => p.label)};
}

// Each warning signal maps to a response and the department that owns it.
export const ACTIONS = {
  silent:{text:'Win-back call with a personalised top-up bonus', owner:'Retention / CRM'},
  spendDrop:{text:'Value bundle matched to their last 3 months of spend', owner:null}, // owned by the customer's own business unit
  fewerRecharges:{text:'Auto-renew bundle or recharge reminder', owner:'Sales'},
  usageCollapse:{text:'Check network quality where they live; service-recovery bundle', owner:'Network'},
  bundleDowngrade:{text:'Right-size data bundle offer', owner:'Sales'},
  complaints:{text:'Priority call-back from Customer Service', owner:'Customer Service'},
  failedPurchases:{text:'Investigate failed purchases and credit a goodwill bundle', owner:'Network'},
  omDrop:{text:'Orange Money cashback on next transfer', owner:'Orange Money'},
};
const FALLBACK = {reward:{text:'Loyalty reward to reinforce the relationship', owner:'Retention / CRM'}, none:{text:'No action — keep monitoring', owner:'—'}};
export function riskBand(score, threshold = 0.5) { return score >= threshold ? 'high' : score >= threshold * 0.55 ? 'medium' : 'low'; }
// Scores every active (not already churned) customer with the trained model, or the rule score as fallback.
export function scoreCustomers(profiles, model) {
  return profiles.filter(p => p.churned !== true).map(p => {
    const m = model ? predict(model, p) : null, score = m ? m.probability : p.ruleScore;
    const fired = SIGNALS.filter(s => p.signals[s.key]);
    const band = riskBand(score, model?.threshold ?? 0.5), reasons = m?.reasons.length ? m.reasons : fired.map(s => s.label).slice(0, 3), next = fired[0] ? ACTIONS[fired[0].key] : band !== 'low' ? FALLBACK.reward : FALLBACK.none;
    return {...p, score, band, reasons, action:next.text, owner:next.owner ?? p.department, valueAtRisk:score * (p.features.spendAvg || p.features.spend)};
  }).sort((a, b) => b.score - a.score);
}

// Monthly buying patterns across the whole dataset.
export function buyingPatterns(records) {
  const months = [...new Set(records.map(r => r.month))].sort();
  const byMonth = months.map(month => {
    const rows = records.filter(r => r.month === month), buyers = rows.filter(r => r.rechargeCount > 0);
    return {month, customers:rows.length, buyers:buyers.length, revenue:sum(rows, 'rechargeAmount'), recharges:sum(rows, 'rechargeCount'), data:sum(rows, 'dataSpend'), voice:sum(rows, 'voiceSpend'), sms:sum(rows, 'smsSpend'), om:sum(rows, 'omValue'),
      arpu:buyers.length ? sum(buyers, 'rechargeAmount') / buyers.length : 0, avgTopup:sum(rows, 'rechargeCount') ? sum(rows, 'rechargeAmount') / sum(rows, 'rechargeCount') : 0};
  });
  const last = months.at(-1), latest = records.filter(r => r.month === last);
  const frequency = [['None', 0, 0], ['1', 1, 1], ['2–3', 2, 3], ['4–7', 4, 7], ['8+', 8, Infinity]].map(([label, lo, hi]) => ({label, count:latest.filter(r => r.rechargeCount >= lo && r.rechargeCount <= hi).length}));
  const sizes = [['< 10', 0, 10], ['10–25', 10, 25], ['25–50', 25, 50], ['50–100', 50, 100], ['100+', 100, Infinity]].map(([label, lo, hi]) => ({label, count:latest.filter(r => r.rechargeCount > 0 && r.rechargeAmount / r.rechargeCount >= lo && r.rechargeAmount / r.rechargeCount < hi).length}));
  return {months, byMonth, frequency, sizes, hasProducts:records.some(r => r.dataSpend !== null || r.voiceSpend !== null), hasOm:records.some(r => r.omValue !== null)};
}

// Churn patterns: observed churn (if labelled) by segment, district, tenure and signal lift.
export function churnPatterns(profiles) {
  const rate = rows => { const l = rows.filter(p => p.churned !== null); return l.length ? l.filter(p => p.churned).length / l.length : null; };
  const labelled = profiles.some(p => p.churned !== null);
  const group = (keyFn, labels) => labels.map(([key, label]) => { const rows = profiles.filter(p => keyFn(p) === key); return {key, label, count:rows.length, rate:rate(rows)}; }).filter(g => g.count);
  const tenureBand = p => p.features.tenure < 6 ? 'a' : p.features.tenure < 12 ? 'b' : p.features.tenure < 24 ? 'c' : 'd';
  return {
    labelled, overall:rate(profiles),
    bySignal:SIGNALS.map(s => { const on = profiles.filter(p => p.signals[s.key]), off = profiles.filter(p => !p.signals[s.key]); const a = rate(on), b = rate(off); return {...s, count:on.length, rate:a, lift:a !== null && b ? a / b : null}; }).filter(s => s.count),
    byTenure:group(tenureBand, [['a', '< 6 months'], ['b', '6–11 months'], ['c', '1–2 years'], ['d', '2+ years']]),
    byDistrict:Object.entries(DISTRICTS).map(([id, name]) => { const rows = profiles.filter(p => p.district === id); return {id, name, count:rows.length, rate:rate(rows)}; }).filter(d => d.count),
  };
}

const csvCell = v => { let t = v === null || v === undefined ? '' : String(v); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return /[,"\r\n]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t; };
export const toCSV = rows => rows.map(r => r.map(csvCell).join(',')).join('\n') + '\n';
export function predictionsCSV(scored, modelLabel) {
  return toCSV([['customer_id', 'district', 'department', 'latest_month', 'segment', 'churn_risk', 'risk_band', 'monthly_value_at_risk_sle', 'top_reasons', 'recommended_action', 'action_owner', 'method'],
    ...scored.map(p => [p.id, p.district ? DISTRICTS[p.district] : '', p.department, p.month, p.segment, p.score.toFixed(3), p.band, p.valueAtRisk.toFixed(1), p.reasons.join('; '), p.action, p.owner, modelLabel])]);
}
export function errorsCSV(errors) { return toCSV([['line', 'column', 'problem'], ...errors.map(e => [e.line, e.column, e.problem])]); }

// The five decision questions, answered only from customers the model actually assessed.
// Retention opportunity = medium/high risk, at least one warning signal to act on, and spend at or above the median.
export function decisionInsights({profiles, scored, churn, model, patterns}) {
  const atRisk = scored.filter(p => p.band !== 'low'), high = scored.filter(p => p.band === 'high');
  const spends = scored.map(p => p.features.spendAvg || p.features.spend).sort((a, b) => a - b), median = spends[Math.floor(spends.length / 2)] ?? 0;
  const opportunities = atRisk.filter(p => SIGNALS.some(s => p.signals[s.key]) && (p.features.spendAvg || p.features.spend) >= median);
  const highShare = rows => rows.length ? rows.filter(p => p.band === 'high').length / rows.length : 0;
  const segments = SEGMENT_TYPES.map(s => { const rows = scored.filter(p => p.segment === s.key); return {...s, count:rows.length, share:highShare(rows)}; }).filter(s => s.count >= 5).sort((a, b) => b.share - a.share);
  const districts = Object.entries(DISTRICTS).map(([id, name]) => { const rows = scored.filter(p => p.district === id); return {id, name, count:rows.length, share:highShare(rows)}; }).filter(d => d.count >= 5).sort((a, b) => b.share - a.share);
  const signals = churn.labelled
    ? churn.bySignal.filter(s => s.lift && s.count >= 5).sort((a, b) => b.lift - a.lift).map(s => ({...s, evidence:`${s.lift.toFixed(1)}× the churn rate of customers without it`}))
    : SIGNALS.map(s => { const on = scored.filter(p => p.signals[s.key]); return {...s, count:on.length, share:highShare(on)}; }).filter(s => s.count >= 5).sort((a, b) => b.share - a.share).map(s => ({...s, evidence:`${Math.round(s.share * 100)}% of these customers scored high risk`}));
  const byAction = Object.values(atRisk.reduce((m, p) => { if (p.owner !== '—') { const k = p.action; (m[k] ??= {action:p.action, owner:p.owner, customers:0, high:0, value:0}); m[k].customers++; m[k].value += p.valueAtRisk; if (p.band === 'high') m[k].high++; } return m; }, {})).sort((a, b) => b.high - a.high || b.value - a.value);
  const labelledMonths = [...new Set(profiles.filter(p => p.churned !== null).flatMap(p => p.history.map(r => r.month)))].sort();
  return {
    assessed:scored.length, customers:profiles.length, atRisk:atRisk.length, high:high.length, opportunities:opportunities.length,
    opportunityValue:opportunities.reduce((a, p) => a + p.valueAtRisk, 0), segments, districts, signals:signals.slice(0, 3), actions:byAction.slice(0, 3),
    churnRate:churn.overall, churnPeriod:labelledMonths.length ? [labelledMonths[0], labelledMonths.at(-1)] : null,
    period:[patterns.months[0], patterns.months.at(-1)], threshold:model?.threshold ?? 0.5, trained:!!model,
  };
}
