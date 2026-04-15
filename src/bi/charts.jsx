import { useState, useRef } from 'react';

const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#8B5CF6', '#F97316', '#14B8A6', '#D946EF'];

function Tooltip({ x, y, children, containerRef }) {
  if (!children || !containerRef?.current) return null;
  const rect = containerRef.current.getBoundingClientRect();
  return (
    <div style={{
      position: 'fixed',
      left: rect.left + x,
      top: rect.top + y,
      transform: 'translate(-50%, -120%)',
      zIndex: 99999,
      pointerEvents: 'none',
    }}>
      <div style={{
        background: '#1E293B',
        color: '#FFFFFF',
        fontSize: '11px',
        padding: '5px 10px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        whiteSpace: 'nowrap',
      }}>
        {children}
      </div>
    </div>
  );
}

export function BarChart({ data, xCol, yCol, width = 300, height = 200 }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (!data?.length || !xCol || !yCol) return <EmptyChart width={width} height={height} />;
  const margin = { top: 10, right: 10, bottom: 36, left: 45 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const values = data.map(r => parseFloat(r[yCol]) || 0);
  const maxVal = Math.max(...values, 1);
  const barW = Math.max(6, Math.min(36, (w / data.length) * 0.7));
  const gap = (w - barW * data.length) / (data.length + 1);

  return (
    <div ref={ref} className="relative" style={{ width, height }}>
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {data.map((row, i) => {
            const barH = (values[i] / maxVal) * h;
            const x = gap + i * (barW + gap);
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
                <rect x={x} y={h - barH} width={barW} height={barH} fill={COLORS[i % COLORS.length]} rx={2}
                  opacity={hover === null || hover === i ? 0.9 : 0.35} />
                <text x={x + barW / 2} y={h + 12} textAnchor="middle" fontSize="7" fill="#64748B" className="select-none">
                  {String(row[xCol]).slice(0, 6)}
                </text>
              </g>
            );
          })}
          <line x1={0} y1={h} x2={w} y2={h} stroke="#E2E8F0" strokeWidth={1} />
          <line x1={0} y1={0} x2={0} y2={h} stroke="#E2E8F0" strokeWidth={1} />
          <text x={-6} y={8} textAnchor="end" fontSize="7" fill="#94A3B8">{Math.round(maxVal)}</text>
          <text x={-6} y={h} textAnchor="end" fontSize="7" fill="#94A3B8">0</text>
        </g>
      </svg>
      {hover !== null && (
        <Tooltip containerRef={ref} x={margin.left + gap + hover * (barW + gap) + barW / 2} y={margin.top + h - (values[hover] / maxVal) * h}>
          <strong>{data[hover][xCol]}</strong>: {values[hover]}
        </Tooltip>
      )}
    </div>
  );
}

export function LineChart({ data, xCol, yCol, width = 300, height = 200 }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (!data?.length || !xCol || !yCol) return <EmptyChart width={width} height={height} />;
  const margin = { top: 10, right: 10, bottom: 36, left: 45 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const values = data.map(r => parseFloat(r[yCol]) || 0);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;
  const getPos = (i) => ({ x: (i / Math.max(1, data.length - 1)) * w, y: h - ((values[i] - minVal) / range) * h });
  const points = data.map((_, i) => { const p = getPos(i); return `${p.x},${p.y}`; });

  return (
    <div ref={ref} className="relative" style={{ width, height }}>
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,${h} ${points.join(' ')} ${w},${h}`} fill="url(#lineGrad)" />
          <polyline points={points.join(' ')} fill="none" stroke="#6366F1" strokeWidth={2} />
          {data.map((_, i) => {
            const p = getPos(i);
            return <circle key={i} cx={p.x} cy={p.y} r={hover === i ? 5 : 3} fill="#6366F1" stroke="white" strokeWidth={1.5}
              className="cursor-pointer" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />;
          })}
          <line x1={0} y1={h} x2={w} y2={h} stroke="#E2E8F0" strokeWidth={1} />
          <line x1={0} y1={0} x2={0} y2={h} stroke="#E2E8F0" strokeWidth={1} />
        </g>
      </svg>
      {hover !== null && (
        <Tooltip containerRef={ref} x={margin.left + getPos(hover).x} y={margin.top + getPos(hover).y}>
          <strong>{data[hover][xCol]}</strong>: {values[hover]}
        </Tooltip>
      )}
    </div>
  );
}

export function PieChart({ data, labelCol, valueCol, width = 200, height = 200 }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (!data?.length || !labelCol || !valueCol) return <EmptyChart width={width} height={height} />;
  const legendH = 24;
  const cx = width / 2, cy = (height - legendH) / 2, r = Math.min(cx, cy) - 8;
  const values = data.map(row => Math.abs(parseFloat(row[valueCol]) || 0));
  const total = values.reduce((s, v) => s + v, 0) || 1;

  let angle = -Math.PI / 2;
  const slices = data.map((row, i) => {
    const pct = values[i] / total;
    const startAngle = angle;
    angle += pct * 2 * Math.PI;
    const endAngle = angle;
    const largeArc = pct > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const midAngle = (startAngle + endAngle) / 2;
    const lx = cx + (r * 0.6) * Math.cos(midAngle), ly = cy + (r * 0.6) * Math.sin(midAngle);
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: COLORS[i % COLORS.length], label: String(row[labelCol]), pct, lx, ly };
  });

  return (
    <div ref={ref} className="relative" style={{ width, height }}>
      <svg width={width} height={height - legendH}>
        {slices.map((s, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
            <path d={s.d} fill={s.color} opacity={hover === null ? 0.8 : hover === i ? 1 : 0.3}
              stroke="white" strokeWidth={2} style={{ transition: 'opacity 0.15s' }} />
            {s.pct > 0.08 && hover !== i && (
              <text x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="white" fontWeight="bold" className="select-none pointer-events-none">{Math.round(s.pct * 100)}%</text>
            )}
          </g>
        ))}
      </svg>
      {hover !== null && (
        <Tooltip containerRef={ref} x={slices[hover].lx} y={slices[hover].ly}>
          <strong>{slices[hover].label}</strong>: {values[hover]} ({Math.round(slices[hover].pct * 100)}%)
        </Tooltip>
      )}
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5" style={{ height: legendH }}>
        {slices.slice(0, 8).map((s, i) => (
          <span key={i} className="flex items-center gap-1 text-[8px] text-slate-600 cursor-pointer"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: s.color }} />
            {s.label.slice(0, 10)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function KpiCard({ data, valueCol, label, width = 200, height = 120 }) {
  if (!data?.length || !valueCol) return <EmptyChart width={width} height={height} />;
  const values = data.map(r => parseFloat(r[valueCol]) || 0);
  const total = values.reduce((s, v) => s + v, 0);
  const formatted = total >= 1000000 ? `${(total / 1000000).toFixed(1)}M` : total >= 1000 ? `${(total / 1000).toFixed(1)}K` : String(Math.round(total * 100) / 100);
  return (
    <div style={{ width, height }} className="flex flex-col items-center justify-center">
      <span className="text-3xl font-black text-indigo-600">{formatted}</span>
      <span className="text-xs text-slate-500 font-medium mt-1">{label || valueCol}</span>
      <span className="text-[10px] text-slate-400">{data.length} lignes</span>
    </div>
  );
}

export function ScatterPlot({ data, xCol, yCol, width = 300, height = 200 }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (!data?.length || !xCol || !yCol) return <EmptyChart width={width} height={height} />;
  const margin = { top: 10, right: 10, bottom: 30, left: 45 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;

  const xVals = data.map(r => parseFloat(r[xCol]) || 0);
  const yVals = data.map(r => parseFloat(r[yCol]) || 0);
  // Check if data is actually numeric
  const xNumeric = data.some(r => !isNaN(parseFloat(r[xCol])) && parseFloat(r[xCol]) !== 0);
  const yNumeric = data.some(r => !isNaN(parseFloat(r[yCol])) && parseFloat(r[yCol]) !== 0);
  if (!xNumeric || !yNumeric) return (
    <div style={{ width, height }} className="flex items-center justify-center text-slate-400 text-xs text-center px-4">
      Les axes X et Y doivent être numériques pour un nuage de points
    </div>
  );

  const xMin = Math.min(...xVals), xMax = Math.max(...xVals);
  const yMin = Math.min(...yVals), yMax = Math.max(...yVals);
  const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;
  const getPos = (i) => ({ x: ((xVals[i] - xMin) / xRange) * w, y: h - ((yVals[i] - yMin) / yRange) * h });

  return (
    <div ref={ref} className="relative" style={{ width, height }}>
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {data.map((_, i) => {
            const p = getPos(i);
            return <circle key={i} cx={p.x} cy={p.y} r={hover === i ? 6 : 4} fill={COLORS[i % COLORS.length]}
              opacity={hover === null ? 0.7 : hover === i ? 1 : 0.25}
              className="cursor-pointer" style={{ transition: 'opacity 0.15s, r 0.15s' }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />;
          })}
          <line x1={0} y1={h} x2={w} y2={h} stroke="#E2E8F0" strokeWidth={1} />
          <line x1={0} y1={0} x2={0} y2={h} stroke="#E2E8F0" strokeWidth={1} />
          <text x={w / 2} y={h + 18} textAnchor="middle" fontSize="8" fill="#94A3B8">{xCol}</text>
        </g>
      </svg>
      {hover !== null && (
        <Tooltip x={margin.left + getPos(hover).x} y={margin.top + getPos(hover).y}>
          {xCol}: <strong>{xVals[hover]}</strong> | {yCol}: <strong>{yVals[hover]}</strong>
        </Tooltip>
      )}
    </div>
  );
}

export function DataTable({ data, width = 300, height = 200 }) {
  if (!data?.length) return <EmptyChart width={width} height={height} />;
  const cols = Object.keys(data[0]);
  const rows = data.slice(0, 20);
  return (
    <div style={{ width, height }} className="overflow-auto">
      <table className="text-[10px] border-collapse w-full">
        <thead className="sticky top-0">
          <tr>{cols.map(c => <th key={c} className="px-2 py-1 bg-slate-100 text-slate-600 font-semibold text-left border-b border-slate-200 whitespace-nowrap">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-indigo-50/30">
              {cols.map(c => <td key={c} className="px-2 py-0.5 text-slate-700 border-b border-slate-100 whitespace-nowrap">{row[c]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyChart({ width, height }) {
  return (
    <div style={{ width, height }} className="flex items-center justify-center text-slate-400 text-xs">
      Configurez le graphique
    </div>
  );
}
