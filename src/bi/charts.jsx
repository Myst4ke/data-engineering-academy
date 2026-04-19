import { useState, useRef } from 'react';

const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#8B5CF6', '#F97316', '#14B8A6', '#D946EF'];

function Tooltip({ x, y, children, containerRef }) {
  if (!children || !containerRef?.current) return null;
  const rect = containerRef.current.getBoundingClientRect();
  return (
    <div style={{ position: 'fixed', left: rect.left + x, top: rect.top + y, transform: 'translate(-50%, -120%)', zIndex: 99999, pointerEvents: 'none' }}>
      <div style={{ background: '#1E293B', color: '#FFF', fontSize: '11px', padding: '5px 10px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>{children}</div>
    </div>
  );
}

// ── BAR CHART (supports stacked/grouped) ──
export function BarChart({ data, xCol, yCol, groupCol, mode = 'simple', width = 300, height = 200, onBarClick }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (!data?.length || !xCol || !yCol) return <EmptyChart width={width} height={height} />;

  if (mode !== 'simple' && groupCol) {
    return <StackedBarChart data={data} xCol={xCol} yCol={yCol} groupCol={groupCol} mode={mode} width={width} height={height} />;
  }

  const m = { top: 10, right: 10, bottom: 36, left: 45 };
  const w = width - m.left - m.right, h = height - m.top - m.bottom;
  const values = data.map(r => parseFloat(r[yCol]) || 0);
  const maxVal = Math.max(...values, 1);
  const barW = Math.max(6, Math.min(36, (w / data.length) * 0.7));
  const gap = (w - barW * data.length) / (data.length + 1);

  return (
    <div ref={ref} className="relative" style={{ width, height }}>
      <svg width={width} height={height}>
        <g transform={`translate(${m.left},${m.top})`}>
          {data.map((row, i) => { const barH = (values[i] / maxVal) * h; const x = gap + i * (barW + gap);
            return (<g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => onBarClick?.(xCol, String(row[xCol]))} className="cursor-pointer">
              <rect x={x} y={h - barH} width={barW} height={barH} fill={COLORS[i % COLORS.length]} rx={2} opacity={hover === null || hover === i ? 0.9 : 0.35} />
              <text x={x + barW / 2} y={h + 12} textAnchor="middle" fontSize="7" fill="#64748B" className="select-none">{String(row[xCol]).slice(0, 6)}</text>
            </g>); })}
          <line x1={0} y1={h} x2={w} y2={h} stroke="#E2E8F0" strokeWidth={1} />
          <line x1={0} y1={0} x2={0} y2={h} stroke="#E2E8F0" strokeWidth={1} />
          <text x={-6} y={8} textAnchor="end" fontSize="7" fill="#94A3B8">{Math.round(maxVal)}</text>
        </g>
      </svg>
      {hover !== null && <Tooltip containerRef={ref} x={m.left + gap + hover * (barW + gap) + barW / 2} y={m.top + h - (values[hover] / maxVal) * h}><strong>{data[hover][xCol]}</strong>: {values[hover]}</Tooltip>}
    </div>
  );
}

function StackedBarChart({ data, xCol, yCol, groupCol, mode, width, height }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const m = { top: 10, right: 10, bottom: 36, left: 45 };
  const w = width - m.left - m.right, h = height - m.top - m.bottom;

  const categories = [...new Set(data.map(r => r[xCol]))];
  const groups = [...new Set(data.map(r => r[groupCol]))];
  const grouped = {};
  categories.forEach(c => { grouped[c] = {}; groups.forEach(g => { grouped[c][g] = 0; }); });
  data.forEach(r => { if (grouped[r[xCol]]) grouped[r[xCol]][r[groupCol]] = (grouped[r[xCol]][r[groupCol]] || 0) + (parseFloat(r[yCol]) || 0); });

  const maxVal = mode === 'stacked' ? Math.max(...categories.map(c => groups.reduce((s, g) => s + (grouped[c][g] || 0), 0)), 1) : Math.max(...categories.flatMap(c => groups.map(g => grouped[c][g] || 0)), 1);
  const catW = w / categories.length;

  return (
    <div ref={ref} className="relative" style={{ width, height }}>
      <svg width={width} height={height}>
        <g transform={`translate(${m.left},${m.top})`}>
          {categories.map((cat, ci) => {
            let cumY = 0;
            const barW = mode === 'stacked' ? catW * 0.6 : (catW * 0.7) / groups.length;
            return groups.map((grp, gi) => {
              const val = grouped[cat][grp] || 0;
              const barH = (val / maxVal) * h;
              let x, y;
              if (mode === 'stacked') { x = ci * catW + catW * 0.2; y = h - cumY - barH; cumY += barH; }
              else { x = ci * catW + gi * barW + catW * 0.15; y = h - barH; }
              return (<g key={`${ci}-${gi}`} onMouseEnter={() => setHover({ cat, grp, val })} onMouseLeave={() => setHover(null)} className="cursor-pointer">
                <rect x={x} y={y} width={barW} height={barH} fill={COLORS[gi % COLORS.length]} rx={1} opacity={0.85} />
              </g>);
            });
          })}
          {categories.map((cat, ci) => <text key={ci} x={ci * catW + catW / 2} y={h + 12} textAnchor="middle" fontSize="7" fill="#64748B" className="select-none">{String(cat).slice(0, 6)}</text>)}
          <line x1={0} y1={h} x2={w} y2={h} stroke="#E2E8F0" strokeWidth={1} />
        </g>
      </svg>
      {hover && <Tooltip containerRef={ref} x={width / 2} y={40}><strong>{hover.cat}</strong> / {hover.grp}: {hover.val}</Tooltip>}
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 mt-0.5">
        {groups.slice(0, 6).map((g, i) => <span key={i} className="flex items-center gap-1 text-[8px] text-slate-600"><span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />{String(g).slice(0, 10)}</span>)}
      </div>
    </div>
  );
}

// ── LINE CHART ──
export function LineChart({ data, xCol, yCol, width = 300, height = 200, onPointClick }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (!data?.length || !xCol || !yCol) return <EmptyChart width={width} height={height} />;
  const m = { top: 10, right: 10, bottom: 36, left: 45 };
  const w = width - m.left - m.right, h = height - m.top - m.bottom;
  const values = data.map(r => parseFloat(r[yCol]) || 0);
  const maxV = Math.max(...values, 1), minV = Math.min(...values, 0), range = maxV - minV || 1;
  const getP = (i) => ({ x: (i / Math.max(1, data.length - 1)) * w, y: h - ((values[i] - minV) / range) * h });
  const pts = data.map((_, i) => { const p = getP(i); return `${p.x},${p.y}`; });
  return (
    <div ref={ref} className="relative" style={{ width, height }}>
      <svg width={width} height={height}><g transform={`translate(${m.left},${m.top})`}>
        <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" /><stop offset="100%" stopColor="#6366F1" stopOpacity="0" /></linearGradient></defs>
        <polygon points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill="url(#lg)" />
        <polyline points={pts.join(' ')} fill="none" stroke="#6366F1" strokeWidth={2} />
        {data.map((row, i) => { const p = getP(i); return <circle key={i} cx={p.x} cy={p.y} r={hover === i ? 5 : 3} fill="#6366F1" stroke="white" strokeWidth={1.5} className="cursor-pointer" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => onPointClick?.(xCol, String(row[xCol]))} />; })}
        <line x1={0} y1={h} x2={w} y2={h} stroke="#E2E8F0" strokeWidth={1} />
      </g></svg>
      {hover !== null && <Tooltip containerRef={ref} x={m.left + getP(hover).x} y={m.top + getP(hover).y}><strong>{data[hover][xCol]}</strong>: {values[hover]}</Tooltip>}
    </div>
  );
}

// ── PIE / DONUT CHART ──
export function PieChart({ data, labelCol, valueCol, width = 200, height = 200, onSliceClick, donut = false }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (!data?.length || !labelCol || !valueCol) return <EmptyChart width={width} height={height} />;
  const legendH = 24;
  const cx = width / 2, cy = (height - legendH) / 2, r = Math.min(cx, cy) - 8;
  const ir = donut ? r * 0.55 : 0;
  const values = data.map(row => Math.abs(parseFloat(row[valueCol]) || 0));
  const total = values.reduce((s, v) => s + v, 0) || 1;
  let angle = -Math.PI / 2;
  const slices = data.map((row, i) => {
    const pct = values[i] / total; const sa = angle; angle += pct * 2 * Math.PI; const ea = angle;
    const la = pct > 0.5 ? 1 : 0;
    const ox1 = cx + r * Math.cos(sa), oy1 = cy + r * Math.sin(sa), ox2 = cx + r * Math.cos(ea), oy2 = cy + r * Math.sin(ea);
    let d;
    if (donut) {
      const ix1 = cx + ir * Math.cos(sa), iy1 = cy + ir * Math.sin(sa);
      const ix2 = cx + ir * Math.cos(ea), iy2 = cy + ir * Math.sin(ea);
      d = `M ${ox1} ${oy1} A ${r} ${r} 0 ${la} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${la} 0 ${ix1} ${iy1} Z`;
    } else {
      d = `M ${cx} ${cy} L ${ox1} ${oy1} A ${r} ${r} 0 ${la} 1 ${ox2} ${oy2} Z`;
    }
    const lr = donut ? (r + ir) / 2 : r * 0.6;
    const mid = (sa + ea) / 2; const lx = cx + lr * Math.cos(mid), ly = cy + lr * Math.sin(mid);
    return { d, color: COLORS[i % COLORS.length], label: String(row[labelCol]), pct, lx, ly };
  });
  const fmt = total >= 1e6 ? `${(total / 1e6).toFixed(1)}M` : total >= 1e3 ? `${(total / 1e3).toFixed(1)}K` : String(Math.round(total));
  return (
    <div ref={ref} className="relative" style={{ width, height }}>
      <svg width={width} height={height - legendH}>
        {slices.map((s, i) => (<g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => onSliceClick?.(labelCol, s.label)} className="cursor-pointer">
          <path d={s.d} fill={s.color} opacity={hover === null ? 0.8 : hover === i ? 1 : 0.3} stroke="white" strokeWidth={2} style={{ transition: 'opacity 0.15s' }} />
          {s.pct > 0.08 && hover !== i && <text x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="white" fontWeight="bold" className="select-none pointer-events-none">{Math.round(s.pct * 100)}%</text>}
        </g>))}
        {donut && <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="bold" fill="#1E293B">{fmt}</text>}
      </svg>
      {hover !== null && <Tooltip containerRef={ref} x={slices[hover].lx} y={slices[hover].ly}><strong>{slices[hover].label}</strong>: {values[hover]} ({Math.round(slices[hover].pct * 100)}%)</Tooltip>}
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5" style={{ height: legendH }}>
        {slices.slice(0, 8).map((s, i) => <span key={i} className="flex items-center gap-1 text-[8px] text-slate-600 cursor-pointer" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}><span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: s.color }} />{s.label.slice(0, 10)}</span>)}
      </div>
    </div>
  );
}

// ── KPI CARD ──
export function KpiCard({ data, valueCol, label, aggFunc, width = 200, height = 120 }) {
  if (!data?.length || !valueCol) return <EmptyChart width={width} height={height} />;
  const values = data.map(r => parseFloat(r[valueCol]) || 0);
  let total;
  switch (aggFunc) {
    case 'count': total = data.length; break;
    case 'avg': total = values.reduce((s, v) => s + v, 0) / values.length; break;
    case 'min': total = Math.min(...values); break;
    case 'max': total = Math.max(...values); break;
    default: total = values.reduce((s, v) => s + v, 0); break; // sum or none
  }
  const fmt = total >= 1e6 ? `${(total / 1e6).toFixed(1)}M` : total >= 1e3 ? `${(total / 1e3).toFixed(1)}K` : String(Math.round(total * 100) / 100);
  const aggLabel = aggFunc === 'count' ? 'COUNT' : aggFunc === 'avg' ? 'AVG' : aggFunc === 'min' ? 'MIN' : aggFunc === 'max' ? 'MAX' : '';
  return (<div style={{ width, height }} className="flex flex-col items-center justify-center">
    <span className="text-3xl font-black text-indigo-600">{fmt}</span>
    <span className="text-xs text-slate-500 font-medium mt-1">{label || valueCol} {aggLabel && `(${aggLabel})`}</span>
    <span className="text-[10px] text-slate-400">{data.length} lignes</span>
  </div>);
}

// ── SCATTER PLOT ──
export function ScatterPlot({ data, xCol, yCol, width = 300, height = 200 }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (!data?.length || !xCol || !yCol) return <EmptyChart width={width} height={height} />;
  const m = { top: 10, right: 10, bottom: 30, left: 45 };
  const w = width - m.left - m.right, h = height - m.top - m.bottom;
  const xV = data.map(r => parseFloat(r[xCol]) || 0), yV = data.map(r => parseFloat(r[yCol]) || 0);
  if (!data.some(r => !isNaN(parseFloat(r[xCol]))) || !data.some(r => !isNaN(parseFloat(r[yCol])))) return <div style={{ width, height }} className="flex items-center justify-center text-slate-400 text-xs text-center px-4">Axes numériques requis</div>;
  const xMin = Math.min(...xV), xMax = Math.max(...xV), yMin = Math.min(...yV), yMax = Math.max(...yV);
  const xR = xMax - xMin || 1, yR = yMax - yMin || 1;
  const getP = (i) => ({ x: ((xV[i] - xMin) / xR) * w, y: h - ((yV[i] - yMin) / yR) * h });
  return (
    <div ref={ref} className="relative" style={{ width, height }}>
      <svg width={width} height={height}><g transform={`translate(${m.left},${m.top})`}>
        {data.map((_, i) => { const p = getP(i); return <circle key={i} cx={p.x} cy={p.y} r={hover === i ? 6 : 4} fill={COLORS[i % COLORS.length]} opacity={hover === null ? 0.7 : hover === i ? 1 : 0.25} className="cursor-pointer" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />; })}
        <line x1={0} y1={h} x2={w} y2={h} stroke="#E2E8F0" strokeWidth={1} />
        <text x={w / 2} y={h + 18} textAnchor="middle" fontSize="8" fill="#94A3B8">{xCol}</text>
      </g></svg>
      {hover !== null && <Tooltip containerRef={ref} x={m.left + getP(hover).x} y={m.top + getP(hover).y}>{xCol}: <strong>{xV[hover]}</strong> | {yCol}: <strong>{yV[hover]}</strong></Tooltip>}
    </div>
  );
}

// ── GAUGE ──
export function Gauge({ data, valueCol, label, min = 0, max = 100, width = 200, height = 140 }) {
  if (!data?.length || !valueCol) return <EmptyChart width={width} height={height} />;
  const values = data.map(r => parseFloat(r[valueCol]) || 0);
  const total = values.reduce((s, v) => s + v, 0);
  const pct = Math.min(1, Math.max(0, (total - min) / (max - min || 1)));
  const cx = width / 2, cy = height - 20, r = Math.min(cx, cy) - 10;
  const needleA = Math.PI - pct * Math.PI;
  const nx = cx + (r - 8) * Math.cos(needleA), ny = cy - (r - 8) * Math.sin(needleA);
  const color = pct < 0.33 ? '#EF4444' : pct < 0.66 ? '#F59E0B' : '#22C55E';

  return (
    <div style={{ width, height }} className="flex flex-col items-center justify-end">
      <svg width={width} height={height - 20}>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#E2E8F0" strokeWidth={12} strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(Math.PI - pct * Math.PI)} ${cy - r * Math.sin(Math.PI - pct * Math.PI)}`} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#334155" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill="#334155" />
        <text x={cx} y={cy - r / 2} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1E293B">{Math.round(total)}</text>
      </svg>
      <span className="text-[10px] text-slate-500 font-medium">{label || valueCol}</span>
    </div>
  );
}

// ── TREEMAP ──
export function Treemap({ data, labelCol, valueCol, width = 300, height = 200, onRectClick }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (!data?.length || !labelCol || !valueCol) return <EmptyChart width={width} height={height} />;
  const items = data.map((r, i) => ({ label: String(r[labelCol]), value: Math.abs(parseFloat(r[valueCol]) || 0), i })).filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  const total = items.reduce((s, x) => s + x.value, 0) || 1;

  const rects = [];
  let x = 0, y = 0, remW = width, remH = height, remTotal = total;
  items.forEach((item, idx) => {
    const pct = item.value / remTotal;
    let rw, rh;
    if (remW >= remH) { rw = remW * pct; rh = remH; if (idx < items.length - 1) remW -= rw; else rw = remW; }
    else { rh = remH * pct; rw = remW; if (idx < items.length - 1) remH -= rh; else rh = remH; }
    rects.push({ ...item, x, y, w: rw, h: rh });
    if (remW >= remH) x += rw; else y += rh;
    remTotal -= item.value;
  });

  return (
    <div ref={ref} className="relative" style={{ width, height }}>
      <svg width={width} height={height}>
        {rects.map((r, i) => (<g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => onRectClick?.(labelCol, r.label)} className="cursor-pointer">
          <rect x={r.x + 1} y={r.y + 1} width={Math.max(0, r.w - 2)} height={Math.max(0, r.h - 2)} fill={COLORS[i % COLORS.length]} rx={3} opacity={hover === null || hover === i ? 0.85 : 0.4} />
          {r.w > 40 && r.h > 20 && <text x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(11, r.w / 6)} fill="white" fontWeight="bold" className="select-none pointer-events-none">{r.label.slice(0, 12)}</text>}
        </g>))}
      </svg>
      {hover !== null && <Tooltip containerRef={ref} x={rects[hover].x + rects[hover].w / 2} y={rects[hover].y + rects[hover].h / 2}><strong>{rects[hover].label}</strong>: {rects[hover].value} ({Math.round(rects[hover].value / total * 100)}%)</Tooltip>}
    </div>
  );
}

// ── MAP (France cities) ──
const CITIES = { Paris: [240, 120], Lyon: [260, 240], Marseille: [270, 310], Toulouse: [170, 300], Bordeaux: [120, 260], Nantes: [100, 180], Lille: [230, 50], Strasbourg: [340, 100] };

export function MapChart({ data, cityCol, valueCol, width = 300, height = 300 }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (!data?.length || !cityCol || !valueCol) return <EmptyChart width={width} height={height} />;
  const agg = {};
  data.forEach(r => { const c = r[cityCol]; agg[c] = (agg[c] || 0) + (parseFloat(r[valueCol]) || 0); });
  const maxVal = Math.max(...Object.values(agg), 1);
  const sx = width / 400, sy = height / 380;

  return (
    <div ref={ref} className="relative" style={{ width, height }}>
      <svg width={width} height={height}>
        <path d="M200,20 L320,60 L350,120 L340,200 L300,280 L280,340 L220,360 L160,320 L100,280 L80,220 L60,160 L100,100 L140,60 Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth={1.5} transform={`scale(${sx},${sy})`} />
        {Object.entries(agg).map(([city, val]) => {
          const pos = CITIES[city];
          if (!pos) return null;
          const r = Math.max(6, Math.min(30, (val / maxVal) * 30));
          const cx = pos[0] * sx, cy = pos[1] * sy;
          return (<g key={city} onMouseEnter={() => setHover({ city, val, cx, cy })} onMouseLeave={() => setHover(null)} className="cursor-pointer">
            <circle cx={cx} cy={cy} r={r} fill="#6366F1" opacity={0.6} stroke="white" strokeWidth={1.5} />
            <text x={cx} y={cy + r + 10} textAnchor="middle" fontSize="8" fill="#475569" className="select-none pointer-events-none">{city}</text>
          </g>);
        })}
      </svg>
      {hover && <Tooltip containerRef={ref} x={hover.cx} y={hover.cy}><strong>{hover.city}</strong>: {hover.val}</Tooltip>}
    </div>
  );
}

// ── FUNNEL CHART ──
export function FunnelChart({ data, labelCol, valueCol, width = 300, height = 200, onSegmentClick }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (!data?.length || !labelCol || !valueCol) return <EmptyChart width={width} height={height} />;
  const items = data.map(r => ({ label: String(r[labelCol]), value: Math.abs(parseFloat(r[valueCol]) || 0) })).filter(x => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);
  if (items.length === 0) return <EmptyChart width={width} height={height} />;
  const maxVal = items[0].value || 1;
  const m = { top: 4, bottom: 4, left: 4, right: 4 };
  const w = width - m.left - m.right, h = height - m.top - m.bottom;
  const stepH = h / items.length;

  return (
    <div ref={ref} className="relative" style={{ width, height }}>
      <svg width={width} height={height}>
        <g transform={`translate(${m.left},${m.top})`}>
          {items.map((item, i) => {
            const topW = (item.value / maxVal) * w;
            const nextW = i < items.length - 1 ? (items[i + 1].value / maxVal) * w : topW * 0.4;
            const y = i * stepH;
            const topL = (w - topW) / 2, botL = (w - nextW) / 2;
            const d = `M ${topL} ${y} L ${topL + topW} ${y} L ${botL + nextW} ${y + stepH} L ${botL} ${y + stepH} Z`;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => onSegmentClick?.(labelCol, item.label)} className="cursor-pointer">
                <path d={d} fill={COLORS[i % COLORS.length]} opacity={hover === null || hover === i ? 0.85 : 0.4} style={{ transition: 'opacity 0.15s' }} />
                {topW > 50 && stepH > 16 && <text x={w / 2} y={y + stepH / 2 + 3} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold" className="select-none pointer-events-none">{item.label.slice(0, 15)}</text>}
              </g>
            );
          })}
        </g>
      </svg>
      {hover !== null && (() => { const pct = Math.round((items[hover].value / maxVal) * 100); return <Tooltip containerRef={ref} x={width / 2} y={m.top + hover * stepH + stepH / 2}><strong>{items[hover].label}</strong>: {items[hover].value} ({pct}%)</Tooltip>; })()}
    </div>
  );
}

// ── DATA TABLE ──
export function DataTable({ data, width = 300, height = 200 }) {
  if (!data?.length) return <EmptyChart width={width} height={height} />;
  const cols = Object.keys(data[0]); const rows = data.slice(0, 20);
  return (<div style={{ width, height }} className="overflow-auto">
    <table className="text-[10px] border-collapse w-full"><thead className="sticky top-0"><tr>{cols.map(c => <th key={c} className="px-2 py-1 bg-slate-100 text-slate-600 font-semibold text-left border-b border-slate-200 whitespace-nowrap">{c}</th>)}</tr></thead>
    <tbody>{rows.map((row, i) => <tr key={i} className="hover:bg-indigo-50/30">{cols.map(c => <td key={c} className="px-2 py-0.5 text-slate-700 border-b border-slate-100 whitespace-nowrap">{row[c]}</td>)}</tr>)}</tbody></table>
  </div>);
}

// ── TEXT WIDGET ──
export function TextWidget({ text, fontSize = 16, width = 200, height = 100 }) {
  return (<div style={{ width, height, fontSize }} className="flex items-center justify-center text-slate-700 font-semibold text-center p-2 leading-tight">{text || 'Double-clic pour éditer'}</div>);
}

// ── SLICER (global filter widget) ──
export function Slicer({ data, col, width, height, activeFilters, onToggle }) {
  if (!data?.length || !col) return <EmptyChart width={width} height={height} />;
  const values = [...new Set(data.map(r => String(r[col] ?? '')))].sort();
  return (
    <div style={{ width, height, overflow: 'auto', padding: 4 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {values.map(v => {
          const active = activeFilters?.some(f => f.col === col && f.val === v);
          return (
            <button key={v} onClick={() => onToggle?.(col, v)}
              style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                background: active ? '#6366F1' : '#FFF', color: active ? '#FFF' : '#475569', borderColor: active ? '#6366F1' : '#E2E8F0' }}>
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyChart({ width, height }) {
  return <div style={{ width, height }} className="flex items-center justify-center text-slate-400 text-xs">Configurez le graphique</div>;
}

// ── CHART RECOMMENDATION ──
export function recommendChart(columns, data) {
  if (!data?.length || !columns?.length) return 'table';
  const numCols = columns.filter(c => data.slice(0, 10).some(r => !isNaN(parseFloat(r[c])) && parseFloat(r[c]) !== 0));
  const textCols = columns.filter(c => !numCols.includes(c));
  const dateCols = columns.filter(c => data.slice(0, 5).some(r => /^\d{4}-\d{2}/.test(String(r[c]))));

  if (dateCols.length > 0 && numCols.length > 0) return 'line';
  if (textCols.length > 0 && numCols.length > 0) {
    const uniqueVals = new Set(data.map(r => r[textCols[0]])).size;
    if (uniqueVals <= 8) return 'pie';
    return 'bar';
  }
  if (numCols.length >= 2) return 'scatter';
  if (numCols.length === 1) return 'kpi';
  return 'table';
}
