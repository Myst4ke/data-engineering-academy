import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { getAllTables } from '../pipeline/sampleData';
import { BarChart, LineChart, PieChart, KpiCard, ScatterPlot, DataTable } from './charts';
import ChartConfig from './ChartConfig';

function aggregateData(data, xCol, yCol, aggFunc) {
  if (aggFunc === 'none' || !aggFunc) return data;
  const groups = new Map();
  data.forEach(row => { const k = String(row[xCol] ?? ''); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(parseFloat(row[yCol]) || 0); });
  return [...groups.entries()].map(([key, vals]) => {
    let r; switch (aggFunc) { case 'sum': r = vals.reduce((s, v) => s + v, 0); break; case 'count': r = vals.length; break; case 'avg': r = vals.reduce((s, v) => s + v, 0) / vals.length; break; case 'min': r = Math.min(...vals); break; case 'max': r = Math.max(...vals); break; default: r = vals[0]; }
    return { [xCol]: key, [yCol]: String(Math.round(r * 100) / 100) };
  });
}

function useSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => { if (!ref.current) return; const m = () => { const r = ref.current.getBoundingClientRect(); setSize({ width: Math.floor(r.width), height: Math.floor(r.height) }); }; m(); const o = new ResizeObserver(m); o.observe(ref.current); return () => o.disconnect(); }, []);
  return size;
}

// Grid config
const COLS = 12;
const ROW_H = 50;
const GAP = 8;
const DEFAULTS = { bar: { gw: 6, gh: 5 }, line: { gw: 6, gh: 5 }, pie: { gw: 4, gh: 6 }, kpi: { gw: 3, gh: 3 }, scatter: { gw: 6, gh: 5 }, table: { gw: 8, gh: 6 } };

function gridToPixel(gx, gy, gw, gh, colW) {
  return { x: gx * (colW + GAP), y: gy * (ROW_H + GAP), w: gw * colW + (gw - 1) * GAP, h: gh * ROW_H + (gh - 1) * GAP };
}

function pixelToGrid(px, py, colW) {
  return { gx: Math.max(0, Math.round(px / (colW + GAP))), gy: Math.max(0, Math.round(py / (ROW_H + GAP))) };
}

function overlaps(a, b) {
  return a.gx < b.gx + b.gw && a.gx + a.gw > b.gx && a.gy < b.gy + b.gh && a.gy + a.gh > b.gy;
}

// Compact widgets: up first, then left
function compact(widgets) {
  const result = widgets.map(w => ({ ...w }));
  // Sort by position
  result.sort((a, b) => a.gy - b.gy || a.gx - b.gx);
  // Compact up
  for (const w of result) {
    while (w.gy > 0) {
      const test = { ...w, gy: w.gy - 1 };
      if (result.some(o => o.id !== w.id && overlaps(test, o))) break;
      w.gy--;
    }
  }
  // Compact left
  for (const w of result) {
    while (w.gx > 0) {
      const test = { ...w, gx: w.gx - 1 };
      if (result.some(o => o.id !== w.id && overlaps(test, o))) break;
      w.gx--;
    }
  }
  return result;
}

// Find first available grid slot for a widget of size gw x gh
function findSlot(widgets, gw, gh) {
  for (let gy = 0; gy < 100; gy++) {
    for (let gx = 0; gx <= COLS - gw; gx++) {
      const test = { gx, gy, gw, gh, id: '__test__' };
      if (!widgets.some(w => overlaps(test, w))) return { gx, gy };
    }
  }
  return { gx: 0, gy: widgets.length > 0 ? Math.max(...widgets.map(w => w.gy + w.gh)) : 0 };
}

// Push overlapping widgets down
function resolveAndCompact(widgets, movedId) {
  const result = widgets.map(w => ({ ...w }));
  const moved = result.find(w => w.id === movedId);
  if (!moved) return compact(result);
  // Push others down
  let changed = true, iter = 0;
  while (changed && iter < 100) { changed = false; iter++;
    for (const w of result) { if (w.id === movedId) continue;
      if (overlaps(moved, w)) { w.gy = moved.gy + moved.gh; changed = true; }
    }
    // Cascading
    for (let i = 0; i < result.length; i++) for (let j = i + 1; j < result.length; j++) {
      if (overlaps(result[i], result[j])) {
        const [upper, lower] = result[i].gy <= result[j].gy ? [result[i], result[j]] : [result[j], result[i]];
        lower.gy = upper.gy + upper.gh; changed = true;
      }
    }
  }
  return compact(result);
}

function GridWidget({ widget, data, colW, onConfig, onRemove, onDragStart, onResizeStart, isDragging }) {
  const chartRef = useRef(null);
  const { width: cw, height: ch } = useSize(chartRef);
  const config = widget.config;
  const chartData = config?.aggFunc && config.aggFunc !== 'none' ? aggregateData(data, config.xCol, config.yCol, config.aggFunc) : data;
  const pos = gridToPixel(widget.gx, widget.gy, widget.gw, widget.gh, colW);

  const renderChart = () => {
    if (cw < 20 || ch < 20) return null;
    switch (config?.chartType) {
      case 'bar': return <BarChart data={chartData} xCol={config.xCol} yCol={config.yCol} width={cw} height={ch} />;
      case 'line': return <LineChart data={chartData} xCol={config.xCol} yCol={config.yCol} width={cw} height={ch} />;
      case 'pie': return <PieChart data={chartData} labelCol={config.xCol} valueCol={config.yCol} width={cw} height={ch} />;
      case 'kpi': return <KpiCard data={data} valueCol={config.yCol} label={config.title} width={cw} height={ch} />;
      case 'scatter': return <ScatterPlot data={chartData} xCol={config.xCol} yCol={config.yCol} width={cw} height={ch} />;
      case 'table': return <DataTable data={data} width={cw} height={ch} />;
      default: return <div className="flex items-center justify-center h-full text-slate-400 text-xs">Clic droit pour configurer</div>;
    }
  };

  return (
    <div style={{ position: 'absolute', left: pos.x, top: pos.y, width: pos.w, height: pos.h, zIndex: isDragging ? 50 : 1, transition: isDragging ? 'none' : 'all 0.2s ease' }}
      className={`bg-white rounded-xl border shadow-sm flex flex-col ${isDragging ? 'border-indigo-400 shadow-xl opacity-80' : 'border-slate-200'}`}
      onContextMenu={e => { e.preventDefault(); onConfig(widget.id); }}>
      <div className="flex items-center justify-between px-3 py-1 border-b border-slate-100 shrink-0 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={e => { if (e.button === 0) { e.preventDefault(); onDragStart(widget.id, e); } }}>
        <span className="text-[11px] font-semibold text-slate-700 truncate">{config?.title || 'Nouveau graphique'}</span>
        <div className="flex items-center gap-0.5" onMouseDown={e => e.stopPropagation()}>
          <button onClick={() => onConfig(widget.id)} className="text-[10px] text-slate-400 hover:text-indigo-500 p-0.5">⚙️</button>
          <button onClick={() => onRemove(widget.id)} className="text-[10px] text-slate-400 hover:text-red-500 p-0.5">✕</button>
        </div>
      </div>
      <div ref={chartRef} className="flex-1 p-1" style={{ minHeight: 0, overflow: 'hidden' }}>{renderChart()}</div>
      <div onMouseDown={e => { if (e.button === 0) { e.preventDefault(); e.stopPropagation(); onResizeStart(widget.id, e); } }}
        style={{ position: 'absolute', right: 0, bottom: 0, width: 18, height: 18, cursor: 'nwse-resize' }}>
        <svg width="18" height="18" viewBox="0 0 18 18"><line x1="16" y1="6" x2="6" y2="16" stroke="#CBD5E1" strokeWidth="1.5"/><line x1="16" y1="11" x2="11" y2="16" stroke="#CBD5E1" strokeWidth="1.5"/></svg>
      </div>
    </div>
  );
}

export default function BiDojo({ onBackToHub }) {
  const allTables = useMemo(() => getAllTables(), []);
  const [selectedTableId, setSelectedTableId] = useState(allTables[0]?.id || '');
  const [widgets, setWidgets] = useState([]);
  const [configWidgetId, setConfigWidgetId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [placeholder, setPlaceholder] = useState(null);
  const actionRef = useRef(null);
  const gridRef = useRef(null);
  const nextId = useRef(1);
  const [gridWidth, setGridWidth] = useState(800);

  useEffect(() => {
    if (!gridRef.current) return;
    const obs = new ResizeObserver(entries => setGridWidth(entries[0].contentRect.width));
    obs.observe(gridRef.current);
    return () => obs.disconnect();
  }, []);

  const colW = useMemo(() => (gridWidth - (COLS - 1) * GAP) / COLS, [gridWidth]);

  const selectedTable = useMemo(() => allTables.find(t => t.id === selectedTableId), [allTables, selectedTableId]);
  const columns = selectedTable?.columns || [];
  const data = selectedTable?.rows || [];

  const addWidget = (type) => {
    const id = `w-${nextId.current++}`;
    const d = DEFAULTS[type] || { gw: 6, gh: 5 };
    const slot = findSlot(widgets, d.gw, d.gh);
    const newW = { id, gx: slot.gx, gy: slot.gy, gw: d.gw, gh: d.gh,
      config: { chartType: type, title: '', xCol: columns[0] || '', yCol: columns[1] || columns[0] || '', aggFunc: 'none' } };
    setWidgets(prev => compact([...prev, newW]));
  };

  const handleConfig = (params) => { if (!configWidgetId) return; setWidgets(prev => prev.map(w => w.id === configWidgetId ? { ...w, config: params } : w)); setConfigWidgetId(null); };
  const removeWidget = (id) => setWidgets(prev => compact(prev.filter(w => w.id !== id)));

  const startDrag = useCallback((id, e) => {
    const w = widgets.find(ww => ww.id === id);
    if (!w) return;
    const rect = gridRef.current?.getBoundingClientRect();
    setActiveId(id);
    actionRef.current = { type: 'drag', startX: e.clientX, startY: e.clientY, origGx: w.gx, origGy: w.gy, gridLeft: rect?.left || 0, gridTop: rect?.top || 0, scrollTop: gridRef.current?.scrollTop || 0 };
  }, [widgets]);

  const startResize = useCallback((id, e) => {
    const w = widgets.find(ww => ww.id === id);
    if (!w) return;
    setActiveId(id);
    actionRef.current = { type: 'resize', startX: e.clientX, startY: e.clientY, origGw: w.gw, origGh: w.gh };
  }, [widgets]);

  useEffect(() => {
    if (!activeId) return;
    const handleMove = (e) => {
      const a = actionRef.current;
      if (!a) return;
      if (a.type === 'drag') {
        const scrollTop = gridRef.current?.scrollTop || 0;
        const px = e.clientX - a.gridLeft;
        const py = e.clientY - a.gridTop + scrollTop;
        const g = pixelToGrid(px, py, colW);
        const w = widgets.find(ww => ww.id === activeId);
        if (!w) return;
        const gx = Math.min(COLS - w.gw, Math.max(0, g.gx));
        const gy = Math.max(0, g.gy);
        setPlaceholder({ gx, gy, gw: w.gw, gh: w.gh });
        setWidgets(prev => prev.map(ww => ww.id === activeId ? { ...ww, gx, gy } : ww));
      }
      if (a.type === 'resize') {
        const dxCols = Math.round((e.clientX - a.startX) / (colW + GAP));
        const dyRows = Math.round((e.clientY - a.startY) / (ROW_H + GAP));
        const w = widgets.find(ww => ww.id === activeId);
        if (!w) return;
        const gw = Math.min(COLS - w.gx, Math.max(1, a.origGw + dxCols));
        const gh = Math.max(1, a.origGh + dyRows);
        setWidgets(prev => prev.map(ww => ww.id === activeId ? { ...ww, gw, gh } : ww));
      }
    };
    const handleUp = () => {
      if (activeId) setWidgets(prev => resolveAndCompact(prev, activeId));
      setActiveId(null);
      setPlaceholder(null);
      actionRef.current = null;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [activeId, widgets, colW]);

  const totalRows = useMemo(() => widgets.length > 0 ? Math.max(...widgets.map(w => w.gy + w.gh)) + 4 : 6, [widgets]);

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <div className="flex-none flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBackToHub} className="game-btn px-3 py-1.5 text-sm font-semibold">← Accueil</button>
          <h1 className="text-lg font-bold text-emerald-600">📊 BI Dojo</h1>
        </div>
        <span className="text-xs text-slate-400">{widgets.length} widget{widgets.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
          <div className="p-3 border-b border-slate-200">
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Source</p>
            <select value={selectedTableId} onChange={e => setSelectedTableId(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:border-indigo-400 focus:outline-none">
              {allTables.map(t => <option key={t.id} value={t.id}>{t.dbIcon} {t.tableName} ({t.rowCount})</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5 px-1">Widgets</p>
            {[
              { type: 'bar', icon: '📊', label: 'Barres' },
              { type: 'line', icon: '📈', label: 'Ligne' },
              { type: 'pie', icon: '🥧', label: 'Camembert' },
              { type: 'kpi', icon: '🔢', label: 'KPI' },
              { type: 'scatter', icon: '⚬', label: 'Nuage de points' },
              { type: 'table', icon: '📋', label: 'Table' },
            ].map(item => (
              <button key={item.type} onClick={() => addWidget(item.type)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-xs hover:bg-slate-50 transition-colors group mb-0.5">
                <span className="text-base">{item.icon}</span>
                <span className="font-medium text-slate-700 group-hover:text-indigo-600">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div ref={gridRef} className="flex-1 overflow-auto p-4">
          <div style={{ position: 'relative', height: totalRows * (ROW_H + GAP), minHeight: '100%' }}>
            {/* Grid lines (subtle) */}
            <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.3 }}>
              {Array.from({ length: totalRows }).map((_, r) => (
                <div key={r} className="absolute left-0 right-0 border-t border-dashed border-slate-200" style={{ top: r * (ROW_H + GAP) }} />
              ))}
            </div>

            {/* Placeholder */}
            {placeholder && (() => {
              const p = gridToPixel(placeholder.gx, placeholder.gy, placeholder.gw, placeholder.gh, colW);
              return <div className="absolute rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/30 pointer-events-none" style={{ left: p.x, top: p.y, width: p.w, height: p.h, transition: 'all 0.15s' }} />;
            })()}

            {/* Widgets */}
            {widgets.map(w => (
              <GridWidget key={w.id} widget={w} data={data} colW={colW}
                onConfig={setConfigWidgetId} onRemove={removeWidget}
                onDragStart={startDrag} onResizeStart={startResize}
                isDragging={activeId === w.id} />
            ))}

            {widgets.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl mb-3">📊</p>
                  <p className="text-slate-400 text-sm font-medium">Ajoutez des widgets depuis le panneau de gauche</p>
                  <p className="text-slate-300 text-xs mt-1">Glissez pour positionner · Coin bas-droit pour redimensionner</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {configWidgetId && (
        <ChartConfig columns={columns}
          initialConfig={widgets.find(w => w.id === configWidgetId)?.config}
          onConfirm={handleConfig} onCancel={() => setConfigWidgetId(null)} />
      )}
    </div>
  );
}
