import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { getAllTables } from '../pipeline/sampleData';
import { BarChart, LineChart, PieChart, KpiCard, ScatterPlot, Gauge, Treemap, MapChart, FunnelChart, DataTable, TextWidget, Slicer, recommendChart } from './charts';
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

const COLS = 12, ROW_H = 50, GAP = 8, MIN_W_COLS = 2, MIN_H_ROWS = 2;
const DEFAULTS = { bar: { gw: 6, gh: 5 }, line: { gw: 6, gh: 5 }, pie: { gw: 4, gh: 6 }, kpi: { gw: 3, gh: 3 }, scatter: { gw: 6, gh: 5 }, gauge: { gw: 3, gh: 4 }, treemap: { gw: 6, gh: 5 }, funnel: { gw: 4, gh: 6 }, map: { gw: 5, gh: 6 }, table: { gw: 8, gh: 6 }, text: { gw: 4, gh: 2 }, separator: { gw: 12, gh: 1 }, slicer: { gw: 4, gh: 3 } };
const DEFAULT_CFG = { chartType: 'bar', title: '', xCol: '', yCol: '', aggFunc: 'none', barMode: 'simple', groupCol: '', gaugeMin: 0, gaugeMax: 100, text: '', sepColor: '#CBD5E1', donut: false };

function gridToPixel(gx, gy, gw, gh, colW) { return { x: gx * (colW + GAP), y: gy * (ROW_H + GAP), w: gw * colW + (gw - 1) * GAP, h: gh * ROW_H + (gh - 1) * GAP }; }
function pixelToGrid(px, py, colW) { return { gx: Math.max(0, Math.round(px / (colW + GAP))), gy: Math.max(0, Math.round(py / (ROW_H + GAP))) }; }
function overlaps(a, b) { return a.gx < b.gx + b.gw && a.gx + a.gw > b.gx && a.gy < b.gy + b.gh && a.gy + a.gh > b.gy; }
function compact(widgets) { const r = widgets.map(w => ({ ...w })); r.sort((a, b) => a.gy - b.gy || a.gx - b.gx); for (const w of r) { while (w.gy > 0) { const t = { ...w, gy: w.gy - 1 }; if (r.some(o => o.id !== w.id && overlaps(t, o))) break; w.gy--; } } for (const w of r) { while (w.gx > 0) { const t = { ...w, gx: w.gx - 1 }; if (r.some(o => o.id !== w.id && overlaps(t, o))) break; w.gx--; } } return r; }
function findSlot(widgets, gw, gh) { for (let gy = 0; gy < 100; gy++) for (let gx = 0; gx <= COLS - gw; gx++) { const t = { gx, gy, gw, gh, id: '__t__' }; if (!widgets.some(w => overlaps(t, w))) return { gx, gy }; } return { gx: 0, gy: 0 }; }
function resolveAndCompact(widgets, movedId) { const r = widgets.map(w => ({ ...w })); const moved = r.find(w => w.id === movedId); if (!moved) return compact(r); let c = true, it = 0; while (c && it < 100) { c = false; it++; for (const w of r) { if (w.id === movedId) continue; if (overlaps(moved, w)) { w.gy = moved.gy + moved.gh; c = true; } } for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) { if (overlaps(r[i], r[j])) { const [u, l] = r[i].gy <= r[j].gy ? [r[i], r[j]] : [r[j], r[i]]; l.gy = u.gy + u.gh; c = true; } } } return compact(r); }

const TEMPLATES = [
  { name: 'Vue d\'ensemble', icon: '📋', widgets: [
    { gx: 0, gy: 0, gw: 3, gh: 3, config: { chartType: 'kpi', title: 'Total', xCol: '', yCol: 'id', aggFunc: 'count' } },
    { gx: 3, gy: 0, gw: 3, gh: 3, config: { chartType: 'kpi', title: 'Somme', xCol: '', yCol: '', aggFunc: 'none' } },
    { gx: 6, gy: 0, gw: 6, gh: 5, config: { chartType: 'bar', title: 'Répartition', xCol: '', yCol: '', aggFunc: 'count' } },
    { gx: 0, gy: 3, gw: 6, gh: 5, config: { chartType: 'line', title: 'Tendance', xCol: '', yCol: '', aggFunc: 'none' } },
    { gx: 6, gy: 5, gw: 6, gh: 5, config: { chartType: 'table', title: 'Données', xCol: '', yCol: '', aggFunc: 'none' } },
  ]},
  { name: 'Analyse catégories', icon: '🥧', widgets: [
    { gx: 0, gy: 0, gw: 5, gh: 6, config: { chartType: 'pie', title: 'Répartition', xCol: '', yCol: '', aggFunc: 'count' } },
    { gx: 5, gy: 0, gw: 7, gh: 6, config: { chartType: 'treemap', title: 'Treemap', xCol: '', yCol: '', aggFunc: 'sum' } },
    { gx: 0, gy: 6, gw: 12, gh: 5, config: { chartType: 'bar', title: 'Détail', xCol: '', yCol: '', aggFunc: 'sum' } },
  ]},
  { name: 'Géographique', icon: '🗺️', widgets: [
    { gx: 0, gy: 0, gw: 6, gh: 7, config: { chartType: 'map', title: 'Carte', xCol: 'ville', yCol: '', aggFunc: 'count' } },
    { gx: 6, gy: 0, gw: 6, gh: 5, config: { chartType: 'bar', title: 'Par ville', xCol: 'ville', yCol: '', aggFunc: 'count' } },
    { gx: 6, gy: 5, gw: 3, gh: 3, config: { chartType: 'kpi', title: 'Total', xCol: '', yCol: 'id', aggFunc: 'count' } },
    { gx: 9, gy: 5, gw: 3, gh: 3, config: { chartType: 'gauge', title: 'Objectif', xCol: '', yCol: '', aggFunc: 'sum', gaugeMin: 0, gaugeMax: 100 } },
  ]},
];

// ── GridWidget ──
function GridWidget({ widget, data, rawData, colW, onConfig, onRemove, onDuplicate, onDragStart, onResizeStart, isDragging, isSelected, onSelect, onCrossFilter, crossFilters }) {
  const chartRef = useRef(null);
  const { width: cw, height: ch } = useSize(chartRef);
  const config = widget.config;
  const chartData = config?.aggFunc && config.aggFunc !== 'none' ? aggregateData(data, config.xCol, config.yCol, config.aggFunc) : data;
  const pos = gridToPixel(widget.gx, widget.gy, widget.gw, widget.gh, colW);
  const handleClick = (col, val) => onCrossFilter?.(col, val);

  const renderChart = () => {
    if (cw < 20 || ch < 20) return null;
    switch (config?.chartType) {
      case 'bar': return <BarChart data={chartData} xCol={config.xCol} yCol={config.yCol} groupCol={config.groupCol} mode={config.barMode || 'simple'} width={cw} height={ch} onBarClick={handleClick} />;
      case 'line': return <LineChart data={chartData} xCol={config.xCol} yCol={config.yCol} width={cw} height={ch} onPointClick={handleClick} />;
      case 'pie': return <PieChart data={chartData} labelCol={config.xCol} valueCol={config.yCol} width={cw} height={ch} onSliceClick={handleClick} donut={config.donut} />;
      case 'kpi': return <KpiCard data={data} valueCol={config.yCol} label={config.title} width={cw} height={ch} />;
      case 'scatter': return <ScatterPlot data={chartData} xCol={config.xCol} yCol={config.yCol} width={cw} height={ch} />;
      case 'gauge': return <Gauge data={data} valueCol={config.yCol} label={config.title} min={config.gaugeMin ?? 0} max={config.gaugeMax ?? 100} width={cw} height={ch} />;
      case 'treemap': return <Treemap data={chartData} labelCol={config.xCol} valueCol={config.yCol} width={cw} height={ch} onRectClick={handleClick} />;
      case 'funnel': return <FunnelChart data={chartData} labelCol={config.xCol} valueCol={config.yCol} width={cw} height={ch} onSegmentClick={handleClick} />;
      case 'map': return <MapChart data={data} cityCol={config.xCol} valueCol={config.yCol} width={cw} height={ch} />;
      case 'table': return <DataTable data={data} width={cw} height={ch} />;
      case 'text': return <TextWidget text={config.text} width={cw} height={ch} />;
      case 'separator': return <div style={{ width: cw, height: ch, display: 'flex', alignItems: 'center' }}><div style={{ width: '100%', height: 2, background: config.sepColor || '#CBD5E1' }} /></div>;
      case 'slicer': return <Slicer data={rawData} col={config.xCol} width={cw} height={ch} activeFilters={crossFilters} onToggle={handleClick} />;
      default: return <div className="flex items-center justify-center h-full text-slate-400 text-xs">Configurer</div>;
    }
  };

  const showHeader = config?.chartType !== 'separator';

  return (
    <div style={{ position: 'absolute', left: pos.x, top: pos.y, width: pos.w, height: pos.h, zIndex: isDragging ? 50 : 1, transition: isDragging ? 'none' : 'all 0.2s ease' }}
      className={`bg-white rounded-xl border shadow-sm flex flex-col ${isDragging ? 'border-indigo-400 shadow-xl opacity-80' : isSelected ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200'}`}
      onClick={e => { if (e.shiftKey) { e.stopPropagation(); onSelect?.(widget.id); } }}
      onContextMenu={e => { e.preventDefault(); onConfig(widget.id); }}>
      {showHeader && <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 shrink-0 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={e => { if (e.button === 0 && !e.shiftKey) { e.preventDefault(); onDragStart(widget.id, e); } }}>
        <span className="text-[10px] font-semibold text-slate-700 truncate">{config?.title || ''}</span>
        <div className="flex items-center gap-0.5" onMouseDown={e => e.stopPropagation()}>
          <button onClick={() => onDuplicate(widget.id)} className="text-[9px] text-slate-400 hover:text-emerald-500" title="Dupliquer">📋</button>
          <button onClick={() => onConfig(widget.id)} className="text-[9px] text-slate-400 hover:text-indigo-500">⚙️</button>
          <button onClick={() => onRemove(widget.id)} className="text-[9px] text-slate-400 hover:text-red-500">✕</button>
        </div>
      </div>}
      {!showHeader && <div className="absolute top-0 right-0 flex gap-0.5 p-0.5 opacity-0 hover:opacity-100 transition-opacity z-10" onMouseDown={e => e.stopPropagation()}>
        <button onClick={() => onDuplicate(widget.id)} className="text-[9px] text-slate-400 hover:text-emerald-500 bg-white rounded px-1">📋</button>
        <button onClick={() => onConfig(widget.id)} className="text-[9px] text-slate-400 hover:text-indigo-500 bg-white rounded px-1">⚙️</button>
        <button onClick={() => onRemove(widget.id)} className="text-[9px] text-slate-400 hover:text-red-500 bg-white rounded px-1">✕</button>
      </div>}
      <div ref={chartRef} className="flex-1 p-0.5" style={{ minHeight: 0, overflow: 'hidden' }}>{renderChart()}</div>
      <div onMouseDown={e => { if (e.button === 0) { e.preventDefault(); e.stopPropagation(); onResizeStart(widget.id, e); } }}
        style={{ position: 'absolute', right: 0, bottom: 0, width: 14, height: 14, cursor: 'nwse-resize' }}>
        <svg width="14" height="14" viewBox="0 0 14 14"><line x1="12" y1="4" x2="4" y2="12" stroke="#CBD5E1" strokeWidth="1.2"/><line x1="12" y1="8" x2="8" y2="12" stroke="#CBD5E1" strokeWidth="1.2"/></svg>
      </div>
    </div>
  );
}

// ── SIDEBAR WIDGET LIST ──
const WIDGET_TYPES = [
  { type: 'bar', icon: '📊', label: 'Barres' }, { type: 'line', icon: '📈', label: 'Ligne' },
  { type: 'pie', icon: '🥧', label: 'Camembert' }, { type: 'kpi', icon: '🔢', label: 'KPI' },
  { type: 'scatter', icon: '⚬', label: 'Nuage' }, { type: 'gauge', icon: '🎯', label: 'Jauge' },
  { type: 'treemap', icon: '🟩', label: 'Treemap' }, { type: 'funnel', icon: '🔻', label: 'Entonnoir' },
  { type: 'map', icon: '🗺️', label: 'Carte' }, { type: 'table', icon: '📋', label: 'Table' },
  { type: 'text', icon: '📝', label: 'Texte' }, { type: 'separator', icon: '➖', label: 'Séparateur' },
  { type: 'slicer', icon: '🔘', label: 'Slicer' },
];

// ══════════════════════════════════════════
// ── MAIN COMPONENT ──
// ══════════════════════════════════════════
export default function BiDojo({ onBackToHub }) {
  const defaultTables = useMemo(() => getAllTables(), []);
  const [customTables, setCustomTables] = useState([]);
  const allTables = useMemo(() => [...defaultTables, ...customTables], [defaultTables, customTables]);
  const [selectedTableId, setSelectedTableId] = useState(defaultTables[0]?.id || '');

  // ── Pages state ──
  const [pages, setPages] = useState([{ id: 'p-1', name: 'Page 1', widgets: [] }]);
  const [activePageId, setActivePageId] = useState('p-1');
  const pagesRef = useRef(pages);
  useEffect(() => { pagesRef.current = pages; }, [pages]);

  // ── UI state ──
  const [configWidgetId, setConfigWidgetId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [placeholder, setPlaceholder] = useState(null);
  const [crossFilters, setCrossFilters] = useState([]);
  const [presentationMode, setPresentationMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // ── Save / Load / Dialogs ──
  const [savedDashboards, setSavedDashboards] = useState(() => { try { return JSON.parse(localStorage.getItem('biDojo_dashboards') || '[]'); } catch { return []; } });
  const [dashName, setDashName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [renamingPageId, setRenamingPageId] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  // ── Undo / Redo ──
  const historyRef = useRef({ past: [], future: [] });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const preDragRef = useRef(null);

  // ── Refs ──
  const actionRef = useRef(null);
  const gridRef = useRef(null);
  const nextId = useRef(1);
  const nextPageId = useRef(2);
  const fileInputRef = useRef(null);
  const [gridWidth, setGridWidth] = useState(800);

  // ── Derived values ──
  useEffect(() => { if (!gridRef.current) return; const o = new ResizeObserver(e => setGridWidth(e[0].contentRect.width)); o.observe(gridRef.current); return () => o.disconnect(); }, []);
  const colW = useMemo(() => (gridWidth - (COLS - 1) * GAP) / COLS, [gridWidth]);

  const widgets = useMemo(() => pages.find(p => p.id === activePageId)?.widgets || [], [pages, activePageId]);
  const updateWidgets = useCallback((updater) => {
    setPages(prev => prev.map(p => p.id === activePageId ? { ...p, widgets: typeof updater === 'function' ? updater(p.widgets) : updater } : p));
  }, [activePageId]);

  const selectedTable = useMemo(() => allTables.find(t => t.id === selectedTableId), [allTables, selectedTableId]);
  const columns = selectedTable?.columns || [];
  const rawData = selectedTable?.rows || [];
  const data = useMemo(() => {
    let d = rawData;
    crossFilters.forEach(f => { d = d.filter(r => String(r[f.col] ?? '').trim() === f.val); });
    return d;
  }, [rawData, crossFilters]);

  // Ensure activePageId is valid after undo/redo
  useEffect(() => {
    if (pages.length > 0 && !pages.find(p => p.id === activePageId)) setActivePageId(pages[0].id);
  }, [pages, activePageId]);

  const addCrossFilter = useCallback((col, val) => {
    setCrossFilters(prev => {
      const exists = prev.find(f => f.col === col && f.val === val);
      if (exists) return prev.filter(f => !(f.col === col && f.val === val));
      return [...prev.filter(f => f.col !== col), { col, val }];
    });
  }, []);

  // ── History helpers ──
  const pushHistory = useCallback(() => {
    historyRef.current.past.push(JSON.parse(JSON.stringify(pagesRef.current)));
    if (historyRef.current.past.length > 30) historyRef.current.past.shift();
    historyRef.current.future = [];
    setCanUndo(true); setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.past.length === 0) return;
    h.future.push(JSON.parse(JSON.stringify(pagesRef.current)));
    setPages(h.past.pop());
    setCanUndo(h.past.length > 0); setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (h.future.length === 0) return;
    h.past.push(JSON.parse(JSON.stringify(pagesRef.current)));
    setPages(h.future.pop());
    setCanUndo(true); setCanRedo(h.future.length > 0);
  }, []);

  // ── Widget CRUD ──
  const addWidget = (type) => {
    pushHistory();
    const id = `w-${nextId.current++}`;
    const d = DEFAULTS[type] || { gw: 6, gh: 5 };
    const slot = findSlot(widgets, d.gw, d.gh);
    const xCol = columns[0] || '', yCol = columns[1] || columns[0] || '';
    updateWidgets(prev => compact([...prev, { id, gx: slot.gx, gy: slot.gy, gw: d.gw, gh: d.gh, config: { ...DEFAULT_CFG, chartType: type, xCol, yCol } }]));
  };

  const duplicateWidget = useCallback((id) => {
    pushHistory();
    const w = widgets.find(ww => ww.id === id);
    if (!w) return;
    const newId = `w-${nextId.current++}`;
    const slot = findSlot(widgets, w.gw, w.gh);
    updateWidgets(prev => compact([...prev, { ...w, id: newId, gx: slot.gx, gy: slot.gy, config: { ...w.config } }]));
  }, [widgets, pushHistory, updateWidgets]);

  const removeWidget = useCallback((id) => {
    pushHistory();
    updateWidgets(prev => compact(prev.filter(w => w.id !== id)));
    setSelectedIds(prev => prev.filter(sid => sid !== id));
  }, [pushHistory, updateWidgets]);

  const handleConfig = (params) => {
    if (!configWidgetId) return;
    pushHistory();
    updateWidgets(prev => prev.map(w => w.id === configWidgetId ? { ...w, config: params } : w));
    setConfigWidgetId(null);
  };

  // ── Multi-selection ──
  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  }, []);

  const removeSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushHistory();
    updateWidgets(prev => compact(prev.filter(w => !selectedIds.includes(w.id))));
    setSelectedIds([]);
  }, [selectedIds, pushHistory, updateWidgets]);

  const duplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushHistory();
    updateWidgets(prev => {
      let all = [...prev];
      selectedIds.forEach(sid => {
        const w = all.find(ww => ww.id === sid);
        if (!w) return;
        const newId = `w-${nextId.current++}`;
        const slot = findSlot(all, w.gw, w.gh);
        all.push({ ...w, id: newId, gx: slot.gx, gy: slot.gy, config: { ...w.config } });
      });
      return compact(all);
    });
    setSelectedIds([]);
  }, [selectedIds, pushHistory, updateWidgets]);

  const alignSelected = useCallback((dir) => {
    if (selectedIds.length < 2) return;
    pushHistory();
    updateWidgets(prev => {
      const sel = prev.filter(w => selectedIds.includes(w.id));
      if (sel.length < 2) return prev;
      const target = dir === 'left' ? Math.min(...sel.map(w => w.gx)) : Math.min(...sel.map(w => w.gy));
      return compact(prev.map(w => {
        if (!selectedIds.includes(w.id)) return w;
        return dir === 'left' ? { ...w, gx: target } : { ...w, gy: target };
      }));
    });
  }, [selectedIds, pushHistory, updateWidgets]);

  // ── Templates ──
  const applyTemplate = (template) => {
    pushHistory();
    let id = nextId.current;
    const newWidgets = template.widgets.map(tw => {
      const cfg = { ...DEFAULT_CFG, ...tw.config };
      if (!cfg.xCol && columns[0]) cfg.xCol = columns[0];
      if (!cfg.yCol && columns[1]) cfg.yCol = columns[1];
      else if (!cfg.yCol && columns[0]) cfg.yCol = columns[0];
      return { id: `w-${id++}`, gx: tw.gx, gy: tw.gy, gw: tw.gw, gh: tw.gh, config: cfg };
    });
    nextId.current = id;
    updateWidgets(compact(newWidgets));
  };

  // ── Auto-generate dashboard ──
  const autoGenerate = useCallback(() => {
    pushHistory();
    const numCols = columns.filter(c => rawData.slice(0, 20).some(r => !isNaN(parseFloat(r[c])) && parseFloat(r[c]) !== 0));
    const textCols = columns.filter(c => !numCols.includes(c));
    const dateCols = columns.filter(c => rawData.slice(0, 5).some(r => /^\d{4}-\d{2}/.test(String(r[c]))));

    const ws = [];
    let id = nextId.current;
    const add = (cfg, gw, gh) => {
      const slot = findSlot(ws, gw, gh);
      ws.push({ id: `w-${id++}`, gx: slot.gx, gy: slot.gy, gw, gh, config: { ...DEFAULT_CFG, ...cfg } });
    };

    // KPIs for first 2 numeric columns
    numCols.slice(0, 2).forEach(c => add({ chartType: 'kpi', title: c, yCol: c, aggFunc: 'sum' }, 3, 3));

    // Slicer for first text column
    if (textCols.length > 0) add({ chartType: 'slicer', title: textCols[0], xCol: textCols[0] }, 3, 3);

    // Line for date columns
    if (dateCols.length > 0 && numCols.length > 0) add({ chartType: 'line', title: 'Tendance', xCol: dateCols[0], yCol: numCols[0] }, 6, 5);

    // Pie or Bar for text columns
    textCols.forEach((c, i) => {
      const unique = new Set(rawData.map(r => r[c])).size;
      if (unique > 0 && unique <= 8 && i === 0) add({ chartType: 'pie', title: c, xCol: c, yCol: numCols[0] || c, aggFunc: numCols[0] ? 'sum' : 'count' }, 4, 6);
      else if (unique > 0 && i <= 1) add({ chartType: 'bar', title: c, xCol: c, yCol: numCols[0] || c, aggFunc: numCols[0] ? 'sum' : 'count' }, 6, 5);
    });

    // Table at the end
    add({ chartType: 'table', title: 'Données', xCol: columns[0] || '', yCol: columns[1] || columns[0] || '' }, 8, 5);

    nextId.current = id;
    updateWidgets(compact(ws));
  }, [columns, rawData, pushHistory, updateWidgets]);

  // ── CSV Import ──
  const handleCSVImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return;
      const delim = (text.match(/;/g) || []).length > (text.match(/,/g) || []).length ? ';' : ',';
      const headers = lines[0].split(delim).map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1).map(l => {
        const vals = l.split(delim).map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
        return obj;
      });
      const newTable = { id: `csv-${Date.now()}`, tableName: file.name.replace(/\.csv$/i, ''), columns: headers, rows, rowCount: rows.length, dbIcon: '📄' };
      setCustomTables(prev => [...prev, newTable]);
      setSelectedTableId(newTable.id);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // ── Pages management ──
  const switchPage = useCallback((id) => { setActivePageId(id); setSelectedIds([]); }, []);

  const addPage = useCallback(() => {
    pushHistory();
    const id = `p-${nextPageId.current++}`;
    setPages(prev => [...prev, { id, name: `Page ${prev.length + 1}`, widgets: [] }]);
    setActivePageId(id);
    setSelectedIds([]);
  }, [pushHistory]);

  const removePage = useCallback((pageId) => {
    if (pagesRef.current.length <= 1) return;
    pushHistory();
    setPages(prev => prev.filter(p => p.id !== pageId));
  }, [pushHistory]);

  const renamePage = useCallback((id, name) => {
    if (!name.trim()) { setRenamingPageId(null); return; }
    setPages(prev => prev.map(p => p.id === id ? { ...p, name: name.trim() } : p));
    setRenamingPageId(null);
  }, []);

  // ── Drag & Resize ──
  const startDrag = useCallback((id, e) => {
    const w = widgets.find(ww => ww.id === id);
    if (!w) return;
    const rect = gridRef.current?.getBoundingClientRect();
    preDragRef.current = JSON.parse(JSON.stringify(pagesRef.current));
    setActiveId(id);
    setSelectedIds([]);
    actionRef.current = { type: 'drag', startX: e.clientX, startY: e.clientY, origGx: w.gx, origGy: w.gy, gridLeft: rect?.left || 0, gridTop: rect?.top || 0 };
  }, [widgets]);

  const startResize = useCallback((id, e) => {
    const w = widgets.find(ww => ww.id === id);
    if (!w) return;
    preDragRef.current = JSON.parse(JSON.stringify(pagesRef.current));
    setActiveId(id);
    actionRef.current = { type: 'resize', startX: e.clientX, startY: e.clientY, origGw: w.gw, origGh: w.gh };
  }, [widgets]);

  useEffect(() => {
    if (!activeId) return;
    const handleMove = (e) => {
      const a = actionRef.current;
      if (!a) return;
      if (a.type === 'drag') {
        const st = gridRef.current?.scrollTop || 0;
        const g = pixelToGrid(e.clientX - a.gridLeft, e.clientY - a.gridTop + st, colW);
        const w = widgets.find(ww => ww.id === activeId);
        if (!w) return;
        const gx = Math.min(COLS - w.gw, Math.max(0, g.gx)), gy = Math.max(0, g.gy);
        setPlaceholder({ gx, gy, gw: w.gw, gh: w.gh });
        updateWidgets(prev => prev.map(ww => ww.id === activeId ? { ...ww, gx, gy } : ww));
      }
      if (a.type === 'resize') {
        const dc = Math.round((e.clientX - a.startX) / (colW + GAP)), dr = Math.round((e.clientY - a.startY) / (ROW_H + GAP));
        const w = widgets.find(ww => ww.id === activeId);
        if (!w) return;
        updateWidgets(prev => prev.map(ww => ww.id === activeId ? { ...ww, gw: Math.min(COLS - w.gx, Math.max(MIN_W_COLS, a.origGw + dc)), gh: Math.max(MIN_H_ROWS, a.origGh + dr) } : ww));
      }
    };
    const handleUp = () => {
      if (preDragRef.current) {
        historyRef.current.past.push(preDragRef.current);
        if (historyRef.current.past.length > 30) historyRef.current.past.shift();
        historyRef.current.future = [];
        setCanUndo(true); setCanRedo(false);
        preDragRef.current = null;
      }
      if (activeId) updateWidgets(prev => resolveAndCompact(prev, activeId));
      setActiveId(null); setPlaceholder(null); actionRef.current = null;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [activeId, widgets, colW, updateWidgets]);

  // ── Save / Load ──
  const saveDashboard = () => {
    if (!dashName.trim()) return;
    const dash = { name: dashName, tableId: selectedTableId, pages, date: new Date().toISOString() };
    const updated = [...savedDashboards.filter(d => d.name !== dashName), dash];
    setSavedDashboards(updated);
    localStorage.setItem('biDojo_dashboards', JSON.stringify(updated));
    setShowSaveDialog(false); setDashName('');
  };

  const loadDashboard = (dash) => {
    if (dash.pages) {
      setPages(dash.pages);
      setActivePageId(dash.pages[0]?.id || 'p-1');
      const allW = dash.pages.flatMap(p => p.widgets);
      nextId.current = Math.max(...allW.map(w => parseInt(w.id.split('-')[1]) || 0), 0) + 1;
      nextPageId.current = Math.max(...dash.pages.map(p => parseInt(p.id.split('-')[1]) || 0), 0) + 1;
    } else if (dash.widgets) {
      // Legacy format migration
      setPages([{ id: 'p-1', name: 'Page 1', widgets: dash.widgets }]);
      setActivePageId('p-1');
      nextId.current = Math.max(...dash.widgets.map(w => parseInt(w.id.split('-')[1]) || 0), 0) + 1;
      nextPageId.current = 2;
    }
    setSelectedTableId(dash.tableId);
    setShowLoadDialog(false);
    setCrossFilters([]); setSelectedIds([]);
    historyRef.current = { past: [], future: [] };
    setCanUndo(false); setCanRedo(false);
  };

  const deleteDashboard = (name) => {
    const updated = savedDashboards.filter(d => d.name !== name);
    setSavedDashboards(updated);
    localStorage.setItem('biDojo_dashboards', JSON.stringify(updated));
  };

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === 'Delete' && selectedIds.length > 0) { e.preventDefault(); removeSelected(); }
      if (e.key === 'Escape') { if (presentationMode) setPresentationMode(false); else setSelectedIds([]); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); setSelectedIds(widgets.map(w => w.id)); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, selectedIds, removeSelected, presentationMode, widgets]);

  const totalRows = useMemo(() => widgets.length > 0 ? Math.max(...widgets.map(w => w.gy + w.gh)) + 4 : 6, [widgets]);

  // ══════════════════════════
  // ── RENDER ──
  // ══════════════════════════
  return (
    <div className={`h-screen flex flex-col ${presentationMode ? 'bg-white' : 'bg-slate-50'}`} onClick={() => setSelectedIds([])}>
      {/* Header */}
      {!presentationMode && (
        <div className="flex-none flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={onBackToHub} className="game-btn px-3 py-1.5 text-sm font-semibold">← Accueil</button>
            <h1 className="text-lg font-bold text-emerald-600">📊 BI Dojo</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={undo} disabled={!canUndo} className={`game-btn px-2 py-1 text-xs font-medium ${canUndo ? '' : 'opacity-30 cursor-default'}`} title="Ctrl+Z">↩️</button>
            <button onClick={redo} disabled={!canRedo} className={`game-btn px-2 py-1 text-xs font-medium ${canRedo ? '' : 'opacity-30 cursor-default'}`} title="Ctrl+Y">↪️</button>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <button onClick={() => setShowSaveDialog(true)} className="game-btn px-2 py-1 text-xs font-medium" title="Sauvegarder">💾</button>
            <button onClick={() => setShowLoadDialog(true)} className="game-btn px-2 py-1 text-xs font-medium" title="Charger">📂</button>
            <button onClick={() => setPresentationMode(true)} className="game-btn px-2 py-1 text-xs font-medium" title="Présentation">🖥️</button>
            <span className="text-xs text-slate-400 ml-1">{widgets.length} widget{widgets.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Cross-filter banner */}
      {crossFilters.length > 0 && (
        <div className="flex-none flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border-b border-indigo-200">
          <span className="text-xs text-indigo-500 font-medium">Filtres :</span>
          {crossFilters.map((f, i) => (
            <button key={i} onClick={() => setCrossFilters(prev => prev.filter((_, j) => j !== i))}
              className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium hover:bg-indigo-200">
              {f.col} = {f.val} ✕
            </button>
          ))}
          <button onClick={() => setCrossFilters([])} className="text-[10px] text-indigo-400 hover:text-indigo-600 ml-2">Tout effacer</button>
        </div>
      )}

      {/* Multi-select toolbar */}
      {selectedIds.length >= 2 && !presentationMode && (
        <div className="flex-none flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-200" onClick={e => e.stopPropagation()}>
          <span className="text-xs text-amber-600 font-medium">{selectedIds.length} sélectionnés</span>
          <button onClick={() => alignSelected('left')} className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium hover:bg-amber-200">⬅ Aligner gauche</button>
          <button onClick={() => alignSelected('top')} className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium hover:bg-amber-200">⬆ Aligner haut</button>
          <button onClick={duplicateSelected} className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium hover:bg-amber-200">📋 Dupliquer</button>
          <button onClick={removeSelected} className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium hover:bg-red-200">🗑️ Supprimer</button>
          <button onClick={() => setSelectedIds([])} className="text-[10px] text-amber-400 hover:text-amber-600 ml-2">Désélectionner</button>
        </div>
      )}

      {/* Presentation mode exit */}
      {presentationMode && (
        <button onClick={() => setPresentationMode(false)} className="fixed top-4 right-4 z-50 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full opacity-40 hover:opacity-100 transition-opacity">
          Echap pour quitter
        </button>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {!presentationMode && (
          <div className="w-48 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
            <div className="p-3 border-b border-slate-200">
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Source</p>
              <select value={selectedTableId} onChange={e => { setSelectedTableId(e.target.value); setCrossFilters([]); }}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:border-indigo-400 focus:outline-none">
                {allTables.map(t => <option key={t.id} value={t.id}>{t.dbIcon} {t.tableName} ({t.rowCount})</option>)}
              </select>
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full mt-1.5 py-1 text-[10px] text-indigo-500 font-medium rounded-lg border border-dashed border-indigo-300 hover:bg-indigo-50 transition-colors">
                📄 Importer CSV
              </button>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1 px-1">Widgets</p>
              {WIDGET_TYPES.map(item => (
                <button key={item.type} onClick={() => addWidget(item.type)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs hover:bg-slate-50 transition-colors group mb-0.5">
                  <span className="text-sm">{item.icon}</span>
                  <span className="font-medium text-slate-700 group-hover:text-indigo-600">{item.label}</span>
                </button>
              ))}
              <p className="text-[10px] font-semibold text-slate-400 uppercase mt-3 mb-1 px-1">Génération</p>
              <button onClick={autoGenerate}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs hover:bg-purple-50 transition-colors group mb-0.5">
                <span className="text-sm">✨</span>
                <span className="font-medium text-slate-700 group-hover:text-purple-600">Auto-dashboard</span>
              </button>
              <p className="text-[10px] font-semibold text-slate-400 uppercase mt-3 mb-1 px-1">Templates</p>
              {TEMPLATES.map(t => (
                <button key={t.name} onClick={() => applyTemplate(t)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs hover:bg-emerald-50 transition-colors group mb-0.5">
                  <span className="text-sm">{t.icon}</span>
                  <span className="font-medium text-slate-700 group-hover:text-emerald-600">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid + Page tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={gridRef} className="flex-1 overflow-auto p-4" onClick={() => setSelectedIds([])}>
            <div style={{ position: 'relative', height: totalRows * (ROW_H + GAP), minHeight: '100%' }}>
              {!presentationMode && <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.2 }}>
                {Array.from({ length: totalRows }).map((_, r) => <div key={r} className="absolute left-0 right-0 border-t border-dashed border-slate-200" style={{ top: r * (ROW_H + GAP) }} />)}
              </div>}
              {placeholder && (() => { const p = gridToPixel(placeholder.gx, placeholder.gy, placeholder.gw, placeholder.gh, colW); return <div className="absolute rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/30 pointer-events-none" style={{ left: p.x, top: p.y, width: p.w, height: p.h, transition: 'all 0.15s' }} />; })()}
              {widgets.map(w => <GridWidget key={w.id} widget={w} data={data} rawData={rawData} colW={colW}
                onConfig={setConfigWidgetId} onRemove={removeWidget} onDuplicate={duplicateWidget}
                onDragStart={startDrag} onResizeStart={startResize} isDragging={activeId === w.id}
                isSelected={selectedIds.includes(w.id)} onSelect={toggleSelect}
                onCrossFilter={addCrossFilter} crossFilters={crossFilters} />)}
              {widgets.length === 0 && <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><p className="text-4xl mb-3">📊</p><p className="text-slate-400 text-sm">Ajoutez des widgets ou choisissez un template</p></div></div>}
            </div>
          </div>

          {/* Page tabs */}
          <div className="flex-none flex items-center gap-1 px-3 py-1 bg-white border-t border-slate-200" onClick={e => e.stopPropagation()}>
            {pages.map(p => (
              <div key={p.id} className={`flex items-center gap-1 px-3 py-1 rounded-t-lg text-xs font-medium cursor-pointer border-b-2 transition-colors ${
                p.id === activePageId ? 'border-indigo-400 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
                {renamingPageId === p.id ? (
                  <input value={renameVal} onChange={e => setRenameVal(e.target.value)}
                    onBlur={() => renamePage(p.id, renameVal)} onKeyDown={e => { if (e.key === 'Enter') renamePage(p.id, renameVal); if (e.key === 'Escape') setRenamingPageId(null); }}
                    autoFocus className="w-20 px-1 text-xs border border-indigo-300 rounded outline-none" onClick={e => e.stopPropagation()} />
                ) : (
                  <span onClick={() => switchPage(p.id)}
                    onDoubleClick={() => { if (!presentationMode) { setRenamingPageId(p.id); setRenameVal(p.name); } }}>
                    {p.name}
                  </span>
                )}
                {pages.length > 1 && !presentationMode && (
                  <button onClick={e => { e.stopPropagation(); removePage(p.id); }} className="text-slate-400 hover:text-red-400 text-[9px] ml-1">✕</button>
                )}
              </div>
            ))}
            {!presentationMode && (
              <button onClick={addPage} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-indigo-500 hover:bg-slate-50 text-sm font-bold" title="Nouvelle page">+</button>
            )}
          </div>
        </div>
      </div>

      {/* Config popup */}
      {configWidgetId && <ChartConfig columns={columns} data={rawData} initialConfig={widgets.find(w => w.id === configWidgetId)?.config} onConfirm={handleConfig} onCancel={() => setConfigWidgetId(null)} />}

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSaveDialog(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-3">Sauvegarder le dashboard</h3>
            <input type="text" value={dashName} onChange={e => setDashName(e.target.value)} placeholder="Nom du dashboard"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-3 focus:border-indigo-400 focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowSaveDialog(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">Annuler</button>
              <button onClick={saveDashboard} disabled={!dashName.trim()} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${dashName.trim() ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-400'}`}>Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

      {/* Load dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowLoadDialog(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-3">Charger un dashboard</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {savedDashboards.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Aucun dashboard sauvegardé</p>}
              {savedDashboards.map(d => (
                <div key={d.name} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <div className="cursor-pointer flex-1" onClick={() => loadDashboard(d)}>
                    <p className="text-sm font-medium text-slate-700">{d.name}</p>
                    <p className="text-[10px] text-slate-400">{d.pages ? `${d.pages.length} page(s) · ${d.pages.reduce((s, p) => s + p.widgets.length, 0)} widgets` : `${d.widgets?.length || 0} widgets`} · {new Date(d.date).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => deleteDashboard(d.name)} className="text-xs text-red-400 hover:text-red-500 p-1">🗑️</button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowLoadDialog(false)} className="mt-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 w-full">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
