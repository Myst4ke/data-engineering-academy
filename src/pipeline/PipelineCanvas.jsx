import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import BackButton from '../components/BackButton';
import { DojoEmojiAuto } from '../components/DojoEmoji';
import { NODE_TYPES, CATEGORIES } from './nodeTypes';
import { getAllTables } from './sampleData';
import TableExplorer from './TableExplorer';
import DataPreview from './DataPreview';
import { applyTransformation } from '../transformations/index';
import ParamInputPopup from '../components/ParamInputPopup';
import MappingConfig from './MappingConfig';
import ForEachConfig from './ForEachConfig';
import LookupConfig from './LookupConfig';
import ForEachRowConfig from './ForEachRowConfig';
import AggregateConfig from './AggregateConfig';
import IfConfig from './IfConfig';
import WindowConfig from './WindowConfig';
import SampleConfig from './SampleConfig';
import LogConfig from './LogConfig';

function mapNodeTypeToTransform(nodeType) {
  const map = {
    filter: 'filter', sort: 'sort', join: 'join', concat: 'concat',
    aggregate: 'aggregate', select_cols: 'select', delete_col: 'delete',
    rename_col: 'rename', deduplicate: 'drop_duplicates', clean_na: 'delete_na', fill_na: 'fill_na',
  };
  return map[nodeType] || nodeType;
}

const PORT_RADIUS = 8;
const NODE_W = 180;
const NODE_H = 72;

// Lakehouse container dimensions
const LAKE_W = 240;
const LAKE_HEADER_H = 36;
const LAKE_TABLE_H = 52;
const LAKE_TABLE_GAP = 8;
const LAKE_PAD = 8;

function getLakehouseHeight(childCount, showDrop = false) {
  const items = childCount + (showDrop ? 1 : 0);
  const body = LAKE_PAD + (items > 0 ? items * LAKE_TABLE_H + (items - 1) * LAKE_TABLE_GAP : 0) + LAKE_PAD;
  return Math.max(LAKE_HEADER_H + body, LAKE_HEADER_H + 40);
}
function getLakehouseChildY(parentNode, index) {
  return parentNode.y + LAKE_HEADER_H + LAKE_PAD + index * (LAKE_TABLE_H + LAKE_TABLE_GAP);
}

function getInputPortPos(node, portIndex = 0) {
  return { x: node.x, y: node.y + NODE_H / 2 + (portIndex > 0 ? 24 : 0) };
}
function getOutputPortPos(node) {
  return { x: node.x + NODE_W, y: node.y + NODE_H / 2 };
}
function bezierPath(from, to) {
  const dx = Math.max(Math.abs(to.x - from.x) * 0.5, 50);
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
}
function rectIntersects(r, x, y, w, h) {
  return !(r.x2 < x || r.x1 > x + w || r.y2 < y || r.y1 > y + h);
}
function pointInRect(r, px, py) {
  return px >= r.x1 && px <= r.x2 && py >= r.y1 && py <= r.y2;
}

function ConnectionLine({ from, to, isTemp, isSelected, onClick }) {
  const d = bezierPath(from, to);
  return (
    <g>
      {!isTemp && <path d={d} fill="none" stroke="transparent" strokeWidth={14} className="cursor-pointer" onClick={onClick} />}
      <path d={d} fill="none" stroke={isTemp ? '#94A3B8' : isSelected ? '#EF4444' : '#6366F1'} strokeWidth={isTemp ? 2 : isSelected ? 3 : 2.5} strokeDasharray={isTemp ? '6 4' : 'none'} opacity={isTemp ? 0.6 : 0.9} pointerEvents="none" />
    </g>
  );
}

function PipelineNode({ node, typeDef, isSelected, onMouseDown, onNodeMouseUp, onPortMouseDown, onPortMouseUp, connectingFrom, onContextMenu, onPreview, outputRowCount, outputData, label }) {
  const isSource = typeDef.category === 'source';
  const isTable = node.type === 'table_output';
  const showPreview = !isSource && typeDef.category !== 'storage';
  const bgColor = isTable ? '#F0FDF4' : 'white';
  return (
    <g>
      {isSelected && (
        <rect x={node.x - 4} y={node.y - 4} width={NODE_W + 8} height={NODE_H + 8} rx={14}
          fill="none" stroke="#6366F1" strokeWidth={2.5} pointerEvents="none" />
      )}
      <foreignObject x={node.x} y={node.y} width={NODE_W} height={NODE_H}>
        <div
          onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, node.id); }}
          onMouseUp={(e) => { e.stopPropagation(); onNodeMouseUp(node.id); }}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node.id); }}
          className="w-full h-full rounded-xl border-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
          style={{ background: bgColor, borderColor: typeDef.color, borderLeftWidth: '4px', overflow: 'visible' }}
        >
          {!isTable && <span className="leading-none inline-flex"><DojoEmojiAuto native={typeDef.icon} size={22} /></span>}
          {isTable && <span className="text-[10px] font-bold text-emerald-700">📋 {label || 'Table'}</span>}
          {!isTable && <span className="text-[10px] font-bold text-slate-700 mt-0.5">{typeDef.name}</span>}
          {!isTable && label === '__foreach_emojis__' && (() => {
            const steps = node._foreachSteps || [];
            return steps.length > 0 ? (
              <div className="flex items-center gap-0.5 mt-0.5">
                {steps.map((s, i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    {i > 0 && <span className="text-[8px] text-slate-300">→</span>}
                    <DojoEmojiAuto native={NODE_TYPES[s.nodeType]?.icon} size={16} />
                  </span>
                ))}
              </div>
            ) : null;
          })()}
          {!isTable && label && label !== '__foreach_emojis__' && <span className="text-[10px] text-indigo-500 font-medium">{label}</span>}
          {!isTable && !label && isSource && <span className="text-[10px] text-amber-600 font-medium">À configurer</span>}
          {!isTable && !label && !isSource && <span className="text-[10px] text-slate-500 font-medium">À configurer</span>}
          {isTable && outputRowCount > 0 && (() => {
            const colCount = outputData && outputData.length > 0 ? Object.keys(outputData[0]).length : 0;
            return <span className="text-[10px] text-slate-500">{colCount} col × {outputRowCount} lignes</span>;
          })()}
        </div>
      </foreignObject>

      {!isTable && outputRowCount > 0 && (() => {
        const colCount = outputData && outputData.length > 0 ? Object.keys(outputData[0]).length : 0;
        const txt = `${colCount}x${outputRowCount}`;
        const w = txt.length * 7 + 10;
        return (
          <g>
            <rect x={node.x + NODE_W - w / 2} y={node.y - 10} width={w} height={16} rx={8} fill="#6366F1" />
            <text x={node.x + NODE_W} y={node.y + 2} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{txt}</text>
          </g>
        );
      })()}

      {showPreview && (
        <g className="cursor-pointer" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          onClick={(e) => { e.stopPropagation(); onPreview(node.id); }}
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}>
          <circle cx={node.x + NODE_W - 10} cy={node.y + NODE_H + 2} r={10} fill="white" stroke="#CBD5E1" strokeWidth={1.5} />
          <foreignObject x={node.x + NODE_W - 18} y={node.y + NODE_H - 6} width={16} height={16} style={{ pointerEvents: 'none' }}>
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DojoEmojiAuto native="🔎" size={14} />
            </div>
          </foreignObject>
        </g>
      )}

      {Array.from({ length: typeDef.inputs }).map((_, i) => {
        const pos = getInputPortPos(node, i);
        return (
          <circle key={`in-${i}`} cx={pos.x} cy={pos.y} r={PORT_RADIUS}
            fill={connectingFrom ? '#E0E7FF' : 'white'} stroke={typeDef.color} strokeWidth={2}
            className="cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp(node.id, i); }}
          />
        );
      })}

      {Array.from({ length: typeDef.outputs }).map((_, i) => {
        const pos = getOutputPortPos(node);
        return (
          <circle key={`out-${i}`} cx={pos.x} cy={pos.y} r={PORT_RADIUS}
            fill={connectingFrom === node.id ? typeDef.color : 'white'} stroke={typeDef.color} strokeWidth={2}
            className="cursor-pointer"
            onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(e, node.id); }}
            onMouseUp={(e) => e.stopPropagation()}
          />
        );
      })}
    </g>
  );
}

// ── Lakehouse container node ──
function LakehouseNode({ node, typeDef, childNodes, nodeConfigs, nodeOutputs, isSelected, connectingFrom, showDropZone, onMouseDown, onNodeMouseUp, onPortMouseDown, onPortMouseUp, onContextMenu }) {
  const childCount = childNodes.length;
  const height = getLakehouseHeight(childCount, showDropZone);

  return (
    <g>
      {isSelected && (
        <rect x={node.x - 4} y={node.y - 4} width={LAKE_W + 8} height={height + 8} rx={14}
          fill="none" stroke="#6366F1" strokeWidth={2.5} pointerEvents="none" />
      )}
      {/* Container body via foreignObject — styled like global site */}
      <foreignObject x={node.x} y={node.y} width={LAKE_W} height={height}>
        <div
          onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, node.id); }}
          onMouseUp={(e) => { e.stopPropagation(); onNodeMouseUp(node.id); }}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu?.(e, node.id); }}
          className="w-full h-full rounded-xl border-2 flex flex-col cursor-grab active:cursor-grabbing select-none overflow-hidden"
          style={{ background: 'white', borderColor: typeDef.color, borderLeftWidth: '4px' }}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-center gap-1.5" style={{ height: LAKE_HEADER_H, background: typeDef.color }}>
            <DojoEmojiAuto native={typeDef.icon} size={20} />
            <span className="text-xs font-bold" style={{ color: typeDef.color === '#FFD700' ? '#1E293B' : 'white' }}>
              {typeDef.name.toUpperCase()}
            </span>
          </div>

          {/* Body with child tables */}
          <div style={{ padding: LAKE_PAD, display: 'flex', flexDirection: 'column', gap: LAKE_TABLE_GAP, flex: 1, background: '#F8FAFC' }}>
            {childNodes.map(child => {
              const cfg = nodeConfigs[child.id];
              const output = nodeOutputs[child.id];
              const rowCount = output?.length || 0;
              const colCount = output?.length > 0 ? Object.keys(output[0]).length : 0;
              return (
                <div key={child.id} className="rounded-lg border-2 border-emerald-400 flex flex-col items-center justify-center"
                  style={{ height: LAKE_TABLE_H, background: '#F0FDF4', flexShrink: 0 }}>
                  <span className="text-[10px] font-bold text-slate-700 leading-tight">{cfg?.tableName || 'Table'}</span>
                  {rowCount > 0 && <span className="text-[7px] text-slate-400">{colCount}×{rowCount}</span>}
                </div>
              );
            })}
            {showDropZone && (
              <div className="rounded-lg border-2 border-dashed border-indigo-300 flex items-center justify-center"
                style={{ height: LAKE_TABLE_H, background: 'rgba(238,242,255,0.5)', flexShrink: 0 }}>
                <span className="text-sm font-bold text-indigo-400">+</span>
              </div>
            )}
          </div>
        </div>
      </foreignObject>

      {/* Ports in SVG on top of foreignObject */}
      {childNodes.map((child, i) => {
        const cy = getLakehouseChildY(node, i);
        return (
          <g key={`ports-${child.id}`}>
            <circle cx={node.x} cy={cy + LAKE_TABLE_H / 2} r={PORT_RADIUS}
              fill={connectingFrom ? '#E0E7FF' : 'white'} stroke={typeDef.color} strokeWidth={2}
              className="cursor-pointer"
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp(child.id, 0); }}
            />
            <circle cx={node.x + LAKE_W} cy={cy + LAKE_TABLE_H / 2} r={PORT_RADIUS}
              fill={connectingFrom === child.id ? typeDef.color : 'white'} stroke={typeDef.color} strokeWidth={2}
              className="cursor-pointer"
              onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(e, child.id); }}
              onMouseUp={(e) => e.stopPropagation()}
            />
          </g>
        );
      })}
    </g>
  );
}

function NodePalette({ onAddNode }) {
  return (
    <div data-tutorial="palette" className="w-48 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Activités</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="p-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1 px-1 sticky top-0 bg-white flex items-center gap-1.5">
              <DojoEmojiAuto native={cat.icon} size={14} />
              <span>{cat.name}</span>
            </p>
            {Object.entries(NODE_TYPES).filter(([, d]) => d.category === cat.id).map(([typeId, def]) => (
              <button key={typeId} onClick={() => onAddNode(typeId)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs hover:bg-slate-50 transition-colors mb-0.5 group">
                <span className="shrink-0 inline-flex"><DojoEmojiAuto native={def.icon} size={18} /></span>
                <span className="font-medium text-slate-700 group-hover:text-indigo-600 truncate">{def.name}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Minimap({ nodes, nodeConfigs, pan, zoom, canvasRef, onNavigate, topOffset = 16 }) {
  const [isDragging, setIsDragging] = useState(false);

  const topLevel = nodes.filter(n => !nodeConfigs[n.id]?.parentId);
  if (topLevel.length === 0) return null;

  const MM_W = 180;
  const MM_H = 120;
  const PAD = 20;

  const rect = canvasRef.current?.getBoundingClientRect();
  const vw = rect ? rect.width : 800;
  const vh = rect ? rect.height : 600;

  const viewMinX = -pan.x / zoom;
  const viewMinY = -pan.y / zoom;
  const viewW = vw / zoom;
  const viewH = vh / zoom;

  const widthOf = (n) => (NODE_TYPES[n.type]?.category === 'storage' ? LAKE_W : NODE_W);
  const heightOf = (n) => (NODE_TYPES[n.type]?.category === 'storage'
    ? getLakehouseHeight(nodes.filter(c => nodeConfigs[c.id]?.parentId === n.id).length)
    : NODE_H);

  const nodesMinX = Math.min(...topLevel.map(n => n.x));
  const nodesMinY = Math.min(...topLevel.map(n => n.y));
  const nodesMaxX = Math.max(...topLevel.map(n => n.x + widthOf(n)));
  const nodesMaxY = Math.max(...topLevel.map(n => n.y + heightOf(n)));

  const bbMinX = Math.min(nodesMinX, viewMinX);
  const bbMinY = Math.min(nodesMinY, viewMinY);
  const bbMaxX = Math.max(nodesMaxX, viewMinX + viewW);
  const bbMaxY = Math.max(nodesMaxY, viewMinY + viewH);

  const contentW = (bbMaxX - bbMinX) + PAD * 2;
  const contentH = (bbMaxY - bbMinY) + PAD * 2;
  const scale = Math.min(MM_W / contentW, MM_H / contentH);

  const proj = (x, y) => ({ x: (x - bbMinX + PAD) * scale, y: (y - bbMinY + PAD) * scale });

  const centerOn = (e, el) => {
    const mrect = el.getBoundingClientRect();
    const mx = e.clientX - mrect.left;
    const my = e.clientY - mrect.top;
    const cx = mx / scale + bbMinX - PAD;
    const cy = my / scale + bbMinY - PAD;
    onNavigate({ x: -cx * zoom + vw / 2, y: -cy * zoom + vh / 2 });
  };

  return (
    <div
      className="absolute right-4 bg-white/95 border border-slate-200 rounded-lg shadow-md overflow-hidden"
      style={{ top: topOffset, width: MM_W, height: MM_H, zIndex: 20, cursor: isDragging ? 'grabbing' : 'pointer' }}
      onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setIsDragging(true); centerOn(e, e.currentTarget); }}
      onMouseMove={(e) => { if (isDragging) centerOn(e, e.currentTarget); }}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onWheel={(e) => e.stopPropagation()}
      title="Minimap — clic ou glisser pour naviguer"
      aria-label="Minimap du canvas"
    >
      <svg width={MM_W} height={MM_H} style={{ display: 'block', pointerEvents: 'none' }}>
        {topLevel.map(n => {
          const p = proj(n.x, n.y);
          const w = Math.max(2, widthOf(n) * scale);
          const h = Math.max(2, heightOf(n) * scale);
          return <rect key={n.id} x={p.x} y={p.y} width={w} height={h} fill={NODE_TYPES[n.type]?.color || '#94A3B8'} opacity={0.85} rx={1} />;
        })}
        <rect
          x={proj(viewMinX, viewMinY).x}
          y={proj(viewMinX, viewMinY).y}
          width={Math.max(1, viewW * scale)}
          height={Math.max(1, viewH * scale)}
          fill="rgba(99,102,241,0.12)"
          stroke="#6366F1"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}

export default function PipelineCanvas({ onBack, exercise, onExerciseValidate }) {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [selectedConns, setSelectedConns] = useState(new Set());
  const [selectionRect, setSelectionRect] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const [nodeConfigs, setNodeConfigs] = useState({});

  const [explorerForNode, setExplorerForNode] = useState(null);
  const [previewNodeId, setPreviewNodeId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [configNodeId, setConfigNodeId] = useState(null);
  const [mappingNodeId, setMappingNodeId] = useState(null);
  const [forEachNodeId, setForEachNodeId] = useState(null);
  const [lookupNodeId, setLookupNodeId] = useState(null);
  const [forEachRowNodeId, setForEachRowNodeId] = useState(null);
  const [aggregateNodeId, setAggregateNodeId] = useState(null);
  const [windowNodeId, setWindowNodeId] = useState(null);
  const [sampleNodeId, setSampleNodeId] = useState(null);
  const [logNodeId, setLogNodeId] = useState(null);
  const [ifNodeId, setIfNodeId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tableRenameDialog, setTableRenameDialog] = useState(null); // { lakehouseId, sourceId, sourceName, name }
  const [dragOverLakehouse, setDragOverLakehouse] = useState(null);
  const [biSaveDialog, setBiSaveDialog] = useState(null); // { nodeId, data, name }
  const [lakehouseRenameMenu, setLakehouseRenameMenu] = useState(null); // { lakehouseId, editingChildId?, editingName? }

  const canvasRef = useRef(null);
  const nextId = useRef(1);
  const clipboardRef = useRef(null);

  const clearSelection = () => { setSelectedNodes(new Set()); setSelectedConns(new Set()); };

  const getCanvasCoords = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom };
  }, [pan, zoom]);

  // ── Port position helpers that handle lakehouse child nodes ──
  const getEffectiveOutputPortPos = useCallback((node) => {
    const cfg = nodeConfigs[node.id];
    if (cfg?.parentId) {
      const parent = nodes.find(n => n.id === cfg.parentId);
      if (parent) return { x: parent.x + LAKE_W, y: node.y + LAKE_TABLE_H / 2 };
    }
    return getOutputPortPos(node);
  }, [nodeConfigs, nodes]);

  const getEffectiveInputPortPos = useCallback((node, portIndex = 0) => {
    const cfg = nodeConfigs[node.id];
    if (cfg?.parentId) {
      const parent = nodes.find(n => n.id === cfg.parentId);
      if (parent) return { x: parent.x, y: node.y + LAKE_TABLE_H / 2 };
    }
    return getInputPortPos(node, portIndex);
  }, [nodeConfigs, nodes]);

  // ── Get children of a lakehouse ──
  const getLakehouseChildren = useCallback((lakehouseId) => {
    return nodes.filter(n => nodeConfigs[n.id]?.parentId === lakehouseId).sort((a, b) => a.y - b.y);
  }, [nodes, nodeConfigs]);

  // ── Sync child positions whenever lakehouse moves ──
  const syncLakehouseChildren = useCallback((updatedNodes) => {
    const result = [...updatedNodes];
    const lakehouseNodes = result.filter(n => NODE_TYPES[n.type]?.category === 'storage');
    lakehouseNodes.forEach(lh => {
      const children = result.filter(n => nodeConfigs[n.id]?.parentId === lh.id).sort((a, b) => a.y - b.y);
      children.forEach((child, i) => {
        const idx = result.findIndex(n => n.id === child.id);
        if (idx >= 0) {
          result[idx] = { ...result[idx], x: lh.x, y: getLakehouseChildY(lh, i) };
        }
      });
    });
    return result;
  }, [nodeConfigs]);

  // ── Absorb a table_output node into a lakehouse ──
  const absorbIntoLakehouse = useCallback((nodeId, lakehouseId) => {
    const lhNode = nodes.find(n => n.id === lakehouseId);
    if (!lhNode) return;
    const children = getLakehouseChildren(lakehouseId);
    const childIndex = children.length;
    const childY = getLakehouseChildY(lhNode, childIndex);
    setNodeConfigs(prev => ({ ...prev, [nodeId]: { ...prev[nodeId], parentId: lakehouseId } }));
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x: lhNode.x, y: childY } : n));
  }, [nodes, getLakehouseChildren]);

  const handleAddNode = useCallback((typeId) => {
    const id = `node-${nextId.current++}`;
    const rect = canvasRef.current?.getBoundingClientRect();
    const cx = rect ? (rect.width / 2 - pan.x - NODE_W / 2) : 300;
    const cy = rect ? (rect.height / 2 - pan.y - NODE_H / 2) : 200;
    const offset = (nextId.current - 1) * 20;
    setNodes(prev => [...prev, { id, type: typeId, x: cx + offset, y: cy + offset }]);
    setSelectedNodes(new Set([id]));
    setSelectedConns(new Set());
    const typeDef = NODE_TYPES[typeId];
    if (typeDef?.category === 'source') {
      setExplorerForNode(id);
    }
  }, [pan]);

  const tryConnect = useCallback((sourceId, targetId) => {
    if (sourceId === targetId) return false;
    const targetNode = nodes.find(n => n.id === targetId);
    const targetType = targetNode && NODE_TYPES[targetNode.type];
    if (!targetType || targetType.inputs === 0) return false;
    const dup = connections.some(c => c.from === sourceId && c.to === targetId);
    if (dup) return false;
    for (let i = 0; i < targetType.inputs; i++) {
      const taken = connections.some(c => c.to === targetId && c.toPort === i);
      if (!taken || targetType.multiInput) {
        setConnections(prev => [...prev, { from: sourceId, to: targetId, toPort: i }]);
        return true;
      }
    }
    return false;
  }, [nodes, connections]);

  // ── Delete ──
  const handleDelete = useCallback(() => {
    if (selectedNodes.size > 0) {
      const toDelete = new Set(selectedNodes);
      // Cascade: delete table_output children connected from deleted nodes
      connections.forEach(c => {
        if (toDelete.has(c.from)) {
          const targetNode = nodes.find(n => n.id === c.to);
          if (targetNode?.type === 'table_output') toDelete.add(c.to);
        }
      });
      // Cascade: delete children of deleted lakehouse containers
      nodes.forEach(n => {
        if (nodeConfigs[n.id]?.parentId && toDelete.has(nodeConfigs[n.id].parentId)) {
          toDelete.add(n.id);
        }
      });

      setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
      setConnections(prev => prev.filter(c => !toDelete.has(c.from) && !toDelete.has(c.to)));
      setNodeConfigs(prev => {
        const next = { ...prev };
        toDelete.forEach(id => delete next[id]);
        return next;
      });
    }
    if (selectedConns.size > 0) {
      setConnections(prev => prev.filter((_, i) => !selectedConns.has(i)));
    }
    clearSelection();
  }, [selectedNodes, selectedConns, connections, nodes, nodeConfigs]);

  // ── Copy / Paste ──
  const handleCopy = useCallback(() => {
    if (selectedNodes.size === 0) return;
    // Include lakehouse children whose parent is selected
    const ids = new Set(selectedNodes);
    nodes.forEach(n => {
      const parentId = nodeConfigs[n.id]?.parentId;
      if (parentId && ids.has(parentId)) ids.add(n.id);
    });
    const copiedNodes = nodes.filter(n => ids.has(n.id));
    if (copiedNodes.length === 0) return;
    const copiedConns = connections.filter(c => ids.has(c.from) && ids.has(c.to));
    const copiedConfigs = {};
    ids.forEach(id => { if (nodeConfigs[id]) copiedConfigs[id] = nodeConfigs[id]; });
    const minX = Math.min(...copiedNodes.map(n => n.x));
    const minY = Math.min(...copiedNodes.map(n => n.y));
    clipboardRef.current = {
      nodes: copiedNodes.map(n => ({ ...n, x: n.x - minX, y: n.y - minY })),
      connections: copiedConns,
      configs: copiedConfigs,
    };
  }, [selectedNodes, nodes, connections, nodeConfigs]);

  const handlePaste = useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip || clip.nodes.length === 0) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    const defaultX = rect ? (rect.width / 2 - pan.x) / zoom : mousePos.x + 40;
    const defaultY = rect ? (rect.height / 2 - pan.y) / zoom : mousePos.y + 40;
    const offsetX = mousePos.x || defaultX;
    const offsetY = mousePos.y || defaultY;
    const idMap = {};
    const newNodes = clip.nodes.map(n => {
      const newId = `node-${nextId.current++}`;
      idMap[n.id] = newId;
      return { ...n, id: newId, x: n.x + offsetX, y: n.y + offsetY };
    });
    const newConns = clip.connections
      .filter(c => idMap[c.from] && idMap[c.to])
      .map(c => ({ ...c, from: idMap[c.from], to: idMap[c.to] }));
    const newConfigs = {};
    for (const [oldId, cfg] of Object.entries(clip.configs)) {
      const newId = idMap[oldId];
      if (!newId) continue;
      const copy = { ...cfg };
      if (copy.parentId && idMap[copy.parentId]) copy.parentId = idMap[copy.parentId];
      else if (copy.parentId && !idMap[copy.parentId]) delete copy.parentId;
      newConfigs[newId] = copy;
    }
    setNodes(prev => [...prev, ...newNodes]);
    setConnections(prev => [...prev, ...newConns]);
    setNodeConfigs(prev => ({ ...prev, ...newConfigs }));
    setSelectedNodes(new Set(Object.values(idMap)));
    setSelectedConns(new Set());
  }, [mousePos, pan, zoom]);

  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); handleCopy(); return; }
      if (mod && (e.key === 'v' || e.key === 'V')) { e.preventDefault(); handlePaste(); return; }
      if (mod && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); handleCopy(); handlePaste(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') handleDelete();
      if (e.key === 'Escape') { setConnectingFrom(null); clearSelection(); setSelectionRect(null); setIsSelecting(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDelete, handleCopy, handlePaste]);

  const getNormalizedRect = () => {
    if (!selectionRect) return null;
    return {
      x1: Math.min(selectionRect.startX, selectionRect.currentX),
      y1: Math.min(selectionRect.startY, selectionRect.currentY),
      x2: Math.max(selectionRect.startX, selectionRect.currentX),
      y2: Math.max(selectionRect.startY, selectionRect.currentY),
    };
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button === 2 || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    if (e.button === 0 && !connectingFrom) {
      setContextMenu(null);
      const coords = getCanvasCoords(e);
      setIsSelecting(true);
      setSelectionRect({ startX: coords.x, startY: coords.y, currentX: coords.x, currentY: coords.y });
      clearSelection();
    }
    if (e.button === 0 && connectingFrom) {
      setConnectingFrom(null);
    }
  };

  const pendingDragRef = useRef(null);
  const DRAG_THRESHOLD = 4;

  const handleCanvasMouseMove = (e) => {
    const coords = getCanvasCoords(e);
    setMousePos(coords);

    if (isPanning && panStart) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    const pd = pendingDragRef.current;
    if (pd && !pd.activated) {
      const dx = Math.abs(e.clientX - pd.startX);
      const dy = Math.abs(e.clientY - pd.startY);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        pd.activated = true;
        setDragging(pd.nodeId);
        setDragStart({ x: pd.startX, y: pd.startY, nodeX: pd.nodeX, nodeY: pd.nodeY, origPositions: pd.origPositions });
        if (!selectedNodes.has(pd.nodeId)) {
          setSelectedNodes(new Set([pd.nodeId]));
          setSelectedConns(new Set());
        }
      }
      return;
    }

    if (dragging && dragStart) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;

      // Collect lakehouse children that should move with their parent
      const extraIds = new Set();
      const draggedIds = selectedNodes.has(dragging) ? selectedNodes : new Set([dragging]);
      draggedIds.forEach(nid => {
        const n = nodes.find(nn => nn.id === nid);
        if (n && NODE_TYPES[n.type]?.category === 'storage') {
          nodes.filter(nn => nodeConfigs[nn.id]?.parentId === nid).forEach(ch => extraIds.add(ch.id));
        }
      });

      setNodes(prev => prev.map(n => {
        if (draggedIds.has(n.id) || extraIds.has(n.id)) {
          return { ...n, x: (dragStart.origPositions?.[n.id]?.x ?? n.x) + dx, y: (dragStart.origPositions?.[n.id]?.y ?? n.y) + dy };
        }
        return n;
      }));

      // Detect if dragged node hovers over a lakehouse (for drop zone)
      const draggedNode = nodes.find(n => n.id === dragging);
      if (draggedNode && draggedNode.type === 'table_output' && !nodeConfigs[dragging]?.parentId) {
        const dragX = (dragStart.origPositions?.[dragging]?.x ?? 0) + dx;
        const dragY = (dragStart.origPositions?.[dragging]?.y ?? 0) + dy;
        const cx = dragX + NODE_W / 2;
        const cy = dragY + NODE_H / 2;
        let overLH = null;
        nodes.forEach(n => {
          if (n.id === dragging) return;
          const td = NODE_TYPES[n.type];
          if (td?.category !== 'storage') return;
          const children = getLakehouseChildren(n.id);
          const lhH = getLakehouseHeight(children.length, true);
          if (cx > n.x && cx < n.x + LAKE_W && cy > n.y && cy < n.y + lhH) overLH = n.id;
        });
        setDragOverLakehouse(overLH);
      } else {
        setDragOverLakehouse(null);
      }
      return;
    }
    if (isSelecting && selectionRect) {
      setSelectionRect(prev => ({ ...prev, currentX: coords.x, currentY: coords.y }));
    }
  };

  const handleCanvasMouseUp = () => {
    // Check if a table_output was dropped over a lakehouse
    if (dragging && dragOverLakehouse) {
      const draggedNode = nodes.find(n => n.id === dragging);
      if (draggedNode?.type === 'table_output' && !nodeConfigs[dragging]?.parentId) {
        absorbIntoLakehouse(dragging, dragOverLakehouse);
        setDragOverLakehouse(null);
        pendingDragRef.current = null;
        setDragging(null); setDragStart(null); setIsPanning(false); setPanStart(null); setIsSelecting(false); setSelectionRect(null);
        return;
      }
    }
    setDragOverLakehouse(null);

    if (pendingDragRef.current && !pendingDragRef.current.activated) {
      const nodeId = pendingDragRef.current.nodeId;
      setSelectedNodes(new Set([nodeId]));
      setSelectedConns(new Set());
    }
    pendingDragRef.current = null;

    if (connectingFrom && !isPanning && !dragging && !isSelecting) {
      setConnectingFrom(null);
    }
    if (isSelecting && selectionRect) {
      const r = getNormalizedRect();
      if (r && Math.abs(r.x2 - r.x1) > 5 && Math.abs(r.y2 - r.y1) > 5) {
        const selNodes = new Set();
        const selConns = new Set();
        nodes.forEach(n => {
          // Skip lakehouse children in rectangle sélection
          if (nodeConfigs[n.id]?.parentId) return;
          const nw = NODE_TYPES[n.type]?.category === 'storage' ? LAKE_W : NODE_W;
          const nh = NODE_TYPES[n.type]?.category === 'storage' ? getLakehouseHeight(getLakehouseChildren(n.id).length) : NODE_H;
          if (rectIntersects(r, n.x, n.y, nw, nh)) selNodes.add(n.id);
        });
        connections.forEach((c, i) => {
          const fromN = nodes.find(n => n.id === c.from);
          const toN = nodes.find(n => n.id === c.to);
          if (fromN && toN) {
            const fp = getEffectiveOutputPortPos(fromN);
            const tp = getEffectiveInputPortPos(toN, c.toPort || 0);
            const mid = { x: (fp.x + tp.x) / 2, y: (fp.y + tp.y) / 2 };
            if (pointInRect(r, mid.x, mid.y)) selConns.add(i);
          }
        });
        setSelectedNodes(selNodes);
        setSelectedConns(selConns);
      }
      setSelectionRect(null);
      setIsSelecting(false);
    }
    setIsPanning(false);
    setPanStart(null);
    setDragging(null);
    setDragStart(null);
  };

  const handleNodeMouseDown = (e, nodeId) => {
    if (e.button !== 0) return;
    setIsSelecting(false);
    setSelectionRect(null);
    setContextMenu(null);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const origPositions = {};
    nodes.forEach(n => { origPositions[n.id] = { x: n.x, y: n.y }; });

    pendingDragRef.current = {
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
      origPositions,
      activated: false,
    };
  };

  // ── Connection drop on node (including lakehouse) ──
  const handleNodeMouseUp = (nodeId) => {
    // Drag-and-drop: if we're dragging a table and hovering over ANY lakehouse, absorb it
    // This handles the case where mouseUp fires on the dragged node itself (z-order on top)
    if (dragging && dragOverLakehouse) {
      const draggedNode = nodes.find(n => n.id === dragging);
      if (draggedNode?.type === 'table_output' && !nodeConfigs[dragging]?.parentId) {
        absorbIntoLakehouse(dragging, dragOverLakehouse);
        setDragOverLakehouse(null);
        pendingDragRef.current = null;
        setDragging(null); setDragStart(null); setIsSelecting(false); setSelectionRect(null);
        return;
      }
    }

    // Drag-and-drop directly onto a lakehouse node
    if (dragging && dragging !== nodeId) {
      const targetNode = nodes.find(n => n.id === nodeId);
      const targetType = targetNode && NODE_TYPES[targetNode.type];
      const draggedNode = nodes.find(n => n.id === dragging);
      if (targetType?.category === 'storage' && draggedNode?.type === 'table_output' && !nodeConfigs[dragging]?.parentId) {
        absorbIntoLakehouse(dragging, nodeId);
        setDragOverLakehouse(null);
        pendingDragRef.current = null;
        setDragging(null); setDragStart(null); setIsSelecting(false); setSelectionRect(null);
        return;
      }
    }

    if (connectingFrom && connectingFrom !== nodeId) {
      const targetNode = nodes.find(n => n.id === nodeId);
      const targetType = targetNode && NODE_TYPES[targetNode.type];

      if (targetType?.category === 'storage') {
        const sourceNode = nodes.find(n => n.id === connectingFrom);
        const sourceCfg = nodeConfigs[connectingFrom];
        const defaultName = sourceCfg?.tableName || (sourceNode ? NODE_TYPES[sourceNode.type]?.name : '') || 'table';
        setTableRenameDialog({ lakehouseId: nodeId, sourceId: connectingFrom, sourceName: defaultName, name: defaultName });
        setConnectingFrom(null);
      } else {
        tryConnect(connectingFrom, nodeId);
        setConnectingFrom(null);
      }
    }

    if (pendingDragRef.current && !pendingDragRef.current.activated) {
      setSelectedNodes(new Set([nodeId]));
      setSelectedConns(new Set());
    }

    pendingDragRef.current = null;
    setDragging(null);
    setDragStart(null);
    setDragOverLakehouse(null);
    setIsSelecting(false);
    setSelectionRect(null);
  };

  const handlePortMouseDown = (e, nodeId) => {
    e.preventDefault();
    setIsSelecting(false);
    setSelectionRect(null);
    setConnectingFrom(nodeId);
  };

  const handlePortMouseUp = (nodeId, portIndex) => {
    if (connectingFrom && connectingFrom !== nodeId) {
      // Check if this is a lakehouse child → normal connection to the child
      const targetNode = nodes.find(n => n.id === nodeId);
      const targetType = targetNode && NODE_TYPES[targetNode.type];
      const dup = connections.some(c => c.from === connectingFrom && c.to === nodeId);
      const taken = connections.some(c => c.to === nodeId && c.toPort === portIndex);
      if (!dup && (!taken || targetType?.multiInput)) {
        setConnections(prev => [...prev, { from: connectingFrom, to: nodeId, toPort: portIndex }]);
      }
      setConnectingFrom(null);
    }
    pendingDragRef.current = null;
    setDragging(null);
    setDragStart(null);
  };

  // ── Confirm table rename → create child table inside lakehouse ──
  const confirmTableRename = useCallback(() => {
    if (!tableRenameDialog) return;
    const { lakehouseId, sourceId, name } = tableRenameDialog;
    const lhNode = nodes.find(n => n.id === lakehouseId);
    if (!lhNode) { setTableRenameDialog(null); return; }

    const childId = `node-${nextId.current++}`;
    const existingChildren = getLakehouseChildren(lakehouseId);
    const childIndex = existingChildren.length;
    const childY = getLakehouseChildY(lhNode, childIndex);

    setNodes(prev => [...prev, { id: childId, type: 'table_output', x: lhNode.x, y: childY }]);
    setConnections(prev => [...prev, { from: sourceId, to: childId, toPort: 0 }]);
    setNodeConfigs(prev => ({
      ...prev,
      [childId]: { tableName: name.trim() || 'table', parentId: lakehouseId },
    }));
    setTableRenameDialog(null);
  }, [tableRenameDialog, nodes, getLakehouseChildren]);

  const handleConnectionClick = (index) => {
    setSelectedConns(new Set([index]));
    setSelectedNodes(new Set());
  };

  const handleClear = () => {
    setNodes([]); setConnections([]); clearSelection(); setConnectingFrom(null); setNodeConfigs({});
  };

  // ── Pipeline execution engine ──
  const nodeOutputs = useMemo(() => {
    const outputs = {};

    // Topological order
    const inDeg = {};
    const kids = {};
    nodes.forEach(n => { inDeg[n.id] = 0; kids[n.id] = []; });
    connections.forEach(c => { inDeg[c.to] = (inDeg[c.to] || 0) + 1; kids[c.from]?.push(c.to); });

    const queue = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
    const visited = new Set();
    const order = [];

    while (queue.length > 0) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      order.push(id);
      (kids[id] || []).forEach(kid => {
        inDeg[kid]--;
        if (inDeg[kid] <= 0) queue.push(kid);
      });
    }
    nodes.forEach(n => { if (!visited.has(n.id)) order.push(n.id); });

    for (const nodeId of order) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;
      const typeDef = NODE_TYPES[node.type];
      if (!typeDef) continue;
      const config = nodeConfigs[nodeId];

      if (typeDef.category === 'source') {
        outputs[nodeId] = config?.data || [];
      } else if (node.type === 'table_output') {
        // Table node: data from config, sourceInputNodeId, or incoming connection
        if (config?.data) {
          outputs[nodeId] = config.data;
        } else if (config?.sourceInputNodeId) {
          outputs[nodeId] = outputs[config.sourceInputNodeId] || [];
        } else {
          // Lakehouse child: get data from incoming connection
          const incoming = connections.filter(c => c.to === nodeId);
          outputs[nodeId] = incoming.length > 0 ? (outputs[incoming[0].from] || []) : [];
        }
      } else if (node.type === 'if_condition') {
        const incoming = connections.filter(c => c.to === nodeId);
        const data = incoming.length > 0 ? (outputs[incoming[0].from] || []) : [];
        const p = config?.params;
        let condResult = false;
        if (p) {
          switch (p.condition) {
            case 'table_empty': condResult = data.length === 0; break;
            case 'table_not_empty': condResult = data.length > 0; break;
            case 'row_count_gt': condResult = data.length > (parseInt(p.value) || 0); break;
            case 'row_count_lt': condResult = data.length < (parseInt(p.value) || 0); break;
            case 'col_has_nulls': condResult = data.some(r => !r[p.column] || String(r[p.column]).trim() === ''); break;
            case 'col_no_nulls': condResult = data.every(r => r[p.column] && String(r[p.column]).trim() !== ''); break;
            case 'col_all_unique': { const vals = data.map(r => String(r[p.column] ?? '')); condResult = new Set(vals).size === vals.length; break; }
            case 'col_contains_value': condResult = data.some(r => String(r[p.column] ?? '').trim() === String(p.value).trim()); break;
            default: condResult = false;
          }
        }
        outputs[nodeId] = data;
        outputs[`${nodeId}_true`] = condResult ? data : [];
        outputs[`${nodeId}_false`] = condResult ? [] : data;
      } else if (node.type === 'lookup') {
        const incoming = connections.filter(c => c.to === nodeId);
        const mainData = incoming.length > 0 ? (outputs[incoming[0].from] || []) : [];
        const refData = incoming.length > 1 ? (outputs[incoming[1].from] || []) : [];
        const col = config?.params?.column;
        if (col && refData.length > 0) {
          const refValues = new Set(refData.map(r => String(r[col] ?? '').trim()));
          const match = mainData.filter(r => refValues.has(String(r[col] ?? '').trim()));
          const noMatch = mainData.filter(r => !refValues.has(String(r[col] ?? '').trim()));
          outputs[nodeId] = [...match, ...noMatch];
          outputs[`${nodeId}_match`] = match;
          outputs[`${nodeId}_nomatch`] = noMatch;
        } else {
          outputs[nodeId] = mainData;
        }
      } else if (node.type === 'aggregate') {
        const incoming = connections.filter(c => c.to === nodeId);
        const upstream = incoming.length > 0 ? (outputs[incoming[0].from] || []) : [];
        const groupBy = config?.params?.groupBy || [];
        const aggs = config?.params?.aggs || [];
        if (aggs.length > 0) {
          const groups = new Map();
          upstream.forEach(row => { const key = groupBy.map(c => row[c] ?? '').join('|||'); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row); });
          outputs[nodeId] = [...groups.entries()].map(([, rows]) => {
            const result = {};
            groupBy.forEach(c => { result[c] = rows[0][c]; });
            aggs.forEach(a => {
              const vals = rows.map(r => parseFloat(r[a.column]) || 0);
              const name = a.alias || `${a.func}_${a.column}`;
              switch (a.func) {
                case 'count': result[name] = String(rows.length); break;
                case 'sum': result[name] = String(vals.reduce((s, v) => s + v, 0)); break;
                case 'avg': result[name] = String(Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100); break;
                case 'min': result[name] = String(Math.min(...vals)); break;
                case 'max': result[name] = String(Math.max(...vals)); break;
                default: result[name] = '';
              }
            });
            return result;
          });
        } else { outputs[nodeId] = upstream; }
      } else if (node.type === 'window_func') {
        const incoming = connections.filter(c => c.to === nodeId);
        const upstream = incoming.length > 0 ? (outputs[incoming[0].from] || []) : [];
        const p = config?.params;
        if (p?.func && p?.orderBy) {
          const sorted = [...upstream].sort((a, b) => { const va = parseFloat(a[p.orderBy]) || 0, vb = parseFloat(b[p.orderBy]) || 0; return p.orderDir === 'desc' ? vb - va : va - vb; });
          const partitions = new Map();
          sorted.forEach(row => { const key = p.partitionBy ? String(row[p.partitionBy] ?? '') : '__all__'; if (!partitions.has(key)) partitions.set(key, []); partitions.get(key).push(row); });
          const result = [];
          partitions.forEach(rows => {
            let cumSum = 0, cumCount = 0;
            rows.forEach((row, i) => {
              const newRow = { ...row };
              const val = parseFloat(row[p.valueCol]) || 0;
              cumSum += val; cumCount++;
              switch (p.func) {
                case 'row_number': newRow[p.alias] = String(i + 1); break;
                case 'rank': { const prevVal = i > 0 ? (parseFloat(rows[i - 1][p.orderBy]) || 0) : null; const curVal = parseFloat(row[p.orderBy]) || 0; newRow[p.alias] = (i === 0 || curVal !== prevVal) ? String(i + 1) : rows[i - 1][p.alias] || String(i + 1); break; }
                case 'dense_rank': { if (i === 0) { newRow[p.alias] = '1'; } else { const prev = parseFloat(rows[i - 1][p.orderBy]) || 0; const cur = parseFloat(row[p.orderBy]) || 0; newRow[p.alias] = cur === prev ? (rows[i - 1][p.alias] || '1') : String(parseInt(rows[i - 1][p.alias] || '0') + 1); } break; }
                case 'sum_cum': newRow[p.alias] = String(cumSum); break;
                case 'avg_cum': newRow[p.alias] = String(Math.round((cumSum / cumCount) * 100) / 100); break;
                case 'lag': newRow[p.alias] = i > 0 ? String(rows[i - 1][p.valueCol] ?? '') : ''; break;
                case 'lead': newRow[p.alias] = i < rows.length - 1 ? String(rows[i + 1][p.valueCol] ?? '') : ''; break;
                default: newRow[p.alias] = '';
              }
              result.push(newRow);
            });
          });
          outputs[nodeId] = result;
        } else { outputs[nodeId] = upstream; }
      } else if (node.type === 'sample') {
        const incoming = connections.filter(c => c.to === nodeId);
        const upstream = incoming.length > 0 ? (outputs[incoming[0].from] || []) : [];
        const p = config?.params;
        if (p?.mode) {
          const n = p.value || 10;
          switch (p.mode) {
            case 'top_n': outputs[nodeId] = upstream.slice(0, n); break;
            case 'last_n': outputs[nodeId] = upstream.slice(-n); break;
            case 'every_nth': outputs[nodeId] = upstream.filter((_, i) => i % n === 0); break;
            case 'percentage': { const count = Math.max(1, Math.round(upstream.length * n / 100)); outputs[nodeId] = [...upstream].sort(() => Math.random() - 0.5).slice(0, count); break; }
            default: outputs[nodeId] = upstream;
          }
        } else { outputs[nodeId] = upstream; }
      } else if (node.type === 'log') {
        const incoming = connections.filter(c => c.to === nodeId);
        outputs[nodeId] = incoming.map(c => outputs[c.from] || []).flat();
      } else if (node.type === 'foreach_row') {
        const incoming = connections.filter(c => c.to === nodeId);
        const upstream = incoming.length > 0 ? (outputs[incoming[0].from] || []) : [];
        const computedCols = config?.params?.computedCols || [];
        if (computedCols.length > 0) {
          outputs[nodeId] = upstream.map(row => {
            const newRow = { ...row };
            for (const cc of computedCols) {
              try {
                const a = cc.args;
                switch (cc.func) {
                  case 'concat': newRow[cc.name] = String(row[a.col1] ?? '') + (a.sep || ' ') + String(row[a.col2] ?? ''); break;
                  case 'upper': newRow[cc.name] = String(row[a.col] ?? '').toUpperCase(); break;
                  case 'lower': newRow[cc.name] = String(row[a.col] ?? '').toLowerCase(); break;
                  case 'len': newRow[cc.name] = String(String(row[a.col] ?? '').length); break;
                  case 'year': newRow[cc.name] = String(row[a.col] ?? '').slice(0, 4); break;
                  case 'coalesce': { const v = row[a.col]; newRow[cc.name] = (!v || String(v).trim() === '') ? (a.default || '') : String(v); break; }
                  case 'prefix': newRow[cc.name] = (a.prefix || '') + String(row[a.col] ?? ''); break;
                  case 'ifthen': {
                    const val = String(row[a.col] ?? '').trim();
                    const cmp = String(a.value ?? '').trim();
                    let res = false;
                    switch (a.operator) { case '=': res = val === cmp; break; case '!=': res = val !== cmp; break; case '>': res = parseFloat(val) > parseFloat(cmp); break; case '<': res = parseFloat(val) < parseFloat(cmp); break; case '>=': res = parseFloat(val) >= parseFloat(cmp); break; case '<=': res = parseFloat(val) <= parseFloat(cmp); break; case 'contient': res = val.toLowerCase().includes(cmp.toLowerCase()); break; }
                    newRow[cc.name] = res ? (a.then || 'true') : (a.else || 'false');
                    break;
                  }
                  default: newRow[cc.name] = '';
                }
              } catch { newRow[cc.name] = ''; }
            }
            return newRow;
          });
        } else { outputs[nodeId] = upstream; }
      } else if (node.type === 'foreach') {
        const incoming = connections.filter(c => c.to === nodeId);
        const forEachSteps = config?.params?.steps || [];
        const results = [];
        const tableEntries = [];
        incoming.forEach(c => {
          let data = outputs[c.from] || [];
          const srcNode = nodes.find(n => n.id === c.from);
          const srcCfg = nodeConfigs[c.from];
          const tableName = srcCfg?.tableName || srcNode?.type || 'table';
          for (const step of forEachSteps) {
            try {
              const transformType = { filter: 'filter', sort: 'sort', select_cols: 'select', delete_col: 'delete', rename_col: 'rename', deduplicate: 'drop_duplicates', clean_na: 'delete_na', fill_na: 'fill_na' }[step.nodeType] || step.nodeType;
              if (step.nodeType === 'mapping' && step.params?.mappings) {
                data = data.map(row => { const newRow = {}; step.params.mappings.forEach(m => { let val = row[m.source]; if (m.targetType === 'integer') val = String(parseInt(val) || 0); else if (m.targetType === 'float') val = String(parseFloat(val) || 0); else val = String(val ?? ''); newRow[m.target] = val; }); return newRow; });
              } else if (step.params) {
                data = applyTransformation(data, { type: transformType, params: step.params });
              } else if (['clean_na', 'deduplicate'].includes(step.nodeType)) {
                data = applyTransformation(data, { type: transformType, params: {} });
              }
            } catch { /* skip */ }
          }
          results.push(...data);
          tableEntries.push({ id: c.from, name: tableName, data });
        });
        outputs[nodeId] = results;
        tableEntries.forEach(t => { outputs[`${nodeId}_${t.id}`] = t.data; });
      } else if (typeDef.category === 'storage') {
        // Lakehouse: output = merge of all children's data (computed in post-pass)
        outputs[nodeId] = [];
      } else {
        const incoming = connections.filter(c => c.to === nodeId);
        if (incoming.length === 0) {
          outputs[nodeId] = [];
        } else if (incoming.length === 1) {
          const upstream = outputs[incoming[0].from] || [];
          try {
            if (node.type === 'mapping' && config?.params?.mappings) {
              outputs[nodeId] = upstream.map(row => { const newRow = {}; config.params.mappings.forEach(m => { let val = row[m.source]; if (m.targetType === 'integer') val = String(parseInt(val) || 0); else if (m.targetType === 'float') val = String(parseFloat(val) || 0); else if (m.targetType === 'boolean') val = (val === 'true' || val === '1') ? 'true' : 'false'; else val = String(val ?? ''); newRow[m.target] = val; }); return newRow; });
            } else if (config?.params) {
              outputs[nodeId] = applyTransformation(upstream, { type: mapNodeTypeToTransform(node.type), params: config.params });
            } else if (['clean_na', 'deduplicate'].includes(node.type)) {
              // These transforms work without params
              outputs[nodeId] = applyTransformation(upstream, { type: mapNodeTypeToTransform(node.type), params: {} });
            } else { outputs[nodeId] = upstream; }
          } catch { outputs[nodeId] = upstream; }
        } else {
          const tables = incoming.map(c => outputs[c.from] || []);
          if (node.type === 'join' && config?.params) {
            try { outputs[nodeId] = applyTransformation(tables[0], { type: 'join', params: config.params }, tables[1]); } catch { outputs[nodeId] = tables[0]; }
          } else if (node.type === 'concat') { outputs[nodeId] = tables.flat(); }
          else { outputs[nodeId] = tables.flat(); }
        }
      }
    }

    // Post-pass: compute lakehouse outputs from children
    nodes.forEach(node => {
      const typeDef = NODE_TYPES[node.type];
      if (typeDef?.category === 'storage') {
        const childIds = nodes.filter(n => nodeConfigs[n.id]?.parentId === node.id).map(n => n.id);
        outputs[node.id] = childIds.flatMap(cid => outputs[cid] || []);
      }
    });

    return outputs;
  }, [nodes, connections, nodeConfigs]);

  // Generate logs
  useEffect(() => {
    const logNodes = nodes.filter(n => n.type === 'log');
    const newLogs = [];
    logNodes.forEach(n => {
      const cfg = nodeConfigs[n.id];
      const data = nodeOutputs[n.id] || [];
      if (cfg?.params?.message && data.length > 0) {
        let msg = cfg.params.message;
        msg = msg.replace('{nb_lignes}', String(data.length));
        msg = msg.replace('{nb_colonnes}', data.length > 0 ? String(Object.keys(data[0]).length) : '0');
        const colMatch = msg.match(/\{premiere_valeur:(\w+)\}/);
        if (colMatch && data[0]) msg = msg.replace(colMatch[0], String(data[0][colMatch[1]] ?? ''));
        newLogs.push({ level: cfg.params.level || 'info', message: msg, nodeId: n.id, time: new Date().toLocaleTimeString() });
      }
    });
    if (newLogs.length > 0) setLogs(newLogs);
  }, [nodeOutputs, nodes, nodeConfigs]);

  // ── Context menu ──
  const handleNodeContextMenu = (e, nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const typeDef = NODE_TYPES[node.type];
    if (typeDef?.category === 'source') {
      setExplorerForNode(nodeId);
    } else if (typeDef?.category === 'storage') {
      const children = getLakehouseChildren(nodeId);
      if (children.length > 0) {
        setLakehouseRenameMenu({ lakehouseId: nodeId, editingChildId: null, editingName: '' });
      }
      return;
    } else if (node.type === 'foreach') { setForEachNodeId(nodeId); }
    else if (node.type === 'if_condition') { setIfNodeId(nodeId); }
    else if (node.type === 'lookup') { setLookupNodeId(nodeId); }
    else if (node.type === 'foreach_row') { setForEachRowNodeId(nodeId); }
    else if (node.type === 'aggregate') { setAggregateNodeId(nodeId); }
    else if (node.type === 'window_func') { setWindowNodeId(nodeId); }
    else if (node.type === 'sample') { setSampleNodeId(nodeId); }
    else if (node.type === 'log') { setLogNodeId(nodeId); }
    else if (node.type === 'mapping') { setMappingNodeId(nodeId); }
    else if (typeDef?.category === 'transform') { setConfigNodeId(nodeId); }
    else if (typeDef?.category === 'destination') {
      // Show save-to-BI dialog for destination nodes
      const destData = nodeOutputs[nodeId] || [];
      if (destData.length > 0) {
        setBiSaveDialog({ nodeId, data: destData, name: '' });
      } else { handlePreview(nodeId); }
    }
    else { handlePreview(nodeId); }
  };

  const handleTransformConfig = (params) => {
    if (!configNodeId) return;
    setNodeConfigs(prev => ({ ...prev, [configNodeId]: { ...prev[configNodeId], params } }));
    setConfigNodeId(null);
  };

  const handleForEachConfig = (params) => {
    if (!forEachNodeId) return;
    setNodeConfigs(prev => ({ ...prev, [forEachNodeId]: { ...prev[forEachNodeId], params } }));
    const feNode = nodes.find(n => n.id === forEachNodeId);
    if (!feNode) { setForEachNodeId(null); return; }
    const incoming = connections.filter(c => c.to === forEachNodeId);
    const existingOutputNodeIds = connections.filter(c => c.from === forEachNodeId).map(c => c.to);
    const existingSourceIds = new Set(existingOutputNodeIds.map(id => nodeConfigs[id]?.sourceInputNodeId).filter(Boolean));
    const newInputs = incoming.filter(c => !existingSourceIds.has(c.from));
    if (newInputs.length > 0) {
      const existingChildNodes = nodes.filter(n => existingOutputNodeIds.includes(n.id));
      const maxY = existingChildNodes.length > 0 ? Math.max(...existingChildNodes.map(n => n.y)) + 100 : feNode.y - ((newInputs.length - 1) * 100) / 2;
      const newNodes = [], newConns = [], newCfgs = {};
      newInputs.forEach((c, i) => {
        const id = `node-${nextId.current++}`;
        const srcCfg = nodeConfigs[c.from]; const srcNode = nodes.find(n => n.id === c.from);
        const tName = srcCfg?.tableName || NODE_TYPES[srcNode?.type]?.name || 'table';
        newNodes.push({ id, type: 'table_output', x: feNode.x + 260, y: maxY + i * 100 });
        newConns.push({ from: forEachNodeId, to: id, toPort: 0 });
        newCfgs[id] = { tableName: tName, sourceInputNodeId: `${forEachNodeId}_${c.from}` };
      });
      setNodes(prev => [...prev, ...newNodes]);
      setConnections(prev => [...prev, ...newConns]);
      setNodeConfigs(prev => ({ ...prev, ...newCfgs }));
    }
    setForEachNodeId(null);
  };

  const handleIfConfig = (params) => {
    if (!ifNodeId) return;
    setNodeConfigs(prev => ({ ...prev, [ifNodeId]: { ...prev[ifNodeId], params } }));
    const ifNode = nodes.find(n => n.id === ifNodeId);
    if (ifNode) {
      const existingOutputs = connections.filter(c => c.from === ifNodeId).map(c => c.to);
      if (existingOutputs.length === 0) {
        const newNodes = [], newConns = [], newCfgs = {};
        ['Vrai', 'Faux'].forEach((name, i) => {
          const id = `node-${nextId.current++}`;
          newNodes.push({ id, type: 'table_output', x: ifNode.x + 260, y: ifNode.y + (i - 0.5) * 100 });
          newConns.push({ from: ifNodeId, to: id, toPort: 0 });
          newCfgs[id] = { tableName: name, sourceInputNodeId: `${ifNodeId}_${name === 'Vrai' ? 'true' : 'false'}` };
        });
        setNodes(prev => [...prev, ...newNodes]);
        setConnections(prev => [...prev, ...newConns]);
        setNodeConfigs(prev => ({ ...prev, ...newCfgs }));
      }
    }
    setIfNodeId(null);
  };

  const handleLookupConfig = (params) => {
    if (!lookupNodeId) return;
    setNodeConfigs(prev => ({ ...prev, [lookupNodeId]: { ...prev[lookupNodeId], params } }));
    const lkNode = nodes.find(n => n.id === lookupNodeId);
    if (lkNode) {
      const existingOutputs = connections.filter(c => c.from === lookupNodeId).map(c => c.to);
      if (existingOutputs.length === 0) {
        const newNodes = [], newConns = [], newCfgs = {};
        ['Match', 'No Match'].forEach((name, i) => {
          const id = `node-${nextId.current++}`;
          newNodes.push({ id, type: 'table_output', x: lkNode.x + 260, y: lkNode.y + (i - 0.5) * 100 });
          newConns.push({ from: lookupNodeId, to: id, toPort: 0 });
          newCfgs[id] = { tableName: name, sourceInputNodeId: `${lookupNodeId}_${name === 'Match' ? 'match' : 'nomatch'}` };
        });
        setNodes(prev => [...prev, ...newNodes]);
        setConnections(prev => [...prev, ...newConns]);
        setNodeConfigs(prev => ({ ...prev, ...newCfgs }));
      }
    }
    setLookupNodeId(null);
  };

  const handleForEachRowConfig = (params) => {
    if (!forEachRowNodeId) return;
    setNodeConfigs(prev => ({ ...prev, [forEachRowNodeId]: { ...prev[forEachRowNodeId], params } }));
    setForEachRowNodeId(null);
  };

  const handleSimpleConfig = (nodeId, setter) => (params) => {
    if (!nodeId) return;
    setNodeConfigs(prev => ({ ...prev, [nodeId]: { ...prev[nodeId], params } }));
    setter(null);
  };

  const handleMappingConfig = (params) => {
    if (!mappingNodeId) return;
    setNodeConfigs(prev => ({ ...prev, [mappingNodeId]: { ...prev[mappingNodeId], params } }));
    setMappingNodeId(null);
  };

  const getLoadedTableIds = useCallback((sourceNodeId) => {
    const childIds = connections.filter(c => c.from === sourceNodeId).map(c => c.to);
    const ids = new Set();
    childIds.forEach(cid => { const cfg = nodeConfigs[cid]; if (cfg?.tableId) ids.add(cfg.tableId); });
    return ids;
  }, [connections, nodeConfigs]);

  const handleTableSelect = (tables) => {
    if (!explorerForNode) return;
    const sourceNode = nodes.find(n => n.id === explorerForNode);
    if (!sourceNode) { setExplorerForNode(null); return; }
    const alreadyLoaded = getLoadedTableIds(explorerForNode);
    const newTables = tables.filter(t => !alreadyLoaded.has(t.id));
    if (newTables.length === 0) { setExplorerForNode(null); return; }
    const existingChildIds = connections.filter(c => c.from === explorerForNode).map(c => c.to);
    const existingChildNodes = nodes.filter(n => existingChildIds.includes(n.id));
    const maxY = existingChildNodes.length > 0 ? Math.max(...existingChildNodes.map(n => n.y)) + 100 : sourceNode.y - ((newTables.length - 1) * 100) / 2;
    const newNodes = [], newConnections = [], newConfigs = {};
    newTables.forEach((table, i) => {
      const id = `node-${nextId.current++}`;
      newNodes.push({ id, type: 'table_output', x: sourceNode.x + 260, y: maxY + i * 100 });
      newConnections.push({ from: explorerForNode, to: id, toPort: 0 });
      newConfigs[id] = { tableId: table.id, tableName: table.tableName, data: [...table.rows] };
    });
    setNodes(prev => [...prev, ...newNodes]);
    setConnections(prev => [...prev, ...newConnections]);
    setNodeConfigs(prev => ({ ...prev, ...newConfigs }));
    setExplorerForNode(null);
  };

  const handlePreview = (nodeId) => { setPreviewNodeId(nodeId); };

  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;
    const inDegree = {};
    const children = {};
    // Skip lakehouse children for layout
    const layoutNodes = nodes.filter(n => !nodeConfigs[n.id]?.parentId);
    layoutNodes.forEach(n => { inDegree[n.id] = 0; children[n.id] = []; });
    connections.forEach(c => {
      if (inDegree[c.to] !== undefined) inDegree[c.to] = (inDegree[c.to] || 0) + 1;
      if (children[c.from]) children[c.from].push(c.to);
    });
    const layers = [];
    const assigned = new Set();
    let queue = layoutNodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    if (queue.length === 0 && layoutNodes.length > 0) queue = [layoutNodes[0].id];
    while (queue.length > 0) {
      layers.push([...queue]);
      queue.forEach(id => assigned.add(id));
      const next = [];
      queue.forEach(id => {
        (children[id] || []).forEach(childId => {
          if (!assigned.has(childId) && !next.includes(childId) && inDegree[childId] !== undefined) {
            const allParentsAssigned = connections.filter(c => c.to === childId).every(c => assigned.has(c.from));
            if (allParentsAssigned) next.push(childId);
          }
        });
      });
      if (next.length === 0) { const remaining = layoutNodes.filter(n => !assigned.has(n.id)); if (remaining.length > 0) next.push(remaining[0].id); }
      queue = next;
      if (layers.length > layoutNodes.length) break;
    }
    const GAP_X = 280;
    const GAP_Y = 120;
    const newPositions = {};
    layers.forEach((layer, colIdx) => {
      const totalHeight = (layer.length - 1) * GAP_Y;
      layer.forEach((nodeId, rowIdx) => { newPositions[nodeId] = { x: colIdx * GAP_X, y: rowIdx * GAP_Y - totalHeight / 2 }; });
    });
    const rect = canvasRef.current?.getBoundingClientRect();
    const vw = rect ? rect.width : 800;
    const vh = rect ? rect.height : 600;
    const allX = Object.values(newPositions).map(p => p.x);
    const allY = Object.values(newPositions).map(p => p.y);
    const minX = Math.min(...allX); const maxX = Math.max(...allX) + LAKE_W;
    const minY = Math.min(...allY); const maxY = Math.max(...allY) + NODE_H;
    const offsetX = (vw - (maxX - minX)) / 2 - minX;
    const offsetY = (vh - (maxY - minY)) / 2 - minY;

    setNodes(prev => {
      let updated = prev.map(n => { const pos = newPositions[n.id]; return pos ? { ...n, x: pos.x, y: pos.y } : n; });
      return syncLakehouseChildren(updated);
    });
    setPan({ x: offsetX, y: offsetY });
  }, [nodes, connections, nodeConfigs, syncLakehouseChildren]);

  const totalSelected = selectedNodes.size + selectedConns.size;
  const cursorStyle = isPanning ? 'grabbing' : connectingFrom ? 'crosshair' : isSelecting ? 'crosshair' : 'default';
  const selRect = getNormalizedRect();

  return (
    <div className="h-screen flex flex-col bg-[#FAFBFC]">
      <div className="flex-none flex items-center justify-between px-4 py-2 bg-white border-b border-[#EDE3D2] shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} label="Accueil" />
          <h1 className="font-display text-xl text-[#2B2D42] tracking-tight flex items-center gap-2">
            Pipeline <span className="font-display-italic text-[#6BA4FF]">Dojo</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{nodes.length} nœud{nodes.length !== 1 ? 's' : ''} · {connections.length} lien{connections.length !== 1 ? 's' : ''}</span>
          <span className="hidden lg:inline text-xs text-slate-400" title="Clic droit : configurer · Molette : zoom · Clic droit + glisser : pan · Suppr : supprimer · Ctrl+C / Ctrl+V : copier / coller la sélection · Ctrl+D : dupliquer">
            Clic droit = configurer
          </span>
          {totalSelected > 0 && (
            <button
              onClick={() => { if (window.confirm(`Supprimer ${totalSelected} élément(s) ? L'action est irréversible.`)) handleDelete(); }}
              className="game-btn px-3 py-1 text-xs text-red-600 font-semibold"
            >
              Supprimer ({totalSelected})
            </button>
          )}
          <button
            onClick={() => { if (nodes.length === 0 || window.confirm('Effacer tout le canvas ? Cette action est irréversible.')) handleClear(); }}
            className="game-btn px-3 py-1 text-xs text-slate-600 font-semibold"
          >
            Tout effacer
          </button>
          {exercise && onExerciseValidate && (
            <button onClick={() => onExerciseValidate(nodeOutputs, nodes, connections, nodeConfigs)}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow">
              Valider
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <NodePalette onAddNode={handleAddNode} />

        <div ref={canvasRef} data-tutorial="canvas" className="flex-1 relative overflow-hidden" style={{ cursor: cursorStyle }}
          onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}
          onContextMenu={(e) => e.preventDefault()}
          onWheel={(e) => {
            e.preventDefault();
            const rect = canvasRef.current?.getBoundingClientRect();
            const mx = e.clientX - (rect?.left || 0); const my = e.clientY - (rect?.top || 0);
            const delta = e.deltaY > 0 ? -0.08 : 0.08;
            const newZoom = Math.min(2, Math.max(0.2, zoom + delta));
            const scale = newZoom / zoom;
            setPan(p => ({ x: mx - scale * (mx - p.x), y: my - scale * (my - p.y) }));
            setZoom(newZoom);
          }}>

          {/* Canvas controls (zoom & reset) */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 bg-white border border-slate-200 rounded-lg shadow-md p-1" onMouseDown={e => e.stopPropagation()} onContextMenu={e => e.stopPropagation()}>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600"
              title="Zoomer"
              aria-label="Zoomer"
            >
              <ZoomIn className="w-4 h-4" aria-hidden="true" />
            </button>
            <div className="text-center text-[10px] text-slate-500 font-medium py-0.5 border-y border-slate-100">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}
              className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600"
              title="Dézoomer"
              aria-label="Dézoomer"
            >
              <ZoomOut className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600"
              title="Réinitialiser le zoom et le pan"
              aria-label="Réinitialiser le zoom et le pan"
            >
              <Maximize className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>


          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {zoom >= 0.35 && (<>
              <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x % 40} ${pan.y % 40})`}><circle cx="1" cy="1" r="1" fill="#CBD5E1" /></pattern></defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </>)}
          </svg>

          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1, userSelect: 'none', WebkitUserSelect: 'none' }}>
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Connections */}
              {connections.map((conn, i) => {
                const fromNode = nodes.find(n => n.id === conn.from);
                const toNode = nodes.find(n => n.id === conn.to);
                if (!fromNode || !toNode) return null;
                return (
                  <ConnectionLine key={`c-${i}`}
                    from={getEffectiveOutputPortPos(fromNode)}
                    to={getEffectiveInputPortPos(toNode, conn.toPort || 0)}
                    isSelected={selectedConns.has(i)}
                    onClick={() => handleConnectionClick(i)}
                  />
                );
              })}

              {connectingFrom && (() => {
                const fn = nodes.find(n => n.id === connectingFrom);
                return fn ? <ConnectionLine from={getEffectiveOutputPortPos(fn)} to={mousePos} isTemp /> : null;
              })()}

              {/* Nodes — render in two passes: non-dragged first, dragged last (z-order) */}
              {[false, true].map(pass => nodes.map(node => {
                const typeDef = NODE_TYPES[node.type];
                if (!typeDef) return null;
                const isDragged = dragging && (selectedNodes.has(node.id) || node.id === dragging);
                if (pass === false && isDragged) return null; // skip dragged on first pass
                if (pass === true && !isDragged) return null; // skip non-dragged on second pass

                // Skip lakehouse children — rendered inside their parent container
                if (nodeConfigs[node.id]?.parentId) return null;

                // Lakehouse container rendering
                if (typeDef.category === 'storage') {
                  const children = getLakehouseChildren(node.id);
                  return (
                    <LakehouseNode key={node.id} node={node} typeDef={typeDef}
                      childNodes={children} nodeConfigs={nodeConfigs} nodeOutputs={nodeOutputs}
                      isSelected={selectedNodes.has(node.id)}
                      connectingFrom={connectingFrom}
                      showDropZone={dragOverLakehouse === node.id}
                      onMouseDown={handleNodeMouseDown}
                      onNodeMouseUp={handleNodeMouseUp}
                      onPortMouseDown={handlePortMouseDown}
                      onPortMouseUp={handlePortMouseUp}
                      onContextMenu={handleNodeContextMenu}
                    />
                  );
                }

                // Regular node rendering
                const config = nodeConfigs[node.id];
                const output = nodeOutputs[node.id];
                let label = null;
                if (config?.tableName) { label = config.tableName; }
                else if (node.type === 'foreach' && config?.params?.steps?.length > 0) { label = '__foreach_emojis__'; }
                else if (node.type === 'foreach_row' && config?.params?.computedCols?.length > 0) { label = config.params.computedCols.map(c => c.name).join(', '); }
                else if (node.type === 'if_condition' && config?.params?.condition) {
                  const cond = config.params.condition;
                  const condLabels = { table_empty: 'vide?', table_not_empty: 'non vide?', row_count_gt: `> ${config.params.value}`, row_count_lt: `< ${config.params.value}`, col_has_nulls: `${config.params.column} vides?`, col_no_nulls: `${config.params.column} complet?`, col_all_unique: `${config.params.column} unique?`, col_contains_value: `${config.params.column} = ${config.params.value}?` };
                  label = condLabels[cond] || cond;
                } else if (node.type === 'lookup' && config?.params?.column) { label = `sur ${config.params.column}`; }
                else if (node.type === 'aggregate' && config?.params?.aggs?.length) { label = config.params.aggs.map(a => `${a.func}(${a.column})`).join(', ').slice(0, 30); }
                else if (node.type === 'window_func' && config?.params?.func) { label = `${config.params.func}(${config.params.alias || ''})`; }
                else if (node.type === 'sample' && config?.params?.mode) { const p = config.params; label = p.mode === 'top_n' ? `Top ${p.value}` : p.mode === 'last_n' ? `Last ${p.value}` : p.mode === 'percentage' ? `${p.value}%` : `1/${p.value}`; }
                else if (node.type === 'log' && config?.params?.level) { label = `${config.params.level.toUpperCase()}`; }
                else if (config?.params) {
                  const p = config.params;
                  if (p.mappings) { const renamed = p.mappings.filter(m => m.source !== m.target); label = renamed.length > 0 ? renamed.map(m => `${m.source}→${m.target}`).join(', ').slice(0, 25) : 'configuré'; }
                  else if (p.column && p.value) label = `${p.column} = ${p.value}`;
                  else if (p.column && p.order) label = `${p.column} ${p.order === 'desc' ? '↓' : '↑'}`;
                  else if (p.oldName && p.newName) label = `${p.oldName} → ${p.newName}`;
                  else if (p.column) label = p.column;
                  else if (p.columns) label = p.columns.join(', ');
                  else label = 'configuré';
                }
                const renderNode = node.type === 'foreach' && config?.params?.steps ? { ...node, _foreachSteps: config.params.steps } : node;
                return (
                  <PipelineNode key={node.id} node={renderNode} typeDef={typeDef}
                    isSelected={selectedNodes.has(node.id)}
                    onMouseDown={handleNodeMouseDown} onNodeMouseUp={handleNodeMouseUp}
                    onPortMouseDown={handlePortMouseDown} onPortMouseUp={handlePortMouseUp}
                    connectingFrom={connectingFrom} onContextMenu={handleNodeContextMenu}
                    onPreview={handlePreview} outputRowCount={output?.length} outputData={output} label={label}
                  />
                );
              }))}

              {isSelecting && selRect && (
                <rect x={selRect.x1} y={selRect.y1} width={selRect.x2 - selRect.x1} height={selRect.y2 - selRect.y1}
                  fill="rgba(99, 102, 241, 0.08)" stroke="#6366F1" strokeWidth={1} strokeDasharray="4 2" rx={4} />
              )}
            </g>
          </svg>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium">Cliquez sur une activité à gauche pour l'ajouter</p>
                <p className="text-slate-300 text-xs mt-1">Clic droit pour configurer · Glissez entre les ports pour connecter · Ctrl+C/V : copier-coller</p>
              </div>
            </div>
          )}

          {nodes.length >= 2 && (
            <Minimap
              nodes={nodes}
              nodeConfigs={nodeConfigs}
              pan={pan}
              zoom={zoom}
              canvasRef={canvasRef}
              onNavigate={setPan}
              topOffset={exercise ? 48 : 16}
            />
          )}

          {logs.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-white border border-slate-200 rounded-xl shadow-lg max-w-sm max-h-[120px] overflow-y-auto" style={{ zIndex: 3 }}>
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500">📋 Journal</span>
                <button onClick={() => setLogs([])} className="text-[10px] text-slate-400 hover:text-slate-600">Effacer</button>
              </div>
              {logs.map((log, i) => (
                <div key={i} className="px-3 py-1 border-b border-slate-50 flex items-start gap-2">
                  <span className="text-[10px]">{log.level === 'error' ? '❌' : log.level === 'warn' ? '⚠️' : log.level === 'success' ? '✅' : 'ℹ️'}</span>
                  <span className="text-[10px] text-slate-600 flex-1">{log.message}</span>
                  <span className="text-[9px] text-slate-400">{log.time}</span>
                </div>
              ))}
            </div>
          )}

          {nodes.length >= 2 && (
            <button onClick={handleAutoLayout}
              className="absolute bottom-4 left-4 bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center gap-1.5 z-20" title="Réorganiser automatiquement">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              Réorganiser
            </button>
          )}

          {connectingFrom && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg" style={{ zIndex: 3 }}>
              Relâchez sur un noeud ou un port — Echap pour annuler
            </div>
          )}

          {totalSelected > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-1.5 rounded-full shadow border border-indigo-200" style={{ zIndex: 3 }}>
              {totalSelected} éléments sélectionnés — Suppr pour les retirer
            </div>
          )}
        </div>
      </div>

      {/* Table Explorer for source nodes */}
      {explorerForNode && (() => {
        // In exercise mode, show ALL exercise tables regardless of source type
        let customTables = null;
        if (exercise?.sources) {
          const sourceNode = nodes.find(n => n.id === explorerForNode);
          const sourceType = sourceNode ? NODE_TYPES[sourceNode.type] : null;
          // First try exact match by source type, then fall back to collecting all exercise tables
          const exactMatch = exercise.sources[sourceNode?.type];
          const allExTables = exactMatch || Object.values(exercise.sources).flat();
          if (allExTables.length > 0) {
            customTables = allExTables.map((t, i) => ({
              id: `ex-${explorerForNode}-${i}`, dbId: 'exercise', dbName: sourceType?.name || 'Source', dbIcon: sourceType?.icon || '📄',
              tableId: `ex-t-${i}`, tableName: t.name, columns: t.data.length > 0 ? Object.keys(t.data[0]) : [],
              rowCount: t.data.length, rows: t.data,
            }));
          }
        }
        return <TableExplorer onSelect={handleTableSelect} onClose={() => setExplorerForNode(null)} initialSelectedIds={getLoadedTableIds(explorerForNode)} customTables={customTables} />;
      })()}

      {/* Data Preview popup */}
      {previewNodeId && (
        <DataPreview data={nodeOutputs[previewNodeId] || []}
          title={(() => { const n = nodes.find(nd => nd.id === previewNodeId); const t = n ? NODE_TYPES[n.type] : null; const cfg = nodeConfigs[previewNodeId]; return `${t?.icon || ''} ${t?.name || ''} ${cfg?.tableName ? '— ' + cfg.tableName : ''}`; })()}
          onClose={() => setPreviewNodeId(null)} />
      )}

      {/* Transform configuration popup */}
      {configNodeId && (() => {
        const cfgNode = nodes.find(n => n.id === configNodeId);
        const cfgType = cfgNode ? NODE_TYPES[cfgNode.type] : null;
        const transformType = cfgNode ? mapNodeTypeToTransform(cfgNode.type) : null;
        const existingParams = nodeConfigs[configNodeId]?.params || null;
        const incoming = connections.filter(c => c.to === configNodeId);
        const upstreamData = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : [];
        const columns = upstreamData.length > 0 ? Object.keys(upstreamData[0]) : [];
        if (!cfgType || !transformType) return null;
        return <ParamInputPopup cardType={transformType} cardName={cfgType.name} cardIcon={cfgType.icon} columns={columns} tableData={upstreamData} onConfirm={handleTransformConfig} onCancel={() => setConfigNodeId(null)} initialParams={existingParams} />;
      })()}

      {ifNodeId && (() => {
        const incoming = connections.filter(c => c.to === ifNodeId); const upstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : []; const cols = upstream.length > 0 ? Object.keys(upstream[0]) : [];
        return <IfConfig columns={cols} rowCount={upstream.length} initialParams={nodeConfigs[ifNodeId]?.params} onConfirm={handleIfConfig} onCancel={() => setIfNodeId(null)} />;
      })()}

      {lookupNodeId && (() => {
        const incoming = connections.filter(c => c.to === lookupNodeId); const mainData = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : []; const refData = incoming.length > 1 ? (nodeOutputs[incoming[1].from] || []) : [];
        return <LookupConfig mainColumns={mainData.length > 0 ? Object.keys(mainData[0]) : []} refColumns={refData.length > 0 ? Object.keys(refData[0]) : []} initialParams={nodeConfigs[lookupNodeId]?.params} onConfirm={handleLookupConfig} onCancel={() => setLookupNodeId(null)} />;
      })()}

      {aggregateNodeId && (() => {
        const incoming = connections.filter(c => c.to === aggregateNodeId); const upstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : []; const cols = upstream.length > 0 ? Object.keys(upstream[0]) : [];
        return <AggregateConfig columns={cols} initialParams={nodeConfigs[aggregateNodeId]?.params} onConfirm={handleSimpleConfig(aggregateNodeId, setAggregateNodeId)} onCancel={() => setAggregateNodeId(null)} />;
      })()}

      {windowNodeId && (() => {
        const incoming = connections.filter(c => c.to === windowNodeId); const upstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : []; const cols = upstream.length > 0 ? Object.keys(upstream[0]) : [];
        return <WindowConfig columns={cols} initialParams={nodeConfigs[windowNodeId]?.params} onConfirm={handleSimpleConfig(windowNodeId, setWindowNodeId)} onCancel={() => setWindowNodeId(null)} />;
      })()}

      {sampleNodeId && (() => {
        const incoming = connections.filter(c => c.to === sampleNodeId); const upstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : [];
        return <SampleConfig rowCount={upstream.length} initialParams={nodeConfigs[sampleNodeId]?.params} onConfirm={handleSimpleConfig(sampleNodeId, setSampleNodeId)} onCancel={() => setSampleNodeId(null)} />;
      })()}

      {logNodeId && (() => {
        const incoming = connections.filter(c => c.to === logNodeId); const upstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : []; const cols = upstream.length > 0 ? Object.keys(upstream[0]) : [];
        return <LogConfig columns={cols} initialParams={nodeConfigs[logNodeId]?.params} onConfirm={handleSimpleConfig(logNodeId, setLogNodeId)} onCancel={() => setLogNodeId(null)} />;
      })()}

      {forEachRowNodeId && (() => {
        const incoming = connections.filter(c => c.to === forEachRowNodeId); const upstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : []; const cols = upstream.length > 0 ? Object.keys(upstream[0]) : [];
        return <ForEachRowConfig columns={cols} sampleData={upstream} initialParams={nodeConfigs[forEachRowNodeId]?.params} onConfirm={handleForEachRowConfig} onCancel={() => setForEachRowNodeId(null)} />;
      })()}

      {forEachNodeId && (() => {
        const incoming = connections.filter(c => c.to === forEachNodeId); const firstUpstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : []; const cols = firstUpstream.length > 0 ? Object.keys(firstUpstream[0]) : [];
        return <ForEachConfig initialSteps={nodeConfigs[forEachNodeId]?.params?.steps || []} sampleColumns={cols} sampleData={firstUpstream} onConfirm={handleForEachConfig} onCancel={() => setForEachNodeId(null)} />;
      })()}

      {mappingNodeId && (() => {
        const incoming = connections.filter(c => c.to === mappingNodeId); const upstreamData = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : []; const columns = upstreamData.length > 0 ? Object.keys(upstreamData[0]) : [];
        return <MappingConfig columns={columns} tableData={upstreamData} initialParams={nodeConfigs[mappingNodeId]?.params || null} onConfirm={handleMappingConfig} onCancel={() => setMappingNodeId(null)} />;
      })()}

      {/* Table rename dialog (connection-based add) */}
      {tableRenameDialog && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setTableRenameDialog(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Nom de la table dans le lakehouse</h3>
            <input type="text" value={tableRenameDialog.name}
              onChange={e => setTableRenameDialog(prev => ({ ...prev, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') confirmTableRename(); }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-4 focus:border-indigo-400 focus:outline-none"
              autoFocus placeholder="Nom de la table" />
            <div className="flex gap-2">
              <button onClick={() => setTableRenameDialog(null)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={confirmTableRename} className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Lakehouse right-click: rename tables menu */}
      {lakehouseRenameMenu && (() => {
        const lhNode = nodes.find(n => n.id === lakehouseRenameMenu.lakehouseId);
        const lhType = lhNode ? NODE_TYPES[lhNode.type] : null;
        const children = getLakehouseChildren(lakehouseRenameMenu.lakehouseId);
        return (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setLakehouseRenameMenu(null)}>
            <div className="bg-white rounded-2xl shadow-2xl p-5 w-96 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-4">
                <DojoEmojiAuto native={lhType?.icon} size={20} />
                <h3 className="text-sm font-bold text-slate-800">Tables dans {lhType?.name}</h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {children.map(child => {
                  const cfg = nodeConfigs[child.id];
                  const isEditing = lakehouseRenameMenu.editingChildId === child.id;
                  const output = nodeOutputs[child.id];
                  const rowCount = output?.length || 0;
                  const colCount = output?.length > 0 ? Object.keys(output[0]).length : 0;
                  return (
                    <div key={child.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                      <span className="text-sm">📋</span>
                      {isEditing ? (
                        <input type="text" value={lakehouseRenameMenu.editingName}
                          onChange={e => setLakehouseRenameMenu(prev => ({ ...prev, editingName: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const newName = lakehouseRenameMenu.editingName.trim();
                              if (newName) setNodeConfigs(prev => ({ ...prev, [child.id]: { ...prev[child.id], tableName: newName } }));
                              setLakehouseRenameMenu(prev => ({ ...prev, editingChildId: null, editingName: '' }));
                            }
                            if (e.key === 'Escape') setLakehouseRenameMenu(prev => ({ ...prev, editingChildId: null }));
                          }}
                          onBlur={() => {
                            const newName = lakehouseRenameMenu.editingName.trim();
                            if (newName) setNodeConfigs(prev => ({ ...prev, [child.id]: { ...prev[child.id], tableName: newName } }));
                            setLakehouseRenameMenu(prev => ({ ...prev, editingChildId: null, editingName: '' }));
                          }}
                          className="flex-1 px-2 py-1 rounded border border-indigo-300 text-sm outline-none focus:border-indigo-500"
                          autoFocus />
                      ) : (
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-slate-700">{cfg?.tableName || 'Table'}</span>
                            {rowCount > 0 && <span className="text-[10px] text-slate-400 ml-2">{colCount}×{rowCount}</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setLakehouseRenameMenu(prev => ({ ...prev, editingChildId: child.id, editingName: cfg?.tableName || '' }))}
                              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium px-2 py-0.5 rounded hover:bg-indigo-50">
                              ✏️ Renommer
                            </button>
                            <button onClick={() => {
                              setNodes(prev => prev.filter(n => n.id !== child.id));
                              setConnections(prev => prev.filter(c => c.from !== child.id && c.to !== child.id));
                              setNodeConfigs(prev => { const next = { ...prev }; delete next[child.id]; return next; });
                            }}
                              className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-0.5 rounded hover:bg-red-50">
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {children.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Aucune table dans ce lakehouse</p>}
              </div>
              <button onClick={() => setLakehouseRenameMenu(null)} className="mt-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 w-full hover:bg-slate-50">Fermer</button>
            </div>
          </div>
        );
      })()}

      {/* Save to BI Dojo dialog */}
      {biSaveDialog && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setBiSaveDialog(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Exporter vers BI Dojo</h3>
            <p className="text-[10px] text-slate-400 mb-3">{biSaveDialog.data.length} lignes · {biSaveDialog.data.length > 0 ? Object.keys(biSaveDialog.data[0]).length : 0} colonnes</p>
            <input type="text" value={biSaveDialog.name}
              onChange={e => setBiSaveDialog(prev => ({ ...prev, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter' && biSaveDialog.name.trim()) {
                const saved = JSON.parse(localStorage.getItem('biDojo_pipelineTables') || '[]');
                const entry = { name: biSaveDialog.name.trim(), columns: Object.keys(biSaveDialog.data[0] || {}), rows: biSaveDialog.data, date: new Date().toISOString() };
                const updated = [...saved.filter(t => t.name !== entry.name), entry];
                localStorage.setItem('biDojo_pipelineTables', JSON.stringify(updated));
                setBiSaveDialog(null);
              }}}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-4 focus:border-emerald-400 focus:outline-none"
              autoFocus placeholder="Nom de la table" />
            <div className="flex gap-2">
              <button onClick={() => setBiSaveDialog(null)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={() => {
                if (!biSaveDialog.name.trim()) return;
                const saved = JSON.parse(localStorage.getItem('biDojo_pipelineTables') || '[]');
                const entry = { name: biSaveDialog.name.trim(), columns: Object.keys(biSaveDialog.data[0] || {}), rows: biSaveDialog.data, date: new Date().toISOString() };
                const updated = [...saved.filter(t => t.name !== entry.name), entry];
                localStorage.setItem('biDojo_pipelineTables', JSON.stringify(updated));
                setBiSaveDialog(null);
              }} disabled={!biSaveDialog.name.trim()}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold ${biSaveDialog.name.trim() ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
