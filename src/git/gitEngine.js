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

// ── Amend (réécriture du dernier commit, in-place) ──────────────
/**
 * Amend the HEAD commit : keep its SHA but replace its tree
 * (current tree merged with index) and optionally its message.
 * In real Git the SHA changes ; we mutate in place for visual stability.
 */
export function amend(state, { message } = {}) {
  const headSha = getHeadSha(state);
  if (!headSha) return { state, command: 'git commit --amend', warning: 'Aucun commit à amender.' };
  const head = state.commits[headSha];
  if (!head) return { state, command: 'git commit --amend', warning: 'Commit HEAD introuvable.' };
  const tree = { ...head.tree, ...state.index };
  const newCommit = { ...head, tree, message: message || head.message, date: Date.now() };
  return {
    state: {
      ...state,
      commits: { ...state.commits, [headSha]: newCommit },
      index: {},
    },
    command: `git commit --amend -m "${message || head.message}"`,
  };
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
  // checkout updates HEAD AND syncs workingTree to the target's tree (clearing index).
  // This mirrors `git checkout -f` semantics : simpler for the dojo, no preservation
  // of uncommitted local changes across branches.
  if (state.branches[target]) {
    const sha = state.branches[target];
    const tree = state.commits[sha]?.tree || {};
    return {
      state: {
        ...state,
        head: { type: 'branch', ref: target },
        workingTree: { ...tree },
        index: {},
      },
      command: `git switch ${target}`,
    };
  }
  if (state.commits[target]) {
    const tree = state.commits[target]?.tree || {};
    return {
      state: {
        ...state,
        head: { type: 'detached', ref: target },
        workingTree: { ...tree },
        index: {},
      },
      command: `git checkout ${target}`,
    };
  }
  return { state, command: `git switch ${target}`, warning: `Cible ${target} introuvable.` };
}

// ── Helpers : ancestors, diff, common ancestor ───────────────────
function ancestorsOf(state, sha) {
  const set = new Set();
  const q = [sha];
  while (q.length) {
    const s = q.shift();
    if (set.has(s)) continue;
    set.add(s);
    (state.commits[s]?.parents || []).forEach(p => q.push(p));
  }
  return set;
}

function findCommonAncestor(state, shaA, shaB) {
  const ancA = ancestorsOf(state, shaA);
  const q = [shaB];
  const seen = new Set();
  while (q.length) {
    const s = q.shift();
    if (seen.has(s)) continue;
    seen.add(s);
    if (ancA.has(s)) return s;
    (state.commits[s]?.parents || []).forEach(p => q.push(p));
  }
  return null;
}

// ── Merge : crée toujours un commit de merge (équivalent --no-ff) ──
// Le fast-forward n'est jamais utilisé : chaque merge produit un commit
// avec deux parents, ce qui préserve la branche source visuellement et
// rend l'historique plus lisible (pratique pour les workflows d'équipe).
export function merge(state, source) {
  const sourceSha = state.branches[source] || (state.commits[source] ? source : null);
  const currentSha = getHeadSha(state);
  if (!sourceSha) return { state, command: `git merge ${source}`, warning: `Cible ${source} introuvable.` };
  if (!currentSha) return { state, command: `git merge ${source}`, warning: 'HEAD sans commit.' };
  if (sourceSha === currentSha) return { state, command: `git merge ${source}`, warning: 'Déjà à jour : la source pointe sur le même commit que ta branche actuelle.' };
  if (state.mergeInProgress) return { state, command: `git merge ${source}`, warning: 'Un merge est déjà en cours, finalise-le ou annule-le d\'abord.' };

  const currentAnc = ancestorsOf(state, currentSha);

  // Already up to date : source is ancestor of current
  if (currentAnc.has(sourceSha)) {
    return { state, command: `git merge ${source}`, warning: 'Déjà à jour : la source est déjà incluse dans ta branche actuelle. (Astuce : pour intégrer ta branche actuelle dans la cible, switche d\'abord sur la cible.)' };
  }

  // Three-way merge : detect conflicts based on common ancestor
  const baseSha = findCommonAncestor(state, currentSha, sourceSha);
  const baseTree = baseSha ? (state.commits[baseSha]?.tree || {}) : {};
  const ourTree = state.commits[currentSha]?.tree || {};
  const theirTree = state.commits[sourceSha]?.tree || {};
  const allFiles = new Set([...Object.keys(baseTree), ...Object.keys(ourTree), ...Object.keys(theirTree)]);
  const tree = {};
  const conflicts = [];
  for (const f of allFiles) {
    const b = baseTree[f];
    const o = ourTree[f];
    const t = theirTree[f];
    if (o === t) { if (o !== undefined) tree[f] = o; }
    else if (o === b) { if (t !== undefined) tree[f] = t; }
    else if (t === b) { if (o !== undefined) tree[f] = o; }
    else {
      conflicts.push(f);
      if (o !== undefined) tree[f] = o; // tentative (will be replaced on resolve)
    }
  }

  if (conflicts.length > 0) {
    return {
      state: {
        ...state,
        mergeInProgress: { source, sourceSha, conflicts, ourTree, theirTree, baseTree },
      },
      command: `git merge ${source}`,
      warning: `Conflit sur ${conflicts.length} fichier(s) : ${conflicts.join(', ')}. Résous le conflit pour continuer.`,
    };
  }

  // No conflicts : create merge commit
  const sha = nextSha('m');
  const mergeCommit = {
    sha,
    parents: [currentSha, sourceSha],
    message: `Merge branch '${source}'`,
    author: 'user',
    tree,
    date: Date.now(),
  };
  const next = {
    ...state,
    commits: { ...state.commits, [sha]: mergeCommit },
    workingTree: { ...tree },
    index: {},
  };
  if (state.head.type === 'branch') {
    next.branches = { ...state.branches, [state.head.ref]: sha };
  } else {
    next.head = { type: 'detached', ref: sha };
  }
  return { state: next, command: `git merge ${source}` };
}

// ── Résolution de conflit : finalise ou abandonne le merge ──────
export function resolveMerge(state, resolution) {
  // resolution = 'ours' | 'theirs'
  if (!state.mergeInProgress) return { state, command: '', warning: 'Aucun merge en cours.' };
  const { source, sourceSha, ourTree, theirTree, baseTree } = state.mergeInProgress;
  const currentSha = getHeadSha(state);
  const allFiles = new Set([...Object.keys(baseTree), ...Object.keys(ourTree), ...Object.keys(theirTree)]);
  const tree = {};
  for (const f of allFiles) {
    const b = baseTree[f];
    const o = ourTree[f];
    const t = theirTree[f];
    if (o === t) { if (o !== undefined) tree[f] = o; }
    else if (o === b) { if (t !== undefined) tree[f] = t; }
    else if (t === b) { if (o !== undefined) tree[f] = o; }
    else {
      // Conflict : apply chosen resolution
      const pick = resolution === 'theirs' ? t : o;
      if (pick !== undefined) tree[f] = pick;
    }
  }
  const sha = nextSha('m');
  const mergeCommit = {
    sha,
    parents: [currentSha, sourceSha],
    message: `Merge branch '${source}'`,
    author: 'user',
    tree,
    date: Date.now(),
  };
  const next = {
    ...state,
    commits: { ...state.commits, [sha]: mergeCommit },
    mergeInProgress: undefined,
    workingTree: { ...tree },
    index: {},
  };
  if (state.head.type === 'branch') {
    next.branches = { ...state.branches, [state.head.ref]: sha };
  } else {
    next.head = { type: 'detached', ref: sha };
  }
  return { state: next, command: `git merge --continue (${resolution})` };
}

export function abortMerge(state) {
  if (!state.mergeInProgress) return { state, command: 'git merge --abort' };
  const headSha = getHeadSha(state);
  const tree = headSha ? (state.commits[headSha]?.tree || {}) : {};
  return {
    state: {
      ...state,
      mergeInProgress: undefined,
      workingTree: { ...tree },
      index: {},
    },
    command: 'git merge --abort',
  };
}

// ── Revert : crée un commit qui inverse les changements de `sha` ──
export function revert(state, sha) {
  const target = state.commits[sha];
  if (!target) return { state, command: `git revert ${sha}`, warning: `Commit ${sha} introuvable.` };
  const headSha = getHeadSha(state);
  if (!headSha) return { state, command: `git revert ${sha}`, warning: 'HEAD sans commit.' };
  if (target.parents.length === 0) {
    return { state, command: `git revert ${sha}`, warning: 'Impossible de revert le commit racine.' };
  }
  const parentTree = state.commits[target.parents[0]]?.tree || {};
  const headTree = state.commits[headSha]?.tree || {};
  const newTree = { ...headTree };
  const changed = new Set([...Object.keys(parentTree), ...Object.keys(target.tree)]);
  for (const f of changed) {
    if (parentTree[f] === target.tree[f]) continue;
    if (parentTree[f] === undefined) delete newTree[f];
    else newTree[f] = parentTree[f];
  }
  const newSha = nextSha('c');
  const newCommit = {
    sha: newSha,
    parents: [headSha],
    message: `Revert "${target.message}"`,
    author: 'user',
    tree: newTree,
    date: Date.now(),
  };
  const next = {
    ...state,
    commits: { ...state.commits, [newSha]: newCommit },
    workingTree: { ...newTree },
    index: {},
  };
  if (state.head.type === 'branch') next.branches = { ...state.branches, [state.head.ref]: newSha };
  else next.head = { type: 'detached', ref: newSha };
  return { state: next, command: `git revert ${sha}` };
}

// ── Cherry-pick : applique le diff de `sha` au-dessus de HEAD ─────
export function cherryPick(state, sha) {
  const target = state.commits[sha];
  if (!target) return { state, command: `git cherry-pick ${sha}`, warning: `Commit ${sha} introuvable.` };
  const headSha = getHeadSha(state);
  if (!headSha) return { state, command: `git cherry-pick ${sha}`, warning: 'HEAD sans commit.' };
  if (target.parents.length === 0) {
    return { state, command: `git cherry-pick ${sha}`, warning: 'Impossible de cherry-pick le commit racine.' };
  }
  if (ancestorsOf(state, headSha).has(sha)) {
    return { state, command: `git cherry-pick ${sha}`, warning: `${sha} est déjà dans l'historique courant.` };
  }
  const parentTree = state.commits[target.parents[0]]?.tree || {};
  const headTree = state.commits[headSha]?.tree || {};
  const newTree = { ...headTree };
  const changed = new Set([...Object.keys(parentTree), ...Object.keys(target.tree)]);
  for (const f of changed) {
    if (parentTree[f] === target.tree[f]) continue;
    if (target.tree[f] === undefined) delete newTree[f];
    else newTree[f] = target.tree[f];
  }
  const newSha = nextSha('c');
  const newCommit = {
    sha: newSha,
    parents: [headSha],
    message: target.message,
    author: 'user',
    tree: newTree,
    date: Date.now(),
  };
  const next = {
    ...state,
    commits: { ...state.commits, [newSha]: newCommit },
    workingTree: { ...newTree },
    index: {},
  };
  if (state.head.type === 'branch') next.branches = { ...state.branches, [state.head.ref]: newSha };
  else next.head = { type: 'detached', ref: newSha };
  return { state: next, command: `git cherry-pick ${sha}` };
}

// ── Rebase : rejoue les commits de la branche courante sur `target` ─
export function rebase(state, target) {
  const targetSha = state.branches[target] || (state.commits[target] ? target : null);
  const currentSha = getHeadSha(state);
  if (!targetSha) return { state, command: `git rebase ${target}`, warning: `Cible ${target} introuvable.` };
  if (!currentSha) return { state, command: `git rebase ${target}`, warning: 'HEAD sans commit.' };
  if (state.head.type !== 'branch') {
    return { state, command: `git rebase ${target}`, warning: 'Le rebase nécessite une branche active.' };
  }
  const baseSha = findCommonAncestor(state, currentSha, targetSha);
  if (!baseSha) return { state, command: `git rebase ${target}`, warning: `Pas d'ancêtre commun avec ${target}.` };
  if (baseSha === currentSha) {
    return { state, command: `git rebase ${target}`, warning: 'La branche courante est déjà ancêtre de la cible.' };
  }
  if (baseSha === targetSha) {
    return { state, command: `git rebase ${target}`, warning: 'Déjà à jour avec la cible.' };
  }

  // Walk back from currentSha via first-parent until baseSha (exclusive)
  const toReplay = [];
  let cur = currentSha;
  while (cur && cur !== baseSha) {
    toReplay.unshift(cur);
    const c = state.commits[cur];
    if (!c || c.parents.length === 0) break;
    cur = c.parents[0];
  }

  let newCommits = { ...state.commits };
  let newHead = targetSha;
  let prevTree = state.commits[targetSha].tree;
  for (const oldSha of toReplay) {
    const oldCommit = state.commits[oldSha];
    const oldParentTree = state.commits[oldCommit.parents[0]]?.tree || {};
    const newTree = { ...prevTree };
    const changed = new Set([...Object.keys(oldParentTree), ...Object.keys(oldCommit.tree)]);
    for (const f of changed) {
      if (oldParentTree[f] === oldCommit.tree[f]) continue;
      if (oldCommit.tree[f] === undefined) delete newTree[f];
      else newTree[f] = oldCommit.tree[f];
    }
    const newSha = nextSha('c');
    newCommits[newSha] = {
      sha: newSha,
      parents: [newHead],
      message: oldCommit.message,
      author: oldCommit.author,
      tree: newTree,
      date: Date.now(),
    };
    newHead = newSha;
    prevTree = newTree;
  }

  const branchName = state.head.ref;
  return {
    state: {
      ...state,
      commits: newCommits,
      branches: { ...state.branches, [branchName]: newHead },
      workingTree: { ...prevTree },
      index: {},
    },
    command: `git rebase ${target}`,
  };
}

// ── Layout helper : deterministic rail-based placement ─────────
export function layoutGraph(state) {
  const commits = Object.values(state.commits);
  if (commits.length === 0) return { positions: {}, railOfBranch: {}, maxRail: 0 };

  // Rails : main = 0. Other branches get a rail only if their tip is not
  // already covered by an earlier branch's chain (avoids ghost/empty rails
  // after fast-forward merges where main absorbs another branch's tip).
  const railOfBranch = {};
  let nextRail = 0;

  // Depth from any root (max distance) → vertical position.
  // Sibling commits at the same depth share the same y so branches form
  // parallel vertical rails instead of cascading diagonally.
  const depth = {};
  const visiting = new Set();
  function getDepth(sha) {
    if (depth[sha] !== undefined) return depth[sha];
    if (visiting.has(sha)) return 0; // safety against cycles (shouldn't happen)
    visiting.add(sha);
    const c = state.commits[sha];
    if (!c || c.parents.length === 0) { depth[sha] = 0; visiting.delete(sha); return 0; }
    const d = 1 + Math.max(...c.parents.map(p => getDepth(p)));
    depth[sha] = d;
    visiting.delete(sha);
    return d;
  }
  for (const c of commits) getDepth(c.sha);

  // Assign rail per commit : process main first, then each other branch.
  // A branch shares its rail with an earlier branch if its tip is already
  // assigned (covered by main's first-parent chain or another branch).
  const railOfCommit = {};
  const allocateChain = (tip, rail) => {
    let sha = tip;
    while (sha && railOfCommit[sha] === undefined) {
      railOfCommit[sha] = rail;
      const c = state.commits[sha];
      if (!c || c.parents.length === 0) break;
      sha = c.parents[0];
    }
  };

  const branchOrder = [DEFAULT_BRANCH, ...Object.keys(state.branches).filter(b => b !== DEFAULT_BRANCH)];
  for (const b of branchOrder) {
    const tip = state.branches[b];
    if (!tip) continue;
    if (railOfCommit[tip] !== undefined) {
      // tip already on a rail (shared with main or an earlier branch)
      railOfBranch[b] = railOfCommit[tip];
      continue;
    }
    const myRail = nextRail++;
    railOfBranch[b] = myRail;
    allocateChain(tip, myRail);
  }

  for (const c of commits) {
    if (railOfCommit[c.sha] === undefined) railOfCommit[c.sha] = 0;
  }

  const positions = {};
  for (const c of commits) {
    positions[c.sha] = {
      x: railOfCommit[c.sha] ?? 0,
      y: depth[c.sha] ?? 0,
    };
  }

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
