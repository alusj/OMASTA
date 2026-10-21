// Fictional monthly behaviour records (May–Oct 2026) used until an authorised user uploads a dataset.
const MONTHS = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
const DISTRICTS = [['Western Area Urban', 22], ['Western Area Rural', 9], ['Bo', 9], ['Kenema', 9], ['Bombali', 8], ['Port Loko', 8], ['Kono', 7], ['Kailahun', 7], ['Tonkolili', 7], ['Koinadugu', 5], ['Kambia', 4], ['Moyamba', 4], ['Pujehun', 3], ['Bonthe', 2]];
const RISKY = {'Western Area Urban':1.4, Kono:1.35, Kailahun:1.25, 'Western Area Rural':1.15, Bonthe:0.6, Pujehun:0.7, Moyamba:0.75};

function rng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, weighted) => { let x = r() * weighted.reduce((a, [, w]) => a + w, 0); for (const [v, w] of weighted) if ((x -= w) < 0) return v; return weighted[0][0]; };

export function sampleBehaviourTable(customers = 520) {
  const r = rng(20261021), rows = [['customer_id', 'month', 'district', 'department', 'tenure_months', 'recharge_count', 'recharge_amount', 'data_bundle_spend', 'voice_bundle_spend', 'sms_spend', 'data_mb', 'voice_minutes', 'active_days', 'om_transactions', 'om_value', 'complaints', 'failed_purchases', 'churned']];
  for (let c = 1; c <= customers; c++) {
    const district = pick(r, DISTRICTS), department = r() < 0.72 ? 'B2C' : r() < 0.85 ? 'Orange Money' : 'B2B';
    const joined = r() < 0.07 ? 3 + Math.floor(r() * 2) : 0, tenure = joined ? 1 - joined : Math.round(1 + r() ** 1.6 * 70), baseSpend = 30 + r() ** 1.8 * (department === 'B2B' ? 900 : 260), dataLover = r();
    const riskiness = (RISKY[district] ?? 1) * (tenure < 6 ? 1.5 : tenure > 30 ? 0.6 : 1);
    // Fate: churners decline then stop; at-risk customers are declining now; the rest stay healthy.
    const fate = r() < 0.13 * riskiness ? 'churn' : r() < 0.11 * riskiness ? 'atRisk' : 'healthy';
    const start = fate === 'churn' ? 2 + Math.floor(r() * 3) : fate === 'atRisk' ? 4 : 99, end = fate === 'churn' ? Math.min(5, start + 1 + Math.floor(r() * 2)) : 99;
    const omBase = department === 'Orange Money' || r() < 0.3 ? 3 + r() * 9 : 0, goesQuiet = fate === 'atRisk' && r() < 0.4, quietFirst = fate === 'churn' && r() < 0.45, complaintProne = fate !== 'healthy' ? r() < 0.55 : r() < 0.12, network = fate !== 'healthy' && r() < 0.5;
    MONTHS.forEach((month, m) => {
      if ((fate === 'churn' && m > end) || m < joined) return;
      const decay = m < start ? 1 : (m >= end && fate === 'churn') || (goesQuiet && m === 5) || (quietFirst && m === end - 1) ? 0 : Math.max(0.05, 1 - (m - start + 1) * (0.32 + r() * 0.2));
      const noise = 0.82 + r() * 0.36, spend = Math.round(baseSpend * decay * noise), count = spend ? Math.max(1, Math.round((2 + baseSpend / 40) * decay * (0.7 + r() * 0.6))) : 0;
      const data = Math.round(spend * (0.35 + dataLover * 0.5) * (fate !== 'healthy' && m >= start ? 0.7 : 1)), voice = Math.round((spend - data) * 0.8), sms = Math.max(0, spend - data - voice);
      const om = omBase ? Math.round(omBase * (0.85 + r() * 0.3) * decay) : 0;
      rows.push([`C-${String(c).padStart(6, '0')}`, month, district, department, tenure + m, count, spend, data, voice, sms,
        Math.round(data * (14 + r() * 10) * (network && m >= start ? 0.5 : 1)), Math.round(voice * (1.4 + r())), Math.min(31, Math.round((8 + 22 * decay) * (0.85 + r() * 0.2))),
        om, om * Math.round(40 + r() * 160), complaintProne && m >= start - 1 && r() < 0.6 ? 1 + Math.floor(r() * 2) : r() < 0.04 ? 1 : 0,
        network && m >= start - 1 && r() < 0.55 ? 2 + Math.floor(r() * 3) : r() < 0.05 ? 1 : 0,
        fate === 'churn' && m === end ? 'yes' : 'no']);
    });
  }
  return rows;
}
