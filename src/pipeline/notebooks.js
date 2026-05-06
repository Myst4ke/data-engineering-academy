/**
 * Pipeline Dojo — Notebook layer.
 *
 * A notebook = a chain of Data Dojo transformation cards bundled with a name,
 * description, and input/output table names. Notebooks are persisted in
 * localStorage and referenced from canvas nodes by id.
 *
 * Three sources :
 *   - 'system' : pre-defined, shipped with the app (read-only, duplicable)
 *   - 'exercise' : provided by an exercise (scoped to that exercise)
 *   - 'user' : created or saved by the learner (lives in localStorage)
 *
 * Cards reuse the Data Dojo card shape : { type, params, ...metadata }.
 * Execution is delegated to applyPipeline() from src/transformations/index.js.
 */

import { applyPipeline } from '../transformations';
import { SYSTEM_NOTEBOOKS } from './systemNotebooks';

const STORAGE_KEY = 'pipelineDojo_notebooks';

// ── Storage primitives ──────────────────────────────────────────
function loadAllUserNotebooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistUserNotebooks(byId) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(byId));
  } catch { /* localStorage full or unavailable, fail silently */ }
}

function nextId() {
  return `nb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Public CRUD ─────────────────────────────────────────────────

/**
 * List all notebooks visible to the user :
 *   - system notebooks (always)
 *   - user notebooks (from localStorage)
 *   - exercise notebooks (passed in by the current exercise, if any)
 */
export function listNotebooks({ exerciseNotebooks = [] } = {}) {
  const userById = loadAllUserNotebooks();
  const userArr = Object.values(userById);
  return [
    ...SYSTEM_NOTEBOOKS.map(n => ({ ...n, source: 'system' })),
    ...exerciseNotebooks.map(n => ({ ...n, source: 'exercise' })),
    ...userArr.map(n => ({ ...n, source: 'user' })),
  ];
}

export function getNotebook(id, { exerciseNotebooks = [] } = {}) {
  const sys = SYSTEM_NOTEBOOKS.find(n => n.id === id);
  if (sys) return { ...sys, source: 'system' };
  const exo = exerciseNotebooks.find(n => n.id === id);
  if (exo) return { ...exo, source: 'exercise' };
  const user = loadAllUserNotebooks()[id];
  if (user) return { ...user, source: 'user' };
  return null;
}

/**
 * Create a fresh user notebook in localStorage. Returns the new notebook
 * (with assigned id and timestamps).
 */
export function createUserNotebook({
  name,
  description = '',
  inputTable = '',
  outputTable = '',
  cards = [],
  createdAtExerciseId = null,
} = {}) {
  if (!name || !name.trim()) throw new Error('Notebook name required.');
  const id = nextId();
  const now = Date.now();
  const notebook = {
    id,
    name: name.trim(),
    description,
    inputTable,
    outputTable,
    cards: Array.isArray(cards) ? [...cards] : [],
    createdAtExerciseId,
    createdAt: now,
    updatedAt: now,
  };
  const all = loadAllUserNotebooks();
  all[id] = notebook;
  persistUserNotebooks(all);
  return { ...notebook, source: 'user' };
}

/**
 * Update an existing user notebook in place. System / exercise notebooks
 * cannot be modified ; pass them through duplicateAsUser() first.
 */
export function updateUserNotebook(id, patch = {}) {
  const all = loadAllUserNotebooks();
  if (!all[id]) return null;
  const next = {
    ...all[id],
    ...patch,
    id, // never overwrite id
    updatedAt: Date.now(),
  };
  all[id] = next;
  persistUserNotebooks(all);
  return { ...next, source: 'user' };
}

export function deleteUserNotebook(id) {
  const all = loadAllUserNotebooks();
  if (!all[id]) return false;
  delete all[id];
  persistUserNotebooks(all);
  return true;
}

/**
 * Duplicate any notebook (system / exercise / user) into a fresh user
 * notebook the learner can then edit.
 */
export function duplicateAsUser(notebook, { renameTo } = {}) {
  if (!notebook) return null;
  return createUserNotebook({
    name: renameTo || `${notebook.name} (copie)`,
    description: notebook.description || '',
    inputTable: notebook.inputTable || '',
    outputTable: notebook.outputTable || '',
    cards: Array.isArray(notebook.cards) ? notebook.cards.map(c => ({ ...c })) : [],
    createdAtExerciseId: null,
  });
}

/**
 * Find user notebooks tagged with a specific exercise id (used when an
 * exercise prompt says "use the notebook you created in pipe-N").
 */
export function findUserNotebooksFromExercise(exerciseId) {
  const all = Object.values(loadAllUserNotebooks());
  return all.filter(n => n.createdAtExerciseId === exerciseId);
}

// ── Execution ───────────────────────────────────────────────────

/**
 * Run a notebook on an input table : applies its card chain in order and
 * returns the resulting table. `secondTable` is forwarded to applyPipeline
 * for cards like join/concat that consume two inputs.
 */
export function runNotebook(notebook, inputTable, secondTable = null) {
  if (!notebook || !Array.isArray(notebook.cards)) return inputTable || [];
  return applyPipeline(inputTable || [], notebook.cards, secondTable);
}

// ── Validation helpers (used by exercise validators) ────────────

/**
 * Does the user have a notebook tagged for `exerciseId` ? Returns the
 * notebook or null.
 */
export function getUserNotebookFromExercise(exerciseId) {
  const matches = findUserNotebooksFromExercise(exerciseId);
  return matches[0] || null;
}

export function notebookHasCardTypes(notebook, requiredTypes = []) {
  if (!notebook || !Array.isArray(notebook.cards)) return false;
  const present = new Set(notebook.cards.map(c => c.type));
  return requiredTypes.every(t => present.has(t));
}

export function notebookCardCount(notebook) {
  return notebook && Array.isArray(notebook.cards) ? notebook.cards.length : 0;
}

// ── Canvas-aware helpers (used by pipeline exercise validators) ──

/**
 * Walks the canvas nodes and returns every notebook node together with its
 * resolved Notebook object (or null if the referenced id has been deleted).
 * Shape : [{ nodeId, notebook }].
 */
export function getNotebookNodesOnCanvas(nodes, nodeConfigs, exerciseNotebooks = []) {
  if (!Array.isArray(nodes)) return [];
  return nodes
    .filter(n => n.type === 'notebook')
    .map(n => {
      const cfg = nodeConfigs?.[n.id] || {};
      const notebook = cfg.notebookId ? getNotebook(cfg.notebookId, { exerciseNotebooks }) : null;
      return { nodeId: n.id, notebook };
    });
}

/**
 * Does the canvas have at least one notebook node referencing a notebook
 * that satisfies `predicate(notebook)` ? Useful for validators :
 *   pipelineUsesNotebook(nodes, cfgs, nb => nb?.id === 'sys-dedup')
 *   pipelineUsesNotebook(nodes, cfgs, nb => nb?.name === 'clean_clients')
 */
export function pipelineUsesNotebook(nodes, nodeConfigs, predicate, exerciseNotebooks = []) {
  if (typeof predicate !== 'function') return false;
  return getNotebookNodesOnCanvas(nodes, nodeConfigs, exerciseNotebooks)
    .some(({ notebook }) => !!notebook && predicate(notebook));
}

/**
 * Convenience : checks that at least one notebook tagged "createdAtExerciseId
 * = exerciseId" exists in the user's library. Allows validators to require
 * "you must have completed pipe-N first" without coupling exercises.
 */
export function pipelineHasUserNotebookFromExercise(exerciseId) {
  return findUserNotebooksFromExercise(exerciseId).length > 0;
}

/**
 * Get the output rows of every notebook node on the canvas, keyed by the
 * notebook name (resolved at the time of the call). Useful when a validator
 * cares about "what came out of the notebook called X" rather than chasing
 * node ids.
 */
export function notebookOutputsByName(nodes, nodeConfigs, nodeOutputs, exerciseNotebooks = []) {
  const out = {};
  for (const { nodeId, notebook } of getNotebookNodesOnCanvas(nodes, nodeConfigs, exerciseNotebooks)) {
    if (!notebook) continue;
    out[notebook.name] = nodeOutputs?.[nodeId] || [];
  }
  return out;
}
