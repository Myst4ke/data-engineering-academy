import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { GitCommit, GitBranch, GitMerge, RotateCcw, Edit3, Undo2, Copy, Repeat } from 'lucide-react';
import BackButton from '../components/BackButton';
import CommitNode from './CommitNode';
import BranchLabel, { HeadPill } from './BranchLabel';
import FileTree from './FileTree';
import CommandLog from './CommandLog';
import * as eng from './gitEngine';
import { RAIL_WIDTH, ROW_HEIGHT } from './gitTypes';

function actionBtn(extra = '') {
  return `w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs hover:bg-violet-50 transition-colors border border-transparent hover:border-violet-200 group ${extra}`;
}

/**
 * Build an SVG path from child (cx, cy) to parent (px, py) using rounded
 * right angles. Vertical layout : child below parent.
 *
 * `nearChild`  controls which end the horizontal segment is anchored at :
 *  - false (branch-off scenario, e.g. first commit of a feature off main) :
 *    horizontal close to the parent so the branch visually "splits" at the
 *    parent ; runs vertically along the child's rail.
 *  - true  (merge-join scenario, e.g. merge commit's second parent) :
 *    horizontal close to the child (= merge commit) so the merge visually
 *    "joins" at the merge commit ; runs vertically along the parent's rail.
 *
 * Same rail (cx === px) : straight vertical line.
 */
function branchPath(cx, cy, px, py, nearChild = false) {
  if (cx === px) return `M ${cx} ${cy} L ${px} ${py}`;
  const halfRow = ROW_HEIGHT / 2; // 36
  const ty = nearChild
    ? cy - Math.min(halfRow, (cy - py) * 0.5)
    : py + Math.min(halfRow, (cy - py) * 0.5);
  const r = Math.max(2, Math.min(14, ty - py - 1, cy - ty - 1, Math.abs(cx - px) / 2 - 1));
  const dir = px > cx ? 1 : -1;
  return [
    `M ${cx} ${cy}`,
    `L ${cx} ${ty + r}`,
    `Q ${cx} ${ty} ${cx + dir * r} ${ty}`,
    `L ${px - dir * r} ${ty}`,
    `Q ${px} ${ty} ${px} ${ty - r}`,
    `L ${px} ${py}`,
  ].join(' ');
}

function Palette({ tier, onCommit, onCreateBranch, onMerge, onAmend, onRebase, onUndo, canUndo }) {
  return (
    <div className="w-44 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Actions</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="text-[9px] font-bold uppercase text-slate-400 mt-1 mb-0.5 px-1">Base</div>
        <button data-tutorial="commit-btn" className={actionBtn()} onClick={onCommit} title="Committer les fichiers stagés">
          <GitCommit className="w-3.5 h-3.5 text-violet-700 shrink-0" aria-hidden="true" />
          <span className="font-medium text-slate-700 group-hover:text-violet-800">Commiter</span>
        </button>

        {tier >= 2 && (
          <>
            <div className="text-[9px] font-bold uppercase text-slate-400 mt-3 mb-0.5 px-1">Branches</div>
            <button className={actionBtn()} onClick={onCreateBranch} title="Créer une nouvelle branche">
              <GitBranch className="w-3.5 h-3.5 text-violet-700 shrink-0" aria-hidden="true" />
              <span className="font-medium text-slate-700 group-hover:text-violet-800">Nouvelle branche</span>
            </button>
            <button className={actionBtn()} onClick={onMerge} title="Fusionner une autre branche dans la courante">
              <GitMerge className="w-3.5 h-3.5 text-violet-700 shrink-0" aria-hidden="true" />
              <span className="font-medium text-slate-700 group-hover:text-violet-800">Merger</span>
            </button>
          </>
        )}

        {tier >= 3 && (
          <>
            <div className="text-[9px] font-bold uppercase text-slate-400 mt-3 mb-0.5 px-1">Réécriture</div>
            <button className={actionBtn()} onClick={onAmend} title="Réécrire le dernier commit (message + fichiers stagés)">
              <Edit3 className="w-3.5 h-3.5 text-violet-700 shrink-0" aria-hidden="true" />
              <span className="font-medium text-slate-700 group-hover:text-violet-800">Amender</span>
            </button>
            <button className={actionBtn()} onClick={onRebase} title="Rejouer les commits de la branche courante sur une autre">
              <Repeat className="w-3.5 h-3.5 text-violet-700 shrink-0" aria-hidden="true" />
              <span className="font-medium text-slate-700 group-hover:text-violet-800">Rebaser</span>
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
          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm mb-4 focus:border-violet-400 focus:outline-none"
        />
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          <button
            onClick={() => onConfirm(message.trim())}
            disabled={!message.trim()}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${message.trim() ? 'bg-violet-500 text-white hover:bg-violet-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
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
          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm mb-4 focus:border-violet-400 focus:outline-none"
        />
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          <button
            onClick={() => onConfirm(name.trim())}
            disabled={!name.trim()}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${name.trim() ? 'bg-violet-500 text-white hover:bg-violet-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >Créer</button>
        </div>
      </div>
    </div>
  );
}

function RebasePopup({ branches, current, onConfirm, onCancel }) {
  const options = branches.filter(b => b !== current);
  const [target, setTarget] = useState(options[0] || '');
  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-96 modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Rebaser sur une autre branche</h3>
        <p className="text-[11px] text-slate-500 mb-3">
          Tes commits sur <span className="font-mono font-bold text-slate-700">{current}</span> seront rejoués au-dessus de la cible. Les SHAs changent (réécriture d'historique).
        </p>
        {options.length === 0 ? (
          <p className="text-xs text-slate-500 mb-4">Aucune autre branche disponible.</p>
        ) : (
          <>
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Cible (sur quoi rejouer)</label>
            <select
              autoFocus value={target} onChange={e => setTarget(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm mb-3 bg-white focus:border-violet-400 focus:outline-none"
            >
              {options.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="flex items-center justify-center gap-2 my-2 py-2.5 rounded-lg bg-violet-50 border border-violet-200 text-[11px]">
              <span className="font-mono text-xs font-bold text-violet-800 px-2 py-0.5 rounded bg-white">{current}</span>
              <span className="text-violet-700 font-bold">posé sur</span>
              <span className="font-mono text-xs font-bold text-violet-800 px-2 py-0.5 rounded bg-white">{target}</span>
            </div>
          </>
        )}
        <div className="flex gap-2 mt-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          <button
            onClick={() => onConfirm(target)}
            disabled={!target}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${target ? 'bg-violet-500 text-white hover:bg-violet-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >Rebaser</button>
        </div>
      </div>
    </div>
  );
}

function ConflictPopup({ source, dest, conflicts, onResolve, onAbort }) {
  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-[26rem] modal-content border-2 border-amber-300" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-amber-700 mb-1">Conflit de merge</h3>
        <p className="text-[11px] text-slate-600 mb-3">
          La fusion de <span className="font-mono font-bold">{source}</span> dans <span className="font-mono font-bold">{dest}</span> ne peut pas être automatique : la même portion de fichier a été modifiée des deux côtés.
        </p>
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700 mb-1">Fichier{conflicts.length > 1 ? 's' : ''} en conflit</p>
          <ul className="text-[11px] font-mono text-amber-900 space-y-0.5">
            {conflicts.map(f => <li key={f}>· {f}</li>)}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onResolve('ours')}
            className="w-full py-2 rounded-lg bg-violet-500 text-white text-xs font-bold hover:bg-violet-600"
          >Garder la version de <span className="font-mono">{dest}</span> (ours)</button>
          <button
            onClick={() => onResolve('theirs')}
            className="w-full py-2 rounded-lg bg-sky-500 text-white text-xs font-bold hover:bg-sky-600"
          >Prendre la version de <span className="font-mono">{source}</span> (theirs)</button>
          <button
            onClick={onAbort}
            className="w-full py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-50"
          >Annuler le merge</button>
        </div>
      </div>
    </div>
  );
}

function AmendPopup({ defaultMessage, onConfirm, onCancel }) {
  const [message, setMessage] = useState(defaultMessage || '');
  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-96 modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-800 mb-2">Amender le dernier commit</h3>
        <p className="text-[11px] text-slate-500 mb-3">Le message et les fichiers stagés sont fusionnés dans le commit existant. Évite sur les commits déjà partagés.</p>
        <input
          autoFocus type="text" value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && message.trim()) onConfirm(message.trim()); }}
          placeholder="Message du commit"
          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm mb-4 focus:border-violet-400 focus:outline-none"
        />
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          <button
            onClick={() => onConfirm(message.trim())}
            disabled={!message.trim()}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${message.trim() ? 'bg-violet-500 text-white hover:bg-violet-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >Amender</button>
        </div>
      </div>
    </div>
  );
}

function MergePopup({ branches, current, onConfirm, onCancel }) {
  // Source = current branch (implicit). User picks destination.
  // Wrapper auto-switches to dest before merging.
  const options = branches.filter(b => b !== current);
  const [dest, setDest] = useState(options[0] || '');

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-96 modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Merger ta branche dans une autre</h3>
        <p className="text-[11px] text-slate-500 mb-3">
          Tu es sur <span className="font-mono font-bold text-slate-700">{current || '(détaché)'}</span>. Choisis où ses commits doivent arriver.
        </p>

        {options.length === 0 ? (
          <p className="text-xs text-slate-500 mb-4">Aucune autre branche disponible.</p>
        ) : (
          <>
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Destination</label>
            <select
              autoFocus value={dest} onChange={e => setDest(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm mb-3 bg-white focus:border-violet-400 focus:outline-none"
            >
              {options.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="flex items-center justify-center gap-2 my-2 py-2.5 rounded-lg bg-violet-50 border border-violet-200">
              <span className="font-mono text-xs font-bold text-violet-800 px-2 py-0.5 rounded bg-white">{current || '...'}</span>
              <span className="text-violet-700 font-bold text-base">→</span>
              <span className="font-mono text-xs font-bold text-violet-800 px-2 py-0.5 rounded bg-white">{dest || '...'}</span>
            </div>
          </>
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          <button
            onClick={() => onConfirm({ source: current, dest })}
            disabled={!dest || !current}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${dest && current ? 'bg-violet-500 text-white hover:bg-violet-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >Merger</button>
        </div>
      </div>
    </div>
  );
}

export default function GitCanvas({ onBack, exercise, onValidate, initialFiles }) {
  const seedState = () => exercise?.build
    ? exercise.build(eng)
    : eng.makeInitialState(initialFiles ? { files: initialFiles } : undefined);
  const [state, setState] = useState(seedState);
  const [commands, setCommands] = useState([]);
  const [selectedSha, setSelectedSha] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [popup, setPopup] = useState(null); // 'commit' | 'branch' | 'merge' | 'amend' | null
  const [banner, setBanner] = useState(null); // transient feedback message

  // Reset when exercise changes (or sandbox seed)
  useEffect(() => {
    setState(seedState());
    setCommands([]);
    setSelectedSha(null);
    setUndoStack([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const doStageAll = () => apply(s => eng.stageAll(s));
  const doCommit = (message) => { apply(s => eng.commit(s, { message })); setPopup(null); };
  const doCreateBranch = (name) => { apply(s => eng.createBranch(s, name)); setPopup(null); };
  const doRevert = (sha) => { apply(s => eng.revert(s, sha)); setSelectedSha(null); };
  const doCherryPick = (sha) => { apply(s => eng.cherryPick(s, sha)); setSelectedSha(null); };
  const doRebase = (target) => { apply(s => eng.rebase(s, target)); setPopup(null); };
  const doResolveMerge = (resolution) => { apply(s => eng.resolveMerge(s, resolution)); };
  const doAbortMerge = () => { apply(s => eng.abortMerge(s)); };
  const doMerge = ({ source, dest }) => {
    setPopup(null);
    const headBranch = state.head.type === 'branch' ? state.head.ref : null;
    let curState = state;
    const newCommands = [];
    let warning = null;

    // Auto-switch to destination if needed
    if (dest && dest !== headBranch) {
      const r = eng.checkout(curState, dest);
      curState = r.state;
      if (r.command) newCommands.push(r.command);
      if (r.warning) warning = r.warning;
    }

    // Merge source into (now) destination (always creates a merge commit)
    const m = eng.merge(curState, source);
    curState = m.state;
    if (m.command) newCommands.push(m.command);
    if (m.warning) warning = m.warning;

    if (curState !== state) {
      pushHistory(eng.cloneState(state));
      setState(curState);
    }
    if (newCommands.length) setCommands(c => [...c, ...newCommands]);
    setBanner(warning);
  };
  const doAmend = (message) => { apply(s => eng.amend(s, { message })); setPopup(null); };
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
              data-tutorial="validate-btn"
              onClick={() => onValidate(state)}
              className="px-4 py-1.5 rounded-lg bg-violet-500 text-white text-xs font-bold hover:bg-violet-600 shadow"
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
          onAmend={() => setPopup('amend')}
          onRebase={() => setPopup('rebase')}
          onUndo={doUndo}
          canUndo={undoStack.length > 0}
        />

        {/* DAG canvas */}
        <div data-tutorial="canvas" className="flex-1 relative overflow-auto bg-[#FAFBFC]"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          onClick={() => setSelectedSha(null)}
        >
          <div className="p-6" style={{ minWidth: svgWidth, minHeight: svgHeight }}>
            <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible' }}>
              {/* Edges : rounded right-angle paths between commits.
                  Merge commit's non-first parent : horizontal anchored near the merge (child).
                  Otherwise : anchored near the parent (branch-off visual). */}
              {commits.map(c => {
                const cp = toPx(layout.positions[c.sha]);
                const isMerge = c.parents.length >= 2;
                return c.parents.map((pSha, i) => {
                  const pp = toPx(layout.positions[pSha] || { x: 0, y: 0 });
                  const nearChild = isMerge && i > 0;
                  const d = branchPath(cp.x, cp.y, pp.x, pp.y, nearChild);
                  return <path key={`${pSha}-${c.sha}`} d={d} fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />;
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

          {/* Selected commit actions overlay : top-12 to clear the énoncé banner */}
          {selectedSha && state.commits[selectedSha] && (() => {
            const tier = exercise?.tier || 4;
            return (
              <div className="absolute top-12 right-4 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-64 z-20" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-mono font-bold text-slate-700">{selectedSha}</span>
                  <button onClick={() => setSelectedSha(null)} className="ml-auto text-slate-400 hover:text-slate-600 text-sm">×</button>
                </div>
                <p className="text-[11px] text-slate-600 mb-3">{state.commits[selectedSha].message}</p>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => { doCheckoutTarget(selectedSha); setSelectedSha(null); }}
                    className="w-full py-1.5 rounded-lg bg-slate-700 text-white text-xs font-bold hover:bg-slate-800"
                  >Checkout ce commit</button>
                  {tier >= 3 && (
                    <button
                      onClick={() => doRevert(selectedSha)}
                      className="w-full py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 flex items-center justify-center gap-1.5"
                    >
                      <Undo2 className="w-3 h-3" /> Revert ce commit
                    </button>
                  )}
                  {tier >= 4 && (
                    <button
                      onClick={() => doCherryPick(selectedSha)}
                      className="w-full py-1.5 rounded-lg bg-sky-500 text-white text-xs font-bold hover:bg-sky-600 flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" /> Cherry-pick ce commit
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

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
          onStageAll={doStageAll}
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
      {popup === 'rebase' && (
        <RebasePopup
          branches={allBranchNames}
          current={headBranch || ''}
          onConfirm={doRebase}
          onCancel={() => setPopup(null)}
        />
      )}
      {state.mergeInProgress && (
        <ConflictPopup
          source={state.mergeInProgress.source}
          dest={state.head.type === 'branch' ? state.head.ref : '(détaché)'}
          conflicts={state.mergeInProgress.conflicts}
          onResolve={doResolveMerge}
          onAbort={doAbortMerge}
        />
      )}
      {popup === 'amend' && (() => {
        const headSha = state.head.type === 'branch' ? state.branches[state.head.ref] : state.head.ref;
        const headMsg = headSha ? (state.commits[headSha]?.message || '') : '';
        return (
          <AmendPopup
            defaultMessage={headMsg}
            onConfirm={doAmend}
            onCancel={() => setPopup(null)}
          />
        );
      })()}
    </div>
  );
}
