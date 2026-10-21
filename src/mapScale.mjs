// Colour scales for the Sierra Leone map.
const fmt = n => n.toLocaleString('en-US');
const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), [x, y] = [p(a), p(b)]; return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const ramp = (stops, t) => { t = Math.max(0, Math.min(1, t)); const i = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1))); return mix(stops[i], stops[i + 1], t * (stops.length - 1) - i); };
export const RATE_STOPS = ['#17b26a', '#9bd27a', '#f9d269', '#ff9b32', '#ff7900', '#d9363e'];
export const COUNT_STOPS = ['#fff3e6', '#ffd2a3', '#ffa34d', '#ff7900', '#c2410c'];
export const LEAVING_STOPS = ['#fff0f0', '#fdb4b4', '#f27272', '#e5484d', '#a51d24'];

export const METRICS = {
  rate:{label:'Churn rate', value:r => r.rate, text:r => `${r.rate}%`},
  atRisk:{label:'At-risk customers', value:r => r.atRisk, text:r => fmt(r.atRisk)},
  leaving:{label:'At risk of leaving', value:r => r.segments.leaving, text:r => fmt(r.segments.leaving)},
};
// Rates are coloured relative to the department's national rate; counts on a sequential scale.
export function colourFor(metric, row, rows, nationalRate) {
  if (metric === 'rate') return ramp(RATE_STOPS, (row.rate / nationalRate - 0.7) / 0.65);
  const max = Math.max(...rows.map(METRICS[metric].value)) || 1;
  return ramp(metric === 'leaving' ? LEAVING_STOPS : COUNT_STOPS, Math.sqrt(METRICS[metric].value(row) / max));
}
