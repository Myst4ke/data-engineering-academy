/**
 * Git Dojo validator. Receives the live state + the exercise target and
 * returns { passed, warnings, stars }.
 *
 * Targets are coarse-grained checks (commit count, head position, etc.)
 * rather than exact SHA matches, because SHAs are generated dynamically.
 */

export function validateGit(state, exercise) {
  const target = exercise?.target;
  if (!target) return { passed: true, warnings: [], stars: 3 };

  const warnings = [];
  const commits = Object.values(state.commits);

  if (typeof target.commitCount === 'number' && commits.length !== target.commitCount) {
    warnings.push({
      level: 'error',
      message: `Nombre de commits attendu : ${target.commitCount}, actuel : ${commits.length}.`,
    });
  }

  if (target.headBranch) {
    if (state.head.type !== 'branch' || state.head.ref !== target.headBranch) {
      warnings.push({
        level: 'error',
        message: `HEAD doit pointer sur la branche ${target.headBranch}.`,
      });
    }
  }

  if (target.hasBranch) {
    if (!state.branches[target.hasBranch]) {
      warnings.push({ level: 'error', message: `La branche ${target.hasBranch} n'existe pas encore.` });
    }
  }

  if (target.indexEmpty && Object.keys(state.index).length > 0) {
    warnings.push({ level: 'warn', message: `La zone stagée n'est pas vide (${Object.keys(state.index).join(', ')}).` });
  }

  // Head at tip of main (no commits in the index, no uncommitted changes expected to match target)
  if (target.headAtTip && state.head.type === 'branch') {
    const tipSha = state.branches[state.head.ref];
    const headSha = state.head.type === 'branch' ? tipSha : state.head.ref;
    if (tipSha !== headSha) {
      warnings.push({ level: 'error', message: `HEAD devrait être au bout de la branche.` });
    }
  }

  if (target.mustContainFile) {
    const hasFile = commits.some(c => c.tree && target.mustContainFile in c.tree);
    if (!hasFile) {
      warnings.push({ level: 'error', message: `Aucun commit ne contient ${target.mustContainFile}.` });
    }
  }

  if (target.mustNotCommitFile) {
    const committed = commits.some(c => c.tree && target.mustNotCommitFile in c.tree);
    if (committed) {
      warnings.push({ level: 'error', message: `${target.mustNotCommitFile} ne doit pas apparaître dans l'historique.` });
    }
  }

  if (target.workingTreeHasModified) {
    const f = target.workingTreeHasModified;
    const head = state.head.type === 'branch' ? state.branches[state.head.ref] : state.head.ref;
    const headTree = head ? (state.commits[head]?.tree || {}) : {};
    if (!(f in state.workingTree)) {
      warnings.push({ level: 'error', message: `${f} devrait être présent dans le working tree.` });
    } else if (headTree[f] === state.workingTree[f]) {
      warnings.push({ level: 'error', message: `${f} devrait être modifié (non identique au dernier commit).` });
    }
  }

  if (target.linearChain) {
    // No merge commits
    const merges = commits.filter(c => c.parents.length >= 2);
    if (merges.length > 0) {
      warnings.push({ level: 'error', message: `L'historique devrait être linéaire (sans commit de merge).` });
    }
  }

  if (target.headDetached && state.head.type !== 'detached') {
    warnings.push({ level: 'error', message: `HEAD devrait être détaché (cliquer sur un commit pour s'y positionner).` });
  }

  if (target.headAtRootCommit && state.head.type === 'detached') {
    const c = state.commits[state.head.ref];
    if (!c || c.parents.length !== 0) {
      warnings.push({ level: 'error', message: `HEAD devrait être sur le tout premier commit (celui sans parent).` });
    }
  }

  if (target.branchDivergence) {
    // Each branch should have at least N commits beyond their common ancestor
    for (const [branch, atLeast] of Object.entries(target.branchDivergence)) {
      const tipSha = state.branches[branch];
      if (!tipSha) {
        warnings.push({ level: 'error', message: `Branche ${branch} introuvable.` });
        continue;
      }
    }
    const [bA, bB] = Object.keys(target.branchDivergence);
    const shaA = state.branches[bA];
    const shaB = state.branches[bB];
    if (shaA && shaB && shaA === shaB) {
      warnings.push({ level: 'error', message: `${bA} et ${bB} pointent sur le même commit : il n'y a pas de divergence.` });
    }
  }

  if (target.mainAdvanced) {
    // main should not be at its starting point
    const mainSha = state.branches['main'];
    if (mainSha) {
      const mainCommit = state.commits[mainSha];
      if (!mainCommit || mainCommit.parents.length === 0) {
        warnings.push({ level: 'error', message: `main n'a pas avancé (merge non effectué).` });
      }
    }
  }

  if (target.noMergeCommit) {
    const headSha = state.head.type === 'branch' ? state.branches[state.head.ref] : state.head.ref;
    const tip = state.commits[headSha];
    if (tip && tip.parents.length >= 2) {
      warnings.push({ level: 'warn', message: `Un commit de merge a été créé : pour un fast-forward, pas de commit de merge attendu.` });
    }
  }

  const errors = warnings.filter(w => w.level === 'error').length;
  const warns = warnings.filter(w => w.level === 'warn').length;
  const passed = errors === 0;
  let stars = 0;
  if (passed) stars = warns === 0 ? 3 : warns <= 2 ? 2 : 1;
  return { passed, warnings, stars };
}
