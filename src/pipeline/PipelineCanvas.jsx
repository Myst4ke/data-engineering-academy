import { useState, useRef, useCallback, useEffect } from 'react';
import { NODE_TYPES, CATEGORIES } from './nodeTypes';

const PORT_RADIUS = 8;
const NODE_W = 160;
const NODE_H = 80;

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

function PipelineNode({ node, typeDef, isSelected, onMouseDown, onNodeMouseUp, onPortMouseDown, onPortMouseUp, connectingFrom }) {
  return (
    <g>
      <foreignObject x={node.x} y={node.y} width={NODE_W} height={NODE_H}>
        <div
          onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, node.id); }}
          onMouseUp={(e) => { e.stopPropagation(); onNodeMouseUp(node.id); }}
          className={`w-full h-full rounded-xl border-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none transition-shadow ${
            isSelected ? 'shadow-lg ring-2 ring-indigo-400' : 'shadow-md hover:shadow-lg'
          }`}
          style={{ background: 'white', borderColor: typeDef.color, borderLeftWidth: '4px' }}
        >
          <span className="text-xl leading-none">{typeDef.icon}</span>
          <span className="text-[11px] font-bold text-slate-700 mt-1">{typeDef.name}</span>
          <span className="text-[9px] text-slate-400 font-medium">{typeDef.category}</span>
        </div>
      </foreignObject>

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
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Multi-selection
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [selectedConns, setSelectedConns] = useState(new Set());
  const [selectionRect, setSelectionRect] = useState(null); // {startX, startY, currentX, currentY} in canvas coords
  const [isSelecting, setIsSelecting] = useState(false);

  const canvasRef = useRef(null);
  const nextId = useRef(1);

  const clearSelection = () => { setSelectedNodes(new Set()); setSelectedConns(new Set()); };

  const getCanvasCoords = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left - pan.x, y: e.clientY - rect.top - pan.y };
  }, [pan]);

  const handleAddNode = useCallback((typeId) => {
    const id = `node-${nextId.current++}`;
    const rect = canvasRef.current?.getBoundingClientRect();
    const cx = rect ? (rect.width / 2 - pan.x - NODE_W / 2) : 300;
    const cy = rect ? (rect.height / 2 - pan.y - NODE_H / 2) : 200;
    const offset = (nextId.current - 1) * 20;
    setNodes(prev => [...prev, { id, type: typeId, x: cx + offset, y: cy + offset }]);
    setSelectedNodes(new Set([id]));
    setSelectedConns(new Set());
  }, [pan]);

  // Try to connect to a node's first free input port
  const tryConnect = useCallback((sourceId, targetId) => {
    if (sourceId === targetId) return false;
    const targetNode = nodes.find(n => n.id === targetId);
    const targetType = targetNode && NODE_TYPES[targetNode.type];
    if (!targetType || targetType.inputs === 0) return false;
    // Find first free input port
    for (let i = 0; i < targetType.inputs; i++) {
      const taken = connections.some(c => c.to === targetId && c.toPort === i);
      if (!taken) {
        const dup = connections.some(c => c.from === sourceId && c.to === targetId);
        if (dup) return false;
        setConnections(prev => [...prev, { from: sourceId, to: targetId, toPort: i }]);
        return true;
      }
    }
    return false;
  }, [nodes, connections]);

  // Delete all selected
  const handleDelete = useCallback(() => {
    if (selectedNodes.size > 0) {
      setNodes(prev => prev.filter(n => !selectedNodes.has(n.id)));
      setConnections(prev => prev.filter(c => !selectedNodes.has(c.from) && !selectedNodes.has(c.to) && !selectedConns.has(prev.indexOf(c))));
      // Also remove connections referencing deleted nodes
    }
    if (selectedConns.size > 0) {
      setConnections(prev => prev.filter((_, i) => !selectedConns.has(i)));
    }
    clearSelection();
  }, [selectedNodes, selectedConns]);

  useEffect(() => {
    const handler = (e) => {
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
      // Start selection rectangle
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
    if (dragging && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      // Move all selected nodes if dragging one of them
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

  const handleNodeMouseDown = (e, nodeId) => {
    if (e.button !== 0) return;
    setIsSelecting(false);
    setSelectionRect(null);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    // Store original positions of all selected nodes for group drag
    const origPositions = {};
    nodes.forEach(n => { origPositions[n.id] = { x: n.x, y: n.y }; });
    setDragging(nodeId);
    setDragStart({ x: e.clientX, y: e.clientY, nodeX: node.x, nodeY: node.y, origPositions });
    if (!selectedNodes.has(nodeId)) {
      setSelectedNodes(new Set([nodeId]));
      setSelectedConns(new Set());
    }
  };

  // Drop connection on node body → auto-connect to first free input
  // Also always clear drag state since canvas mouseUp may not fire (stopPropagation)
  const handleNodeMouseUp = (nodeId) => {
    if (connectingFrom && connectingFrom !== nodeId) {
      tryConnect(connectingFrom, nodeId);
      setConnectingFrom(null);
    }
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
      const dup = connections.some(c => c.from === connectingFrom && c.to === nodeId);
      const taken = connections.some(c => c.to === nodeId && c.toPort === portIndex);
      if (!dup && !taken) {
        setConnections(prev => [...prev, { from: connectingFrom, to: nodeId, toPort: portIndex }]);
      }
      setConnectingFrom(null);
    }
    setDragging(null);
    setDragStart(null);
  };

  const handleConnectionClick = (index) => {
    setSelectedConns(new Set([index]));
    setSelectedNodes(new Set());
  };

  const handleClear = () => {
    setNodes([]); setConnections([]); clearSelection(); setConnectingFrom(null);
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
        >
          {/* Grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x % 40} ${pan.y % 40})`}>
                <circle cx="1" cy="1" r="1" fill="#CBD5E1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            <g transform={`translate(${pan.x}, ${pan.y})`}>
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
                return (
                  <PipelineNode key={node.id} node={node} typeDef={typeDef}
                    isSelected={selectedNodes.has(node.id)}
                    onMouseDown={handleNodeMouseDown}
                    onNodeMouseUp={handleNodeMouseUp}
                    onPortMouseDown={handlePortMouseDown}
                    onPortMouseUp={handlePortMouseUp}
                    connectingFrom={connectingFrom}
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
    </div>
  );
}
