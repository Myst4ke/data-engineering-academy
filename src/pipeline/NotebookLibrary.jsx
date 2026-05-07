import { useMemo, useState } from 'react';
import { Plus, Pencil, Copy, Trash2, BookOpen } from 'lucide-react';
import {
  listNotebooks,
  createUserNotebook,
  duplicateAsUser,
  deleteUserNotebook,
  updateUserNotebook,
} from './notebooks';
import NotebookConfig from './NotebookConfig';

/**
 * Right-side panel that lists every notebook visible to the learner :
 * system notebooks first, then exercise-provided notebooks, then user
 * notebooks. Drag a row onto the canvas to spawn a Notebook node, or
 * click to view/edit. Buttons let users duplicate/delete user notebooks.
 *
 * Props :
 *   exerciseNotebooks  : array of { id, name, ... } provided by the current exercise
 *   currentExerciseId  : id of the current exercise (used when creating notebooks)
 *   onDragStartRef     : optional callback (notebookId) => void invoked when dragging starts
 *   onCreateNotebookOnCanvas?(notebookId) : when the user clicks "+ Add to canvas"
 *   onChange?()        : called whenever a notebook is created/updated/deleted (to refresh)
 */
export default function NotebookLibrary({
  exerciseNotebooks = [],
  currentExerciseId = null,
  onDragStartRef,
  onCreateNotebookOnCanvas,
  onChange,
}) {
  const [tick, setTick] = useState(0);
  const [openNotebook, setOpenNotebook] = useState(null); // notebook being viewed/edited
  const [filter, setFilter] = useState('');

  const notebooks = useMemo(() => {
    return listNotebooks({ exerciseNotebooks });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, exerciseNotebooks]);

  const refresh = () => {
    setTick(t => t + 1);
    onChange?.();
    // Notify the canvas (or anyone else) that the notebook set has changed,
    // so cached executions can be invalidated.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pipeline:notebook-changed'));
    }
  };

  const filteredBySource = (src) =>
    notebooks.filter(n => n.source === src && (!filter || n.name.toLowerCase().includes(filter.toLowerCase())));

  const handleCreateBlank = () => {
    const created = createUserNotebook({
      name: 'Nouveau notebook',
      description: '',
      cards: [],
      createdAtExerciseId: currentExerciseId,
    });
    refresh();
    setOpenNotebook(created);
  };

  const handleDuplicate = (notebook) => {
    const copy = duplicateAsUser(notebook);
    refresh();
    setOpenNotebook(copy);
  };

  const handleDelete = (notebook) => {
    if (!window.confirm(`Supprimer le notebook "${notebook.name}" ?`)) return;
    deleteUserNotebook(notebook.id);
    refresh();
    if (openNotebook?.id === notebook.id) setOpenNotebook(null);
  };

  const handleSave = (updated) => {
    if (updated.source === 'user' || !updated.source) {
      updateUserNotebook(updated.id, updated);
    }
    refresh();
    setOpenNotebook(null);
  };

  const handleSaveAsNew = (payload) => {
    const created = createUserNotebook({
      ...payload,
      id: undefined,
      createdAtExerciseId: currentExerciseId,
    });
    refresh();
    setOpenNotebook(created);
  };

  const handleDragStart = (e, notebook) => {
    e.dataTransfer.setData('application/x-notebook-id', notebook.id);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStartRef?.(notebook.id);
  };

  return (
    <div className="w-72 shrink-0 bg-white border-l border-slate-200 flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">Notebooks</h3>
        </div>
        <button
          onClick={handleCreateBlank}
          className="text-[10px] font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-2 py-0.5 flex items-center gap-1"
          title="Créer un nouveau notebook vide"
        >
          <Plus className="w-3 h-3" /> Nouveau
        </button>
      </div>

      <div className="px-2 pt-2 pb-1">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filtrer…"
          className="w-full text-xs px-2 py-1 rounded border border-slate-200 focus:outline-none focus:border-indigo-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
        <NotebookGroup
          title="Système" badge="lecture seule"
          items={filteredBySource('system')}
          onClick={(nb) => setOpenNotebook(nb)}
          onDragStart={handleDragStart}
          onAdd={onCreateNotebookOnCanvas}
          onDuplicate={handleDuplicate}
          emptyText="(aucun)"
        />
        {filteredBySource('exercise').length > 0 && (
          <NotebookGroup
            title="Fournis par l'exercice"
            items={filteredBySource('exercise')}
            onClick={(nb) => setOpenNotebook(nb)}
            onDragStart={handleDragStart}
            onAdd={onCreateNotebookOnCanvas}
            onDuplicate={handleDuplicate}
            emptyText=""
          />
        )}
        <NotebookGroup
          title="Mes notebooks"
          items={filteredBySource('user')}
          onClick={(nb) => setOpenNotebook(nb)}
          onDragStart={handleDragStart}
          onAdd={onCreateNotebookOnCanvas}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          showExerciseTag
          emptyText="Aucun notebook créé pour l'instant."
        />
      </div>

      {openNotebook && (
        <NotebookConfig
          notebook={openNotebook}
          readOnly={openNotebook.source === 'system' || openNotebook.source === 'exercise'}
          onSave={handleSave}
          onSaveAsNew={handleSaveAsNew}
          onDelete={openNotebook.source === 'user' ? () => handleDelete(openNotebook) : undefined}
          onCancel={() => setOpenNotebook(null)}
        />
      )}
    </div>
  );
}

function NotebookGroup({ title, badge, items, onClick, onDragStart, onAdd, onDuplicate, onDelete, showExerciseTag, emptyText }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</span>
        {badge && <span className="text-[9px] text-slate-400 italic">{badge}</span>}
      </div>
      {items.length === 0 ? (
        <div className="text-[11px] italic text-slate-400 px-2 py-1">{emptyText}</div>
      ) : (
        <ul className="space-y-1">
          {items.map(nb => (
            <li
              key={nb.id}
              draggable
              onDragStart={(e) => onDragStart(e, nb)}
              className="group rounded-lg border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
            >
              <div className="px-2 py-1.5 flex items-start gap-2">
                <span className="text-base shrink-0">📓</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 truncate text-[12px]">{nb.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{nb.description || '—'}</div>
                  {showExerciseTag && nb.createdAtExerciseId && (
                    <div className="text-[9px] text-indigo-600 font-bold mt-0.5">créé en {nb.createdAtExerciseId}</div>
                  )}
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); onClick(nb); }}
                    className="p-1 rounded hover:bg-slate-100"
                    title="Voir / éditer"
                  >
                    <Pencil className="w-3 h-3 text-slate-600" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate(nb); }}
                    className="p-1 rounded hover:bg-slate-100"
                    title="Dupliquer"
                  >
                    <Copy className="w-3 h-3 text-slate-600" />
                  </button>
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(nb); }}
                      className="p-1 rounded hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
              {onAdd && (
                <button
                  onClick={() => onAdd(nb.id)}
                  className="w-full text-[10px] text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 py-1 font-medium"
                >
                  + Ajouter au canvas
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
