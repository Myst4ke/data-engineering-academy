import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import BackButton from '../components/BackButton';
import { DojoEmojiAuto } from '../components/DojoEmoji';
import { TABLE_TYPES, TABLE_CATEGORIES, CARDINALITIES } from './datamodelTypes';
import TableNode, { TABLE_W, getTableHeight, getColumnPortPos } from './TableNode';
import RelationLine from './RelationLine';
import ColumnEditor from './ColumnEditor';
import TableConfig from './TableConfig';
import ExerciseChecklist from '../components/ExerciseChecklist';
import ExerciseNote from '../components/ExerciseNote';
import { buildDmChecklist } from './checklistBuilder';

let idSeed = 1;
const nextId = (prefix) => `${prefix}-${Date.now().toString(36)}-${idSeed++}`;

function Palette({ onAddTable }) {
  return (
    <div className="w-48 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Ajouter</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {TABLE_CATEGORIES.map((cat) => {
          const def = TABLE_TYPES[cat.id];
          return (
            <button
              key={cat.id}
              onClick={() => onAddTable(cat.id)}
              className="w-full flex items-start gap-2 px-2 py-2 rounded-lg text-left text-xs hover:bg-slate-50 transition-colors mb-1 border border-transparent hover:border-slate-200 group"
              title={def.description}
            >
              <span
                className="w-8 h-8 flex items-center justify-center rounded-md shrink-0"
                style={{ background: def.color + '22' }}
              >
                <DojoEmojiAuto native={def.icon} size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-700 group-hover:text-indigo-600 truncate">{def.name}</div>
                <div className="text-[9px] text-slate-400 leading-tight line-clamp-2">{def.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DataModelCanvas({
  onBack,
  exercise,
  onExerciseValidate,
  initialTables,
  initialRelations,
}) {
  const [tables, setTables] = useState(() => (initialTables || []).map((t) => ({ ...t, columns: (t.columns || []).map((c) => ({ ...c })) })));
  const [relations, setRelations] = useState(() => (initialRelations || []).map((r) => ({ ...r })));
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);

  const [dragging, setDragging] = useState(null);
  const [dragStart, setDragStart] = useState(null);

  const [connectingFrom, setConnectingFrom] = useState(null); // {tableId, columnId, side}
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [selectedTables, setSelectedTables] = useState(new Set());
  const [selectedRelations, setSelectedRelations] = useState(new Set());

  const [editingColumn, setEditingColumn] = useState(null); // {tableId, columnId|null}
  const [editingTable, setEditingTable] = useState(null);   // tableId
  const [editingRelation, setEditingRelation] = useState(null); // relationId

  const canvasRef = useRef(null);

  // FK columns = columns that appear as `from` in any relation
  const fkMapByTable = useMemo(() => {
    const map = {};
    for (const r of relations) {
      if (!map[r.fromTableId]) map[r.fromTableId] = new Set();
      map[r.fromTableId].add(r.fromColumnId);
    }
    return map;
  }, [relations]);

  // Live checklist items (Tier 1 exercises only)
  const checklistItems = useMemo(() => {
    if (!exercise || exercise.difficulty !== 1) return [];
    return buildDmChecklist(exercise, tables, relations);
  }, [exercise, tables, relations]);

  const getCanvasCoords = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const clearSelection = useCallback(() => {
    setSelectedTables(new Set());
    setSelectedRelations(new Set());
  }, []);

  // ── Palette : add a new table at canvas center ──
  const handleAddTable = (typeId) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const cx = rect ? (rect.width / 2 - pan.x) / zoom - TABLE_W / 2 : 300;
    const cy = rect ? (rect.height / 2 - pan.y) / zoom - 80 : 200;
    const countOfType = tables.filter((t) => t.type === typeId).length;
    const baseName = TABLE_TYPES[typeId]?.name || 'Table';
    const newTable = {
      id: nextId('tbl'),
      type: typeId,
      name: `${baseName}_${countOfType + 1}`,
      x: cx,
      y: cy,
      columns: [{ id: nextId('col'), name: 'id', type: 'INT', pk: true }],
    };
    setTables((prev) => [...prev, newTable]);
    setEditingTable(newTable.id);
  };

  // ── Table drag ──
  const handleTableMouseDown = (e, tableId) => {
    if (e.button !== 0) return;
    const t = tables.find((tt) => tt.id === tableId);
    if (!t) return;
    const additive = e.ctrlKey || e.metaKey || e.shiftKey;
    if (additive) {
      setSelectedTables((prev) => {
        const next = new Set(prev);
        if (next.has(tableId)) next.delete(tableId); else next.add(tableId);
        return next;
      });
    } else if (!selectedTables.has(tableId)) {
      setSelectedTables(new Set([tableId]));
      setSelectedRelations(new Set());
    }
    // Start drag
    const origPositions = {};
    tables.forEach((tt) => { origPositions[tt.id] = { x: tt.x, y: tt.y }; });
    setDragging(tableId);
    setDragStart({ x: e.clientX, y: e.clientY, origPositions });
  };

  // ── Ports : start / end a relation ──
  const handlePortMouseDown = (tableId, columnId, side) => {
    setConnectingFrom({ tableId, columnId, side });
  };

  const handlePortMouseUp = (tableId, columnId /* side */) => {
    if (!connectingFrom) return;
    if (connectingFrom.tableId === tableId && connectingFrom.columnId === columnId) {
      setConnectingFrom(null);
      return;
    }
    const dup = relations.some(
      (r) =>
        r.fromTableId === connectingFrom.tableId &&
        r.fromColumnId === connectingFrom.columnId &&
        r.toTableId === tableId &&
        r.toColumnId === columnId
    );
    if (!dup) {
      setRelations((prev) => [
        ...prev,
        {
          id: nextId('rel'),
          fromTableId: connectingFrom.tableId,
          fromColumnId: connectingFrom.columnId,
          toTableId: tableId,
          toColumnId: columnId,
          cardinality: '1-N',
        },
      ]);
    }
    setConnectingFrom(null);
  };

  // ── Canvas mouse handlers ──
  const handleCanvasMouseDown = (e) => {
    if (e.button === 2 || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    if (e.button === 0) {
      if (connectingFrom) setConnectingFrom(null);
      clearSelection();
    }
  };

  const handleCanvasMouseMove = (e) => {
    setMousePos(getCanvasCoords(e));
    if (isPanning && panStart) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (dragging && dragStart) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      const movedIds = selectedTables.has(dragging) && selectedTables.size > 1 ? selectedTables : new Set([dragging]);
      setTables((prev) => prev.map((t) => movedIds.has(t.id)
        ? { ...t, x: (dragStart.origPositions?.[t.id]?.x ?? t.x) + dx, y: (dragStart.origPositions?.[t.id]?.y ?? t.y) + dy }
        : t
      ));
    }
  };

  const handleCanvasMouseUp = () => {
    setDragging(null);
    setDragStart(null);
    setIsPanning(false);
    setPanStart(null);
  };

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedTables.size === 0 && selectedRelations.size === 0) return;
        const toDelete = new Set(selectedTables);
        setTables((prev) => prev.filter((t) => !toDelete.has(t.id)));
        setRelations((prev) => prev.filter(
          (r) => !toDelete.has(r.fromTableId) && !toDelete.has(r.toTableId) && !selectedRelations.has(r.id)
        ));
        clearSelection();
      }
      if (e.key === 'Escape') {
        setConnectingFrom(null);
        clearSelection();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedTables, selectedRelations, clearSelection]);

  // ── Column CRUD ──
  const handleColumnContextMenu = (_e, tableId, columnId) => {
    setEditingColumn({ tableId, columnId });
  };

  const handleAddColumn = (tableId) => {
    setEditingColumn({ tableId, columnId: null });
  };

  const saveColumn = (colData) => {
    if (!editingColumn) return;
    const { tableId, columnId } = editingColumn;
    setTables((prev) => prev.map((t) => {
      if (t.id !== tableId) return t;
      if (columnId == null) {
        return { ...t, columns: [...t.columns, { id: nextId('col'), ...colData }] };
      }
      return { ...t, columns: t.columns.map((c) => c.id === columnId ? { ...c, ...colData } : c) };
    }));
    setEditingColumn(null);
  };

  const deleteColumn = () => {
    if (!editingColumn?.columnId) { setEditingColumn(null); return; }
    const { tableId, columnId } = editingColumn;
    setTables((prev) => prev.map((t) => t.id === tableId
      ? { ...t, columns: t.columns.filter((c) => c.id !== columnId) }
      : t
    ));
    setRelations((prev) => prev.filter(
      (r) => !((r.fromTableId === tableId && r.fromColumnId === columnId) || (r.toTableId === tableId && r.toColumnId === columnId))
    ));
    setEditingColumn(null);
  };

  // ── Table CRUD ──
  const handleHeaderContextMenu = (_e, tableId) => {
    setEditingTable(tableId);
  };

  const saveTable = (tblData) => {
    if (!editingTable) return;
    setTables((prev) => prev.map((t) => t.id === editingTable ? { ...t, ...tblData } : t));
    setEditingTable(null);
  };

  const deleteTable = () => {
    if (!editingTable) return;
    setTables((prev) => prev.filter((t) => t.id !== editingTable));
    setRelations((prev) => prev.filter((r) => r.fromTableId !== editingTable && r.toTableId !== editingTable));
    setEditingTable(null);
  };

  // ── Relation edit ──
  const handleRelationClick = (relationId) => setEditingRelation(relationId);

  const saveRelationCardinality = (cardinality) => {
    if (!editingRelation) return;
    setRelations((prev) => prev.map((r) => r.id === editingRelation ? { ...r, cardinality } : r));
    setEditingRelation(null);
  };

  const deleteRelation = () => {
    if (!editingRelation) return;
    setRelations((prev) => prev.filter((r) => r.id !== editingRelation));
    setEditingRelation(null);
  };

  // ── Exercise validation handoff ──
  const handleValidate = () => {
    if (onExerciseValidate) onExerciseValidate(tables, relations);
  };

  // Derived (for popups)
  const editingColumnObj = editingColumn && editingColumn.columnId
    ? tables.find((t) => t.id === editingColumn.tableId)?.columns.find((c) => c.id === editingColumn.columnId)
    : null;
  const editingTableObj = editingTable ? tables.find((t) => t.id === editingTable) : null;
  const editingRelationObj = editingRelation ? relations.find((r) => r.id === editingRelation) : null;

  const cursor = isPanning ? 'grabbing' : connectingFrom ? 'crosshair' : 'default';

  return (
    <div className="h-screen flex flex-col bg-[#FAFBFC]">
      <div className="flex-none flex items-center justify-between px-4 py-2 bg-white border-b border-[#EDE3D2] shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {onBack && <BackButton onClick={onBack} label="Retour" />}
          <h1 className="font-display text-xl text-[#2B2D42] tracking-tight flex items-center gap-2">
            Data Modeling <span className="font-display-italic text-[#C084FC]">Dojo</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {tables.length} table{tables.length !== 1 ? 's' : ''}, {relations.length} relation{relations.length !== 1 ? 's' : ''}
          </span>
          <span
            className="hidden lg:inline text-xs text-slate-400"
            title="Clic droit sur une table : configurer ; Clic droit sur une colonne : modifier ; Drag entre les ronds : relier les colonnes ; Clic sur la ligne de relation : cardinalité ; Suppr : supprimer la sélection"
          >
            Clic droit = configurer
          </span>
          <button
            onClick={() => {
              if (tables.length === 0 || window.confirm('Effacer tout le canvas ?')) {
                setTables([]);
                setRelations([]);
                clearSelection();
              }
            }}
            className="game-btn px-3 py-1 text-xs text-slate-600 font-semibold"
          >
            Tout effacer
          </button>
          {exercise && onExerciseValidate && (
            <button
              onClick={handleValidate}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 shadow"
            >
              Valider
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Palette onAddTable={handleAddTable} />

        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden"
          style={{ cursor }}
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
            const scale = newZoom / zoom;
            setPan((p) => ({ x: mx - scale * (mx - p.x), y: my - scale * (my - p.y) }));
            setZoom(newZoom);
          }}
        >
          {/* Grid background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {zoom >= 0.35 && (
              <>
                <defs>
                  <pattern
                    id="grid-dm"
                    width="40" height="40"
                    patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${pan.x % 40} ${pan.y % 40})`}
                  >
                    <circle cx="1" cy="1" r="1" fill="#CBD5E1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-dm)" />
              </>
            )}
          </svg>

          {/* Main SVG */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1, userSelect: 'none' }}>
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Relations behind tables */}
              {relations.map((r) => {
                const fromT = tables.find((t) => t.id === r.fromTableId);
                const toT = tables.find((t) => t.id === r.toTableId);
                if (!fromT || !toT) return null;
                const from = getColumnPortPos(fromT, r.fromColumnId, 'right');
                const to = getColumnPortPos(toT, r.toColumnId, 'left');
                return (
                  <RelationLine
                    key={r.id}
                    from={from}
                    to={to}
                    cardinality={r.cardinality}
                    isSelected={selectedRelations.has(r.id)}
                    onClick={() => handleRelationClick(r.id)}
                  />
                );
              })}

              {connectingFrom && (() => {
                const fromT = tables.find((t) => t.id === connectingFrom.tableId);
                if (!fromT) return null;
                const from = getColumnPortPos(fromT, connectingFrom.columnId, connectingFrom.side);
                return <RelationLine from={from} to={mousePos} cardinality="" isTemp />;
              })()}

              {/* Tables */}
              {tables.map((t) => (
                <TableNode
                  key={t.id}
                  table={t}
                  isSelected={selectedTables.has(t.id)}
                  connectingFrom={connectingFrom}
                  fkColumnIds={fkMapByTable[t.id]}
                  onMouseDown={handleTableMouseDown}
                  onHeaderContextMenu={handleHeaderContextMenu}
                  onColumnContextMenu={handleColumnContextMenu}
                  onPortMouseDown={handlePortMouseDown}
                  onPortMouseUp={handlePortMouseUp}
                  onAddColumn={handleAddColumn}
                />
              ))}
            </g>
          </svg>

          {tables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium">Ajoute une table depuis la palette à gauche</p>
                <p className="text-slate-300 text-xs mt-1">Drag entre les ronds pour relier deux colonnes ; clic droit pour configurer</p>
              </div>
            </div>
          )}

          {/* Live checklist for easy exercises ; free-form note otherwise */}
          {exercise && exercise.difficulty === 1 && checklistItems.length > 0 && (
            <ExerciseChecklist items={checklistItems} topOffset={48} leftOffset={16} />
          )}
          {exercise && exercise.difficulty > 1 && (
            <ExerciseNote exerciseId={`dm-${exercise.id}`} topOffset={48} leftOffset={16} />
          )}

          {/* Zoom controls */}
          <div
            className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 bg-white border border-slate-200 rounded-lg shadow-md p-1"
            onMouseDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600"
              title="Zoomer" aria-label="Zoomer"
            >
              <ZoomIn className="w-4 h-4" aria-hidden="true" />
            </button>
            <div className="text-center text-[10px] text-slate-500 font-medium py-0.5 border-y border-slate-100">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
              className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600"
              title="Dézoomer" aria-label="Dézoomer"
            >
              <ZoomOut className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600"
              title="Réinitialiser" aria-label="Réinitialiser"
            >
              <Maximize className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {connectingFrom && (
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg"
              style={{ zIndex: 3 }}
            >
              Relâche sur le rond d'une autre colonne pour créer la relation ; Échap pour annuler
            </div>
          )}
        </div>
      </div>

      {editingColumn && (
        <ColumnEditor
          initialColumn={editingColumnObj}
          onConfirm={saveColumn}
          onCancel={() => setEditingColumn(null)}
          onDelete={editingColumnObj ? deleteColumn : null}
        />
      )}

      {editingTable && editingTableObj && (
        <TableConfig
          initialTable={editingTableObj}
          onConfirm={saveTable}
          onCancel={() => setEditingTable(null)}
          onDelete={deleteTable}
        />
      )}

      {editingRelation && editingRelationObj && (
        <div
          className="fixed inset-0 modal-overlay flex items-center justify-center z-50"
          onClick={() => setEditingRelation(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-80 modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Cardinalité de la relation</h3>
            <div className="space-y-1.5 mb-4">
              {Object.entries(CARDINALITIES).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => saveRelationCardinality(k)}
                  className={`w-full text-left px-3 py-2 rounded-lg border-2 text-xs transition-colors ${editingRelationObj.cardinality === k ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="font-bold">{v.label}</div>
                  <div className="text-[10px] text-slate-500">{v.description}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={deleteRelation}
                className="px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 font-semibold"
              >
                Supprimer
              </button>
              <button
                onClick={() => setEditingRelation(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
