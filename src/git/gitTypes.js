export const DEFAULT_BRANCH = 'main';

export const FILE_STATES = {
  UNTRACKED: 'untracked',
  MODIFIED:  'modified',
  STAGED:    'staged',
  COMMITTED: 'committed',
};

// Rails (columns) assigned deterministically by branch name.
// Main is always rail 0 ; others receive rails 1, 2, 3 in creation order.
export const RAIL_WIDTH = 140;
export const COMMIT_RADIUS = 16;
export const ROW_HEIGHT = 72;

// Branch colors (rail palette). Stable per branch name.
export const BRANCH_COLORS = {
  main:      { color: '#059669', light: '#D1FAE5' },
  develop:   { color: '#6BA4FF', light: '#DCE8FF' },
  feature:   { color: '#FF8066', light: '#FFE5DC' },
  hotfix:    { color: '#F472B6', light: '#FCE7F3' },
  release:   { color: '#FFC857', light: '#FFF2D1' },
  other:     { color: '#8B5CF6', light: '#EDE9FE' },
};

export function colorForBranch(name) {
  if (name === 'main' || name === 'master') return BRANCH_COLORS.main;
  if (name === 'develop' || name === 'dev') return BRANCH_COLORS.develop;
  if (name.startsWith('feature/')) return BRANCH_COLORS.feature;
  if (name.startsWith('hotfix/'))  return BRANCH_COLORS.hotfix;
  if (name.startsWith('release/')) return BRANCH_COLORS.release;
  return BRANCH_COLORS.other;
}

export const DM_TIERS = [
  { id: 1, name: 'Snapshots',       difficulty: 1 },
  { id: 2, name: 'Branches',        difficulty: 2 },
  { id: 3, name: 'Réécriture',      difficulty: 3 },
  { id: 4, name: 'Collaboration',   difficulty: 4 },
];
