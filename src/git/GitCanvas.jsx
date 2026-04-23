import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { GitCommit, GitBranch, GitMerge, RotateCcw } from 'lucide-react';
import BackButton from '../components/BackButton';
import CommitNode from './CommitNode';
import BranchLabel, { HeadPill } from './BranchLabel';
import FileTree from './FileTree';
import CommandLog from './CommandLog';
import * as eng from './gitEngine';
import { RAIL_WIDTH, ROW_HEIGHT } from './gitTypes';

function actionBtn(extra = '') {
  return `w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-200 group ${extra}`;
}

function Palette({ tier, onCommit, onCreateBranch, onMerge, onUndo, canUndo }) {
  return (
    <div className="w-44 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Actions</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="text-[9px] font-bold uppercase text-slate-400 mt-1 mb-0.5 px-1">Base</div>
        <button className={actionBtn()} onClick={onCommit} title="Committer les fichiers stagés">
          <GitCommit className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
          <span className="font-medium text-slate-700 group-hover:text-emerald-800">Commiter</span>
        </button>

        {tier >= 2 && (
          <>
            <div className="text-[9px] font-bold uppercase text-slate-400 mt-3 mb-0.5 px-1">Branches</div>
            <button className={actionBtn()} onClick={onCreateBranch} title="Créer une nouvelle branche">
              <GitBranch className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
              <span className="font-medium text-slate-700 group-hover:text-emerald-800">Nouvelle branche</span>
            </button>
            <button className={actionBtn()} onClick={onMerge} title="Fusionner une autre branche dans la courante">
              <GitMerge className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
              <span className="font-medium text-slate-700 group-hover:text-emerald-800">Merger</span>
            </button>
          </>
        )}

        <div className="text-[9px] font-bold uppercase text-slate-400 mt-3 mb-0.5 px-1">Aide</div>
        <button
          className={`${actionBtn('hover:bg-slate-50 hover:border-slate-200')} ${canUndo ? '' : 'opacity-40 cursor-not-allowed'}`}
          onClick={canUndo ? onUndo : undefined}
          title="Annuler la dernière action (Ctrl+Z)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />
          <span className="font-medium text-slate-700">Annuler</span>
        </button>
      </div>
    </div>
  );
}

function CommitMessagePopup({ defaultMessage, onConfirm, onCancel }) {
  const [message, setMessage] = useState(defaultMessage || '');
  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-96 modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Message de commit</h3>
        <input
          autoFocus type="text" value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && message.trim()) onConfirm(message.trim()); }}
          placeholder="feat : ajouter la page de login"
          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm mb-4 focus:border-emerald-400 focus:outline-none"
        />
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          <button
            onClick={() => onConfirm(message.trim())}
            disabled={!message.trim()}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${message.trim() ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >Commiter</button>
        </div>
      </div>
    </div>
  );
}

function BranchNamePopup({ onConfirm, onCancel }) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-96 modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Nom de la nouvelle branche</h3>
        <input
          autoFocus type="text" value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onConfirm(name.trim()); }}
          placeholder="feature/login"
          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm mb-4 focus:border-emerald-400 focus:outline-none"
        />
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          <button
            onClick={() => onConfirm(name.trim())}
            disabled={!name.trim()}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${name.trim() ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >Créer</button>
        </div>
      </div>
    </div>
  );
}

function MergePopup({ branches, current, onConfirm, onCancel }) {
  const options = branches.filter(b => b !== current);
  const [selected, setSelected] = useState(options[0] || '');
  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-96 modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Merger une branche dans {current}</h3>
        {options.length === 0 ? (
          <p className="text-xs text-slate-500 mb-4">Aucune autre branche disponible.</p>
        ) : (
          <select
            autoFocus value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm mb-4 bg-white focus:border-emerald-400 focus:outline-none"
          >
            {options.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        )}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={!selected}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${selected ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >Merger</button>
        </div>
      </div>
    </div>
  );
}

export default function GitCanvas({ onBack, exercise, onValidate }) {
  const [state, setState] = useState(() => (exercise?.build ? exercise.build(eng) : eng.makeInitialState()));
  const [commands, setCommands] = useState([]);
  const [selectedSha, setSelectedSha] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [popup, setPopup] = useState(null); // 'commit' | 'branch' | 'merge' | null
  const [banner, setBanner] = useState(null); // transient feedback message

  // Reset when exercise changes
  useEffect(() => {
    setState(exercise?.build ? exercise.build(eng) : eng.makeInitialState());
    setCommands([]);
    setSelectedSha(null);
    setUndoStack([]);
  }, [exercise?.id]);

  const pushHistory = useCallback((prev) => {
    setUndoStack(stk => [...stk.slice(-19), prev]);
  }, []);

  const apply = useCallback((fn) => {
    const prev = eng.cloneState(state);
    const r = fn(state);
    if (r.warning) setBanner(r.warning);
    else setBanner(null);
    if (r.state !== state) {
      pushHistory(prev);
      setState(r.state);
    }
    if (r.command) setCommands(c => [...c, r.command]);
  }, [state, pushHistory]);

  const doUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(stk => stk.slice(0, -1));
    setState(last);
    setCommands(c => c.slice(0, -1));
  }, [undoStack]);

  useEffect(() => {
    const h = (e) => {
      if (e.target?.tagName?.toLowerCase().match(/input|textarea|select/)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [doUndo]);

  const doStage = (f) => apply(s => eng.stage(s, f));
  const doUnstage = (f) => apply(s => eng.unstage(s, f));
  const doModify = (f, c) => apply(s => eng.modifyFile(s, f, c));
  const doCommit = (message) => { apply(s => eng.commit(s, { message })); setPopup(null); };
  const doCreateBranch = (name) => { apply(s => eng.createBranch(s, name)); setPopup(null); };
  const doMerge = (source) => { apply(s => eng.merge(s, source)); setPopup(null); };
  const doCheckoutTarget = useCallback((target) => apply(s => eng.checkout(s, target)), [apply]);

  const layout = useMemo(() => eng.layoutGraph(state), [state]);

  const commits = Object.values(state.commits);
  const maxY = commits.length > 0 ? Math.max(...commits.map(c => layout.positions[c.sha]?.y ?? 0)) : 0;
  const maxX = commits.length > 0 ? Math.max(...commits.map(c => layout.positions[c.sha]?.x ?? 0)) : 0;

  const svgHeight = (maxY + 1) * ROW_HEIGHT + 60;
  const svgWidth = (maxX + 1) * RAIL_WIDTH + 240;

  const toPx = (pos) => ({ x: pos.x * RAIL_WIDTH + 50, y: pos.y * ROW_HEIGHT + 40 });

  const headBranch = state.head.type === 'branch' ? state.head.ref : null;
  const headSha = eng.getHeadSha(state);

  // Branches indexed by the SHA they point at
  const branchesBySha = {};
  for (const [name, sha] of Object.entries(state.branches)) {
    if (!branchesBySha[sha]) branchesBySha[sha] = [];
    branchesBySha[sha].push(name);
  }

  // Commit → branch that "owns" its rail (for coloring). Prefer the first branch.
  const branchOfCommit = {};
  for (const [branch, sha] of Object.entries(state.branches)) {
    let cur = sha;
    while (cur && !(cur in branchOfCommit)) {
      branchOfCommit[cur] = branch;
      const c = state.commits[cur];
      if (!c || c.parents.length === 0) break;
      cur = c.parents[0];
    }
  }

  const allBranchNames = Object.keys(state.branches);

  return (
    <div className="h-screen flex flex-col bg-[#FAFBFC]">
      <div className="flex-none flex items-center justify-between px-4 py-2 bg-white border-b border-[#EDE3D2] shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && <BackButton onClick={onBack} label="Accueil" />}
          <h1 className="font-display text-xl text-[#2B2D42] flex items-center gap-2">
            Git <span className="font-display-italic text-[#059669]">Dojo</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {commits.length} commit{commits.length !== 1 ? 's' : ''}, {Object.keys(state.branches).length} branche{Object.keys(state.branches).length !== 1 ? 's' : ''}
          </span>
          {exercise && onValidate && (
            <button
              onClick={() => onValidate(state)}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 shadow"
            >Valider</button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Palette
          tier={exercise?.tier || 4}
          onCommit={() => setPopup('commit')}
          onCreateBranch={() => setPopup('branch')}
          onMerge={() => setPopup('merge')}
          onUndo={doUndo}
          canUndo={undoStack.length > 0}
        />

        {/* DAG canvas */}
        <div className="flex-1 relative overflow-auto bg-[#FAFBFC]"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          onClick={() => setSelectedSha(null)}
        >
          <div className="p-6" style={{ minWidth: svgWidth, minHeight: svgHeight }}>
            <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible' }}>
              {/* Edges */}
              {commits.map(c => {
                const cp = toPx(layout.positions[c.sha]);
                return c.parents.map((pSha) => {
                  const pp = toPx(layout.positions[pSha] || { x: 0, y: 0 });
                  const d = `M ${cp.x} ${cp.y} C ${cp.x} ${(cp.y + pp.y) / 2}, ${pp.x} ${(cp.y + pp.y) / 2}, ${pp.x} ${pp.y}`;
                  return <path key={`${pSha}-${c.sha}`} d={d} fill="none" stroke="#94A3B8" strokeWidth={2} />;
                });
              })}

              {/* Commits */}
              {commits.map(c => {
                const p = toPx(layout.positions[c.sha]);
                return (
                  <CommitNode
                    key={c.sha}
                    commit={c}
                    x={p.x} y={p.y}
                    branchName={branchOfCommit[c.sha] || 'main'}
                    isHead={headSha === c.sha}
                    isSelected={selectedSha === c.sha}
                    onClick={setSelectedSha}
                  />
                );
              })}

              {/* Branch labels (stacked vertically on the same sha) */}
              {Object.entries(branchesBySha).map(([sha, names]) => {
                const p = toPx(layout.positions[sha] || { x: 0, y: 0 });
                return names.map((name, i) => (
                  <BranchLabel
                    key={`${sha}-${name}`}
                    name={name}
                    x={p.x} y={p.y + i * 24 - ((names.length - 1) * 12)}
                    isHead={headBranch === name}
                    onClick={doCheckoutTarget}
                  />
                ));
              })}

              {/* Detached HEAD pill */}
              {state.head.type === 'detached' && state.commits[state.head.ref] && (
                <HeadPill {...toPx(layout.positions[state.head.ref])} />
              )}
            </svg>

            {commits.length === 0 && (
              <div className="text-center text-slate-400 text-sm">Aucun commit. Commence par stager un fichier et committer.</div>
            )}
          </div>

          {/* Selected commit actions overlay */}
          {selectedSha && state.commits[selectedSha] && (
            <div className="absolute top-4 right-4 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-60" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-mono font-bold text-slate-700">{selectedSha}</span>
                <button onClick={() => setSelectedSha(null)} className="ml-auto text-slate-400 hover:text-slate-600 text-sm">×</button>
              </div>
              <p className="text-[11px] text-slate-600 mb-3">{state.commits[selectedSha].message}</p>
              <button
                onClick={() => { doCheckoutTarget(selectedSha); setSelectedSha(null); }}
                className="w-full py-1.5 rounded-lg bg-slate-700 text-white text-xs font-bold hover:bg-slate-800"
              >Checkout ce commit</button>
            </div>
          )}

          {banner && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-medium px-3 py-1.5 rounded-full shadow">
              {banner}
            </div>
          )}
        </div>

        {/* Working tree panel on the right */}
        <FileTree
          state={state}
          onModify={doModify}
          onStage={doStage}
          onUnstage={doUnstage}
        />
      </div>

      <CommandLog commands={commands} />

      {popup === 'commit' && (
        <CommitMessagePopup onConfirm={doCommit} onCancel={() => setPopup(null)} />
      )}
      {popup === 'branch' && (
        <BranchNamePopup onConfirm={doCreateBranch} onCancel={() => setPopup(null)} />
      )}
      {popup === 'merge' && (
        <MergePopup
          branches={allBranchNames}
          current={headBranch || ''}
          onConfirm={doMerge}
          onCancel={() => setPopup(null)}
        />
      )}
    </div>
  );
}
