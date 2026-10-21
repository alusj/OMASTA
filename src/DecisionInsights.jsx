import { useMemo, useState } from 'react';
import { Info, ArrowUpRight, Users, Layers, Radar, Target, ClipboardCheck } from 'lucide-react';
import { decisionInsights } from './behaviour.mjs';

const fmt = n => Math.round(n).toLocaleString('en-US');
const pc = v => v === null || v === undefined ? '—' : `${(v * 100).toFixed(1)}%`;
const month = m => m ? new Date(`${m}-01T00:00:00Z`).toLocaleString('en-GB', {month:'short', year:'numeric', timeZone:'UTC'}) : '—';

// Small (i) button that reveals a metric's definition, reporting period and data source.
export function MetricInfo({definition, period, source}) {
  const [open, setOpen] = useState(false);
  return <span className="metric-info" onMouseLeave={() => setOpen(false)}>
    <button type="button" aria-label="What this metric means" aria-expanded={open} onClick={e => { e.stopPropagation(); setOpen(!open); }} onMouseEnter={() => setOpen(true)}><Info size={12}/></button>
    {open && <span role="tooltip" className="metric-info-pop"><b>Definition</b>{definition}<b>Period</b>{period}<b>Source</b>{source}</span>}
  </span>;
}

// "What needs a decision": the five questions every department view should answer, using only model-assessed customers.
export default function DecisionInsights({data, dataset, department, onOpen, canStudio}) {
  const ins = useMemo(() => decisionInsights(data), [data]);
  const period = `${month(ins.period[0])} – ${month(ins.period[1])}`, source = `${dataset.name}${dataset.source === 'uploaded' ? '' : ' (fictional sample)'}`;
  const scoreRule = ins.trained ? `trained model score ≥ ${Math.round(ins.threshold * 55)}% (medium) or ≥ ${Math.round(ins.threshold * 100)}% (high)` : 'behaviour-rule score ≥ 28% (medium) or ≥ 50% (high)';
  if (!ins.assessed) return <section className="panel insights empty-insights"><h2>{department === 'All departments' ? 'Executive insights' : 'Department insights'}</h2><p>No customers in this department have been assessed yet. Upload a behaviour dataset in the Dataset studio.</p></section>;
  const top = ins.segments[0], district = ins.districts[0], action = ins.actions[0];
  const cards = [
    {n:1, q:'How many customers are at risk?', Icon:Users, value:fmt(ins.atRisk), sub:`${fmt(ins.high)} high risk need urgent review`, foot:`of ${fmt(ins.assessed)} customers assessed`,
      info:{definition:`Active customers whose ${scoreRule}. Only customers the model scored are counted.`, period, source}},
    {n:2, q:'Which segments carry the most risk?', Icon:Layers, value:top ? top.label : '—', sub:top ? `${pc(top.share)} of ${fmt(top.count)} are high risk${ins.segments[1]?.share ? ` · then ${ins.segments[1].label} (${pc(ins.segments[1].share)})` : ''}` : 'Not enough customers per segment', foot:district ? `Highest district: ${district.name} (${pc(district.share)})` : 'No district column supplied',
      info:{definition:'Share of each behaviour segment (and district) scored high risk. Groups under 5 customers are hidden.', period, source}},
    {n:3, q:'Which signals go with that risk?', Icon:Radar, list:ins.signals.map(s => [s.label, s.evidence]), foot:'Associations in this data — not proven causes',
      info:{definition:ins.signals[0]?.evidence?.includes('churn rate') ? 'Observed churn rate among customers showing the signal, divided by the rate among those without it.' : 'Share of customers showing the signal who scored high risk (no churn labels to measure lift).', period, source}},
    {n:4, q:'Who should Orange prioritise?', Icon:Target, value:fmt(ins.opportunities), sub:'retention opportunities', foot:`≈ SLE ${fmt(ins.opportunityValue)} monthly spend at risk`,
      info:{definition:'Medium or high-risk customers with at least one actionable warning signal and spend at or above the median. Value = risk score × their average monthly spend.', period, source}},
    {n:5, q:'What should each department do next?', Icon:ClipboardCheck, list:ins.actions.map(a => [a.owner, `${a.action} — ${fmt(a.customers)} customers`]), foot:'Recommendations for review; campaigns are not connected',
      info:{definition:'The response linked to each at-risk customer’s strongest signal, grouped by the owning department, most high-risk customers first.', period, source}},
  ];
  return <section className="panel insights">
    <div className="panel-heading"><div><h2>{department === 'All departments' ? 'Executive insights' : `${department} insights`}</h2><p>Answers from {fmt(ins.assessed)} customers assessed by {ins.trained ? 'the trained churn model' : 'behaviour rules'} · {period} · {dataset.source === 'uploaded' ? 'uploaded dataset' : 'fictional sample data'}</p></div>
      <div className="insights-links"><button className="secondary-button" onClick={() => onOpen('behaviour')}>Watchlist<ArrowUpRight size={13}/></button>{canStudio && <button className="secondary-button" onClick={() => onOpen('studio')}>Predictions<ArrowUpRight size={13}/></button>}</div></div>
    <div className="insight-cards">{cards.map(c => <div key={c.n} className="insight-card">
      <div className="ic-q"><span>{c.n}</span>{c.q}<MetricInfo {...c.info}/></div>
      {c.value !== undefined && <><strong>{c.value}</strong><p>{c.sub}</p></>}
      {c.list && <ul>{c.list.length ? c.list.map(([a, b]) => <li key={a + b}><b>{a}</b>{b}</li>) : <li>Not enough data yet</li>}</ul>}
      <small>{c.foot}</small>
    </div>)}</div>
    <div className="insights-foot">
      <span><b>Observed churn rate</b>{ins.churnRate === null ? 'Not available — dataset has no churn outcomes' : `${pc(ins.churnRate)} of labelled customers left, ${month(ins.churnPeriod[0])} – ${month(ins.churnPeriod[1])}`}<MetricInfo definition="Customers recorded as churned ÷ customers with a known outcome. Measured, not predicted." period={ins.churnPeriod ? `${month(ins.churnPeriod[0])} – ${month(ins.churnPeriod[1])}` : 'n/a'} source={source}/></span>
      <span><b>Retention campaign performance</b>Not measured yet — no campaign results are connected<MetricInfo definition="Churn among customers who received a retention action vs. a held-out control group." period="Shown once campaign outcomes are recorded" source="Campaign results feed (not connected)"/></span>
      {action && <span><b>Biggest single action</b>{action.owner}: {action.action.toLowerCase()} ({fmt(action.high)} high risk)</span>}
    </div>
  </section>;
}
