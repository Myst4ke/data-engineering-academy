import { useState } from 'react';
import { getHeadSha } from './gitEngine';

function FileRow({ name, actions }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-50 text-[11px] text-slate-700">
      <span className="flex-1 truncate font-mono">{name}</span>
      {actions}
    </div>
  );
}

export default function FileTree({ state, onModify, onStage, onUnstage }) {
  const headSha = getHeadSha(state);
  const headTree = headSha ? (state.commits[headSha]?.tree || {}) : {};
  const [editing, setEditing] = useState(null); // { file, content }

  // Buckets
  const staged = Object.keys(state.index).sort();
  const modifiedNames = [];
  const untrackedNames = [];
  const committedOnlyNames = [];
  for (const f of Object.keys(state.workingTree).sort()) {
    const wt = state.workingTree[f];
    const hd = headTree[f];
    const ix = state.index[f];
    if (ix !== undefined && wt === ix) continue; // already in staged section
    if (hd === undefined) {
      untrackedNames.push(f);
    } else if (wt !== hd) {
      modifiedNames.push(f);
    }
  }
  for (const f of Object.keys(headTree).sort()) {
    if (!(f in state.workingTree) && !(f in state.index)) committedOnlyNames.push(f);
  }

  const commitTree = Object.keys(headTree).filter(f => !modifiedNames.includes(f) && !staged.includes(f) && !untrackedNames.includes(f)).sort();

  const pillCls = "inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide";

  const startEdit = (file) => setEditing({ file, content: state.workingTree[file] ?? '' });
  const saveEdit = () => {
    if (editing && onModify) onModify(editing.file, editing.content);
    setEditing(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200 w-64 shrink-0">
      <div className="px-3 py-2 border-b border-slate-200 bg-white">
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Working tree</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Staged */}
        <div className="p-2 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase text-emerald-700">Stagé</span>
            <span className={`${pillCls} bg-emerald-100 text-emerald-700`}>{staged.length}</span>
          </div>
          {staged.length === 0
            ? <div className="text-[10px] text-slate-400 italic px-2">(rien)</div>
            : staged.map(f => (
              <FileRow key={f} name={f} actions={
                <button onClick={() => onUnstage?.(f)}
                  className="text-[9px] text-slate-500 hover:text-red-600 font-medium px-1.5 py-0.5 rounded hover:bg-red-50">
                  Unstager
                </button>
              } />
            ))}
        </div>

        {/* Modified */}
        <div className="p-2 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase text-amber-700">Modifié</span>
            <span className={`${pillCls} bg-amber-100 text-amber-700`}>{modifiedNames.length + untrackedNames.length}</span>
          </div>
          {modifiedNames.length + untrackedNames.length === 0
            ? <div className="text-[10px] text-slate-400 italic px-2">(rien)</div>
            : [...modifiedNames, ...untrackedNames].map(f => (
              <FileRow key={f} name={f} actions={
                <>
                  <button onClick={() => startEdit(f)}
                    className="text-[9px] text-slate-500 hover:text-indigo-600 font-medium px-1.5 py-0.5 rounded hover:bg-indigo-50">
                    Modifier
                  </button>
                  <button onClick={() => onStage?.(f)}
                    className="text-[9px] text-emerald-600 hover:text-emerald-800 font-bold px-1.5 py-0.5 rounded hover:bg-emerald-50">
                    Stager
                  </button>
                </>
              } />
            ))}
        </div>

        {/* Committed */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase text-slate-500">Committé</span>
            <span className={`${pillCls} bg-slate-100 text-slate-600`}>{commitTree.length}</span>
          </div>
          {commitTree.length === 0
            ? <div className="text-[10px] text-slate-400 italic px-2">(rien)</div>
            : commitTree.map(f => (
              <FileRow key={f} name={f} actions={
                <button onClick={() => startEdit(f)}
                  className="text-[9px] text-slate-500 hover:text-indigo-600 font-medium px-1.5 py-0.5 rounded hover:bg-indigo-50">
                  Modifier
                </button>
              } />
            ))}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-[32rem] modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Modifier {editing.file}</h3>
            <textarea
              autoFocus
              value={editing.content}
              onChange={(e) => setEditing(prev => ({ ...prev, content: e.target.value }))}
              rows={10}
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-xs font-mono focus:border-emerald-400 focus:outline-none"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={saveEdit} className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600">Sauver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
