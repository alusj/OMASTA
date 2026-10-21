import { useMemo, useState } from 'react';
import { Users, Wallet, Repeat, BellRing, ArrowUpRight, ArrowDownRight, X, Search, Upload, FileSpreadsheet, Lightbulb, ChevronRight } from 'lucide-react';
import SierraLeoneMap, { MapLegend } from './SierraLeoneMap';
import { useGeo } from './useGeo';
import { SIGNALS, SEGMENT_TYPES, DISTRICTS } from './behaviour.mjs';
import { bandFor } from './regional.mjs';
import './studio.css';

const fmt = n => Math.round(n).toLocaleString('en-US');
const money = n => `SLE ${n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : fmt(n)}`;
const pct = (n, d) => d ? `${(n / d * 100).toFixed(1)}%` : '—';
const monthLabel = m => new Date(`${m}-01T00:00:00Z`).toLocaleString('en-GB', {month:'short', year:'numeric', timeZone:'UTC'});
const delta = (a, b) => b ? (a - b) / b * 100 : 0;

export function Spark({values, color = '#ff7900', width = 90, height = 26}) {
  const max = Math.max(...values, 1), step = width / Math.max(1, values.length - 1);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)} ${(height - 2 - v / max * (height - 4)).toFixed(1)}`).join('');
  return <svg className="spark" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true"><path d={d} fill="none" stroke={color} strokeWidth="1.8"/></svg>;
}
function Kpi(props) {
  const {label, value, change, note, Icon, color, invert} = props;
  const up = change > 0, good = invert ? !up : up;
  return <section className="metric"><div className="metric-top"><span>{label}</span><div className={`metric-icon ${color}`}><Icon size={19}/></div></div><strong>{value}</strong>
    <div className="metric-bottom"><span className={good ? 'positive' : 'negative'}>{up ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}{Math.abs(change).toFixed(1)}%</span><span>{note}</span></div></section>;
}

export function CustomerDrawer({customer, onClose}) {
  const h = customer.history, max = Math.max(...h.map(r => r.rechargeAmount), 1);
  return <div className="modal-backdrop" onClick={onClose}><section className="modal behaviour-drawer" role="dialog" aria-modal="true" aria-labelledby="bd-title" onClick={e => e.stopPropagation()}>
    <div className="panel-heading"><div><span className="eyebrow"><i/>CUSTOMER BEHAVIOUR</span><h2 id="bd-title">{customer.id}</h2><p>{customer.district ? DISTRICTS[customer.district] : 'District not supplied'} · {customer.department} · {customer.features.tenure} months on network</p></div><button className="icon-button" aria-label="Close" onClick={onClose}><X size={20}/></button></div>
    <div className="bd-score"><div><small>Churn risk</small><strong className={`risk-${customer.band}`}>{Math.round(customer.score * 100)}%</strong></div><div><small>Segment</small><strong>{SEGMENT_TYPES.find(s => s.key === customer.segment).label}</strong></div><div><small>Spend trend</small><strong className={customer.features.spendChange < 0 ? 'negative' : 'positive'}>{(customer.features.spendChange * 100).toFixed(0)}%</strong></div></div>
    <h3>Monthly top-ups</h3>
    <div className="bd-bars">{h.map(r => <div key={r.month}><b>{money(r.rechargeAmount)}</b><span style={{height:`${r.rechargeAmount / max * 90}px`}} className={r.churned ? 'churned' : r.rechargeCount ? '' : 'quiet'}/><small>{monthLabel(r.month)}</small></div>)}</div>
    <div className="table-wrap"><table className="bd-table"><thead><tr><th>Month</th><th>Top-ups</th><th>Data bundles</th><th>Data (MB)</th><th>Active days</th><th>OM txns</th><th>Complaints</th></tr></thead>
      <tbody>{h.map(r => <tr key={r.month} className={r.churned ? 'churned' : ''}><td>{monthLabel(r.month)}{r.churned && <em> left</em>}</td><td>{r.rechargeCount}</td><td>{r.dataSpend ?? '—'}</td><td>{r.dataMb === null ? '—' : fmt(r.dataMb)}</td><td>{r.activeDays ?? '—'}</td><td>{r.omTransactions ?? '—'}</td><td>{r.complaints ?? '—'}</td></tr>)}</tbody></table></div>
    <h3>Signals</h3>
    <div className="signal-chips">{SIGNALS.filter(s => customer.signals[s.key]).map(s => <span key={s.key} style={{'--c':s.color}}>{s.label}</span>)}{!SIGNALS.some(s => customer.signals[s.key]) && <span className="calm">No warning signals</span>}</div>
    {customer.reasons?.length > 0 && <p className="bd-reasons">Model drivers: {customer.reasons.join(' · ')}</p>}
    <div className="dd-driver"><Lightbulb size={16}/><p><strong>Next best action ({customer.owner}):</strong> {customer.action}. Sample recommendation — campaign execution is not connected.</p></div>
  </section></div>;
}

export default function BehaviourMonitor({data, dataset, canUpload, onOpenStudio}) {
  const geo = useGeo();
  const {records, profiles, scored, patterns} = data;
  const [signal, setSignal] = useState(null), [segment, setSegment] = useState(null), [query, setQuery] = useState(''), [open, setOpen] = useState(null), [shown, setShown] = useState(12);
  const months = patterns.byMonth, last = months.at(-1), prev = months.at(-2) ?? last;
  const active = scored, warned = active.filter(p => SIGNALS.some(s => p.signals[s.key]));
  const watch = useMemo(() => active.filter(p => (!signal || p.signals[signal]) && (!segment || p.segment === segment) && (!query || `${p.id} ${DISTRICTS[p.district] ?? ''}`.toLowerCase().includes(query.toLowerCase()))), [active, signal, segment, query]);
  const mapModel = useMemo(() => geo && (() => {
    const overall = active.length ? Math.round(active.filter(p => p.band !== 'low').length / active.length * 1000) / 10 : 0;
    const districts = geo.districts.map(d => { const rows = active.filter(p => p.district === d.id), w = rows.filter(p => p.band !== 'low').length, rate = rows.length ? Math.round(w / rows.length * 1000) / 10 : 0;
      return {id:d.id, name:d.name, province:d.province, customers:rows.length, rate, band:bandFor(rate, overall), atRisk:w, segments:{leaving:rows.filter(p => p.band === 'high').length}, chiefdoms:[]}; });
    return {districts, profile:{rate:Math.max(1, overall), unit:'customers'}};
  })(), [geo, active]);
  const maxMonth = Math.max(...months.map(m => m.revenue), 1), segCounts = SEGMENT_TYPES.map(s => ({...s, count:profiles.filter(p => p.segment === s.key && p.churned !== true).length}));
  const maxFreq = Math.max(...patterns.frequency.map(f => f.count), 1), maxSize = Math.max(...patterns.sizes.map(f => f.count), 1);
  if (!records.length) return <section className="panel empty"><FileSpreadsheet/><h2>No behaviour data in your scope</h2><p>Upload a monthly behaviour dataset for this department in the Dataset studio.</p></section>;
  return <div className="behaviour">
    <section className="dataset-strip"><span className="dataset-file-icon"><FileSpreadsheet size={22}/></span><div><strong>{dataset.name}</strong><p>{fmt(active.length)} active customers · {patterns.months.length} months ({monthLabel(patterns.months[0])} – {monthLabel(patterns.months.at(-1))}){dataset.uploadedBy ? ` · uploaded by ${dataset.uploadedBy}` : ''}</p></div><span className="dataset-tag">{dataset.source === 'uploaded' ? 'UPLOADED' : 'SAMPLE DATA'}</span>{canUpload && <button className="secondary-button" onClick={onOpenStudio}><Upload size={14}/>Upload dataset</button>}</section>
    <div className="metrics">
      <Kpi label="Active buyers" value={fmt(last.buyers)} change={delta(last.buyers, prev.buyers)} note={`topped up in ${monthLabel(last.month)}`} Icon={Users} color="orange"/>
      <Kpi label="Average spend per buyer" value={money(last.arpu)} change={delta(last.arpu, prev.arpu)} note="vs previous month" Icon={Wallet} color="green"/>
      <Kpi label="Top-ups per buyer" value={(last.recharges / Math.max(1, last.buyers)).toFixed(1)} change={delta(last.recharges / Math.max(1, last.buyers), prev.recharges / Math.max(1, prev.buyers))} note={`avg ${money(last.avgTopup)} each`} Icon={Repeat} color="purple"/>
      <Kpi label="Showing warning signals" value={fmt(warned.length)} change={warned.length / Math.max(1, active.length) * 100} note="of active customers" Icon={BellRing} color="red" invert/>
    </div>
    <div className="bm-row">
      <section className="panel"><div className="panel-heading"><div><h2>Buying pattern over time</h2><p>{patterns.hasProducts ? 'What customers spend on each month' : 'Monthly top-up value'}</p></div><div className="bm-legend">{patterns.hasProducts ? [['Data', '#ff7900'], ['Voice', '#367cf6'], ['SMS', '#8b5cf6']].map(([l, c]) => <span key={l}><i style={{background:c}}/>{l}</span>) : <span><i style={{background:'#ff7900'}}/>Top-ups</span>}<span><i className="line"/>Buyers</span></div></div>
        <div className="stack-chart">{months.map(m => { const other = Math.max(0, m.revenue - m.data - m.voice - m.sms); return <div key={m.month} className="stack-col" title={`${monthLabel(m.month)}: ${money(m.revenue)} from ${fmt(m.buyers)} buyers`}>
          <b>{money(m.revenue)}</b><div className="stack" style={{height:`${m.revenue / maxMonth * 150}px`}}>{patterns.hasProducts ? <>{other > 0 && <span style={{flex:other, background:'#d5dbe0'}}/>}<span style={{flex:m.sms, background:'#8b5cf6'}}/><span style={{flex:m.voice, background:'#367cf6'}}/><span style={{flex:m.data, background:'#ff7900'}}/></> : <span style={{flex:1, background:'#ff7900'}}/>}</div>
          <small>{monthLabel(m.month)}</small><em>{fmt(m.buyers)}</em></div>; })}</div>
        <p className="driver-note">Buyers = customers with at least one top-up that month.{patterns.hasOm ? ` Orange Money moved ${money(last.om)} in ${monthLabel(last.month)}.` : ''}</p>
      </section>
      <section className="panel"><div className="panel-heading"><div><h2>Behaviour segments</h2><p>Click a segment to list its customers</p></div></div>
        <div className="seg-list">{segCounts.map(s => <button key={s.key} className={segment === s.key ? 'active' : ''} onClick={() => setSegment(segment === s.key ? null : s.key)}><i style={{background:s.color}}/><div><strong>{s.label}</strong><small>{s.text}</small></div><b>{fmt(s.count)}</b><span className="seg-bar"><span style={{width:pct(s.count, active.length), background:s.color}}/></span></button>)}</div>
      </section>
    </div>
    <section className="panel"><div className="panel-heading"><div><h2>Behaviour-change alerts</h2><p>Customers whose buying or usage has shifted — click to filter the watchlist</p></div>{signal && <button className="secondary-button" onClick={() => setSignal(null)}><X size={13}/>Clear filter</button>}</div>
      <div className="alert-grid">{SIGNALS.map(s => { const n = active.filter(p => p.signals[s.key]).length; return <button key={s.key} className={`alert-card ${signal === s.key ? 'active' : ''}`} style={{'--c':s.color}} onClick={() => setSignal(signal === s.key ? null : s.key)} disabled={!n}><span>{s.label}</span><strong>{fmt(n)}</strong><small>{s.detail}</small><em>{pct(n, active.length)} of customers</em></button>; })}</div>
    </section>
    <div className="bm-row three">
      <section className="panel"><div className="panel-heading"><div><h2>Top-up frequency</h2><p>Top-ups per customer, {monthLabel(last.month)}</p></div></div><div className="histo">{patterns.frequency.map(f => <div key={f.label}><b>{fmt(f.count)}</b><span style={{height:`${f.count / maxFreq * 110}px`, background:f.label === 'None' ? '#e5484d' : '#ffb672'}}/><small>{f.label}</small></div>)}</div></section>
      <section className="panel"><div className="panel-heading"><div><h2>Top-up size</h2><p>Average value per top-up (SLE), {monthLabel(last.month)}</p></div></div><div className="histo">{patterns.sizes.map(f => <div key={f.label}><b>{fmt(f.count)}</b><span style={{height:`${f.count / maxSize * 110}px`}}/><small>{f.label}</small></div>)}</div></section>
      <section className="panel bm-map"><div className="panel-heading"><div><h2>Where behaviour is slipping</h2><p>Share of customers at medium/high risk</p></div></div>{mapModel ? <><SierraLeoneMap geo={geo} model={mapModel} compact/><MapLegend metric="rate" nationalRate={mapModel.profile.rate}/></> : <div className="ws-loading"><span/></div>}</section>
    </div>
    <section className="panel"><div className="panel-heading"><div><h2>Customer watchlist</h2><p>{signal ? SIGNALS.find(s => s.key === signal).label : segment ? SEGMENT_TYPES.find(s => s.key === segment).label : 'All active customers'} · highest churn risk first</p></div><label className="business-search"><Search size={13}/><input aria-label="Search customers" placeholder="Customer ID or district" value={query} onChange={e => setQuery(e.target.value)}/></label></div>
      <div className="table-wrap"><table className="district-table watch-table"><thead><tr><th>Customer</th><th>Segment</th><th>6-month spend</th><th>Latest</th><th>Change</th><th>Signals</th><th>Risk</th><th/></tr></thead>
        <tbody>{watch.slice(0, shown).map(p => <tr key={p.id} onClick={() => setOpen(p)}>
          <td><strong>{p.id}</strong><small>{p.district ? DISTRICTS[p.district] : '—'} · {p.department}</small></td>
          <td><span className="seg-pill" style={{'--c':SEGMENT_TYPES.find(s => s.key === p.segment).color}}>{SEGMENT_TYPES.find(s => s.key === p.segment).label}</span></td>
          <td><Spark values={p.history.map(r => r.rechargeAmount)} color={p.features.spendChange < -0.3 ? '#e5484d' : '#17b26a'}/></td>
          <td>{money(p.history.at(-1).rechargeAmount)}</td><td className={p.features.spendChange < 0 ? 'negative' : 'positive'}>{(p.features.spendChange * 100).toFixed(0)}%</td>
          <td><div className="signal-chips small">{SIGNALS.filter(s => p.signals[s.key]).slice(0, 2).map(s => <span key={s.key} style={{'--c':s.color}}>{s.label}</span>)}</div></td>
          <td><span className={`risk-pill risk-${p.band}`}>{Math.round(p.score * 100)}%</span></td><td><ChevronRight size={15}/></td></tr>)}</tbody></table>
        {!watch.length && <p className="empty-note">No customers match.</p>}</div>
      {watch.length > shown && <button className="link-button" onClick={() => setShown(shown + 24)}>Show more ({fmt(watch.length - shown)} remaining)</button>}
    </section>
    {open && <CustomerDrawer customer={open} onClose={() => setOpen(null)}/>}
  </div>;
}
