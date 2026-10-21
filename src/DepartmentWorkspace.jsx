import { useEffect, useMemo, useState } from 'react';
import { Users, Activity, UserX, Landmark, ArrowUpRight, ArrowDownRight, ChevronRight, Download, Lightbulb, ShieldCheck, Gauge, Search, MapPin, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import SierraLeoneMap, { MapLegend } from './SierraLeoneMap';
import { METRICS } from './mapScale.mjs';
import { buildRegionalModel, regionalUpdates, simulateImpact, SEGMENTS, BANDS, MONTHS } from './regional.mjs';
import { TABS } from './tabs.mjs';
import { useGeo } from './useGeo';
import DecisionInsights, { MetricInfo } from './DecisionInsights';
import './workspace.css';

const fmt = n => Math.round(n).toLocaleString('en-US');
const pct = (n, d) => d ? `${(n / d * 100).toFixed(1)}%` : '—';
const cap = s => s[0].toUpperCase() + s.slice(1);


function BandChip({band}) { return <span className="band-chip" style={{'--band':BANDS[band].color}}><i/>{BANDS[band].label}</span>; }
function Change({value, unit = ' pts'}) {
  const up = value > 0, Icon = up ? ArrowUpRight : ArrowDownRight;
  return <span className={`change ${up ? 'negative' : 'positive'}`}><Icon size={13}/>{Math.abs(value).toFixed(1)}{unit}</span>;
}
function SegmentBar({segments, total, showLegend = true}) {
  return <div className="segment-block">
    <div className="segment-bar">{SEGMENTS.map(s => <span key={s.key} style={{width:`${segments[s.key] / total * 100}%`, background:s.color}} title={`${s.label}: ${fmt(segments[s.key])}`}/>)}</div>
    {showLegend && <div className="segment-legend">{SEGMENTS.map(s => <div key={s.key}><i style={{background:s.color}}/><span>{s.label}</span><strong>{fmt(segments[s.key])}</strong><small>{pct(segments[s.key], total)}</small></div>)}</div>}
  </div>;
}
function TrendChart({series, height = 170}) {
  const values = series.flatMap(s => s.values), lo = Math.floor(Math.min(...values) - 1), hi = Math.ceil(Math.max(...values) + 1);
  const W = 600, H = height, pad = [28, 12, 22, 8], x = i => pad[0] + i * (W - pad[0] - pad[1]) / 11, y = v => pad[3] + (hi - v) / (hi - lo) * (H - pad[2] - pad[3]);
  const ticks = [lo, (lo + hi) / 2, hi];
  return <svg className="trend-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Churn rate trend, last 12 months">
    {ticks.map(t => <g key={t}><line x1={pad[0]} x2={W - pad[1]} y1={y(t)} y2={y(t)}/><text x={pad[0] - 6} y={y(t) + 3} textAnchor="end">{t.toFixed(0)}%</text></g>)}
    {MONTHS.map((m, i) => i % 2 === 1 && <text key={m} x={x(i)} y={H - 5} textAnchor="middle">{m}</text>)}
    {series.map((s, k) => { const line = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(''); return <g key={s.label}>
      {k === 0 && <path d={`${line}L${x(11)} ${H - pad[2]}L${x(0)} ${H - pad[2]}Z`} fill={s.color} opacity=".09"/>}
      <path d={line} fill="none" stroke={s.color} strokeWidth={k ? 1.6 : 2.6} strokeDasharray={s.dashed ? '5 5' : undefined} vectorEffect="non-scaling-stroke"/>
      {k === 0 && <circle cx={x(11)} cy={y(s.values[11])} r="4.5" fill="#fff" stroke={s.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke"/>}
    </g>; })}
  </svg>;
}
function Panel({title, sub, action, children, className = ''}) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>{action}</div>{children}</section>;
}

export default function DepartmentWorkspace({department, tab, onTab, multiplier, periodLabel, assessed, onNotice, children}) {
  const geo = useGeo();
  const [district, setDistrict] = useState(null), [chiefdom, setChiefdom] = useState(null), [metric, setMetric] = useState('rate'), [band, setBand] = useState('all');
  useEffect(() => { setDistrict(null); setChiefdom(null); setBand('all'); }, [department]);
  const model = useMemo(() => geo && buildRegionalModel(department, geo), [geo, department]);
  const selectDistrict = id => { setDistrict(id); setChiefdom(null); };
  const openDistrict = id => { selectDistrict(id); onTab('analysis'); };
  const tabs = <nav className="ws-tabs" aria-label="Department sections">{TABS.map(t => <button key={t.key} className={tab === t.key ? 'active' : ''} aria-current={tab === t.key ? 'page' : undefined} onClick={() => onTab(t.key)}><t.Icon size={15}/>{t.label}</button>)}<span className="ws-tabs-note"><ShieldCheck size={12}/>Sample regional data · real district boundaries</span></nav>;
  if (!model) return <>{tabs}<div className="ws-loading"><span/>Loading Sierra Leone map…</div></>;
  const props = {model, geo, multiplier, periodLabel, assessed, district, chiefdom, metric, band, setMetric, setBand, selectDistrict, setChiefdom, openDistrict, onNotice};
  return <>{tabs}{tab === 'analysis' ? <AnalysisTab {...props}/> : tab === 'intelligence' ? <IntelligenceTab {...props}/> : <OverviewTab {...props}>{children}</OverviewTab>}</>;
}

function Metrics({model, multiplier, periodLabel}) {
  const {profile, national} = model;
  const cards = [
    {label:`Total ${profile.unit}`, value:fmt(profile.customers), change:'2.3%', note:'base growth', Icon:Users, color:'orange', good:true, info:'Subscribers, accounts or wallets in this business unit (service counts, not unique people).'},
    {label:'Customers at risk', value:fmt(national.atRisk * multiplier), change:`${profile.rate}%`, note:'churn rate', Icon:Activity, color:'red', info:'Customers in the high-risk and at-risk-of-leaving segments of the regional estimate. The % is the estimated churn rate.'},
    {label:'At risk of leaving', value:fmt(national.segments.leaving * multiplier), change:pct(national.segments.leaving, profile.customers), note:'act this week', Icon:UserX, color:'purple', info:'The most urgent segment: customers estimated to leave soon without intervention.'},
    {label:'Revenue at risk', value:`SLE ${(profile.revenue * multiplier).toFixed(1)}M`, change:'14.2%', note:'estimated exposure', Icon:Landmark, color:'green', info:'Monthly revenue from at-risk customers, in SLE millions.'},
  ];
  return <div className="metrics">{cards.map(m => <section className="metric" key={m.label}><div className="metric-top"><span>{m.label}<MetricInfo definition={m.info} period={periodLabel} source="Illustrative regional estimate (fictional sample), not model-assessed"/></span><div className={`metric-icon ${m.color}`}><m.Icon size={19}/></div></div><strong>{m.value}</strong><div className="metric-bottom"><span className={m.good ? 'positive' : 'negative'}><ArrowUpRight size={14}/>{m.change}</span><span>{m.note}</span></div></section>)}<p className="metrics-source">Regional estimates for {model.department === 'All departments' ? 'all business units' : model.department} · {periodLabel} · fictional sample, not model-assessed. Model-assessed figures are in the insights below.</p></div>;
}

function OverviewTab({model, geo, multiplier, periodLabel, assessed, openDistrict, children}) {
  const {profile, national, provinces} = model, updates = regionalUpdates(model);
  const change = national.trend[11] - national.trend[8];
  return <>
    <Metrics model={model} multiplier={multiplier} periodLabel={periodLabel}/>
    {assessed && <DecisionInsights key={model.department} {...assessed} department={model.department}/>}
    <div className="ov-grid">
      <div className="ov-main">
        <div className="ov-pair">
          <Panel title="Churn trend" sub={`National churn rate, ${profile.unit}, last 12 months`} action={<Change value={change}/>}>
            <div className="trend-head"><strong>{profile.rate}%</strong><span>this month · {change > 0 ? 'rising' : 'easing'} over the quarter</span></div>
            <TrendChart series={[{label:'National', values:national.trend, color:profile.color}]}/>
          </Panel>
          <Panel title="Customer health" sub="Every customer in one of four risk segments">
            <div className="health-total"><strong>{fmt(profile.customers)}</strong><span>{profile.unit}</span></div>
            <SegmentBar segments={national.segments} total={profile.customers}/>
          </Panel>
        </div>
        <Panel title="Provinces at a glance" sub="Churn rate against the national average" action={<span className="pill">{provinces.length} provinces</span>}>
          <div className="province-list">{provinces.map(p => <div key={p.name} className="province-row">
            <div><strong>{p.name}</strong><small>{p.summary}</small></div>
            <div className="province-bar"><span style={{width:`${Math.min(100, p.rate / (profile.rate * 1.5) * 100)}%`, background:BANDS[p.band].color}}/><i style={{left:`${100 / 1.5}%`}} title="National rate"/></div>
            <b>{p.rate}%</b><BandChip band={p.band}/>
          </div>)}</div>
        </Panel>
        {children}
      </div>
      <aside className="ov-side">
        <Panel className="national-map" title="National picture" sub="Churn rate by district — click to analyse" action={<span className="pill">SL</span>}>
          <SierraLeoneMap geo={geo} model={model} compact onSelect={id => id && openDistrict(id)}/>
          <MapLegend metric="rate" nationalRate={profile.rate}/>
          <button className="link-button" onClick={() => openDistrict(null)}>Open district analysis <ChevronRight size={14}/></button>
        </Panel>
        <Panel title="Latest updates" sub="What changed across the country">
          <div className="update-list">{updates.map(u => <button key={u.title} className={`update ${u.tone}`} onClick={() => openDistrict(u.district)}><i/><div><strong>{u.title}</strong><p>{u.text}</p></div><ChevronRight size={14}/></button>)}</div>
        </Panel>
      </aside>
    </div>
  </>;
}

function AnalysisTab({model, geo, multiplier, district, chiefdom, metric, band, setMetric, setBand, selectDistrict, setChiefdom, onNotice}) {
  const {profile, national} = model, row = model.districts.find(d => d.id === district);
  const [sort, setSort] = useState({key:'rate', dir:-1}), [query, setQuery] = useState('');
  const counts = {all:model.districts.length, low:0, normal:0, high:0}; model.districts.forEach(d => counts[d.band]++);
  const inBand = d => band === 'all' || band === 'leaving' || d.band === band;
  const rankKey = band === 'leaving' ? 'leaving' : metric, rankValue = METRICS[rankKey].value;
  const ranked = model.districts.filter(inBand).sort((a, b) => rankValue(b) - rankValue(a)), max = Math.max(...ranked.map(rankValue), 1);
  const tableRows = model.districts.filter(d => inBand(d) && d.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => { const v = r => sort.key === 'name' ? r.name : sort.key in r.segments ? r.segments[sort.key] : r[sort.key]; return (v(a) > v(b) ? 1 : v(a) < v(b) ? -1 : 0) * sort.dir; });
  const head = (key, label) => <th><button onClick={() => setSort(s => ({key, dir:s.key === key ? -s.dir : -1}))} className={sort.key === key ? 'sorted' : ''}>{label}{sort.key === key ? (sort.dir < 0 ? ' ↓' : ' ↑') : ''}</button></th>;
  function exportDistricts() {
    const lines = ['District,Province,Customers,Churn rate %,Band,Low risk,Normal,High risk,At risk of leaving,Revenue at risk (SLE M)', ...model.districts.map(d => [d.name, d.province, d.customers, d.rate, BANDS[d.band].label, d.segments.low, d.segments.normal, d.segments.high, d.segments.leaving, d.revenueAtRisk].join(',')), 'Sample data only'];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], {type:'text/csv'})), a = document.createElement('a');
    a.href = url; a.download = `${model.department.replace(/\W+/g, '-').toLowerCase()}-districts-sample.csv`; a.click(); URL.revokeObjectURL(url); onNotice('Sample district report downloaded.');
  }
  const bandOptions = [['all', 'All districts', counts.all], ['low', 'Low rate', counts.low], ['normal', 'Normal rate', counts.normal], ['high', 'High rate', counts.high], ['leaving', 'At risk of leaving', null]];
  return <>
    <div className="analysis-toolbar">
      <div className="band-filter" role="group" aria-label="Filter by churn band">{bandOptions.map(([key, label, n]) => <button key={key} className={band === key ? 'active' : ''} style={{'--band':key === 'leaving' ? '#e5484d' : BANDS[key]?.color ?? '#17212c'}} onClick={() => setBand(key)}>{key !== 'all' && <i/>}{label}{n !== null && <small>{n}</small>}</button>)}</div>
      <div className="toolbar-right">
        <div className="segmented" role="group" aria-label="Map measure">{['rate', 'atRisk'].map(k => <button key={k} className={metric === k ? 'active' : ''} disabled={band === 'leaving'} onClick={() => setMetric(k)}>{METRICS[k].label}</button>)}</div>
        <label className="district-picker"><MapPin size={14}/><select aria-label="Choose a district" value={district ?? ''} onChange={e => selectDistrict(e.target.value || null)}><option value="">All of Sierra Leone</option>{model.districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <button className="secondary-button" onClick={exportDistricts}><Download size={14}/>Export</button>
      </div>
    </div>
    <div className="analysis-grid">
      <section className="panel map-panel">
        <div className="map-crumbs"><button onClick={() => selectDistrict(null)} className={!row ? 'current' : ''}>Sierra Leone</button>{row && <><ChevronRight size={13}/><span>{row.province}</span><ChevronRight size={13}/><strong>{row.name}</strong></>}{chiefdom && row && <><ChevronRight size={13}/><strong>{row.chiefdoms.find(c => c.id === chiefdom)?.name}</strong></>}</div>
        <SierraLeoneMap geo={geo} model={model} metric={metric} band={band} selected={district} chiefdom={chiefdom} onSelect={selectDistrict} onChiefdom={setChiefdom}/>
        <div className="map-foot"><MapLegend metric={band === 'leaving' ? 'leaving' : metric} nationalRate={profile.rate}/><span>{row ? `${row.chiefdoms.length} chiefdoms · click one to inspect` : 'Click a district to zoom in'}</span></div>
      </section>
      {row ? <DistrictDetail model={model} row={row} chiefdom={chiefdom} setChiefdom={setChiefdom} multiplier={multiplier}/> :
        <Panel className="ranking" title={band === 'all' ? 'District ranking' : band === 'leaving' ? 'Most customers at risk of leaving' : `${BANDS[band].label} districts`} sub={`By ${METRICS[rankKey].label.toLowerCase()} · national ${profile.rate}%`}>
          <SegmentBar segments={national.segments} total={profile.customers} showLegend={false}/>
          <div className="rank-list">{ranked.map((d, i) => <button key={d.id} onClick={() => selectDistrict(d.id)}>
            <span className="rank">{i + 1}</span><div><strong>{d.name}</strong><small>{d.province}</small><div className="rank-bar"><span style={{width:`${rankValue(d) / max * 100}%`, background:BANDS[d.band].color}}/></div></div>
            <b>{METRICS[rankKey].text(d)}</b><ChevronRight size={14}/></button>)}
            {!ranked.length && <p className="empty-note">No districts in this band for {model.department}.</p>}</div>
        </Panel>}
    </div>
    <Panel title="District breakdown" sub="Low, normal, high-risk and at-risk-of-leaving customers in every district" action={<label className="business-search"><Search size={13}/><input aria-label="Find a district" placeholder="Find a district" value={query} onChange={e => setQuery(e.target.value)}/></label>}>
      <div className="table-wrap"><table className="district-table"><thead><tr>{head('name', 'District')}{head('customers', cap(profile.unit))}{head('rate', 'Churn rate')}<th>Band</th>{head('low', 'Low risk')}{head('normal', 'Normal')}{head('high', 'High risk')}{head('leaving', 'At risk of leaving')}{head('revenueAtRisk', 'Revenue at risk')}{head('change', 'Qtr change')}</tr></thead>
        <tbody>{tableRows.map(d => <tr key={d.id} className={d.id === district ? 'selected' : ''} onClick={() => selectDistrict(d.id)}>
          <td><strong>{d.name}</strong><small>{d.province}</small></td><td>{fmt(d.customers)}</td><td><b>{d.rate}%</b></td><td><BandChip band={d.band}/></td>
          <td>{fmt(d.segments.low)}</td><td>{fmt(d.segments.normal)}</td><td>{fmt(d.segments.high * multiplier)}</td><td className="leaving">{fmt(d.segments.leaving * multiplier)}</td>
          <td>SLE {(d.revenueAtRisk * multiplier).toFixed(1)}M</td><td><Change value={d.change}/></td></tr>)}</tbody></table>
        {!tableRows.length && <p className="empty-note">No districts match.</p>}</div>
    </Panel>
  </>;
}

function DistrictDetail({model, row, chiefdom, setChiefdom, multiplier}) {
  const {profile, national} = model, chief = row.chiefdoms.find(c => c.id === chiefdom), focus = chief ?? row;
  const topDriver = [...row.drivers].sort((a, b) => b.share - a.share)[0];
  return <section className="panel district-detail">
    <div className="dd-head"><div><span className="eyebrow"><i/>{chief ? `${row.name} · chiefdom` : `${row.province} Province`}</span><h2>{focus.name}</h2></div><BandChip band={focus.band}/></div>
    <div className="dd-kpis">
      <div><span>Churn rate</span><strong>{focus.rate}%</strong><small className={focus.rate > profile.rate ? 'negative' : 'positive'}>{(focus.rate - profile.rate > 0 ? '+' : '') + (focus.rate - profile.rate).toFixed(1)} vs national</small></div>
      <div><span>{cap(profile.unit)}</span><strong>{fmt(focus.customers)}</strong><small>{pct(focus.customers, profile.customers)} of base</small></div>
      <div><span>At risk of leaving</span><strong>{fmt(focus.segments.leaving * multiplier)}</strong><small>{pct(focus.segments.leaving, focus.customers)} of {chief ? 'chiefdom' : 'district'}</small></div>
      {!chief && <div><span>Revenue at risk</span><strong>SLE {(row.revenueAtRisk * multiplier).toFixed(1)}M</strong><small><Change value={row.change}/> this quarter</small></div>}
      {chief && <div><span>High risk</span><strong>{fmt(chief.segments.high * multiplier)}</strong><small>needs a retention offer</small></div>}
    </div>
    <h3>Customer segments</h3>
    <SegmentBar segments={focus.segments} total={focus.customers}/>
    {!chief && <><h3>12-month trend <span className="legend-inline"><i style={{background:profile.color}}/>{row.name}<i className="dashed"/>National</span></h3>
      <TrendChart height={130} series={[{label:row.name, values:row.trend, color:profile.color}, {label:'National', values:national.trend, color:'#8b98a4', dashed:true}]}/>
      <div className="dd-driver"><Lightbulb size={16}/><p><strong>{topDriver.label}</strong> explains {topDriver.share}% of churn here. {topDriver.solution}.</p></div></>}
    <h3>Chiefdoms <small>highest churn first</small></h3>
    <div className="chief-list">{row.chiefdoms.map(c => <button key={c.id} className={c.id === chiefdom ? 'active' : ''} onClick={() => setChiefdom(c.id === chiefdom ? null : c.id)}>
      <i style={{background:BANDS[c.band].color}}/><span>{c.name}</span><small>{fmt(c.segments.leaving)} leaving</small><b>{c.rate}%</b></button>)}</div>
  </section>;
}

function IntelligenceTab({model, district, selectDistrict, openDistrict, onNotice}) {
  const {profile} = model, row = model.districts.find(d => d.id === district);
  const drivers = row ? row.drivers : profile.drivers, base = row ?? {customers:profile.customers, rate:profile.rate};
  const [efforts, setEfforts] = useState(() => profile.drivers.map(() => 0.5)), [open, setOpen] = useState(0);
  useEffect(() => setEfforts(profile.drivers.map(() => 0.5)), [profile]);
  const sim = simulateImpact(model, efforts), churners = base.customers * base.rate / 100;
  const maxShare = Math.max(...model.districts.flatMap(d => d.drivers.map(x => x.share)));
  const deltas = d => d.drivers.map((x, i) => ({...x, delta:x.share - profile.drivers[i].share}));
  const highs = model.districts.filter(d => d.band === 'high').sort((a, b) => b.rate - a.rate);
  const lows = model.districts.filter(d => d.band === 'low').sort((a, b) => a.rate - b.rate);
  return <>
    <div className="intel-scope">
      <div><span className="eyebrow"><i/>CHURN INTELLIGENCE</span><h2>{row ? `Signals linked to churn in ${row.name}` : `Signals linked to churn${model.department === 'All departments' ? '' : ` · ${model.department}`}`}</h2><p>{profile.focus} Drivers are estimated from sample behavioural signals, not confirmed causes.</p></div>
      <label className="district-picker"><MapPin size={14}/><select aria-label="Scope churn drivers" value={district ?? ''} onChange={e => selectDistrict(e.target.value || null)}><option value="">National</option>{model.districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
    </div>
    <div className="intel-grid">
      <Panel title="Churn signals & recommended responses" sub={`Share of ${row ? row.name : 'national'} churn cases showing each signal (association, not proven cause) · click for the playbook`}>
        <div className="driver-cards">{[...drivers].map((d, i) => ({...d, i})).sort((a, b) => b.share - a.share).map((d, rank) => {
          const saved = churners * d.share / 100 * d.lift, active = open === d.i;
          return <div key={d.label} className={`driver-card ${active ? 'open' : ''}`}>
            <button className="driver-card-head" onClick={() => setOpen(active ? -1 : d.i)} aria-expanded={active}>
              <span className="rank" style={{background:`${d.color}1c`, color:d.color}}>{rank + 1}</span>
              <div><strong>{d.label}</strong><div className="driver-track"><span style={{width:`${d.share * 3}%`, background:d.color}}/></div></div>
              <b>{d.share}%</b><ChevronRight size={15}/>
            </button>
            {active && <div className="driver-card-body">
              <div><span><Gauge size={13}/>How we spot it</span><p>{d.signal}.</p></div>
              <div><span><Lightbulb size={13}/>Recommended solution</span><p>{d.solution}.</p></div>
              <div className="driver-impact"><div><small>Owner</small><strong>{d.owner}</strong></div><div><small>Could retain</small><strong>~{fmt(saved)}</strong></div><div><small>Removable churn</small><strong>{Math.round(d.lift * 100)}%</strong></div>
                <button className="primary-button" onClick={() => onNotice(`${d.label}: action plan drafted for ${row?.name ?? 'Sierra Leone'} (sample). Campaign execution is not connected.`)}>Plan action<ArrowUpRight size={14}/></button></div>
            </div>}
          </div>;
        })}<p className="driver-note">Other factors account for {(100 - drivers.reduce((a, d) => a + d.share, 0)).toFixed(1)}%.</p></div>
      </Panel>
      <Panel className="simulator" title="Impact simulator" sub="How far would each fix move national churn?" action={<span className="pill orange-pill"><Sparkles size={11}/> Projection</span>}>
        <div className="sim-result"><div><small>Projected churn</small><strong>{sim.rate}%</strong><span className="positive"><TrendingDown size={13}/>{(profile.rate - sim.rate).toFixed(1)} pts</span></div><div><small>{cap(profile.unit)} retained</small><strong>{fmt(sim.saved)}</strong><span>per period</span></div><div><small>Revenue protected</small><strong>SLE {sim.revenue}M</strong><span>of {profile.revenue}M at risk</span></div></div>
        {profile.drivers.map((d, i) => <label key={d.label} className="sim-row"><span>{d.label}<b>{Math.round(efforts[i] * 100)}%</b></span><input type="range" min="0" max="1" step="0.05" value={efforts[i]} style={{'--fill':`${efforts[i] * 100}%`, '--c':d.color}} onChange={e => setEfforts(efforts.map((v, j) => j === i ? Number(e.target.value) : v))}/></label>)}
        <p className="driver-note">Slider = how much of the playbook is delivered. Sample model; validate with a controlled campaign.</p>
      </Panel>
    </div>
    <Panel title="Driver heatmap by district" sub="Where each driver bites hardest — click a district to focus" action={<span className="pill">{model.districts.length} districts</span>}>
      <div className="table-wrap"><table className="heatmap"><thead><tr><th>District</th>{profile.drivers.map(d => <th key={d.label}>{d.label}</th>)}<th>Rate</th></tr></thead>
        <tbody>{[...model.districts].sort((a, b) => b.rate - a.rate).map(d => { const top = Math.max(...d.drivers.map(x => x.share)); return <tr key={d.id} className={d.id === district ? 'selected' : ''} onClick={() => selectDistrict(d.id === district ? null : d.id)}>
          <td><strong>{d.name}</strong></td>{d.drivers.map(x => <td key={x.label}><span className={x.share === top ? 'top' : ''} style={{background:`rgba(255,121,0,${(x.share / maxShare) ** 1.6 * 0.85})`, color:x.share / maxShare > 0.62 ? '#fff' : '#3c4a56'}}>{x.share}%</span></td>)}<td><b style={{color:BANDS[d.band].color}}>{d.rate}%</b></td></tr>; })}</tbody></table></div>
    </Panel>
    <div className="intel-pair">
      <Panel title="Why high-rate districts struggle" sub="Drivers running above the national mix" action={<TrendingUp size={16} className="negative"/>}>
        {highs.length ? highs.map(d => { const worst = deltas(d).sort((a, b) => b.delta - a.delta).slice(0, 2); return <button key={d.id} className="reason" onClick={() => openDistrict(d.id)}><div><strong>{d.name} · {d.rate}%</strong><p>{worst.map(w => `${w.label} +${w.delta.toFixed(1)} pts`).join(' · ')}</p><small>{worst[0].solution}.</small></div><ChevronRight size={14}/></button>; }) : <p className="empty-note">No high-rate districts.</p>}
      </Panel>
      <Panel title="What keeps low-rate districts loyal" sub="Drivers running below the national mix — copy what works" action={<ShieldCheck size={16} className="positive"/>}>
        {lows.length ? lows.map(d => { const best = deltas(d).filter(w => w.delta < -0.05).sort((a, b) => a.delta - b.delta).slice(0, 2); if (!best.length) return null; return <button key={d.id} className="reason good" onClick={() => openDistrict(d.id)}><div><strong>{d.name} · {d.rate}%</strong><p>{best.map(w => `${w.label} ${w.delta.toFixed(1)} pts`).join(' · ')}</p><small>Fewer {best[0].label.toLowerCase()} exits than the national mix.</small></div><ChevronRight size={14}/></button>; }) : <p className="empty-note">No low-rate districts.</p>}
      </Panel>
    </div>
  </>;
}
