/**
 * Git Dojo : moteur d'état simplifié. Toutes les actions sont des fonctions
 * pures `(state, params) → { state, command, warning? }`.
 */

import { DEFAULT_BRANCH } from './gitTypes';

let shaCounter = 0;
export function resetShaCounter(n = 0) { shaCounter = n; }
function nextSha(prefix = 'c') {
  shaCounter += 1;
  return `${prefix}${String(shaCounter).padStart(6, '0')}`.slice(0, 7);
}

export function makeInitialState({ files = {}, initialMessage = 'Initial commit', branch = DEFAULT_BRANCH } = {}) {
  resetShaCounter(0);
  const sha = nextSha('c');
  return {
    commits: {
      [sha]: { sha, parents: [], message: initialMessage, tree: { ...files }, date: 0 },
    },
    branches: { [branch]: sha },
    tags: {},
    head: { type: 'branch', ref: branch },
    workingTree: { ...files },
    index: {},
    remote: null,
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function getHeadSha(state) {
  if (state.head.type === 'branch') return state.branches[state.head.ref] || null;
  return state.head.ref;
}

export function getHeadBranch(state) {
  return state.head.type === 'branch' ? state.head.ref : null;
}

// ── Working tree / index ─────────────────────────────────────────
export function modifyFile(state, file, content) {
  return {
    state: { ...state, workingTree: { ...state.workingTree, [file]: content } },
    command: null,
  };
}

export function deleteFile(state, file) {
  const { [file]: _, ...rest } = state.workingTree;
  const { [file]: __, ...restIdx } = state.index;
  return {
    state: { ...state, workingTree: rest, index: restIdx },
    command: `git rm ${file}`,
  };
}

export function stage(state, file) {
  if (!(file in state.workingTree)) {
    return { state, command: `git add ${file}`, warning: `Fichier ${file} introuvable.` };
  }
  // Already staged AND unchanged : no-op
  if (state.index[file] === state.workingTree[file]) {
    return { state, command: `git add ${file}` };
  }
  return {
    state: { ...state, index: { ...state.index, [file]: state.workingTree[file] } },
    command: `git add ${file}`,
  };
}

export function unstage(state, file) {
  if (!(file in state.index)) return { state, command: `git restore --staged ${file}` };
  const { [file]: _, ...rest } = state.index;
  return { state: { ...state, index: rest }, command: `git restore --staged ${file}` };
}

export function stageAll(state) {
  const newIndex = { ...state.index };
  const headTree = state.commits[getHeadSha(state)]?.tree || {};
  for (const [f, content] of Object.entries(state.workingTree)) {
    if (headTree[f] !== content) newIndex[f] = content;
  }
  return { state: { ...state, index: newIndex }, command: 'git add .' };
}

// ── Commit ───────────────────────────────────────────────────────
export function commit(state, { message, author = 'user' }) {
  if (Object.keys(state.index).length === 0) {
    return { state, command: `git commit -m "${message}"`, warning: 'Rien à committer (index vide).' };
  }
  const parentSha = getHeadSha(state);
  const parents = parentSha ? [parentSha] : [];
  const parentTree = parentSha ? (state.commits[parentSha]?.tree || {}) : {};
  const tree = { ...parentTree, ...state.index };
  const sha = nextSha('c');
  const newCommit = { sha, parents, message: message || '(sans message)', author, tree, date: Date.now() };

  const nextState = {
    ...state,
    commits: { ...state.commits, [sha]: newCommit },
    index: {},
  };
  if (state.head.type === 'branch') {
    nextState.branches = { ...state.branches, [state.head.ref]: sha };
  } else {
    nextState.head = { type: 'detached', ref: sha };
  }
  return { state: nextState, command: `git commit -m "${message}"` };
}

// ── Branches / HEAD ─────────────────────────────────────────────
export function createBranch(state, name) {
  if (!name || !name.trim()) return { state, command: `git branch`, warning: 'Nom de branche vide.' };
  const n = name.trim();
  if (state.branches[n]) return { state, command: `git switch -c ${n}`, warning: `La branche ${n} existe déjà.` };
  const sha = getHeadSha(state);
  if (!sha) return { state, command: `git switch -c ${n}`, warning: 'HEAD sans commit.' };
  return {
    state: {
      ...state,
      branches: { ...state.branches, [n]: sha },
      head: { type: 'branch', ref: n },
    },
    command: `git switch -c ${n}`,
  };
}

export function deleteBranch(state, name) {
  if (!state.branches[name]) return { state, command: `git branch -d ${name}`, warning: `Branche ${name} inconnue.` };
  if (state.head.type === 'branch' && state.head.ref === name) {
    return { state, command: `git branch -d ${name}`, warning: `Impossible de supprimer la branche active.` };
  }
  const { [name]: _, ...rest } = state.branches;
  return { state: { ...state, branches: rest }, command: `git branch -d ${name}` };
}

export function checkout(state, target) {
  if (state.branches[target]) {
    return {
      state: { ...state, head: { type: 'branch', ref: target } },
      command: `git switch ${target}`,
    };
  }
  if (state.commits[target]) {
    return {
      state: { ...state, head: { type: 'detached', ref: target } },
      command: `git checkout ${target}`,
    };
  }
  return { state, command: `git switch ${target}`, warning: `Cible ${target} introuvable.` };
}

// ── Merge : fast-forward ou three-way ──────────────────────────
export function merge(state, source) {
  const sourceSha = state.branches[source] || (state.commits[source] ? source : null);
  const currentSha = getHeadSha(state);
  if (!sourceSha) return { state, command: `git merge ${source}`, warning: `Cible ${source} introuvable.` };
  if (!currentSha) return { state, command: `git merge ${source}`, warning: 'HEAD sans commit.' };
  if (sourceSha === currentSha) return { state, command: `git merge ${source}`, warning: 'Déjà à jour.' };

  const ancestors = (sha) => {
    const set = new Set();
    const q = [sha];
    while (q.length) {
      const s = q.shift();
      if (set.has(s)) continue;
      set.add(s);
      (state.commits[s]?.parents || []).forEach(p => q.push(p));
    }
    return set;
  };

  const sourceAnc = ancestors(sourceSha);
  const currentAnc = ancestors(currentSha);

  // Fast-forward : current is ancestor of source
  if (sourceAnc.has(currentSha) && !currentAnc.has(sourceSha)) {
    const next = { ...state };
    if (state.head.type === 'branch') {
      next.branches = { ...state.branches, [state.head.ref]: sourceSha };
    } else {
      next.head = { type: 'detached', ref: sourceSha };
    }
    return { state: next, command: `git merge ${source}` };
  }

  // Already up to date : source is ancestor of current
  if (currentAnc.has(sourceSha)) {
    return { state, command: `git merge ${source}`, warning: 'Déjà à jour.' };
  }

  // Three-way merge : create merge commit with 2 parents
  const sha = nextSha('m');
  const mergeCommit = {
    sha,
    parents: [currentSha, sourceSha],
    message: `Merge branch '${source}'`,
    author: 'user',
    tree: { ...(state.commits[currentSha]?.tree || {}), ...(state.commits[sourceSha]?.tree || {}) },
    date: Date.now(),
  };
  const next = {
    ...state,
    commits: { ...state.commits, [sha]: mergeCommit },
  };
  if (state.head.type === 'branch') {
    next.branches = { ...state.branches, [state.head.ref]: sha };
  } else {
    next.head = { type: 'detached', ref: sha };
  }
  return { state: next, command: `git merge ${source}` };
}

// ── Layout helper : deterministic rail-based placement ─────────
export function layoutGraph(state) {
  const commits = Object.values(state.commits);
  if (commits.length === 0) return { positions: {}, railOfBranch: {}, maxRail: 0 };

  // Rails : main = 0, others in creation order
  const railOfBranch = {};
  const branches = Object.keys(state.branches);
  let nextRail = 0;
  if (state.branches[DEFAULT_BRANCH]) {
    railOfBranch[DEFAULT_BRANCH] = nextRail++;
  }
  for (const b of branches) {
    if (b === DEFAULT_BRANCH) continue;
    railOfBranch[b] = nextRail++;
  }

  // Topological order : roots first
  const inDeg = {};
  const adj = {};
  for (const c of commits) {
    inDeg[c.sha] = 0;
    adj[c.sha] = [];
  }
  for (const c of commits) {
    for (const p of c.parents) {
      if (adj[p]) adj[p].push(c.sha);
      inDeg[c.sha] = (inDeg[c.sha] || 0) + 1;
    }
  }
  const topo = [];
  const q = commits.filter(c => (inDeg[c.sha] || 0) === 0).map(c => c.sha);
  const seen = new Set();
  while (q.length) {
    const s = q.shift();
    if (seen.has(s)) continue;
    seen.add(s);
    topo.push(s);
    for (const ch of (adj[s] || [])) q.push(ch);
  }

  // Assign rail per commit : trace from each branch tip backwards via first parent
  const railOfCommit = {};
  const assign = (sha, rail) => {
    while (sha && railOfCommit[sha] === undefined) {
      railOfCommit[sha] = rail;
      const c = state.commits[sha];
      if (!c || c.parents.length === 0) break;
      sha = c.parents[0];
    }
  };
  // Prioritize main rail first so other branches stop when they reach main
  if (state.branches[DEFAULT_BRANCH]) assign(state.branches[DEFAULT_BRANCH], 0);
  for (const b of branches) {
    if (b === DEFAULT_BRANCH) continue;
    assign(state.branches[b], railOfBranch[b]);
  }
  // Any stragglers
  for (const c of commits) {
    if (railOfCommit[c.sha] === undefined) railOfCommit[c.sha] = 0;
  }

  const positions = {};
  topo.forEach((sha, i) => {
    positions[sha] = {
      x: (railOfCommit[sha] ?? 0),
      y: i,
    };
  });

  return { positions, railOfBranch, maxRail: nextRail };
}

// ── Structural fingerprint of the graph (for the validator) ────
/**
 * Normalizes the DAG so that SHAs are replaced by stable labels like C1, C2, M1.
 * Two topologically isomorphic graphs produce the same fingerprint string.
 * Used by the validator to compare current vs target states regardless of SHAs.
 */
export function fingerprint(state) {
  const commits = Object.values(state.commits);
  const byParentCount = commits.slice().sort((a, b) => a.parents.length - b.parents.length);
  // Topological order
  const inDeg = {};
  const adj = {};
  for (const c of commits) { inDeg[c.sha] = c.parents.length; adj[c.sha] = []; }
  for (const c of commits) for (const p of c.parents) (adj[p] || (adj[p] = [])).push(c.sha);
  const topo = [];
  const q = byParentCount.filter(c => c.parents.length === 0).map(c => c.sha);
  const seen = new Set();
  while (q.length) {
    const s = q.shift();
    if (seen.has(s)) continue;
    seen.add(s);
    topo.push(s);
    for (const ch of (adj[s] || [])) q.push(ch);
  }
  const labelBySha = {};
  let c = 0, m = 0;
  for (const sha of topo) {
    const commitObj = state.commits[sha];
    if (commitObj.parents.length >= 2) { m += 1; labelBySha[sha] = `M${m}`; }
    else { c += 1; labelBySha[sha] = `C${c}`; }
  }
  const edges = [];
  for (const sha of topo) {
    for (const p of state.commits[sha].parents) {
      edges.push(`${labelBySha[p]}→${labelBySha[sha]}`);
    }
  }
  const branches = Object.entries(state.branches)
    .map(([name, sha]) => `${name}@${labelBySha[sha] || '?'}`)
    .sort();
  const headRepr = state.head.type === 'branch'
    ? `HEAD→${state.head.ref}`
    : `HEAD@${labelBySha[state.head.ref] || state.head.ref}`;
  return { edges, branches, head: headRepr, labelBySha };
}
