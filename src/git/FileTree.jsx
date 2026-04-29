import { useState } from 'react';
import { File, FileCode, FileText, FileJson, X, Plus } from 'lucide-react';
import { getHeadSha } from './gitEngine';

function getFileIcon(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'rb', 'php', 'sh'].includes(ext)) return FileCode;
  if (['md', 'txt', 'rst', 'log'].includes(ext)) return FileText;
  if (ext === 'json') return FileJson;
  return File;
}

function WindowChrome({ title, count, accent = 'neutral', children, dropProps, dragOver, headerLeft = null }) {
  const accents = {
    mint: { bar: 'bg-emerald-50/70', border: 'border-emerald-200', text: 'text-emerald-700', countText: 'text-emerald-600' },
    neutral: { bar: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', countText: 'text-slate-400' },
  };
  const a = accents[accent];

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all ${
      dragOver ? 'border-emerald-400 ring-4 ring-emerald-100 shadow-md' : a.border
    }`}>
      <div className={`flex items-center px-3 py-1.5 ${a.bar} border-b ${a.border}`}>
        <div className="flex-1 flex justify-start min-w-0">{headerLeft}</div>
        <span className={`shrink-0 text-[11px] font-bold tracking-wide ${a.text} select-none`}>
          {title}<span className={`ml-1.5 ${a.countText} font-medium`}>({count})</span>
        </span>
        <div className="flex-1 flex justify-end">
          <div className="flex gap-1 opacity-50" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-sm border border-slate-300 bg-white" />
            <span className="w-2.5 h-2.5 rounded-sm border border-slate-300 bg-white" />
            <span className="w-2.5 h-2.5 rounded-sm border border-slate-300 bg-white" />
          </div>
        </div>
      </div>
      <div {...(dropProps || {})}>
        {children}
      </div>
    </div>
  );
}

const TILE_STYLES = {
  staged: {
    base: 'border-emerald-400 bg-emerald-50/40',
    hover: 'group-hover:border-emerald-600 group-hover:bg-emerald-100 group-hover:ring-2 group-hover:ring-emerald-200',
  },
  modified: {
    base: 'border-red-400 bg-red-50/40',
    hover: 'group-hover:border-red-600 group-hover:bg-red-100 group-hover:ring-2 group-hover:ring-red-200',
  },
  untracked: {
    base: 'border-emerald-400 border-dashed bg-white',
    hover: 'group-hover:border-emerald-600 group-hover:bg-emerald-50 group-hover:ring-2 group-hover:ring-emerald-200',
  },
  committed: {
    base: 'border-slate-200 bg-white',
    hover: 'group-hover:border-slate-400 group-hover:ring-2 group-hover:ring-slate-200',
  },
};

function FileTile({ name, status, draggable, onDragStart, onDoubleClick, hoverAction }) {
  const Icon = getFileIcon(name);
  const style = TILE_STYLES[status] || TILE_STYLES.committed;

  const tooltip = draggable
    ? 'Glisser pour déplacer · Double-clic pour éditer'
    : 'Double-clic pour éditer';

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDoubleClick={onDoubleClick}
      title={tooltip}
      className={`group relative flex flex-col items-center gap-1.5 p-1.5 ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} select-none`}
    >
      <div className={`p-2 rounded-xl border-2 ${style.base} ${style.hover} transition-all group-hover:-translate-y-0.5`}>
        <Icon className="w-9 h-9 text-slate-700" strokeWidth={1.5} />
      </div>
      <span className="text-[10px] font-mono text-slate-700 truncate w-full text-center leading-tight" title={name}>{name}</span>
      {hoverAction && (
        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {hoverAction}
        </div>
      )}
    </div>
  );
}

function setupCustomDragImage(e) {
  const tile = e.currentTarget;
  const rect = tile.getBoundingClientRect();
  const ghost = tile.cloneNode(true);
  ghost.style.position = 'fixed';
  ghost.style.top = '-9999px';
  ghost.style.left = '-9999px';
  ghost.style.width = rect.width + 'px';
  ghost.style.background = 'transparent';
  ghost.style.pointerEvents = 'none';
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, rect.width / 2, rect.height / 2);
  setTimeout(() => { try { document.body.removeChild(ghost); } catch (_) { /* gone */ } }, 0);
}

export default function FileTree({ state, onModify, onStage, onUnstage, onStageAll }) {
  const headSha = getHeadSha(state);
  const headTree = headSha ? (state.commits[headSha]?.tree || {}) : {};
  const [editing, setEditing] = useState(null);
  const [dragOverStaging, setDragOverStaging] = useState(false);
  const [dragOverFiles, setDragOverFiles] = useState(false);
  const [dragSource, setDragSource] = useState(null); // 'files' | 'staged' | null

  const staged = Object.keys(state.index).sort();
  const allWorkingFiles = Object.keys(state.workingTree).sort();

  const statusOf = (file) => {
    const wt = state.workingTree[file];
    const hd = headTree[file];
    const ix = state.index[file];
    if (ix !== undefined && wt === ix) return 'staged-clean';
    if (hd === undefined) return 'untracked';
    if (wt !== hd) return 'modified';
    return 'committed';
  };

  const filesView = allWorkingFiles.filter(f => statusOf(f) !== 'staged-clean');
  const stageableCount = filesView.filter(f => {
    const s = statusOf(f);
    return s === 'modified' || s === 'untracked';
  }).length;

  const startEdit = (file) => setEditing({ file, content: state.workingTree[file] ?? headTree[file] ?? '', isNew: false });
  const startCreate = () => setEditing({ file: '', content: '', isNew: true });
  const saveEdit = () => {
    if (!editing || !onModify) return setEditing(null);
    const filename = editing.file.trim();
    if (editing.isNew) {
      if (!filename) return; // require a name
      if (filename in state.workingTree) return; // would overwrite, refuse silently
    }
    onModify(filename, editing.content);
    setEditing(null);
  };

  const handleDragStart = (file, source) => (e) => {
    e.dataTransfer.setData('text/plain', file);
    e.dataTransfer.setData('application/x-git-source', source);
    e.dataTransfer.effectAllowed = 'move';
    setDragSource(source);
    setupCustomDragImage(e);
  };
  const handleDragEnd = () => {
    setDragSource(null);
    setDragOverStaging(false);
    setDragOverFiles(false);
  };

  // Staging drop target : accepts files coming from "files" zone
  const handleStagingDragOver = (e) => {
    if (dragSource !== 'files') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStaging(true);
  };
  const handleStagingDragLeave = (e) => { if (e.currentTarget.contains(e.relatedTarget)) return; setDragOverStaging(false); };
  const handleStagingDrop = (e) => {
    e.preventDefault();
    setDragOverStaging(false);
    if (e.dataTransfer.getData('application/x-git-source') !== 'files') return;
    const file = e.dataTransfer.getData('text/plain');
    if (file && onStage) onStage(file);
  };

  // Files drop target : accepts files coming from staging (= unstage)
  const handleFilesDragOver = (e) => {
    if (dragSource !== 'staged') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFiles(true);
  };
  const handleFilesDragLeave = (e) => { if (e.currentTarget.contains(e.relatedTarget)) return; setDragOverFiles(false); };
  const handleFilesDrop = (e) => {
    e.preventDefault();
    setDragOverFiles(false);
    if (e.dataTransfer.getData('application/x-git-source') !== 'staged') return;
    const file = e.dataTransfer.getData('text/plain');
    if (file && onUnstage) onUnstage(file);
  };

  return (
    <div onDragEnd={handleDragEnd} className="flex flex-col h-full bg-[#FAFBFC] border-l border-slate-200 w-96 shrink-0 px-3 pt-12 pb-3 gap-3 overflow-y-auto">
      {/* Staging Zone */}
      <div data-tutorial="staging-zone">
      <WindowChrome
        title="Staging Zone"
        count={staged.length}
        accent="mint"
        dragOver={dragOverStaging}
        dropProps={{
          onDragOver: handleStagingDragOver,
          onDragLeave: handleStagingDragLeave,
          onDrop: handleStagingDrop,
        }}
      >
        <div className="grid grid-cols-3 gap-1 p-3 min-h-[110px] bg-white">
          {staged.length === 0 ? (
            <div className={`col-span-3 flex items-center justify-center text-[11px] italic py-7 ${dragOverStaging ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              {dragOverStaging ? 'Lâchez pour stager' : 'Glissez les fichiers ici'}
            </div>
          ) : (
            staged.map(f => (
              <FileTile
                key={f}
                name={f}
                status="staged"
                draggable
                onDragStart={handleDragStart(f, 'staged')}
                onDoubleClick={() => startEdit(f)}
                hoverAction={
                  <button
                    onClick={(e) => { e.stopPropagation(); onUnstage?.(f); }}
                    title="Retirer du staging"
                    className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 flex items-center justify-center shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                }
              />
            ))
          )}
        </div>
      </WindowChrome>

      </div>

      {/* Files (working tree) */}
      <div data-tutorial="files-window">
        <WindowChrome
          title="Files"
          count={filesView.length}
          accent="neutral"
          dragOver={dragOverFiles}
          dropProps={{
            onDragOver: handleFilesDragOver,
            onDragLeave: handleFilesDragLeave,
            onDrop: handleFilesDrop,
          }}
          headerLeft={
            stageableCount > 0 && onStageAll ? (
              <button
                onClick={onStageAll}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full px-2 py-0.5 transition-colors"
                title="Stager tous les fichiers modifiés et nouveaux (git add .)"
              >
                <Plus className="w-2.5 h-2.5" />
                Tout stager <span className="text-emerald-500 font-semibold">({stageableCount})</span>
              </button>
            ) : null
          }
        >
          <div className="grid grid-cols-3 gap-1 p-3 min-h-[110px] bg-white">
            {filesView.length === 0 && !dragOverFiles ? (
              <div className="col-span-3 flex items-center justify-center text-[11px] italic py-7 text-slate-400">
                Aucun fichier
              </div>
            ) : dragOverFiles && filesView.length === 0 ? (
              <div className="col-span-3 flex items-center justify-center text-[11px] italic py-7 text-slate-700 font-bold">
                Lâchez pour retirer du staging
              </div>
            ) : (
              filesView.map(f => {
                const s = statusOf(f);
                const draggable = s === 'modified' || s === 'untracked';
                return (
                  <FileTile
                    key={f}
                    name={f}
                    status={s}
                    draggable={draggable}
                    onDragStart={draggable ? handleDragStart(f, 'files') : undefined}
                    onDoubleClick={() => startEdit(f)}
                    hoverAction={
                      draggable ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onStage?.(f); }}
                          title="Stager ce fichier"
                          className="w-5 h-5 rounded-full bg-white border border-emerald-300 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center shadow"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      ) : null
                    }
                  />
                );
              })
            )}
            {/* Create new file tile : same shape as a tile */}
            <div
              onClick={startCreate}
              className="group relative flex flex-col items-center gap-1.5 p-1.5 cursor-pointer select-none"
              title="Créer un nouveau fichier"
            >
              <div className="p-2 rounded-xl border-2 border-dashed border-slate-300 bg-white transition-all group-hover:border-emerald-500 group-hover:bg-emerald-50 group-hover:ring-2 group-hover:ring-emerald-200 group-hover:-translate-y-0.5 flex items-center justify-center">
                <Plus className="w-9 h-9 text-slate-400 group-hover:text-emerald-600 transition-colors" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-mono text-slate-500 group-hover:text-emerald-700 truncate w-full text-center leading-tight transition-colors">Nouveau</span>
            </div>
          </div>
        </WindowChrome>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border-2 border-red-400 rounded-sm bg-red-50/40" /> modifié</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border-2 border-dashed border-emerald-400 rounded-sm" /> nouveau</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border-2 border-emerald-400 rounded-sm bg-emerald-50/40" /> stagé</span>
      </div>

      {editing && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-[32rem] modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              {editing.isNew ? 'Créer un fichier' : `Modifier ${editing.file}`}
            </h3>
            {editing.isNew && (
              <input
                autoFocus
                type="text"
                placeholder="nom-du-fichier.ext (ex: notes.md)"
                value={editing.file}
                onChange={(e) => setEditing(prev => ({ ...prev, file: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter' && editing.file.trim()) saveEdit(); }}
                className="w-full mb-3 px-3 py-2 rounded-lg border-2 border-slate-200 text-sm font-mono focus:border-emerald-400 focus:outline-none"
              />
            )}
            <textarea
              autoFocus={!editing.isNew}
              value={editing.content}
              onChange={(e) => setEditing(prev => ({ ...prev, content: e.target.value }))}
              rows={10}
              placeholder={editing.isNew ? 'Contenu du fichier (peut être vide)' : ''}
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-xs font-mono focus:border-emerald-400 focus:outline-none"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
              <button
                onClick={saveEdit}
                disabled={editing.isNew && (!editing.file.trim() || editing.file.trim() in state.workingTree)}
                className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {editing.isNew ? 'Créer' : 'Sauver'}
              </button>
            </div>
            {editing.isNew && editing.file.trim() && editing.file.trim() in state.workingTree && (
              <p className="text-[11px] text-red-600 mt-2">Ce fichier existe déjà.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
