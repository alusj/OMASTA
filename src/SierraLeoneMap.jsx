import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Minus, Maximize2, ArrowLeft } from 'lucide-react';
import { BANDS } from './regional.mjs';
import { METRICS, colourFor, RATE_STOPS, COUNT_STOPS, LEAVING_STOPS } from './mapScale.mjs';

const fmt = n => n.toLocaleString('en-US');
export function MapLegend({metric, nationalRate}) {
  const stops = metric === 'rate' ? RATE_STOPS : metric === 'leaving' ? LEAVING_STOPS : COUNT_STOPS;
  return <div className="sl-legend"><span>{metric === 'rate' ? `${(nationalRate * 0.7).toFixed(0)}%` : 'Fewer'}</span><i style={{background:`linear-gradient(90deg,${stops.join(',')})`}}/><span>{metric === 'rate' ? `${(nationalRate * 1.35).toFixed(0)}%+` : 'More'}</span>{metric === 'rate' && <em>National {nationalRate}%</em>}</div>;
}

function fitBox([x0, y0, x1, y1], base, pad = 0.14) {
  const w = (x1 - x0) * (1 + pad * 2), h = (y1 - y0) * (1 + pad * 2), aspect = base[2] / base[3];
  const [W, H] = w / h > aspect ? [w, w / aspect] : [h * aspect, h];
  return [(x0 + x1) / 2 - W / 2, (y0 + y1) / 2 - H / 2, W, H];
}
function useTween(target) {
  const [box, setBox] = useState(target), current = useRef(target);
  useEffect(() => {
    const from = current.current, start = performance.now(); let frame;
    const step = now => {
      const t = Math.min(1, (now - start) / 700), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      current.current = from.map((v, i) => v + (target[i] - v) * e); setBox(current.current);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  return box;
}

export default function SierraLeoneMap({geo, model, metric = 'rate', band = 'all', selected = null, chiefdom = null, onSelect, onChiefdom, compact = false}) {
  const base = useMemo(() => [-40, -30, 1080, 1105], []);
  const [zoom, setZoom] = useState(1), [tip, setTip] = useState(null), wrap = useRef(null);
  const district = model.districts.find(d => d.id === selected);
  const geoDistrict = geo.districts.find(d => d.id === selected);
  useEffect(() => setZoom(1), [selected]);
  const target = useMemo(() => {
    const b = geoDistrict ? fitBox(geoDistrict.bbox, base) : base, w = b[2] / zoom, h = b[3] / zoom;
    return [b[0] + (b[2] - w) / 2, b[1] + (b[3] - h) / 2, w, h];
  }, [geoDistrict, zoom, base]);
  const box = useTween(target), unit = box[2] / 1000;
  const rows = new Map(model.districts.map(d => [d.id, d]));
  const chiefRows = district ? new Map(district.chiefdoms.map(c => [c.id, c])) : null;
  const visibleBand = row => band === 'all' || band === 'leaving' || row.band === band;
  const hotspots = [...model.districts].sort((a, b) => b.atRisk - a.atRisk).slice(0, 3).map(d => d.id);
  const moveTip = (e, row, kind) => { const r = wrap.current.getBoundingClientRect(); setTip({x:e.clientX - r.left, y:e.clientY - r.top, row, kind}); };

  return <div className={`sl-map ${compact ? 'compact' : ''}`} ref={wrap} onMouseLeave={() => setTip(null)}>
    <svg viewBox={box.join(' ')} role="img" aria-label={district ? `${district.name} chiefdoms map` : 'Sierra Leone districts map'}>
      <defs><filter id="sl-shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy={6 * unit} stdDeviation={8 * unit} floodColor="#0b2030" floodOpacity=".16"/></filter></defs>
      <g filter="url(#sl-shadow)">
        {geo.districts.map(d => {
          const row = rows.get(d.id), active = d.id === selected, dim = (district && !active) || !visibleBand(row);
          return <path key={d.id} d={d.d} className={`sl-district ${active ? 'active' : ''}`} vectorEffect="non-scaling-stroke"
            fill={district ? (active ? '#fff' : '#e7ecf0') : !row.customers ? '#eef1f4' : colourFor(band === 'leaving' ? 'leaving' : metric, row, model.districts, model.profile.rate)}
            opacity={dim && !district ? 0.22 : 1} tabIndex={compact ? -1 : 0} role="button" aria-label={`${d.name}: ${row.rate}% churn`}
            onMouseMove={e => moveTip(e, row, 'district')} onClick={() => onSelect?.(active ? null : d.id)}
            onKeyDown={e => e.key === 'Enter' && onSelect?.(active ? null : d.id)}/>;
        })}
      </g>
      {district && <g className="sl-chiefdoms">{geo.chiefdoms.filter(c => c.district === selected).map(c => {
        const row = chiefRows.get(c.id);
        return <path key={c.id} d={c.d} vectorEffect="non-scaling-stroke" className={c.id === chiefdom ? 'active' : ''}
          fill={colourFor(band === 'leaving' ? 'leaving' : metric, row, district.chiefdoms, model.profile.rate)} opacity={visibleBand(row) ? 1 : 0.25}
          onMouseMove={e => moveTip(e, row, 'chiefdom')} onClick={() => onChiefdom?.(c.id === chiefdom ? null : c.id)}/>;
      })}<path d={geoDistrict.d} className="sl-outline" vectorEffect="non-scaling-stroke"/></g>}
      {!district && hotspots.map(id => { const c = geo.districts.find(d => d.id === id).center; return <g key={id} className="sl-hotspot" transform={`translate(${c[0]} ${c[1] - (compact ? 0 : 30)})`}><circle r={9 * unit * (compact ? 1.6 : 1)}/><circle r={9 * unit * (compact ? 1.6 : 1)} className="pulse"/></g>; })}
      {!compact && !district && <g className="sl-labels" fontSize={15 * unit}>{geo.districts.map(d => <text key={d.id} x={d.center[0]} y={d.center[1] + (d.id === 'western-area-urban' ? -32 : d.id === 'western-area-rural' ? 24 : 0)} textAnchor={d.id === 'western-area-urban' ? 'start' : 'middle'}>{d.id === 'western-area-urban' ? 'Freetown' : d.id === 'western-area-rural' ? 'W. Area Rural' : d.name}<tspan x={d.center[0]} dy="1.2em" className="value">{METRICS[band === 'leaving' ? 'leaving' : metric].text(rows.get(d.id))}</tspan></text>)}</g>}
      {district && <g className="sl-labels chief" fontSize={13 * unit}>{district.chiefdoms.slice(0, 6).map(c => { const g = geo.chiefdoms.find(x => x.id === c.id); return <text key={c.id} x={g.center[0]} y={g.center[1]} textAnchor="middle">{c.name}<tspan x={g.center[0]} dy="1.2em" className="value">{c.rate}%</tspan></text>; })}</g>}
    </svg>
    {!compact && <div className="sl-controls">
      {district && <button className="sl-back" onClick={() => onSelect?.(null)}><ArrowLeft size={14}/>Sierra Leone</button>}
      <div className="sl-zoom"><button aria-label="Zoom in" onClick={() => setZoom(z => Math.min(4, z * 1.4))}><Plus size={15}/></button><button aria-label="Zoom out" onClick={() => setZoom(z => Math.max(1, z / 1.4))}><Minus size={15}/></button><button aria-label="Reset map" onClick={() => { setZoom(1); onSelect?.(null); }}><Maximize2 size={13}/></button></div>
    </div>}
    {tip && <div className="sl-tip" style={{left:tip.x, top:tip.y}}>
      <strong>{tip.row.name}</strong><small>{tip.kind === 'chiefdom' ? `Chiefdom · ${district?.name}` : `${tip.row.province} Province`}</small>
      <div><span>Churn rate</span><b>{tip.row.rate}%</b></div>
      <div><span>{model.profile.unit[0].toUpperCase() + model.profile.unit.slice(1)}</span><b>{fmt(tip.row.customers)}</b></div>
      <div><span>At risk of leaving</span><b>{fmt(tip.row.segments.leaving)}</b></div>
      <em style={{color:BANDS[tip.row.band].color}}>● {BANDS[tip.row.band].label}</em>
    </div>}
  </div>;
}
