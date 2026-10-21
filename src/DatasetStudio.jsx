import { useMemo, useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, RotateCcw, BarChart3, BrainCircuit, FileText, Printer, ChevronDown, Search, Upload } from 'lucide-react';
import { COLUMNS, TEMPLATE, LIMITS, SIGNALS, SEGMENT_TYPES, DISTRICTS, validateDataset, predictionsCSV, errorsCSV, toCSV } from './behaviour.mjs';
import { readTable } from './tabular.mjs';
import { CustomerDrawer } from './BehaviourMonitor';
import './studio.css';

const fmt = n => Math.round(n).toLocaleString('en-US');
const pc = v => v === null || v === undefined ? '—' : `${(v * 100).toFixed(1)}%`;
function download(name, text, type = 'text/csv') { const url = URL.createObjectURL(new Blob([text], {type})), a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }
const STEPS = [['upload', 'Upload & validate', UploadCloud], ['analyse', 'Churn patterns', BarChart3], ['predict', 'Predictions', BrainCircuit], ['report', 'Report', FileText]];

function Ring({value}) {
  const r = 34, c = 2 * Math.PI * r, color = value >= 90 ? '#17b26a' : value >= 70 ? '#f4b740' : '#e5484d';
  return <svg className="ring" viewBox="0 0 84 84" role="img" aria-label={`Data quality ${value} out of 100`}><circle cx="42" cy="42" r={r} stroke="#eef1f4" strokeWidth="8" fill="none"/><circle cx="42" cy="42" r={r} stroke={color} strokeWidth="8" fill="none" strokeDasharray={`${c * value / 100} ${c}`} strokeLinecap="round" transform="rotate(-90 42 42)"/><text x="42" y="46" textAnchor="middle">{value}</text></svg>;
}
function RateBars({rows, overall, valueKey = 'rate', label}) {
  const max = Math.max(...rows.map(r => r[valueKey] ?? 0), overall ?? 0, 0.01);
  return <div className="rate-bars">{rows.map(r => <div key={r.key ?? r.id}><span>{r.label ?? r.name}<small>{fmt(r.count)}</small></span><div><i style={{width:`${(r[valueKey] ?? 0) / max * 100}%`, background:r.color ?? ((r[valueKey] ?? 0) > (overall ?? 0) * 1.1 ? '#e5484d' : '#ff9b32')}}/>{overall !== null && overall !== undefined && <em style={{left:`${overall / max * 100}%`}} title={label}/>}</div><b>{pc(r[valueKey])}</b></div>)}</div>;
}

export default function DatasetStudio({departments, user, data, dataset, onPublish, onReset, onNotice}) {
  const [step, setStep] = useState('upload'), [check, setCheck] = useState(null), [busy, setBusy] = useState(false), [drag, setDrag] = useState(false), [fileName, setFileName] = useState('');
  const [defaultDept, setDefaultDept] = useState(departments[0]), [showSchema, setShowSchema] = useState(false), [band, setBand] = useState('all'), [sortBy, setSortBy] = useState('risk'), [query, setQuery] = useState(''), [open, setOpen] = useState(null);
  const input = useRef(null);
  const {scored, model, churn, method, profiles} = data;
  const counts = {high:scored.filter(p => p.band === 'high').length, medium:scored.filter(p => p.band === 'medium').length, low:scored.filter(p => p.band === 'low').length};
  const predictions = useMemo(() => scored.filter(p => (band === 'all' || p.band === band) && (!query || `${p.id} ${DISTRICTS[p.district] ?? ''}`.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => sortBy === 'value' ? b.valueAtRisk - a.valueAtRisk : b.score - a.score), [scored, band, query, sortBy]);
  const riskByDistrict = useMemo(() => Object.entries(DISTRICTS).map(([id, name]) => { const rows = scored.filter(p => p.district === id); return {id, name, count:rows.length, rate:rows.length ? rows.filter(p => p.band === 'high').length / rows.length : null}; }).filter(d => d.count).sort((a, b) => b.rate - a.rate), [scored]);
  const fileSlug = dataset.name.replace(/\.[^.]+$/, '').replace(/\W+/g, '-').toLowerCase();

  async function handle(file) {
    if (!file) return;
    setFileName(file.name); setCheck(null); setBusy(true);
    try {
      if (file.size > LIMITS.bytes) throw new Error(`Files must be under ${LIMITS.bytes / 1e6} MB.`);
      if (!/\.(csv|xlsx|xls|txt)$/i.test(file.name)) throw new Error('Upload a .csv or .xlsx file.');
      setCheck({...validateDataset(await readTable(file), {departments, defaultDepartment:defaultDept}), file:file.name});
    } catch (err) { setCheck({ok:false, fatal:err.message, errors:[], warnings:[], columns:[], stats:{}, file:file.name}); }
    finally { setBusy(false); }
  }
  function publish() { onPublish(check.records, check.file); setCheck(null); setStep('analyse'); onNotice(`${check.file}: ${fmt(check.stats.valid)} rows loaded for analysis. The Behaviour monitor now uses this dataset.`); }
  const findings = [
    `${fmt(scored.length)} active customers analysed across ${data.patterns.months.length} month${data.patterns.months.length === 1 ? '' : 's'}; ${fmt(counts.high)} (${pc(counts.high / Math.max(1, scored.length))}) are at high risk of churning.`,
    churn.overall !== null && `Observed churn in the dataset is ${pc(churn.overall)}.`,
    (() => { const s = [...churn.bySignal].filter(x => x.lift).sort((a, b) => b.lift - a.lift)[0]; return s && `Customers flagged "${s.label.toLowerCase()}" churned ${s.lift.toFixed(1)}× as often as others.`; })(),
    riskByDistrict[0] && `${riskByDistrict[0].name} has the highest share of high-risk customers (${pc(riskByDistrict[0].rate)}).`,
    model && `Model check on ${model.holdout ? 'held-out' : 'training'} customers: AUC ${model.metrics.auc?.toFixed(2) ?? '—'}, catches ${pc(model.metrics.recall)} of churners with ${pc(model.metrics.precision)} precision.`,
  ].filter(Boolean);

  return <div className="studio">
    <nav className="studio-steps" aria-label="Dataset studio steps">{STEPS.map((entry, i) => { const [key, label, Icon] = entry; return <button key={key} className={step === key ? 'active' : ''} onClick={() => setStep(key)}><span>{i + 1}</span><Icon size={15}/>{label}</button>; })}
      <div className="studio-active"><FileSpreadsheet size={14}/>{dataset.name}<em>{dataset.source === 'uploaded' ? 'Uploaded' : 'Sample'}</em>{dataset.source === 'uploaded' && <button className="icon-button" aria-label="Restore sample dataset" title="Restore sample dataset" onClick={onReset}><RotateCcw size={14}/></button>}</div></nav>

    {step === 'upload' && <>
      <div className="upload-grid">
        <section className={`panel dropzone ${drag ? 'drag' : ''}`} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}>
          <UploadCloud size={34}/><h2>{busy ? `Reading ${fileName}…` : 'Drop a CSV or Excel file here'}</h2><p>One row per customer per month · .csv or .xlsx · up to {LIMITS.bytes / 1e6} MB and {fmt(LIMITS.rows)} rows</p>
          <div className="dz-actions"><button className="primary-button" disabled={busy} onClick={() => input.current?.click()}><Upload size={15}/>Choose file</button><button className="secondary-button" onClick={() => download('orange-behaviour-template.csv', TEMPLATE)}><Download size={14}/>CSV template</button></div>
          <label className="dz-dept">Rows without a department belong to <select value={defaultDept} onChange={e => setDefaultDept(e.target.value)} aria-label="Default department">{departments.map(d => <option key={d}>{d}</option>)}</select></label>
          <input ref={input} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="file-input" aria-label="Upload behaviour dataset" onChange={e => { handle(e.target.files?.[0]); e.target.value = ''; }}/>
        </section>
        <section className="panel privacy"><ShieldCheck size={20}/><h2>Before you upload</h2><ul><li>Use pseudonymous customer IDs — phone numbers are rejected.</li><li>Files are read in this browser. No rows are sent to a server or to OMASTA.</li><li>You can only load rows for departments you are assigned to ({departments.length > 3 ? `${departments.length} departments` : departments.join(', ')}).</li><li>Uploaded data resets when the page reloads.</li></ul><p className="driver-note">Signed in as {user.name} · {user.role}</p></section>
      </div>
      <section className="panel schema"><button className="schema-toggle" onClick={() => setShowSchema(!showSchema)} aria-expanded={showSchema}><div><h2>Expected columns</h2><p>{COLUMNS.filter(c => c.required).length} required, {COLUMNS.filter(c => !c.required).length} optional — common alternative names are recognised</p></div><ChevronDown size={16}/></button>
        {showSchema && <div className="table-wrap"><table className="district-table"><thead><tr><th>Column</th><th>Required</th><th>What it holds</th><th>Also accepted</th></tr></thead><tbody>{COLUMNS.map(c => <tr key={c.key}><td><code>{c.label}</code></td><td>{c.required ? <b className="negative">Required</b> : 'Optional'}</td><td>{c.help}</td><td><small>{c.aliases.slice(0, 4).join(', ')}</small></td></tr>)}</tbody></table></div>}
      </section>
      {check && (check.fatal && !check.records?.length ? <section className="panel validation fail"><XCircle size={22}/><div><h2>{check.file} can’t be imported</h2><p>{check.fatal}</p>{check.errors.length > 0 && <button className="secondary-button" onClick={() => download('validation-errors.csv', errorsCSV(check.errors))}><Download size={14}/>Download error report ({fmt(check.errors.length)})</button>}</div></section> :
        <section className="panel validation"><div className="val-head"><Ring value={check.stats.quality}/><div><h2>{check.file}</h2><p>Data quality score · {pc(check.stats.completeness)} of optional cells filled</p></div>
          <div className="val-actions"><button className="secondary-button" onClick={() => setCheck(null)}>Choose another file</button><button className="primary-button" onClick={publish}><CheckCircle2 size={15}/>Analyse {fmt(check.stats.valid)} valid rows</button></div></div>
          <div className="val-stats">{[['Rows read', check.stats.rows], ['Valid rows', check.stats.valid], ['Rows with errors', check.stats.invalid], ['Customers', check.stats.customers], ['Months', check.stats.months.length]].map(([l, v]) => <div key={l} className={l === 'Rows with errors' && v ? 'bad' : ''}><small>{l}</small><strong>{fmt(v)}</strong></div>)}</div>
          <div className="val-cols">{check.columns.filter(c => c.key !== 'department' || c.found).map(c => <span key={c.key} className={c.found ? 'ok' : c.required ? 'missing' : 'off'} title={c.found ? `Read from "${c.source}"` : 'Not supplied'}>{c.found ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}{c.label}</span>)}</div>
          {check.warnings.map(w => <div key={w} className="val-warning"><AlertTriangle size={14}/>{w}</div>)}
          {check.errors.length > 0 && <><div className="val-errors-head"><h3>Row errors <small>{fmt(check.stats.invalid)} rows excluded</small></h3><button className="secondary-button" onClick={() => download('validation-errors.csv', errorsCSV(check.errors))}><Download size={14}/>Download error report</button></div>
            <div className="table-wrap"><table className="district-table"><thead><tr><th>Line</th><th>Column</th><th>Problem</th></tr></thead><tbody>{check.errors.slice(0, 8).map((e, i) => <tr key={i}><td>{e.line}</td><td><code>{e.column}</code></td><td>{e.problem}</td></tr>)}</tbody></table></div>{check.errors.length > 8 && <p className="driver-note">Showing 8 of {fmt(check.errors.length)} problems — the error report lists them all.</p>}</>}
        </section>)}
    </>}

    {step === 'analyse' && <>
      <div className="metrics">{[['Customers', fmt(profiles.length), 'in your scope'], ['Observed churn', pc(churn.overall), churn.labelled ? 'from the churned column' : 'no churn labels supplied'], ['High risk now', fmt(counts.high), 'active customers'], ['Months analysed', data.patterns.months.length, `${data.patterns.months[0]} → ${data.patterns.months.at(-1)}`]].map(([l, v, n]) => <section key={l} className="metric"><div className="metric-top"><span>{l}</span></div><strong>{v}</strong><div className="metric-bottom"><span>{n}</span></div></section>)}</div>
      {!churn.labelled && <div className="notice">This dataset has no churn outcomes, so patterns below show <strong>&nbsp;predicted&nbsp;</strong> risk. Add a churned column to measure real churn and train a model.</div>}
      <div className="bm-row">
        <section className="panel"><div className="panel-heading"><div><h2>Which behaviours come before churn?</h2><p>{churn.labelled ? 'Churn rate among customers showing each signal — the line marks the overall rate' : 'Customers showing each signal'}</p></div></div>
          {churn.labelled ? <RateBars rows={churn.bySignal} overall={churn.overall} label="Overall churn"/> : <RateBars rows={churn.bySignal.map(s => ({...s, rate:s.count / profiles.length}))} overall={null}/>}
          {churn.labelled && <div className="lift-list">{[...churn.bySignal].filter(s => s.lift).sort((a, b) => b.lift - a.lift).slice(0, 3).map(s => <span key={s.key}><b>{s.lift.toFixed(1)}×</b>{s.label}</span>)}</div>}
        </section>
        <section className="panel"><div className="panel-heading"><div><h2>Churn by tenure</h2><p>How long customers had been with Orange</p></div></div>{churn.labelled ? <RateBars rows={churn.byTenure} overall={churn.overall}/> : <p className="empty-note">Needs churn labels.</p>}</section>
      </div>
      <section className="panel"><div className="panel-heading"><div><h2>{churn.labelled ? 'Churn by district' : 'High-risk share by district'}</h2><p>Districts with customers in this dataset</p></div></div>
        <div className="two-col">{churn.labelled ? <RateBars rows={[...churn.byDistrict].sort((a, b) => b.rate - a.rate)} overall={churn.overall}/> : <RateBars rows={riskByDistrict}/>}</div>
        {!churn.byDistrict.length && <p className="empty-note">No district column supplied.</p>}
      </section>
    </>}

    {step === 'predict' && <>
      <div className="bm-row">
        <section className="panel model-card"><div className="panel-heading"><div><h2>Prediction method</h2><p>{method}</p></div><span className={`pill ${model ? 'orange-pill' : ''}`}>{model ? 'Trained model' : 'Rule-based'}</span></div>
          {model ? <><div className="val-stats">{[['AUC', model.metrics.auc?.toFixed(2) ?? '—'], ['Recall', pc(model.metrics.recall)], ['Precision', pc(model.metrics.precision)], ['Accuracy', pc(model.metrics.accuracy)], ['Threshold', model.threshold]].map(([l, v]) => <div key={l}><small>{l}</small><strong>{v}</strong></div>)}</div>
            <p className="driver-note">Measured on {fmt(model.testedOn)} {model.holdout ? 'held-out customers the model never saw' : 'training customers (too few labels for a hold-out set)'}. Churners are described by behaviour before the month they left.{model.testedOn < 200 && ' Small test set — treat these scores as indicative, not proven.'}</p>
            <h3>What the model looks at</h3><div className="importance">{model.importance.slice(0, 7).map(f => <div key={f.key}><span>{f.label}</span><div><i className={f.weight > 0 ? 'up' : 'down'} style={{width:`${Math.abs(f.weight) / Math.abs(model.importance[0].weight) * 50}%`}}/></div><small>{f.weight > 0 ? 'higher → more risk' : 'higher → less risk'}</small></div>)}</div></>
            : <><p className="model-note">Without churn outcomes the risk score combines warning signals with fixed weights:</p><div className="importance">{SIGNALS.map(s => <div key={s.key}><span>{s.label}</span><div><i className="up" style={{width:`${s.weight / 0.38 * 50}%`}}/></div><small>{Math.round(s.weight * 100)} pts</small></div>)}</div></>}
        </section>
        <section className="panel"><div className="panel-heading"><div><h2>Risk distribution</h2><p>{fmt(scored.length)} active customers scored</p></div></div>
          <div className="risk-split">{[['high', 'High risk', '#e5484d'], ['medium', 'Medium', '#f4b740'], ['low', 'Low', '#17b26a']].map(([k, l, c]) => <button key={k} className={band === k ? 'active' : ''} onClick={() => setBand(band === k ? 'all' : k)} style={{'--c':c}}><strong>{fmt(counts[k])}</strong><span>{l}</span><small>{pc(counts[k] / Math.max(1, scored.length))}</small></button>)}</div>
          <div className="segment-bar">{[['high', '#e5484d'], ['medium', '#f4b740'], ['low', '#17b26a']].map(([k, c]) => <span key={k} style={{width:`${counts[k] / Math.max(1, scored.length) * 100}%`, background:c}}/>)}</div>
          <h3>High-risk by segment</h3><RateBars rows={SEGMENT_TYPES.map(s => { const rows = scored.filter(p => p.segment === s.key); return {key:s.key, label:s.label, count:rows.length, rate:rows.length ? rows.filter(p => p.band === 'high').length / rows.length : 0, color:s.color}; }).filter(r => r.count)}/>
        </section>
      </div>
      <section className="panel"><div className="panel-heading"><div><h2>Customer predictions</h2><p>{band === 'all' ? 'All active customers' : `${band[0].toUpperCase() + band.slice(1)} risk`} · {fmt(predictions.length)} customers</p></div>
        <div className="toolbar-right"><div className="segmented" role="group" aria-label="Prioritise by"><button className={sortBy === 'risk' ? 'active' : ''} onClick={() => setSortBy('risk')}>Highest risk</button><button className={sortBy === 'value' ? 'active' : ''} onClick={() => setSortBy('value')}>Most value at risk</button></div><label className="business-search"><Search size={13}/><input aria-label="Search predictions" placeholder="Customer ID or district" value={query} onChange={e => setQuery(e.target.value)}/></label><button className="primary-button" onClick={() => download(`${fileSlug}-predictions.csv`, predictionsCSV(predictions, model ? 'logistic-regression' : 'behaviour-rules'))}><Download size={14}/>Download CSV</button></div></div>
        <div className="table-wrap"><table className="district-table"><thead><tr><th>Customer</th><th>Risk</th><th>Value at risk</th><th>Segment</th><th>Why</th><th>Recommended action</th><th>Owner</th></tr></thead>
          <tbody>{predictions.slice(0, 40).map(p => <tr key={p.id} onClick={() => setOpen(p)}><td><strong>{p.id}</strong><small>{p.district ? DISTRICTS[p.district] : '—'} · {p.department}</small></td><td><span className={`risk-pill risk-${p.band}`}>{Math.round(p.score * 100)}%</span></td><td>SLE {fmt(p.valueAtRisk)}<small>per month</small></td><td>{SEGMENT_TYPES.find(s => s.key === p.segment).label}</td><td className="wrap">{p.reasons.join(' · ') || '—'}</td><td className="wrap">{p.action}</td><td>{p.owner}</td></tr>)}</tbody></table></div>
        {predictions.length > 40 && <p className="driver-note">Showing the top 40 of {fmt(predictions.length)}. The CSV includes everyone.</p>}
      </section>
    </>}

    {step === 'report' && <section className="panel studio-report">
      <div className="report-head"><div><span className="eyebrow"><i/>ORANGE SIERRA LEONE · CHURN REPORT</span><h2>{dataset.name}</h2><p>Generated {new Date().toLocaleString('en-GB', {dateStyle:'long', timeStyle:'short'})} by {user.name} · {method}{dataset.source !== 'uploaded' ? ' · fictional sample data' : ''}</p></div>
        <div className="report-actions"><button className="secondary-button" onClick={() => download(`${fileSlug}-predictions.csv`, predictionsCSV(scored, model ? 'logistic-regression' : 'behaviour-rules'))}><Download size={14}/>Predictions CSV</button>
          <button className="secondary-button" onClick={() => download(`${fileSlug}-summary.csv`, toCSV([['measure', 'value'], ['customers', profiles.length], ['active customers', scored.length], ['observed churn rate', churn.overall ?? ''], ['high risk', counts.high], ['medium risk', counts.medium], ['low risk', counts.low], ...riskByDistrict.map(d => [`high-risk share: ${d.name}`, d.rate.toFixed(3)]), ...(model ? [['model AUC', model.metrics.auc?.toFixed(3)], ['model recall', model.metrics.recall.toFixed(3)], ['model precision', model.metrics.precision.toFixed(3)]] : [])]))}><Download size={14}/>Summary CSV</button>
          <button className="primary-button" onClick={() => window.print()}><Printer size={14}/>Print / save PDF</button></div></div>
      <h3>Key findings</h3><ul className="findings">{findings.map(f => <li key={f}>{f}</li>)}</ul>
      <div className="val-stats">{[['Active customers', fmt(scored.length)], ['High risk', fmt(counts.high)], ['Medium risk', fmt(counts.medium)], ['Observed churn', pc(churn.overall)], ['Months', data.patterns.months.length]].map(([l, v]) => <div key={l}><small>{l}</small><strong>{v}</strong></div>)}</div>
      <div className="two-col"><div><h3>Warning signals</h3><RateBars rows={churn.bySignal.map(s => ({...s, rate:s.count / Math.max(1, profiles.length)}))}/></div><div><h3>High-risk share by district</h3><RateBars rows={riskByDistrict.slice(0, 8)}/></div></div>
      <h3>Recommended actions</h3><table className="district-table"><thead><tr><th>Action</th><th>Owner</th><th>Customers</th><th>High risk</th></tr></thead><tbody>{Object.entries(scored.filter(p => p.band !== 'low').reduce((m, p) => { (m[p.action] ??= {n:0, high:0, owner:p.owner}).n++; if (p.band === 'high') m[p.action].high++; return m; }, {})).sort((a, b) => b[1].high - a[1].high).map(([a, v]) => <tr key={a}><td>{a}</td><td>{v.owner}</td><td>{fmt(v.n)}</td><td>{fmt(v.high)}</td></tr>)}</tbody></table>
      <p className="driver-note">Predictions support human review; they are not automated decisions. Validate any campaign against a control group before scaling.</p>
    </section>}
    {open && <CustomerDrawer customer={open} onClose={() => setOpen(null)}/>}
  </div>;
}
