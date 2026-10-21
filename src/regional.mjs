// Regional churn intelligence. Everything here is deterministic SAMPLE data shaped like the
// production feed (district → chiefdom), so a real data service can replace `buildRegionalModel` later.

export const SEGMENTS = [
  {key:'low', label:'Low risk', color:'#17b26a'},
  {key:'normal', label:'Normal', color:'#f4c54a'},
  {key:'high', label:'High risk', color:'#ff7900'},
  {key:'leaving', label:'At risk of leaving', color:'#e5484d'},
];
export const BANDS = {low:{label:'Low rate', color:'#17b26a'}, normal:{label:'Normal rate', color:'#f4b740'}, high:{label:'High rate', color:'#e5484d'}};
export const MONTHS = ['Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct'];

// 2015 census populations (Stats SL) — used only to spread the sample base across districts.
const POPULATION = {bo:575478, bombali:606544, bonthe:200781, kailahun:526379, kambia:345474, kenema:609891, koinadugu:409372, kono:506100, moyamba:318588, 'port-loko':615376, pujehun:346461, tonkolili:531435, 'western-area-rural':444270, 'western-area-urban':1055964};
// What makes each district different, by driver theme (1 = national average).
const TRAITS = {
  'western-area-urban':{urban:1.7, price:1.35, competition:1.5, network:0.85, agent:0.7, rate:1.32},
  'western-area-rural':{urban:1.2, price:1.2, competition:1.2, network:1.05, rate:1.12},
  bo:{urban:1.1, service:1.15, rate:1.0}, kenema:{agent:1.2, competition:1.1, rate:1.04},
  kono:{network:1.6, coverage:1.5, agent:1.2, rate:1.22}, kailahun:{network:1.5, coverage:1.6, agent:1.35, rate:1.16},
  koinadugu:{coverage:1.8, network:1.4, agent:1.4, urban:0.6, rate:0.92}, bombali:{service:1.2, price:1.05, rate:0.97},
  tonkolili:{network:1.2, engagement:1.15, rate:0.94}, kambia:{competition:1.25, engagement:1.1, rate:0.88},
  'port-loko':{engagement:1.2, service:1.1, rate:0.95}, moyamba:{coverage:1.3, engagement:1.1, rate:0.84},
  pujehun:{coverage:1.35, agent:1.2, rate:0.78}, bonthe:{coverage:1.7, network:1.3, urban:0.5, rate:0.74},
};
const PROVINCE_SUMMARY = {
  'Western Area':'Dense, competitive market around Freetown — price and switching offers dominate.',
  Northern:'Large rural districts — coverage and agent reach shape loyalty.',
  'North West':'Border districts with multi-SIM behaviour and seasonal engagement dips.',
  Eastern:'Mining and trading hubs — network quality drives most exits.',
  Southern:'Stable, relationship-led base with the lowest national churn.',
};

const drv = (label, share, color, theme, signal, solution, owner, lift) => ({label, share, color, theme, signal, solution, owner, lift});
export const PROFILES = {
  'All departments':{unit:'customers', customers:1480240, rate:14.3, revenue:74.6, color:'#ff7900', focus:'Every Orange business, one national view.', drivers:[
    drv('Network experience',24.8,'#ff7900','network','Dropped calls and slow data in the 30 days before exit','Prioritise site upgrades where at-risk customers cluster; proactive apology bundles','Network',0.34),
    drv('Price & value',18.7,'#f4b740','price','Recharge value falling while competitor-SIM activity rises','Personalised value bundles for price-sensitive segments','B2C marketing',0.28),
    drv('Low engagement',15.2,'#8b5cf6','engagement','Fewer active days and no recharge in 14+ days','Win-back nudges and usage-based rewards at day 10 of inactivity','Retention / CRM',0.22),
    drv('Customer service',12.6,'#367cf6','service','Repeat contacts and unresolved complaints','Fast-track complex complaints; call back every at-risk complainant','Customer Service',0.19),
    drv('Bundle mismatch',10.4,'#17b26a','engagement','Out-of-bundle spend or unused bundle balance each month','Right-size bundles automatically from 60-day usage','Sales',0.15)]},
  B2C:{unit:'subscribers', customers:842600, rate:16.2, revenue:32.8, color:'#ff7900', focus:'Consumer prepaid and postpaid subscribers.', drivers:[
    drv('Network experience',24.8,'#ff7900','network','Dropped calls and slow data in the 30 days before exit','Target site upgrades where at-risk subscribers cluster','Network',0.34),
    drv('Price & value',18.7,'#f4b740','price','Recharge value falling while competitor-SIM activity rises','Personalised value bundles for price-sensitive segments','B2C marketing',0.28),
    drv('Low engagement',15.2,'#8b5cf6','engagement','No recharge in 14+ days, fewer active days','Usage rewards and win-back nudges at day 10 of inactivity','Retention / CRM',0.22),
    drv('Customer service',12.6,'#367cf6','service','Repeat contacts and unresolved complaints','Call back every at-risk complainant within 24 hours','Customer Service',0.19),
    drv('Bundle mismatch',10.4,'#17b26a','engagement','Out-of-bundle spend or unused balance','Right-size bundles from 60-day usage','Sales',0.15)]},
  B2B:{unit:'accounts', customers:12840, rate:6.4, revenue:18.6, color:'#367cf6', focus:'Enterprise, SME and public-sector accounts.', drivers:[
    drv('Contract & pricing',26.1,'#367cf6','price','Renewal within 90 days and tariff above market benchmark','Renewal reviews 90 days ahead with tailored pricing','B2B sales',0.31),
    drv('Service uptime (SLA)',21.4,'#ff7900','network','SLA breaches and repeat fault tickets','Dedicated fault desk and SLA credits for key accounts','Network',0.27),
    drv('Account management',17.9,'#8b5cf6','service','No account-manager contact in 60 days','Quarterly business reviews for every top-tier account','B2B sales',0.21),
    drv('Competitor offers',14.2,'#f4b740','competition','Competitor bids reported or lines ported out','Counter-offer playbook and multi-year incentives','B2B sales',0.18),
    drv('Billing disputes',9.6,'#17b26a','service','Open disputes older than 30 days','Single consolidated invoice and 7-day dispute resolution','Customer Service',0.14)]},
  'Orange Money':{unit:'wallets', customers:624800, rate:11.8, revenue:23.2, color:'#17b26a', focus:'Orange Money wallets, agents and merchants.', drivers:[
    drv('Wallet inactivity',25.3,'#17b26a','engagement','No transaction in 30 days after a first cash-in','First-30-day activation journeys and cashback on second use','Orange Money',0.3),
    drv('Agent liquidity',20.2,'#ff7900','agent','Failed cash-outs and agents without float','Float rebalancing and super-agent coverage in thin areas','Orange Money',0.27),
    drv('Transaction fees',17.1,'#f4b740','price','Fee complaints and transfers shifting to competitors','Fee-free tiers for small transfers and merchant payments','Orange Money',0.22),
    drv('Failed transactions',13.4,'#e5484d','network','Timeouts and reversals during peak hours','Peak-hour capacity and automatic instant reversals','Network',0.18),
    drv('Trust & security',10.2,'#8b5cf6','service','Fraud reports and PIN-reset contacts','Fraud education and faster PIN-reset in shops','Customer Service',0.14)]},
  'Customer Service':{unit:'contacting customers', customers:318400, rate:19.4, revenue:12.1, color:'#367cf6', focus:'Customers who contacted Orange in the period.', drivers:[
    drv('Unresolved complaints',27.6,'#e5484d','service','Tickets open more than 72 hours','Escalation desk for tickets older than 48 hours','Customer Service',0.33),
    drv('Repeat contacts',21.2,'#ff7900','service','Three or more contacts for the same issue','First-contact resolution targets and agent coaching','Customer Service',0.26),
    drv('Long wait times',16.4,'#f4b740','urban','Abandoned calls and long queues at peak','Call-back queue and self-service for top 5 requests','Customer Service',0.2),
    drv('Billing errors',12.3,'#367cf6','price','Disputed charges and refund requests','Proactive refunds and clear charge notifications','Customer Service',0.16),
    drv('Channel friction',9.8,'#8b5cf6','coverage','Walk-ins from areas without a nearby shop','WhatsApp support and mobile service days in remote chiefdoms','Customer Service',0.12)]},
  'Retention / CRM':{unit:'customers in campaigns', customers:386200, rate:13.9, revenue:21.4, color:'#8b5cf6', focus:'Customers targeted by retention campaigns.', drivers:[
    drv('Late intervention',24.1,'#e5484d','engagement','First retention contact after the customer went inactive','Trigger offers from early-warning signals, not inactivity','Retention / CRM',0.31),
    drv('Wrong offer fit',20.6,'#ff7900','price','Offers declined or used once','Next-best-offer model per segment and district','Retention / CRM',0.25),
    drv('Offer fatigue',15.9,'#f4b740','engagement','More than four campaigns in 30 days','Contact-frequency caps and a quiet period','Retention / CRM',0.18),
    drv('Contactability',13.3,'#367cf6','coverage','SMS not delivered, no consent for calls','Refresh consent and reach through agents and shops','Retention / CRM',0.15),
    drv('Competitor counter-offers',11.8,'#8b5cf6','competition','Customer received a rival promotion','Match-and-beat offers for high-value customers','B2C marketing',0.14)]},
  Sales:{unit:'new activations', customers:96500, rate:21.3, revenue:6.8, color:'#ff7900', focus:'Customers in their first 90 days.', drivers:[
    drv('Poor onboarding',25.8,'#ff7900','engagement','No second recharge within 14 days of activation','Welcome journey with a day-7 bonus and how-to messages','Sales',0.3),
    drv('Mismatched first bundle',19.7,'#f4b740','price','First bundle unused or exhausted early','Guided bundle selection at the point of sale','Sales',0.24),
    drv('Multi-SIM switching',17.2,'#8b5cf6','competition','Device active on rival SIMs','Loyalty perks unlocked by day-30 tenure','B2C marketing',0.2),
    drv('Coverage at activation',13.5,'#367cf6','coverage','Activated where indoor coverage is weak','Coverage checks before selling in fringe areas','Network',0.16),
    drv('Dealer quality',10.6,'#17b26a','service','High early churn concentrated in a few dealers','Dealer scorecards and commission on 90-day survival','Sales',0.13)]},
  Network:{unit:'customers on affected sites', customers:402300, rate:17.6, revenue:15.9, color:'#ff7900', focus:'Customers served by sites with quality issues.', drivers:[
    drv('Coverage gaps',26.4,'#ff7900','coverage','Frequent no-service events at home location','Rural site rollout prioritised by at-risk revenue','Network',0.32),
    drv('Dropped calls',20.8,'#e5484d','network','Drop rate above 2% on serving cells','Optimise the 50 worst cells serving at-risk customers','Network',0.26),
    drv('Slow data',17.3,'#f4b740','urban','Throughput below 1 Mbps in busy hours','Capacity upgrades in congested urban sectors','Network',0.21),
    drv('Site outages',13.1,'#8b5cf6','network','Power-related outages longer than 4 hours','Solar and battery backup at outage-prone sites','Network',0.17),
    drv('Peak congestion',10.9,'#367cf6','urban','Failed sessions in evening peaks','Traffic steering and evening data offers off-peak','Network',0.13)]},
};
PROFILES['Executive Management'] = {...PROFILES['All departments'], focus:'Board-level view of churn, exposure and actions.'};

const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const round1 = n => Math.round(n * 10) / 10 || 0;

export function bandFor(rate, nationalRate) {
  return rate < nationalRate * 0.9 ? 'low' : rate > nationalRate * 1.08 ? 'high' : 'normal';
}
function segmentsFor(customers, rate, random) {
  const atRisk = customers * rate / 100, leaving = Math.round(atRisk * (0.36 + random() * 0.08)), high = Math.round(atRisk - leaving);
  const normal = Math.round(customers * (0.27 + random() * 0.12));
  return {low:customers - leaving - high - normal, normal, high, leaving};
}
function trendFor(rate, random, drift) {
  const out = []; let r = rate - drift;
  for (let i = 0; i < 12; i++) { out.push(round1(r)); r += drift / 11 + (random() - 0.5) * rate * 0.05; }
  out[11] = round1(rate); return out;
}
function driverMix(profile, traits) {
  const raw = profile.drivers.map(d => d.share * (traits[d.theme] ?? 1));
  const sum = raw.reduce((a, b) => a + b, 0), target = profile.drivers.reduce((a, d) => a + d.share, 0);
  return profile.drivers.map((d, i) => ({...d, share:round1(raw[i] * target / sum)}));
}

export function buildRegionalModel(department, geo) {
  const profile = PROFILES[department] ?? PROFILES['All departments'];
  const seed = hash(department), urbanBias = ['B2B','Orange Money','Customer Service'].includes(department) ? 1.6 : 1;
  const weights = geo.districts.map(d => POPULATION[d.id] * ((TRAITS[d.id]?.urban ?? 1) > 1.1 ? urbanBias : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let districts = geo.districts.map((d, i) => {
    const random = rng(seed ^ hash(d.id)), traits = TRAITS[d.id] ?? {};
    const customers = Math.round(profile.customers * weights[i] / total);
    return {...d, customers, rawRate:profile.rate * (traits.rate ?? 1) * (0.92 + random() * 0.16), random, traits};
  });
  const weighted = districts.reduce((a, d) => a + d.rawRate * d.customers, 0) / profile.customers;
  districts = districts.map(({random, traits, rawRate, ...d}) => {
    const rate = round1(rawRate * profile.rate / weighted), segments = segmentsFor(d.customers, rate, random);
    const atRisk = segments.high + segments.leaving, drift = (random() - 0.4) * rate * 0.22;
    const chiefdoms = geo.chiefdoms.filter(c => c.district === d.id);
    const cw = chiefdoms.map(() => 0.3 + random() * 1.7), cTotal = cw.reduce((a, b) => a + b, 0);
    const chiefdomRows = chiefdoms.map((c, j) => {
      const r = rng(hash(department + c.id)), customers = Math.max(12, Math.round(d.customers * cw[j] / cTotal));
      const cRate = round1(rate * (0.68 + r() * 0.7)), cSeg = segmentsFor(customers, cRate, r);
      return {id:c.id, name:c.name, district:d.id, customers, rate:cRate, band:bandFor(cRate, profile.rate), segments:cSeg, atRisk:cSeg.high + cSeg.leaving};
    });
    return {id:d.id, name:d.name, province:d.province, customers:d.customers, rate, band:bandFor(rate, profile.rate), segments, atRisk,
      revenueAtRisk:round1(profile.revenue * atRisk / (profile.customers * profile.rate / 100)), change:round1(drift / 11 * 3),
      trend:trendFor(rate, random, drift), drivers:driverMix(profile, traits), chiefdoms:chiefdomRows.sort((a, b) => b.rate - a.rate)};
  });
  const sum = key => districts.reduce((a, d) => a + d.segments[key], 0);
  const national = {customers:profile.customers, rate:profile.rate, revenue:profile.revenue,
    segments:{low:sum('low'), normal:sum('normal'), high:sum('high'), leaving:sum('leaving')},
    trend:MONTHS.map((_, i) => round1(districts.reduce((a, d) => a + d.trend[i] * d.customers, 0) / profile.customers))};
  national.atRisk = national.segments.high + national.segments.leaving;
  const provinces = [...new Set(districts.map(d => d.province))].map(name => {
    const rows = districts.filter(d => d.province === name), customers = rows.reduce((a, d) => a + d.customers, 0);
    const rate = round1(rows.reduce((a, d) => a + d.rate * d.customers, 0) / customers);
    return {name, customers, rate, band:bandFor(rate, profile.rate), atRisk:rows.reduce((a, d) => a + d.atRisk, 0), summary:PROVINCE_SUMMARY[name]};
  }).sort((a, b) => b.rate - a.rate);
  return {department, profile, national, districts, provinces};
}

// Short, plain-language updates generated from the model (largest movements first).
export function regionalUpdates(model) {
  const byChange = [...model.districts].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  const hottest = [...model.districts].sort((a, b) => b.rate - a.rate)[0];
  const chiefdom = model.districts.flatMap(d => d.chiefdoms.map(c => ({...c, districtName:d.name}))).sort((a, b) => b.atRisk - a.atRisk)[0];
  return [
    {tone:'high', title:`${hottest.name} has the highest churn`, text:`${hottest.rate}% of ${model.profile.unit} — ${(hottest.rate - model.profile.rate).toFixed(1)} pts above the national rate.`, district:hottest.id},
    ...byChange.slice(0, 3).map(d => ({tone:d.change > 0 ? 'high' : 'low', title:`${d.name} ${d.change > 0 ? 'up' : 'down'} ${Math.abs(d.change)} pts`, text:`Churn rate moved over the last quarter; now ${d.rate}% (${BANDS[d.band].label.toLowerCase()}).`, district:d.id})),
    {tone:'normal', title:`${chiefdom.name} needs a visit`, text:`${chiefdom.atRisk.toLocaleString('en-US')} ${model.profile.unit} at risk in this ${chiefdom.districtName} chiefdom.`, district:chiefdom.district},
  ];
}

// Projected effect of mitigating each driver by `effort` (0–1). Lift = share of driver-attributed churn removable.
export function simulateImpact(model, efforts) {
  const drivers = model.profile.drivers;
  const reduction = drivers.reduce((a, d, i) => a + d.share / 100 * d.lift * (efforts[i] ?? 0), 0);
  const rate = round1(model.profile.rate * (1 - reduction));
  const saved = Math.round(model.profile.customers * (model.profile.rate - rate) / 100);
  return {rate, saved, revenue:round1(model.profile.revenue * reduction)};
}
