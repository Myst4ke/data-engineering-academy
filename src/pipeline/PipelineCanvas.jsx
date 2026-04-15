import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  const isStorage = typeDef.category === 'storage';
  const isTable = node.type === 'table_output';
  const showPreview = !isSource && !isStorage;
  const bgColor = isTable ? '#F0FDF4' : 'white';
  return (
    <g>
      {/* Node body */}
      <foreignObject x={node.x} y={node.y} width={NODE_W} height={NODE_H}>
        <div
          onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, node.id); }}
          onMouseUp={(e) => { e.stopPropagation(); onNodeMouseUp(node.id); }}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node.id); }}
          className={`w-full h-full rounded-xl border-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none ${
            isSelected ? 'shadow-lg ring-2 ring-indigo-400' : 'shadow-md hover:shadow-lg'
          }`}
          style={{ background: bgColor, borderColor: typeDef.color, borderLeftWidth: '4px', overflow: 'visible' }}
        >
          {!isTable && <span className="text-lg leading-none">{typeDef.icon}</span>}
          {isTable && <span className="text-[10px] font-bold text-emerald-700">📋 {label || 'Table'}</span>}
          {!isTable && <span className="text-[10px] font-bold text-slate-700 mt-0.5">{typeDef.name}</span>}
          {!isTable && label === '__foreach_emojis__' && (() => {
            const steps = node._foreachSteps || [];
            return steps.length > 0 ? (
              <div className="flex items-center gap-0.5 mt-0.5">
                {steps.map((s, i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    {i > 0 && <span className="text-[8px] text-slate-300">→</span>}
                    <span className="text-sm">{NODE_TYPES[s.nodeType]?.icon}</span>
                  </span>
                ))}
              </div>
            ) : null;
          })()}
          {!isTable && label && label !== '__foreach_emojis__' && <span className="text-[8px] text-indigo-500 font-medium">{label}</span>}
          {!isTable && !label && (isSource || isStorage) && <span className="text-[8px] text-amber-500 font-medium">Clic droit: configurer</span>}
          {!isTable && !label && !isSource && !isStorage && <span className="text-[8px] text-slate-400 font-medium">Clic droit: configurer</span>}
          {isTable && outputRowCount > 0 && (() => {
            const colCount = outputData && outputData.length > 0 ? Object.keys(outputData[0]).length : 0;
            return <span className="text-[8px] text-slate-400">{colCount} col × {outputRowCount} lignes</span>;
          })()}
        </div>
      </foreignObject>

      {/* Dimensions badge - rendered in SVG outside foreignObject to avoid clipping */}
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

      {/* Preview button - rendered in SVG, not selectable */}
      {showPreview && (
        <g
          className="cursor-pointer"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          onClick={(e) => { e.stopPropagation(); onPreview(node.id); }}
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        >
          <circle cx={node.x + NODE_W - 10} cy={node.y + NODE_H + 2} r={10} fill="white" stroke="#CBD5E1" strokeWidth={1.5} />
          <text x={node.x + NODE_W - 10} y={node.y + NODE_H + 6} textAnchor="middle" fontSize="10" style={{ pointerEvents: 'none' }}>🔍</text>
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

function NodePalette({ onAddNode }) {
  return (
    <div className="w-48 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Activités</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="p-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1 px-1 sticky top-0 bg-white">{cat.icon} {cat.name}</p>
            {Object.entries(NODE_TYPES).filter(([, d]) => d.category === cat.id).map(([typeId, def]) => (
              <button key={typeId} onClick={() => onAddNode(typeId)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs hover:bg-slate-50 transition-colors mb-0.5 group">
                <span className="text-base shrink-0">{def.icon}</span>
                <span className="font-medium text-slate-700 group-hover:text-indigo-600 truncate">{def.name}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PipelineCanvas({ onBack }) {
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

  // Multi-selection
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [selectedConns, setSelectedConns] = useState(new Set());
  const [selectionRect, setSelectionRect] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Node configs: { [nodeId]: { tableId, tableName, data, params } }
  const [nodeConfigs, setNodeConfigs] = useState({});

  // Popups
  const [explorerForNode, setExplorerForNode] = useState(null);
  const [previewNodeId, setPreviewNodeId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [configNodeId, setConfigNodeId] = useState(null);
  const [mappingNodeId, setMappingNodeId] = useState(null);
  const [lakehouseNodeId, setLakehouseNodeId] = useState(null);
  const [forEachNodeId, setForEachNodeId] = useState(null);
  const [lookupNodeId, setLookupNodeId] = useState(null);
  const [forEachRowNodeId, setForEachRowNodeId] = useState(null);
  const [aggregateNodeId, setAggregateNodeId] = useState(null);
  const [windowNodeId, setWindowNodeId] = useState(null);
  const [sampleNodeId, setSampleNodeId] = useState(null);
  const [logNodeId, setLogNodeId] = useState(null);
  const [ifNodeId, setIfNodeId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [lakehouseTables, setLakehouseTables] = useState([]); // tables available in the lakehouse for the explorer

  const canvasRef = useRef(null);
  const nextId = useRef(1);

  const clearSelection = () => { setSelectedNodes(new Set()); setSelectedConns(new Set()); };

  const getCanvasCoords = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom };
  }, [pan, zoom]);

  const handleAddNode = useCallback((typeId) => {
    const id = `node-${nextId.current++}`;
    const rect = canvasRef.current?.getBoundingClientRect();
    const cx = rect ? (rect.width / 2 - pan.x - NODE_W / 2) : 300;
    const cy = rect ? (rect.height / 2 - pan.y - NODE_H / 2) : 200;
    const offset = (nextId.current - 1) * 20;
    setNodes(prev => [...prev, { id, type: typeId, x: cx + offset, y: cy + offset }]);
    setSelectedNodes(new Set([id]));
    setSelectedConns(new Set());
    // Auto-open explorer for source nodes
    const typeDef = NODE_TYPES[typeId];
    if (typeDef?.category === 'source') {
      setExplorerForNode(id);
    }
  }, [pan]);

  // Try to connect to a node's first free input port
  const tryConnect = useCallback((sourceId, targetId) => {
    if (sourceId === targetId) return false;
    const targetNode = nodes.find(n => n.id === targetId);
    const targetType = targetNode && NODE_TYPES[targetNode.type];
    if (!targetType || targetType.inputs === 0) return false;
    // No duplicate connection from same source to same target
    const dup = connections.some(c => c.from === sourceId && c.to === targetId);
    if (dup) return false;
    // Find a free input port, or use port 0 if multiInput
    for (let i = 0; i < targetType.inputs; i++) {
      const taken = connections.some(c => c.to === targetId && c.toPort === i);
      if (!taken || targetType.multiInput) {
        setConnections(prev => [...prev, { from: sourceId, to: targetId, toPort: i }]);
        return true;
      }
    }
    return false;
  }, [nodes, connections]);

  // Delete all selected
  const handleDelete = useCallback(() => {
    if (selectedNodes.size > 0) {
      // Find all table_output children connected from deleted nodes (cascade delete)
      const toDelete = new Set(selectedNodes);
      connections.forEach(c => {
        if (toDelete.has(c.from)) {
          const targetNode = nodes.find(n => n.id === c.to);
          if (targetNode?.type === 'table_output') {
            toDelete.add(c.to);
          }
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
  }, [selectedNodes, selectedConns, connections, nodes]);

  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
      if (e.key === 'Delete' || e.key === 'Backspace') handleDelete();
      if (e.key === 'Escape') { setConnectingFrom(null); clearSelection(); setSelectionRect(null); setIsSelecting(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDelete]);

  // Compute selection rect in normalized form
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
      setContextMenu(null); // close context menu
      const coords = getCanvasCoords(e);
      setIsSelecting(true);
      setSelectionRect({ startX: coords.x, startY: coords.y, currentX: coords.x, currentY: coords.y });
      clearSelection();
    }
    if (e.button === 0 && connectingFrom) {
      setConnectingFrom(null);
    }
  };

  const handleCanvasMouseMove = (e) => {
    const coords = getCanvasCoords(e);
    setMousePos(coords);

    if (isPanning && panStart) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    // Check pending drag threshold
    const pd = pendingDragRef.current;
    if (pd && !pd.activated) {
      const dx = Math.abs(e.clientX - pd.startX);
      const dy = Math.abs(e.clientY - pd.startY);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        pd.activated = true;
        // Now actually start dragging
        setDragging(pd.nodeId);
        setDragStart({ x: pd.startX, y: pd.startY, nodeX: pd.nodeX, nodeY: pd.nodeY, origPositions: pd.origPositions });
        // Select this node if not already selected
        if (!selectedNodes.has(pd.nodeId)) {
          setSelectedNodes(new Set([pd.nodeId]));
          setSelectedConns(new Set());
        }
      }
      return;
    }

    if (dragging && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      if (selectedNodes.has(dragging)) {
        setNodes(prev => prev.map(n =>
          selectedNodes.has(n.id)
            ? { ...n, x: (dragStart.origPositions?.[n.id]?.x ?? n.x) + dx, y: (dragStart.origPositions?.[n.id]?.y ?? n.y) + dy }
            : n
        ));
      } else {
        setNodes(prev => prev.map(n =>
          n.id === dragging ? { ...n, x: dragStart.nodeX + dx, y: dragStart.nodeY + dy } : n
        ));
      }
      return;
    }
    if (isSelecting && selectionRect) {
      setSelectionRect(prev => ({ ...prev, currentX: coords.x, currentY: coords.y }));
    }
  };

  const handleCanvasMouseUp = () => {
    // If pending drag was never activated → was a click on canvas or nothing
    if (pendingDragRef.current && !pendingDragRef.current.activated) {
      // Click on node but released on canvas → select the node
      const nodeId = pendingDragRef.current.nodeId;
      setSelectedNodes(new Set([nodeId]));
      setSelectedConns(new Set());
    }
    pendingDragRef.current = null;

    if (connectingFrom && !isPanning && !dragging && !isSelecting) {
      setConnectingFrom(null);
    }
    if (isSelecting && selectionRect) {
      // Compute what's in the selection rectangle
      const r = getNormalizedRect();
      if (r && Math.abs(r.x2 - r.x1) > 5 && Math.abs(r.y2 - r.y1) > 5) {
        const selNodes = new Set();
        const selConns = new Set();
        nodes.forEach(n => {
          if (rectIntersects(r, n.x, n.y, NODE_W, NODE_H)) selNodes.add(n.id);
        });
        connections.forEach((c, i) => {
          const fromN = nodes.find(n => n.id === c.from);
          const toN = nodes.find(n => n.id === c.to);
          if (fromN && toN) {
            const fp = getOutputPortPos(fromN);
            const tp = getInputPortPos(toN, c.toPort || 0);
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

  // pendingDrag: mouseDown recorded but drag not yet started (waiting for threshold)
  const pendingDragRef = useRef(null);
  const DRAG_THRESHOLD = 4;

  const handleNodeMouseDown = (e, nodeId) => {
    if (e.button !== 0) return;
    setIsSelecting(false);
    setSelectionRect(null);
    setContextMenu(null);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const origPositions = {};
    nodes.forEach(n => { origPositions[n.id] = { x: n.x, y: n.y }; });

    // Don't start dragging yet — wait for threshold
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

  // Drop connection on node body → auto-connect to first free input
  // Also always clear drag/pending state
  const handleNodeMouseUp = (nodeId) => {
    if (connectingFrom && connectingFrom !== nodeId) {
      tryConnect(connectingFrom, nodeId);
      setConnectingFrom(null);
    }

    // If pending drag was never activated → it was a click → select this node
    if (pendingDragRef.current && !pendingDragRef.current.activated) {
      setSelectedNodes(new Set([nodeId]));
      setSelectedConns(new Set());
    }

    pendingDragRef.current = null;
    setDragging(null);
    setDragStart(null);
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

  const handleConnectionClick = (index) => {
    setSelectedConns(new Set([index]));
    setSelectedNodes(new Set());
  };

  const handleClear = () => {
    setNodes([]); setConnections([]); clearSelection(); setConnectingFrom(null); setNodeConfigs({});
  };

  // ── Pipeline execution engine (real-time) ──
  const nodeOutputs = useMemo(() => {
    const outputs = {}; // { nodeId: data[] }

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
    // Add any remaining (disconnected nodes)
    nodes.forEach(n => { if (!visited.has(n.id)) order.push(n.id); });

    // Execute in order
    for (const nodeId of order) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;
      const typeDef = NODE_TYPES[node.type];
      if (!typeDef) continue;
      const config = nodeConfigs[nodeId];

      if (typeDef.category === 'source') {
        outputs[nodeId] = config?.data || [];
      } else if (node.type === 'table_output') {
        // Table node: use configured data if available (from source explorer),
        // otherwise get from lakehouse via sourceInputNodeId
        if (config?.data) {
          outputs[nodeId] = config.data;
        } else if (config?.sourceInputNodeId) {
          outputs[nodeId] = outputs[config.sourceInputNodeId] || [];
        } else {
          outputs[nodeId] = [];
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
        // Lookup: split main table into match/no match based on reference
        const incoming = connections.filter(c => c.to === nodeId);
        const mainData = incoming.length > 0 ? (outputs[incoming[0].from] || []) : [];
        const refData = incoming.length > 1 ? (outputs[incoming[1].from] || []) : [];
        const col = config?.params?.column;

        if (col && refData.length > 0) {
          const refValues = new Set(refData.map(r => String(r[col] ?? '').trim()));
          const match = mainData.filter(r => refValues.has(String(r[col] ?? '').trim()));
          const noMatch = mainData.filter(r => !refValues.has(String(r[col] ?? '').trim()));
          outputs[nodeId] = [...match, ...noMatch];
          // Store match/no match directly accessible by table_output nodes
          outputs[`${nodeId}_match`] = match;
          outputs[`${nodeId}_nomatch`] = noMatch;
          if (!outputs._lakehouseTables) outputs._lakehouseTables = {};
          outputs._lakehouseTables[nodeId] = [
            { id: `${nodeId}_match`, name: 'Match', data: match },
            { id: `${nodeId}_nomatch`, name: 'No Match', data: noMatch },
          ];
        } else {
          outputs[nodeId] = mainData;
        }
      } else if (node.type === 'aggregate') {
        // Aggregate: GROUP BY + agg functions
        const incoming = connections.filter(c => c.to === nodeId);
        const upstream = incoming.length > 0 ? (outputs[incoming[0].from] || []) : [];
        const groupBy = config?.params?.groupBy || [];
        const aggs = config?.params?.aggs || [];

        if (aggs.length > 0) {
          const groups = new Map();
          upstream.forEach(row => {
            const key = groupBy.map(c => row[c] ?? '').join('|||');
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(row);
          });

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
        } else {
          outputs[nodeId] = upstream;
        }
      } else if (node.type === 'window_func') {
        // Window function
        const incoming = connections.filter(c => c.to === nodeId);
        const upstream = incoming.length > 0 ? (outputs[incoming[0].from] || []) : [];
        const p = config?.params;

        if (p?.func && p?.orderBy) {
          const sorted = [...upstream].sort((a, b) => {
            const va = parseFloat(a[p.orderBy]) || 0, vb = parseFloat(b[p.orderBy]) || 0;
            return p.orderDir === 'desc' ? vb - va : va - vb;
          });

          // Partition
          const partitions = new Map();
          sorted.forEach(row => {
            const key = p.partitionBy ? String(row[p.partitionBy] ?? '') : '__all__';
            if (!partitions.has(key)) partitions.set(key, []);
            partitions.get(key).push(row);
          });

          const result = [];
          partitions.forEach(rows => {
            let cumSum = 0, cumCount = 0;
            rows.forEach((row, i) => {
              const newRow = { ...row };
              const val = parseFloat(row[p.valueCol]) || 0;
              cumSum += val; cumCount++;
              switch (p.func) {
                case 'row_number': newRow[p.alias] = String(i + 1); break;
                case 'rank': {
                  const prevVal = i > 0 ? (parseFloat(rows[i - 1][p.orderBy]) || 0) : null;
                  const curVal = parseFloat(row[p.orderBy]) || 0;
                  newRow[p.alias] = (i === 0 || curVal !== prevVal) ? String(i + 1) : rows[i - 1][p.alias] || String(i + 1);
                  break;
                }
                case 'dense_rank': {
                  if (i === 0) { newRow[p.alias] = '1'; }
                  else {
                    const prev = parseFloat(rows[i - 1][p.orderBy]) || 0;
                    const cur = parseFloat(row[p.orderBy]) || 0;
                    newRow[p.alias] = cur === prev ? (rows[i - 1][p.alias] || '1') : String(parseInt(rows[i - 1][p.alias] || '0') + 1);
                  }
                  break;
                }
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
        } else {
          outputs[nodeId] = upstream;
        }
      } else if (node.type === 'sample') {
        // Sample
        const incoming = connections.filter(c => c.to === nodeId);
        const upstream = incoming.length > 0 ? (outputs[incoming[0].from] || []) : [];
        const p = config?.params;

        if (p?.mode) {
          const n = p.value || 10;
          switch (p.mode) {
            case 'top_n': outputs[nodeId] = upstream.slice(0, n); break;
            case 'last_n': outputs[nodeId] = upstream.slice(-n); break;
            case 'every_nth': outputs[nodeId] = upstream.filter((_, i) => i % n === 0); break;
            case 'percentage': {
              const count = Math.max(1, Math.round(upstream.length * n / 100));
              const shuffled = [...upstream].sort(() => Math.random() - 0.5);
              outputs[nodeId] = shuffled.slice(0, count);
              break;
            }
            default: outputs[nodeId] = upstream;
          }
        } else {
          outputs[nodeId] = upstream;
        }
      } else if (node.type === 'log') {
        // Log: pass-through data but generate a log entry
        const incoming = connections.filter(c => c.to === nodeId);
        const allData = incoming.map(c => outputs[c.from] || []);
        const merged = allData.flat();
        outputs[nodeId] = merged;
        // Log entry will be generated after execution
      } else if (node.type === 'foreach_row') {
        // ForEachRow: add computed columns to each row
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
                    let result = false;
                    switch (a.operator) {
                      case '=': result = val === cmp; break;
                      case '!=': result = val !== cmp; break;
                      case '>': result = parseFloat(val) > parseFloat(cmp); break;
                      case '<': result = parseFloat(val) < parseFloat(cmp); break;
                      case '>=': result = parseFloat(val) >= parseFloat(cmp); break;
                      case '<=': result = parseFloat(val) <= parseFloat(cmp); break;
                      case 'contient': result = val.toLowerCase().includes(cmp.toLowerCase()); break;
                    }
                    newRow[cc.name] = result ? (a.then || 'true') : (a.else || 'false');
                    break;
                  }
                  default: newRow[cc.name] = '';
                }
              } catch { newRow[cc.name] = ''; }
            }
            return newRow;
          });
        } else {
          outputs[nodeId] = upstream;
        }
      } else if (node.type === 'foreach') {
        // ForEach: apply transformation chain to each input table
        const incoming = connections.filter(c => c.to === nodeId);
        const forEachSteps = config?.params?.steps || [];
        if (!outputs._lakehouseTables) outputs._lakehouseTables = {};
        const results = [];
        const tableEntries = [];

        incoming.forEach(c => {
          let data = outputs[c.from] || [];
          const srcNode = nodes.find(n => n.id === c.from);
          const srcCfg = nodeConfigs[c.from];
          const tableName = srcCfg?.tableName || srcNode?.type || 'table';

          // Apply each step
          for (const step of forEachSteps) {
            try {
              const transformType = {
                filter: 'filter', sort: 'sort', select_cols: 'select', delete_col: 'delete',
                rename_col: 'rename', deduplicate: 'drop_duplicates', clean_na: 'delete_na', fill_na: 'fill_na',
              }[step.nodeType] || step.nodeType;

              if (step.nodeType === 'mapping' && step.params?.mappings) {
                data = data.map(row => {
                  const newRow = {};
                  step.params.mappings.forEach(m => {
                    let val = row[m.source];
                    if (m.targetType === 'integer') val = String(parseInt(val) || 0);
                    else if (m.targetType === 'float') val = String(parseFloat(val) || 0);
                    else val = String(val ?? '');
                    newRow[m.target] = val;
                  });
                  return newRow;
                });
              } else if (step.params) {
                data = applyTransformation(data, { type: transformType, params: step.params });
              } else if (['clean_na', 'deduplicate'].includes(step.nodeType)) {
                data = applyTransformation(data, { type: transformType, params: {} });
              }
            } catch { /* skip failed step */ }
          }

          results.push(...data);
          tableEntries.push({ id: c.from, name: tableName, data });
        });

        outputs[nodeId] = results;
        // Store each transformed table accessible by sourceInputNodeId
        tableEntries.forEach(t => { outputs[`${nodeId}_${t.id}`] = t.data; });
        outputs._lakehouseTables[nodeId] = tableEntries;
      } else if (typeDef.category === 'storage') {
        // Lakehouse: store all incoming tables, output merged for pass-through
        const incoming = connections.filter(c => c.to === nodeId);
        const allData = incoming.map(c => outputs[c.from] || []);
        // Store individual tables indexed by source node id (for the picker)
        outputs[nodeId] = allData.flat(); // merged output for badge display
        // Store individual tables in a special property
        if (!outputs._lakehouseTables) outputs._lakehouseTables = {};
        outputs._lakehouseTables[nodeId] = incoming.map(c => ({
          id: c.from,
          name: (() => {
            const srcNode = nodes.find(n => n.id === c.from);
            const srcCfg = nodeConfigs[c.from];
            return srcCfg?.tableName || srcNode?.type || 'table';
          })(),
          data: outputs[c.from] || [],
        }));
      } else {
        // Get input data from connected upstream nodes
        const incoming = connections.filter(c => c.to === nodeId);
        if (incoming.length === 0) {
          outputs[nodeId] = [];
        } else if (incoming.length === 1) {
          const upstream = outputs[incoming[0].from] || [];
          // Apply transformation if configured
          try {
            if (node.type === 'mapping' && config?.params?.mappings) {
              // Mapping: rename columns + type casting
              outputs[nodeId] = upstream.map(row => {
                const newRow = {};
                config.params.mappings.forEach(m => {
                  let val = row[m.source];
                  // Type casting
                  if (m.targetType === 'integer') val = String(parseInt(val) || 0);
                  else if (m.targetType === 'float') val = String(parseFloat(val) || 0);
                  else if (m.targetType === 'boolean') val = (val === 'true' || val === '1') ? 'true' : 'false';
                  else val = String(val ?? '');
                  newRow[m.target] = val;
                });
                return newRow;
              });
            } else if (config?.params) {
              outputs[nodeId] = applyTransformation(upstream, { type: mapNodeTypeToTransform(node.type), params: config.params });
            } else {
              outputs[nodeId] = upstream;
            }
          } catch {
            outputs[nodeId] = upstream;
          }
        } else {
          // Multiple inputs (join, concat, destinations)
          const tables = incoming.map(c => outputs[c.from] || []);
          if (node.type === 'join' && config?.params) {
            try {
              outputs[nodeId] = applyTransformation(tables[0], { type: 'join', params: config.params }, tables[1]);
            } catch { outputs[nodeId] = tables[0]; }
          } else if (node.type === 'concat') {
            outputs[nodeId] = tables.flat();
          } else {
            // Destinations: merge all inputs
            outputs[nodeId] = tables.flat();
          }
        }
      }
    }

    return outputs;
  }, [nodes, connections, nodeConfigs]);

  // Generate logs from log nodes
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

  // Context menu handlers
  const handleNodeContextMenu = (e, nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const typeDef = NODE_TYPES[node.type];
    if (typeDef?.category === 'source') {
      setExplorerForNode(nodeId);
    } else if (typeDef?.category === 'storage') {
      // Build table list from incoming connections for the explorer
      const lhTables = (nodeOutputs._lakehouseTables?.[nodeId] || []).map(t => ({
        id: `lh-${nodeId}-${t.id}`,
        dbId: nodeId,
        dbName: typeDef.name,
        dbIcon: typeDef.icon,
        tableId: t.id,
        tableName: t.name,
        columns: t.data.length > 0 ? Object.keys(t.data[0]) : [],
        rowCount: t.data.length,
        rows: t.data,
        _sourceInputNodeId: t.id, // track the upstream node for table_output config
      }));
      setLakehouseTables(lhTables);
      setLakehouseNodeId(nodeId);
    } else if (node.type === 'foreach') {
      setForEachNodeId(nodeId);
    } else if (node.type === 'if_condition') {
      setIfNodeId(nodeId);
    } else if (node.type === 'lookup') {
      setLookupNodeId(nodeId);
    } else if (node.type === 'foreach_row') {
      setForEachRowNodeId(nodeId);
    } else if (node.type === 'aggregate') {
      setAggregateNodeId(nodeId);
    } else if (node.type === 'window_func') {
      setWindowNodeId(nodeId);
    } else if (node.type === 'sample') {
      setSampleNodeId(nodeId);
    } else if (node.type === 'log') {
      setLogNodeId(nodeId);
    } else if (node.type === 'mapping') {
      setMappingNodeId(nodeId);
    } else if (typeDef?.category === 'transform') {
      setConfigNodeId(nodeId);
    } else {
      handlePreview(nodeId);
    }
  };

  const handleTransformConfig = (params) => {
    if (!configNodeId) return;
    setNodeConfigs(prev => ({ ...prev, [configNodeId]: { ...prev[configNodeId], params } }));
    setConfigNodeId(null);
  };

  const handleForEachConfig = (params) => {
    if (!forEachNodeId) return;
    setNodeConfigs(prev => ({ ...prev, [forEachNodeId]: { ...prev[forEachNodeId], params } }));

    // Auto-create table_output nodes for each input table (like sources)
    const feNode = nodes.find(n => n.id === forEachNodeId);
    if (!feNode) { setForEachNodeId(null); return; }

    const incoming = connections.filter(c => c.to === forEachNodeId);
    // Check which outputs already exist
    const existingOutputNodeIds = connections.filter(c => c.from === forEachNodeId).map(c => c.to);
    const existingSourceIds = new Set(existingOutputNodeIds.map(id => nodeConfigs[id]?.sourceInputNodeId).filter(Boolean));

    const newInputs = incoming.filter(c => !existingSourceIds.has(c.from));
    if (newInputs.length > 0) {
      const existingChildNodes = nodes.filter(n => existingOutputNodeIds.includes(n.id));
      const maxY = existingChildNodes.length > 0
        ? Math.max(...existingChildNodes.map(n => n.y)) + 100
        : feNode.y - ((newInputs.length - 1) * 100) / 2;

      const newNodes = [];
      const newConns = [];
      const newCfgs = {};

      newInputs.forEach((c, i) => {
        const id = `node-${nextId.current++}`;
        const srcCfg = nodeConfigs[c.from];
        const srcNode = nodes.find(n => n.id === c.from);
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
        const newNodes = [];
        const newConns = [];
        const newCfgs = {};
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

    // Auto-create Match and No Match table_output nodes
    const lkNode = nodes.find(n => n.id === lookupNodeId);
    if (lkNode) {
      const existingOutputs = connections.filter(c => c.from === lookupNodeId).map(c => c.to);
      if (existingOutputs.length === 0) {
        const newNodes = [];
        const newConns = [];
        const newCfgs = {};
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

  // Lakehouse: get tables already exposed as outputs
  const getLakehouseExposedIds = useCallback((lhNodeId) => {
    const childIds = connections.filter(c => c.from === lhNodeId).map(c => c.to);
    const ids = new Set();
    childIds.forEach(cid => {
      const cfg = nodeConfigs[cid];
      if (cfg?.sourceInputNodeId) ids.add(cfg.sourceInputNodeId);
    });
    return ids;
  }, [connections, nodeConfigs]);

  const handleLakehouseSelect = (tables) => {
    if (!lakehouseNodeId) return;
    const lhNode = nodes.find(n => n.id === lakehouseNodeId);
    if (!lhNode) { setLakehouseNodeId(null); setLakehouseTables([]); return; }

    const alreadyExposed = getLakehouseExposedIds(lakehouseNodeId);
    const newTables = tables.filter(t => !alreadyExposed.has(t.id));
    if (newTables.length === 0) { setLakehouseNodeId(null); setLakehouseTables([]); return; }

    const existingChildIds = connections.filter(c => c.from === lakehouseNodeId).map(c => c.to);
    const existingChildNodes = nodes.filter(n => existingChildIds.includes(n.id));
    const maxY = existingChildNodes.length > 0
      ? Math.max(...existingChildNodes.map(n => n.y)) + 100
      : lhNode.y;

    const newNodes = [];
    const newConns = [];
    const newConfigs = {};

    newTables.forEach((table, i) => {
      const id = `node-${nextId.current++}`;
      newNodes.push({ id, type: 'table_output', x: lhNode.x + 260, y: maxY + i * 100 });
      newConns.push({ from: lakehouseNodeId, to: id, toPort: 0 });
      newConfigs[id] = { tableName: table.tableName, sourceInputNodeId: table._sourceInputNodeId || table.tableId };
    });

    setNodes(prev => [...prev, ...newNodes]);
    setConnections(prev => [...prev, ...newConns]);
    setNodeConfigs(prev => ({ ...prev, ...newConfigs }));
    setLakehouseNodeId(null);
    setLakehouseTables([]);
  };

  // Get table IDs already loaded for a source node
  const getLoadedTableIds = useCallback((sourceNodeId) => {
    const childIds = connections.filter(c => c.from === sourceNodeId).map(c => c.to);
    const ids = new Set();
    childIds.forEach(cid => {
      const cfg = nodeConfigs[cid];
      if (cfg?.tableId) ids.add(cfg.tableId);
    });
    return ids;
  }, [connections, nodeConfigs]);

  // Called with an array of tables from the explorer
  const handleTableSelect = (tables) => {
    if (!explorerForNode) return;
    const sourceNode = nodes.find(n => n.id === explorerForNode);
    if (!sourceNode) { setExplorerForNode(null); return; }

    // Only add tables that aren't already loaded
    const alreadyLoaded = getLoadedTableIds(explorerForNode);
    const newTables = tables.filter(t => !alreadyLoaded.has(t.id));
    if (newTables.length === 0) { setExplorerForNode(null); return; }

    // Find existing table nodes to position new ones below
    const existingChildIds = connections.filter(c => c.from === explorerForNode).map(c => c.to);
    const existingChildNodes = nodes.filter(n => existingChildIds.includes(n.id));
    const maxY = existingChildNodes.length > 0
      ? Math.max(...existingChildNodes.map(n => n.y)) + 100
      : sourceNode.y - ((newTables.length - 1) * 100) / 2;

    const newNodes = [];
    const newConnections = [];
    const newConfigs = {};
    const OFFSET_X = 260;

    newTables.forEach((table, i) => {
      const id = `node-${nextId.current++}`;
      newNodes.push({
        id,
        type: 'table_output',
        x: sourceNode.x + OFFSET_X,
        y: (existingChildNodes.length > 0 ? maxY + i * 100 : maxY + i * 100),
      });
      newConnections.push({ from: explorerForNode, to: id, toPort: 0 });
      newConfigs[id] = {
        tableId: table.id,
        tableName: table.tableName,
        data: [...table.rows],
      };
    });

    setNodes(prev => [...prev, ...newNodes]);
    setConnections(prev => [...prev, ...newConnections]);
    setNodeConfigs(prev => ({ ...prev, ...newConfigs }));
    setExplorerForNode(null);
  };

  const handlePreview = (nodeId) => {
    setPreviewNodeId(nodeId);
  };

  // Auto-layout: topological layering (BFS from roots)
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;

    // Build adjacency: who feeds into whom
    const inDegree = {};
    const children = {};
    nodes.forEach(n => { inDegree[n.id] = 0; children[n.id] = []; });
    connections.forEach(c => {
      inDegree[c.to] = (inDegree[c.to] || 0) + 1;
      if (children[c.from]) children[c.from].push(c.to);
    });

    // BFS layering
    const layers = [];
    const assigned = new Set();
    let queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    if (queue.length === 0) queue = [nodes[0].id]; // cycle fallback

    while (queue.length > 0) {
      layers.push([...queue]);
      queue.forEach(id => assigned.add(id));
      const next = [];
      queue.forEach(id => {
        (children[id] || []).forEach(childId => {
          if (!assigned.has(childId) && !next.includes(childId)) {
            // Check all parents are assigned
            const allParentsAssigned = connections
              .filter(c => c.to === childId)
              .every(c => assigned.has(c.from));
            if (allParentsAssigned) next.push(childId);
          }
        });
      });
      // Add any remaining unassigned nodes if we're stuck
      if (next.length === 0) {
        const remaining = nodes.filter(n => !assigned.has(n.id));
        if (remaining.length > 0) next.push(remaining[0].id);
      }
      queue = next;
      if (layers.length > nodes.length) break; // safety
    }

    // Place nodes: each layer is a column, nodes spaced vertically
    const GAP_X = 240;
    const GAP_Y = 120;
    const newPositions = {};

    layers.forEach((layer, colIdx) => {
      const totalHeight = (layer.length - 1) * GAP_Y;
      layer.forEach((nodeId, rowIdx) => {
        newPositions[nodeId] = {
          x: colIdx * GAP_X,
          y: rowIdx * GAP_Y - totalHeight / 2,
        };
      });
    });

    // Center in viewport
    const rect = canvasRef.current?.getBoundingClientRect();
    const vw = rect ? rect.width : 800;
    const vh = rect ? rect.height : 600;
    const allX = Object.values(newPositions).map(p => p.x);
    const allY = Object.values(newPositions).map(p => p.y);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX) + NODE_W;
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY) + NODE_H;
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const offsetX = (vw - contentW) / 2 - minX;
    const offsetY = (vh - contentH) / 2 - minY;

    setNodes(prev => prev.map(n => {
      const pos = newPositions[n.id];
      return pos ? { ...n, x: pos.x, y: pos.y } : n;
    }));
    setPan({ x: offsetX, y: offsetY });
  }, [nodes, connections]);

  const totalSelected = selectedNodes.size + selectedConns.size;
  const cursorStyle = isPanning ? 'grabbing' : connectingFrom ? 'crosshair' : isSelecting ? 'crosshair' : 'default';

  // Normalized selection rect for rendering
  const selRect = getNormalizedRect();

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <div className="flex-none flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="game-btn px-3 py-1.5 text-sm font-semibold">← Accueil</button>
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Pipeline Dojo</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {nodes.length} noeud{nodes.length !== 1 ? 's' : ''} · {connections.length} lien{connections.length !== 1 ? 's' : ''}
          </span>
          {totalSelected > 0 && (
            <button onClick={handleDelete} className="game-btn px-3 py-1 text-xs text-red-500 font-semibold">
              Supprimer ({totalSelected})
            </button>
          )}
          <button onClick={handleClear} className="game-btn px-3 py-1 text-xs text-slate-500 font-semibold">Tout effacer</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <NodePalette onAddNode={handleAddNode} />

        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden"
          style={{ cursor: cursorStyle }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onContextMenu={(e) => e.preventDefault()}
          onWheel={(e) => {
            e.preventDefault();
            const rect = canvasRef.current?.getBoundingClientRect();
            const mx = e.clientX - (rect?.left || 0);
            const my = e.clientY - (rect?.top || 0);
            const delta = e.deltaY > 0 ? -0.08 : 0.08;
            const newZoom = Math.min(2, Math.max(0.2, zoom + delta));
            // Zoom toward cursor
            const scale = newZoom / zoom;
            setPan(p => ({ x: mx - scale * (mx - p.x), y: my - scale * (my - p.y) }));
            setZoom(newZoom);
          }}
        >
          {/* Grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {zoom >= 0.35 && (
              <>
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x % 40} ${pan.y % 40})`}>
                    <circle cx="1" cy="1" r="1" fill="#CBD5E1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </>
            )}
          </svg>

          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1, userSelect: 'none', WebkitUserSelect: 'none' }}>
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {connections.map((conn, i) => {
                const fromNode = nodes.find(n => n.id === conn.from);
                const toNode = nodes.find(n => n.id === conn.to);
                if (!fromNode || !toNode) return null;
                return (
                  <ConnectionLine key={`c-${i}`}
                    from={getOutputPortPos(fromNode)}
                    to={getInputPortPos(toNode, conn.toPort || 0)}
                    isSelected={selectedConns.has(i)}
                    onClick={() => handleConnectionClick(i)}
                  />
                );
              })}

              {connectingFrom && (() => {
                const fn = nodes.find(n => n.id === connectingFrom);
                return fn ? <ConnectionLine from={getOutputPortPos(fn)} to={mousePos} isTemp /> : null;
              })()}

              {nodes.map(node => {
                const typeDef = NODE_TYPES[node.type];
                if (!typeDef) return null;
                const config = nodeConfigs[node.id];
                const output = nodeOutputs[node.id];
                let label = null;
                if (config?.tableName) {
                  label = config.tableName;
                } else if (node.type === 'foreach' && config?.params?.steps?.length > 0) {
                  label = '__foreach_emojis__';
                } else if (node.type === 'foreach_row' && config?.params?.computedCols?.length > 0) {
                  label = config.params.computedCols.map(c => c.name).join(', ');
                } else if (node.type === 'if_condition' && config?.params?.condition) {
                  const cond = config.params.condition;
                  const condLabels = { table_empty: 'vide?', table_not_empty: 'non vide?', row_count_gt: `> ${config.params.value}`, row_count_lt: `< ${config.params.value}`, col_has_nulls: `${config.params.column} vides?`, col_no_nulls: `${config.params.column} complet?`, col_all_unique: `${config.params.column} unique?`, col_contains_value: `${config.params.column} = ${config.params.value}?` };
                  label = condLabels[cond] || cond;
                } else if (node.type === 'lookup' && config?.params?.column) {
                  label = `sur ${config.params.column}`;
                } else if (node.type === 'aggregate' && config?.params?.aggs?.length) {
                  label = config.params.aggs.map(a => `${a.func}(${a.column})`).join(', ').slice(0, 30);
                } else if (node.type === 'window_func' && config?.params?.func) {
                  label = `${config.params.func}(${config.params.alias || ''})`;
                } else if (node.type === 'sample' && config?.params?.mode) {
                  const p = config.params;
                  label = p.mode === 'top_n' ? `Top ${p.value}` : p.mode === 'last_n' ? `Last ${p.value}` : p.mode === 'percentage' ? `${p.value}%` : `1/${p.value}`;
                } else if (node.type === 'log' && config?.params?.level) {
                  label = `${config.params.level.toUpperCase()}`;
                } else if (config?.params) {
                  const p = config.params;
                  if (p.mappings) {
                    const renamed = p.mappings.filter(m => m.source !== m.target);
                    label = renamed.length > 0 ? renamed.map(m => `${m.source}→${m.target}`).join(', ').slice(0, 25) : 'configuré';
                  } else if (p.column && p.value) label = `${p.column} = ${p.value}`;
                  else if (p.column && p.order) label = `${p.column} ${p.order === 'desc' ? '↓' : '↑'}`;
                  else if (p.oldName && p.newName) label = `${p.oldName} → ${p.newName}`;
                  else if (p.column) label = p.column;
                  else if (p.columns) label = p.columns.join(', ');
                  else label = 'configuré';
                }
                // Attach foreach steps to node for rendering
                const renderNode = node.type === 'foreach' && config?.params?.steps
                  ? { ...node, _foreachSteps: config.params.steps } : node;
                return (
                  <PipelineNode key={node.id} node={renderNode} typeDef={typeDef}
                    isSelected={selectedNodes.has(node.id)}
                    onMouseDown={handleNodeMouseDown}
                    onNodeMouseUp={handleNodeMouseUp}
                    onPortMouseDown={handlePortMouseDown}
                    onPortMouseUp={handlePortMouseUp}
                    connectingFrom={connectingFrom}
                    onContextMenu={handleNodeContextMenu}
                    onPreview={handlePreview}
                    outputRowCount={output?.length}
                    outputData={output}
                    label={label}
                  />
                );
              })}

              {/* Selection rectangle */}
              {isSelecting && selRect && (
                <rect
                  x={selRect.x1} y={selRect.y1}
                  width={selRect.x2 - selRect.x1} height={selRect.y2 - selRect.y1}
                  fill="rgba(99, 102, 241, 0.08)"
                  stroke="#6366F1"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                  rx={4}
                />
              )}
            </g>
          </svg>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium">Cliquez sur une activité à gauche pour l'ajouter</p>
                <p className="text-slate-300 text-xs mt-1">Clic droit pour naviguer · Glissez entre les ports pour connecter · Clic gauche pour sélectionner</p>
              </div>
            </div>
          )}

          {/* Log panel */}
          {logs.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-white border border-slate-200 rounded-xl shadow-lg max-w-sm max-h-[120px] overflow-y-auto" style={{ zIndex: 3 }}>
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500">📋 Journal</span>
                <button onClick={() => setLogs([])} className="text-[10px] text-slate-400 hover:text-slate-600">Effacer</button>
              </div>
              {logs.map((log, i) => (
                <div key={i} className="px-3 py-1 border-b border-slate-50 flex items-start gap-2">
                  <span className="text-[10px]">
                    {log.level === 'error' ? '❌' : log.level === 'warn' ? '⚠️' : log.level === 'success' ? '✅' : 'ℹ️'}
                  </span>
                  <span className="text-[10px] text-slate-600 flex-1">{log.message}</span>
                  <span className="text-[9px] text-slate-400">{log.time}</span>
                </div>
              ))}
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-16 right-4 flex flex-col gap-1" style={{ zIndex: 3 }}>
            <button
              onClick={() => { const nz = Math.min(2, zoom + 0.15); const rect = canvasRef.current?.getBoundingClientRect(); const cx = (rect?.width || 0) / 2; const cy = (rect?.height || 0) / 2; const s = nz / zoom; setPan(p => ({ x: cx - s * (cx - p.x), y: cy - s * (cy - p.y) })); setZoom(nz); }}
              className="w-9 h-9 bg-white border border-slate-200 shadow rounded-lg text-sm font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center"
              title="Zoom in"
            >+</button>
            <span className="text-[9px] text-slate-400 text-center font-medium">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => { const nz = Math.max(0.2, zoom - 0.15); const rect = canvasRef.current?.getBoundingClientRect(); const cx = (rect?.width || 0) / 2; const cy = (rect?.height || 0) / 2; const s = nz / zoom; setPan(p => ({ x: cx - s * (cx - p.x), y: cy - s * (cy - p.y) })); setZoom(nz); }}
              className="w-9 h-9 bg-white border border-slate-200 shadow rounded-lg text-sm font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center"
              title="Zoom out"
            >−</button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="w-9 h-9 bg-white border border-slate-200 shadow rounded-lg text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center"
              title="Reset zoom"
            >1:1</button>
          </div>

          {/* Auto-layout button */}
          {nodes.length >= 2 && (
            <button
              onClick={handleAutoLayout}
              className="absolute bottom-4 right-4 bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center gap-1.5"
              style={{ zIndex: 3 }}
              title="Réorganiser automatiquement"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
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
      {explorerForNode && (
        <TableExplorer
          onSelect={handleTableSelect}
          onClose={() => setExplorerForNode(null)}
          initialSelectedIds={getLoadedTableIds(explorerForNode)}
        />
      )}

      {/* Data Preview popup */}
      {previewNodeId && (
        <DataPreview
          data={nodeOutputs[previewNodeId] || []}
          title={(() => {
            const n = nodes.find(nd => nd.id === previewNodeId);
            const t = n ? NODE_TYPES[n.type] : null;
            const cfg = nodeConfigs[previewNodeId];
            return `${t?.icon || ''} ${t?.name || ''} ${cfg?.tableName ? '— ' + cfg.tableName : ''}`;
          })()}
          onClose={() => setPreviewNodeId(null)}
        />
      )}

      {/* Transform configuration popup */}
      {configNodeId && (() => {
        const cfgNode = nodes.find(n => n.id === configNodeId);
        const cfgType = cfgNode ? NODE_TYPES[cfgNode.type] : null;
        const transformType = cfgNode ? mapNodeTypeToTransform(cfgNode.type) : null;
        const existingParams = nodeConfigs[configNodeId]?.params || null;
        // Get columns from upstream data
        const incoming = connections.filter(c => c.to === configNodeId);
        const upstreamData = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : [];
        const columns = upstreamData.length > 0 ? Object.keys(upstreamData[0]) : [];
        if (!cfgType || !transformType) return null;
        return (
          <ParamInputPopup
            cardType={transformType}
            cardName={cfgType.name}
            cardIcon={cfgType.icon}
            columns={columns}
            tableData={upstreamData}
            onConfirm={handleTransformConfig}
            onCancel={() => setConfigNodeId(null)}
            initialParams={existingParams}
          />
        );
      })()}

      {/* If config */}
      {ifNodeId && (() => {
        const incoming = connections.filter(c => c.to === ifNodeId);
        const upstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : [];
        const cols = upstream.length > 0 ? Object.keys(upstream[0]) : [];
        return <IfConfig columns={cols} rowCount={upstream.length} initialParams={nodeConfigs[ifNodeId]?.params}
          onConfirm={handleIfConfig} onCancel={() => setIfNodeId(null)} />;
      })()}

      {/* Lookup config */}
      {lookupNodeId && (() => {
        const incoming = connections.filter(c => c.to === lookupNodeId);
        const mainData = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : [];
        const refData = incoming.length > 1 ? (nodeOutputs[incoming[1].from] || []) : [];
        const mainCols = mainData.length > 0 ? Object.keys(mainData[0]) : [];
        const refCols = refData.length > 0 ? Object.keys(refData[0]) : [];
        return (
          <LookupConfig
            mainColumns={mainCols}
            refColumns={refCols}
            initialParams={nodeConfigs[lookupNodeId]?.params}
            onConfirm={handleLookupConfig}
            onCancel={() => setLookupNodeId(null)}
          />
        );
      })()}

      {/* Aggregate config */}
      {aggregateNodeId && (() => {
        const incoming = connections.filter(c => c.to === aggregateNodeId);
        const upstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : [];
        const cols = upstream.length > 0 ? Object.keys(upstream[0]) : [];
        return <AggregateConfig columns={cols} initialParams={nodeConfigs[aggregateNodeId]?.params}
          onConfirm={handleSimpleConfig(aggregateNodeId, setAggregateNodeId)} onCancel={() => setAggregateNodeId(null)} />;
      })()}

      {/* Window config */}
      {windowNodeId && (() => {
        const incoming = connections.filter(c => c.to === windowNodeId);
        const upstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : [];
        const cols = upstream.length > 0 ? Object.keys(upstream[0]) : [];
        return <WindowConfig columns={cols} initialParams={nodeConfigs[windowNodeId]?.params}
          onConfirm={handleSimpleConfig(windowNodeId, setWindowNodeId)} onCancel={() => setWindowNodeId(null)} />;
      })()}

      {/* Sample config */}
      {sampleNodeId && (() => {
        const incoming = connections.filter(c => c.to === sampleNodeId);
        const upstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : [];
        return <SampleConfig rowCount={upstream.length} initialParams={nodeConfigs[sampleNodeId]?.params}
          onConfirm={handleSimpleConfig(sampleNodeId, setSampleNodeId)} onCancel={() => setSampleNodeId(null)} />;
      })()}

      {/* Log config */}
      {logNodeId && (() => {
        const incoming = connections.filter(c => c.to === logNodeId);
        const upstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : [];
        const cols = upstream.length > 0 ? Object.keys(upstream[0]) : [];
        return <LogConfig columns={cols} initialParams={nodeConfigs[logNodeId]?.params}
          onConfirm={handleSimpleConfig(logNodeId, setLogNodeId)} onCancel={() => setLogNodeId(null)} />;
      })()}

      {/* ForEachRow config */}
      {forEachRowNodeId && (() => {
        const incoming = connections.filter(c => c.to === forEachRowNodeId);
        const upstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : [];
        const cols = upstream.length > 0 ? Object.keys(upstream[0]) : [];
        return (
          <ForEachRowConfig
            columns={cols}
            sampleData={upstream}
            initialParams={nodeConfigs[forEachRowNodeId]?.params}
            onConfirm={handleForEachRowConfig}
            onCancel={() => setForEachRowNodeId(null)}
          />
        );
      })()}

      {/* ForEach config */}
      {forEachNodeId && (() => {
        const incoming = connections.filter(c => c.to === forEachNodeId);
        const firstUpstream = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : [];
        const cols = firstUpstream.length > 0 ? Object.keys(firstUpstream[0]) : [];
        const existingParams = nodeConfigs[forEachNodeId]?.params || null;
        return (
          <ForEachConfig
            initialSteps={existingParams?.steps || []}
            sampleColumns={cols}
            sampleData={firstUpstream}
            onConfirm={handleForEachConfig}
            onCancel={() => setForEachNodeId(null)}
          />
        );
      })()}

      {/* Lakehouse table explorer */}
      {lakehouseNodeId && (
        <TableExplorer
          customTables={lakehouseTables}
          initialSelectedIds={getLakehouseExposedIds(lakehouseNodeId)}
          onSelect={handleLakehouseSelect}
          onClose={() => { setLakehouseNodeId(null); setLakehouseTables([]); }}
        />
      )}

      {/* Mapping configuration popup */}
      {mappingNodeId && (() => {
        const incoming = connections.filter(c => c.to === mappingNodeId);
        const upstreamData = incoming.length > 0 ? (nodeOutputs[incoming[0].from] || []) : [];
        const columns = upstreamData.length > 0 ? Object.keys(upstreamData[0]) : [];
        const existingParams = nodeConfigs[mappingNodeId]?.params || null;
        return (
          <MappingConfig
            columns={columns}
            tableData={upstreamData}
            initialParams={existingParams}
            onConfirm={handleMappingConfig}
            onCancel={() => setMappingNodeId(null)}
          />
        );
      })()}
    </div>
  );
}
