/**
 * Progress management with localStorage
 */

const STORAGE_KEY = 'dataDojo';

const defaultState = {
  completed: [],
  unlockAll: false,
};

export function getProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultState, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error reading progress:', e);
  }
  return defaultState;
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Error saving progress:', e);
  }
}

export function markExerciseCompleted(exerciseId) {
  const progress = getProgress();
  if (!progress.completed.includes(exerciseId)) {
    progress.completed.push(exerciseId);
    saveProgress(progress);
  }
  return progress;
}

export function isExerciseCompleted(exerciseId) {
  const progress = getProgress();
  return progress.completed.includes(exerciseId);
}

export function setUnlockAll(value) {
  const progress = getProgress();
  progress.unlockAll = value;
  saveProgress(progress);
  return progress;
}

export function getUnlockAll() {
  return getProgress().unlockAll;
}

export function getCompletedCount() {
  return getProgress().completed.length;
}

export function isTierUnlocked(tier, exercisesByTier) {
  const progress = getProgress();

  // UnlockAll override
  if (progress.unlockAll) return true;

  // Beginner is always unlocked
  if (tier === 'beginner') return true;

  // Intermediate unlocks when all beginner completed
  if (tier === 'intermediate') {
    const beginnerIds = exercisesByTier.beginner.map(e => e.id);
    return beginnerIds.every(id => progress.completed.includes(id));
  }

  // Expert unlocks when all intermediate completed
  if (tier === 'expert') {
    const intermediateIds = exercisesByTier.intermediate.map(e => e.id);
    return intermediateIds.every(id => progress.completed.includes(id));
  }

  return false;
}

export function resetProgress() {
  saveProgress(defaultState);
}
