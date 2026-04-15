import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { getAllTables } from '../pipeline/sampleData';
import { BarChart, LineChart, PieChart, KpiCard, ScatterPlot, DataTable } from './charts';
import ChartConfig from './ChartConfig';

function aggregateData(data, xCol, yCol, aggFunc) {
  if (aggFunc === 'none' || !aggFunc) return data;
  const groups = new Map();
  data.forEach(row => {
    const key = String(row[xCol] ?? '');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(parseFloat(row[yCol]) || 0);
  });
  return [...groups.entries()].map(([key, vals]) => {
    let r;
    switch (aggFunc) {
      case 'sum': r = vals.reduce((s, v) => s + v, 0); break;
      case 'count': r = vals.length; break;
      case 'avg': r = vals.reduce((s, v) => s + v, 0) / vals.length; break;
      case 'min': r = Math.min(...vals); break;
      case 'max': r = Math.max(...vals); break;
      default: r = vals[0];
    }
    return { [xCol]: key, [yCol]: String(Math.round(r * 100) / 100) };
  });
}

function useSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const measure = () => { const { width, height } = ref.current.getBoundingClientRect(); setSize({ width: Math.floor(width), height: Math.floor(height) }); };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return size;
}

const SNAP_THRESHOLD = 8;
const MIN_W = 150;
const MIN_H = 100;
const DEFAULT_SIZES = { bar: { w: 420, h: 280 }, line: { w: 420, h: 280 }, pie: { w: 320, h: 300 }, kpi: { w: 200, h: 130 }, scatter: { w: 400, h: 280 }, table: { w: 500, h: 300 } };

function computeSnap(dragging, others) {
  const guides = [];
  let sx = dragging.x, sy = dragging.y;
  const dEdges = { l: dragging.x, r: dragging.x + dragging.w, t: dragging.y, b: dragging.y + dragging.h, cx: dragging.x + dragging.w / 2, cy: dragging.y + dragging.h / 2 };

  for (const o of others) {
    const oEdges = { l: o.x, r: o.x + o.w, t: o.y, b: o.y + o.h, cx: o.x + o.w / 2, cy: o.y + o.h / 2 };
    // Horizontal snaps
    const hPairs = [
      [dEdges.l, oEdges.l, 'l-l'], [dEdges.l, oEdges.r, 'l-r'], [dEdges.r, oEdges.l, 'r-l'], [dEdges.r, oEdges.r, 'r-r'], [dEdges.cx, oEdges.cx, 'c-c'],
    ];
    for (const [dv, ov, type] of hPairs) {
      if (Math.abs(dv - ov) < SNAP_THRESHOLD) {
        const offset = type[0] === 'l' ? ov - dragging.x : type[0] === 'r' ? ov - dragging.x - dragging.w : ov - dragging.x - dragging.w / 2;
        sx = dragging.x + offset;
        guides.push({ type: 'v', x: ov, y1: Math.min(dEdges.t, oEdges.t), y2: Math.max(dEdges.b, oEdges.b) });
      }
    }
    // Vertical snaps
    const vPairs = [
      [dEdges.t, oEdges.t, 't-t'], [dEdges.t, oEdges.b, 't-b'], [dEdges.b, oEdges.t, 'b-t'], [dEdges.b, oEdges.b, 'b-b'], [dEdges.cy, oEdges.cy, 'c-c'],
    ];
    for (const [dv, ov, type] of vPairs) {
      if (Math.abs(dv - ov) < SNAP_THRESHOLD) {
        const offset = type[0] === 't' ? ov - dragging.y : type[0] === 'b' ? ov - dragging.y - dragging.h : ov - dragging.y - dragging.h / 2;
        sy = dragging.y + offset;
        guides.push({ type: 'h', y: ov, x1: Math.min(dEdges.l, oEdges.l), x2: Math.max(dEdges.r, oEdges.r) });
      }
    }
  }
  return { x: sx, y: sy, guides };
}

function Widget({ widget, data, onConfig, onRemove, onMove, onResize, isDragging, snapGuides }) {
  const chartRef = useRef(null);
  const { width: cw, height: ch } = useSize(chartRef);
  const config = widget.config;
  const chartData = config?.aggFunc && config.aggFunc !== 'none' ? aggregateData(data, config.xCol, config.yCol, config.aggFunc) : data;

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
    <div style={{ position: 'absolute', left: widget.x, top: widget.y, width: widget.w, height: widget.h, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 50 : 1, transition: isDragging ? 'none' : 'box-shadow 0.2s' }}
      className={`bg-white rounded-xl border shadow-sm flex flex-col ${isDragging ? 'border-indigo-400 shadow-lg' : 'border-slate-200'}`}
      onContextMenu={e => { e.preventDefault(); onConfig(widget.id); }}>
      {/* Drag header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 shrink-0 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={e => { if (e.button === 0) { e.preventDefault(); onMove(widget.id, e); } }}>
        <span className="text-xs font-semibold text-slate-700 truncate">{config?.title || 'Nouveau graphique'}</span>
        <div className="flex items-center gap-1" onMouseDown={e => e.stopPropagation()}>
          <button onClick={() => onConfig(widget.id)} className="text-[10px] text-slate-400 hover:text-indigo-500 p-0.5">⚙️</button>
          <button onClick={() => onRemove(widget.id)} className="text-[10px] text-slate-400 hover:text-red-500 p-0.5">✕</button>
        </div>
      </div>
      <div ref={chartRef} className="flex-1 p-1" style={{ minHeight: 0, overflow: 'hidden' }}>
        {renderChart()}
      </div>
      {/* Resize handle */}
      <div onMouseDown={e => { if (e.button === 0) { e.preventDefault(); e.stopPropagation(); onResize(widget.id, e); } }}
        style={{ position: 'absolute', right: 0, bottom: 0, width: 16, height: 16, cursor: 'nwse-resize' }}>
        <svg width="16" height="16" viewBox="0 0 16 16"><line x1="14" y1="6" x2="6" y2="14" stroke="#CBD5E1" strokeWidth="1.5" /><line x1="14" y1="10" x2="10" y2="14" stroke="#CBD5E1" strokeWidth="1.5" /></svg>
      </div>
    </div>
  );
}

export default function BiDojo({ onBackToHub }) {
  const allTables = useMemo(() => getAllTables(), []);
  const [selectedTableId, setSelectedTableId] = useState(allTables[0]?.id || '');
  const [widgets, setWidgets] = useState([]);
  const [configWidgetId, setConfigWidgetId] = useState(null);
  const [dragState, setDragState] = useState(null); // { id, startX, startY, origX, origY }
  const [resizeState, setResizeState] = useState(null);
  const [snapGuides, setSnapGuides] = useState([]);
  const nextId = useRef(1);
  const canvasRef = useRef(null);

  const selectedTable = useMemo(() => allTables.find(t => t.id === selectedTableId), [allTables, selectedTableId]);
  const columns = selectedTable?.columns || [];
  const data = selectedTable?.rows || [];

  const addWidget = (type) => {
    const id = `w-${nextId.current++}`;
    const sz = DEFAULT_SIZES[type] || { w: 360, h: 260 };
    // Place new widget in a smart position
    const offset = (nextId.current - 1) * 20;
    setWidgets(prev => [...prev, { id, x: 16 + offset, y: 16 + offset, w: sz.w, h: sz.h,
      config: { chartType: type, title: '', xCol: columns[0] || '', yCol: columns[1] || columns[0] || '', aggFunc: 'none' } }]);
  };

  const handleConfig = (params) => {
    if (!configWidgetId) return;
    setWidgets(prev => prev.map(w => w.id === configWidgetId ? { ...w, config: params } : w));
    setConfigWidgetId(null);
  };

  const removeWidget = (id) => setWidgets(prev => prev.filter(w => w.id !== id));

  // Drag
  const startMove = useCallback((id, e) => {
    const w = widgets.find(ww => ww.id === id);
    if (!w) return;
    setDragState({ id, startX: e.clientX, startY: e.clientY, origX: w.x, origY: w.y });
  }, [widgets]);

  // Resize
  const startResize = useCallback((id, e) => {
    const w = widgets.find(ww => ww.id === id);
    if (!w) return;
    setResizeState({ id, startX: e.clientX, startY: e.clientY, origW: w.w, origH: w.h });
  }, [widgets]);

  useEffect(() => {
    if (!dragState && !resizeState) return;

    const handleMove = (e) => {
      if (dragState) {
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        const newX = Math.max(0, dragState.origX + dx);
        const newY = Math.max(0, dragState.origY + dy);
        const others = widgets.filter(w => w.id !== dragState.id);
        const dragging = { ...widgets.find(w => w.id === dragState.id), x: newX, y: newY };
        const snap = computeSnap(dragging, others);
        setWidgets(prev => prev.map(w => w.id === dragState.id ? { ...w, x: snap.x, y: snap.y } : w));
        setSnapGuides(snap.guides);
      }
      if (resizeState) {
        const dw = e.clientX - resizeState.startX;
        const dh = e.clientY - resizeState.startY;
        const maxW = canvasRef.current ? canvasRef.current.clientWidth - 32 : 2000;
        setWidgets(prev => prev.map(w => w.id === resizeState.id
          ? { ...w, w: Math.min(maxW, Math.max(MIN_W, resizeState.origW + dw)), h: Math.max(MIN_H, resizeState.origH + dh) } : w));
      }
    };
    const handleUp = () => { setDragState(null); setResizeState(null); setSnapGuides([]); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragState, resizeState, widgets]);

  // Canvas size = bounding box of all widgets + padding
  const canvasSize = useMemo(() => {
    if (widgets.length === 0) return { w: '100%', h: '100%' };
    const maxR = Math.max(...widgets.map(w => w.x + w.w)) + 40;
    const maxB = Math.max(...widgets.map(w => w.y + w.h)) + 40;
    return { w: maxR, h: maxB };
  }, [widgets]);

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

        {/* Free-form canvas */}
        <div ref={canvasRef} className="flex-1 overflow-auto relative">
          <div style={{ position: 'relative', minWidth: canvasSize.w, minHeight: canvasSize.h, width: '100%', height: '100%' }}>
            {widgets.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl mb-3">📊</p>
                  <p className="text-slate-400 text-sm font-medium">Ajoutez des widgets depuis le panneau de gauche</p>
                  <p className="text-slate-300 text-xs mt-1">Glissez le header pour déplacer · Coin bas-droit pour redimensionner</p>
                </div>
              </div>
            )}

            {/* Snap guides */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 100 }}>
              {snapGuides.map((g, i) => g.type === 'v'
                ? <line key={i} x1={g.x} y1={g.y1} x2={g.x} y2={g.y2} stroke="#6366F1" strokeWidth={1} strokeDasharray="4 2" />
                : <line key={i} x1={g.x1} y1={g.y} x2={g.x2} y2={g.y} stroke="#6366F1" strokeWidth={1} strokeDasharray="4 2" />
              )}
            </svg>

            {/* Widgets */}
            {widgets.map(w => (
              <Widget key={w.id} widget={w} data={data}
                onConfig={setConfigWidgetId} onRemove={removeWidget}
                onMove={startMove} onResize={startResize}
                isDragging={dragState?.id === w.id}
                snapGuides={snapGuides} />
            ))}
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
