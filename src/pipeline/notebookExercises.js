/**
 * Pipeline Dojo — notebook-based exercises.
 *
 * Exercises now revolve around NOTEBOOKS (chains of Data Dojo cards bundled
 * as a reusable unit) rather than placing atomic transformation nodes by hand.
 *
 *   T1 "Composer"      : connect ready-made system notebooks
 *   T2 "Adapter"       : open & modify a notebook fed by the exercise
 *   T3 "Créer"         : build a notebook from scratch ; saved for later reuse
 *   T4 "Architecturer" : combine notebooks (incl. user notebooks from T3)
 *
 * Each exercise can declare `availableNotebookIds` (system whitelist) to keep
 * the palette focused on the notebooks useful for the task. User notebooks the
 * learner creates inside the exercise are always visible.
 *
 * Exercise shape :
 *   id, title, description, prompt, hint, hintNodes,
 *   tier, difficulty, isTutorial?,
 *   sources, providedNotebooks?, availableNotebookIds?, validate(...)
 *
 * The module also exposes the same progress / tier / unlock helpers as the
 * legacy `exercises.js`, so it can be a drop-in replacement in PipelineDojo.
 */

import { pipelineUsesNotebook } from './notebooks';

// ── Tier definitions (match legacy shape used by ExerciseSelector) ──
export const TIERS = [
  { id: 1, name: 'Composer',      color: 'from-emerald-400 to-green-500',  icon: '🔗',  minToUnlockNext: 3 },
  { id: 2, name: 'Adapter',       color: 'from-blue-400 to-indigo-500',    icon: '🔧',  minToUnlockNext: 3 },
  { id: 3, name: 'Créer',         color: 'from-amber-400 to-orange-500',   icon: '✏️',  minToUnlockNext: 3 },
  { id: 4, name: 'Architecturer', color: 'from-red-400 to-rose-600',       icon: '🧱',  minToUnlockNext: null },
];

// Kept for any code that still imports it.
export const NB_TIERS = TIERS.map(t => ({ id: t.id, name: t.name, difficulty: t.id }));

// ── Sample datasets (reused across exos) ────────────────────────
const CLIENTS_WITH_DUPES = [
  { id: '1', nom: 'Dupont Marie',   email: 'marie@mail.com',  ville: 'Paris' },
  { id: '2', nom: 'Martin Pierre',  email: 'pierre@mail.com', ville: 'Lyon' },
  { id: '3', nom: 'Bernard Julie',  email: 'julie@mail.com',  ville: 'Marseille' },
  { id: '4', nom: 'Petit Luc',      email: 'luc@mail.com',    ville: 'Paris' },
  { id: '1', nom: 'Dupont Marie',   email: 'marie@mail.com',  ville: 'Paris' },
  { id: '3', nom: 'Bernard Julie',  email: 'julie@mail.com',  ville: 'Marseille' },
];

const COMMANDES_AVEC_VIDES = [
  { id: 'C1', client_id: '1', date: '2024-01-10', montant: '150', statut: 'Livree' },
  { id: 'C2', client_id: '2', date: '2024-01-15', montant: '',    statut: 'Livree' },
  { id: 'C3', client_id: '3', date: '2024-02-01', montant: '320', statut: 'En cours' },
  { id: 'C4', client_id: '1', date: '2024-02-14', montant: '85',  statut: '' },
  { id: 'C5', client_id: '4', date: '2024-03-01', montant: '210', statut: 'Livree' },
  { id: 'C6', client_id: '5', date: '2024-03-15', montant: '95',  statut: 'Annulee' },
];

const COMMANDES_VARIEES = [
  { id: 'C1', client: 'Marie',  montant: '150', statut: 'Livree' },
  { id: 'C2', client: 'Pierre', montant: '90',  statut: 'En cours' },
  { id: 'C3', client: 'Julie',  montant: '320', statut: 'Livree' },
  { id: 'C4', client: 'Luc',    montant: '85',  statut: 'Annulee' },
  { id: 'C5', client: 'Sophie', montant: '210', statut: 'Livree' },
];

// ── Helpers used by validators ──────────────────────────────────
function getDestinationData(outputs, nodes, conns) {
  const dest = nodes.find(n => ['csv_export', 'warehouse', 'dashboard'].includes(n.type));
  if (!dest) return null;
  const inc = conns.filter(c => c.to === dest.id);
  return inc.length > 0 ? (outputs[inc[0].from] || []) : [];
}

function usesSystemNotebook(nodes, nodeConfigs, sysId) {
  return pipelineUsesNotebook(nodes, nodeConfigs, nb => nb?.id === sysId);
}

// ── Exercises ────────────────────────────────────────────────────
export const EXERCISES = [

  // ════════════════ TIER 1 : COMPOSER ════════════════
  {
    id: 'pipe-nb-01',
    tier: 1,
    difficulty: 1,
    isTutorial: true,
    title: 'Premier pipeline',
    description: "Connecter une source à un notebook système puis à une destination.",
    prompt: `Bienvenue dans le Pipeline Dojo !

Ici, on n'enchaîne plus des cartes une par une comme dans le Data Dojo : on assemble des NOTEBOOKS (chaînes de transformations préparées) entre une source et une destination.

À faire :
1. Dans la palette à gauche, section "Notebooks", clique sur "Dédoublonner" pour l'ajouter au canvas
2. Ajoute un nœud Source CSV (section Sources), choisis la table "clients" via clic droit
3. Connecte la source au notebook
4. Ajoute un nœud Export CSV (Destinations) et connecte le notebook dessus

Le notebook va automatiquement supprimer les doublons.`,
    hint: "Notebook 'Dédoublonner' (palette gauche, section Notebooks) + Source CSV (clients) + Export CSV.",
    hintNodes: ['csv_source', 'notebook', 'csv_export'],
    sources: { csv_source: [{ name: 'clients', data: CLIENTS_WITH_DUPES }] },
    availableNotebookIds: ['sys-dedup'],
    validate: (outputs, nodes, conns, nodeConfigs) => {
      if (!usesSystemNotebook(nodes, nodeConfigs, 'sys-dedup')) {
        return { ok: false, msg: "Tu dois utiliser le notebook système 'Dédoublonner'." };
      }
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: "Ajoute une destination (Export CSV)." };
      if (data.length === 4) return { ok: true, msg: 'Pipeline fonctionnel : 4 clients uniques exportés.' };
      return { ok: false, msg: `Attendu : 4 clients uniques. Reçu : ${data.length}.` };
    },
  },

  {
    id: 'pipe-nb-02',
    tier: 1,
    difficulty: 1,
    title: 'Nettoyer les vides',
    description: "Utiliser un notebook système pour retirer les lignes incomplètes.",
    prompt: `Le service compta veut un export commandes sans aucune ligne vide.

À faire :
1. Source CSV → table "commandes"
2. Branche le notebook système "Nettoyer les vides"
3. Export CSV en sortie

Tu n'as rien à configurer dans le notebook : il fait le travail tel quel.`,
    hint: "Notebook 'Nettoyer les vides' entre la source et l'export.",
    hintNodes: ['csv_source', 'notebook', 'csv_export'],
    sources: { csv_source: [{ name: 'commandes', data: COMMANDES_AVEC_VIDES }] },
    availableNotebookIds: ['sys-clean-na'],
    validate: (outputs, nodes, conns, nodeConfigs) => {
      if (!usesSystemNotebook(nodes, nodeConfigs, 'sys-clean-na')) {
        return { ok: false, msg: "Utilise le notebook 'Nettoyer les vides'." };
      }
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: "Ajoute une destination." };
      const expected = COMMANDES_AVEC_VIDES.filter(r => r.montant && r.statut).length;
      if (data.length === expected) return { ok: true, msg: `${expected} commandes complètes exportées.` };
      return { ok: false, msg: `Attendu : ${expected} lignes. Reçu : ${data.length}.` };
    },
  },

  {
    id: 'pipe-nb-03',
    tier: 1,
    difficulty: 1,
    title: 'Filtrer les actifs',
    description: "Garder uniquement les commandes livrées via un notebook système.",
    prompt: `Le dashboard ne doit afficher que les commandes effectivement livrées (statut "Livree").

À faire :
1. Source CSV → "commandes"
2. Notebook système "Filtrer actifs"
3. Dashboard

Le notebook applique un filtre statut = "Livree" sans que tu aies à toucher aux paramètres.`,
    hint: "Notebook 'Filtrer actifs' + destination Dashboard.",
    hintNodes: ['csv_source', 'notebook', 'dashboard'],
    sources: { csv_source: [{ name: 'commandes', data: COMMANDES_VARIEES }] },
    availableNotebookIds: ['sys-filter-active'],
    validate: (outputs, nodes, conns, nodeConfigs) => {
      if (!usesSystemNotebook(nodes, nodeConfigs, 'sys-filter-active')) {
        return { ok: false, msg: "Utilise le notebook 'Filtrer actifs'." };
      }
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: "Ajoute une destination." };
      const expected = COMMANDES_VARIEES.filter(r => r.statut === 'Livree').length;
      if (data.length === expected) return { ok: true, msg: `${expected} commandes livrées exportées.` };
      return { ok: false, msg: `Attendu : ${expected} commandes livrées. Reçu : ${data.length}.` };
    },
  },

  {
    id: 'pipe-nb-04',
    tier: 1,
    difficulty: 1,
    title: 'Pipeline multi-étapes',
    description: "Un seul notebook qui chaîne plusieurs transformations.",
    prompt: `Au lieu d'enchaîner trois nœuds Dédoublonner + Nettoyer + Renommer, un seul notebook système "Clients : pipeline de nettoyage" fait les trois en une étape.

À faire :
1. Source CSV → "clients"
2. Notebook "Clients : pipeline de nettoyage"
3. Export CSV

Compare avec l'exo 1 : le résultat est plus complet (sans doublons, sans vides, avec id renommé en customer_id) avec moitié moins de nœuds sur le canvas.`,
    hint: "Notebook 'Clients : pipeline de nettoyage' (multi-étapes).",
    hintNodes: ['csv_source', 'notebook', 'csv_export'],
    sources: { csv_source: [{ name: 'clients', data: CLIENTS_WITH_DUPES }] },
    availableNotebookIds: ['sys-clean-customers'],
    validate: (outputs, nodes, conns, nodeConfigs) => {
      if (!usesSystemNotebook(nodes, nodeConfigs, 'sys-clean-customers')) {
        return { ok: false, msg: "Utilise le notebook 'Clients : pipeline de nettoyage'." };
      }
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: "Ajoute une destination." };
      if (data.length !== 4) {
        return { ok: false, msg: `Attendu : 4 clients uniques. Reçu : ${data.length}.` };
      }
      const cols = data[0] ? Object.keys(data[0]) : [];
      if (!cols.includes('customer_id')) {
        return { ok: false, msg: "La colonne id devrait être renommée en customer_id." };
      }
      return { ok: true, msg: 'Notebook multi-étapes appliqué !' };
    },
  },

  // Tiers 2 / 3 / 4 : à implémenter (Adapter, Créer, Architecturer)
];

// ── Lookup / progress helpers (compatible with PipelineDojo) ────
export function getExerciseById(id) { return EXERCISES.find(e => e.id === id); }
export function getExercisesByTier(tier) { return EXERCISES.filter(e => e.difficulty === tier); }

// Aliases preserved for callers of the older API
export const NB_EXERCISES = EXERCISES;
export const getNbExerciseById = getExerciseById;
export const getNbExercisesByTier = getExercisesByTier;

const PROGRESS_KEY   = 'pipelineDojo_progress';
const UNLOCK_ALL_KEY = 'pipelineDojo_unlockAll';

export function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
}

export function saveProgress(exerciseId, stars) {
  const p = getProgress();
  const prev = p[exerciseId]?.stars || 0;
  if (stars > prev) p[exerciseId] = { stars, date: new Date().toISOString() };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

export function getUnlockAll() {
  try { return localStorage.getItem(UNLOCK_ALL_KEY) === '1'; } catch { return false; }
}

export function setUnlockAll(value) {
  try { localStorage.setItem(UNLOCK_ALL_KEY, value ? '1' : '0'); } catch { /* ignore */ }
}

export function isTierUnlocked(tier) {
  if (getUnlockAll()) return true;
  if (tier === 1) return true;
  const p = getProgress();
  const prevTierExercises = EXERCISES.filter(e => e.difficulty === tier - 1);
  const completed = prevTierExercises.filter(e => p[e.id]?.stars > 0).length;
  return completed >= (TIERS[tier - 2]?.minToUnlockNext || 0);
}

export function getTierProgress(tier) {
  const p = getProgress();
  const exercises = EXERCISES.filter(e => e.difficulty === tier);
  const completed = exercises.filter(e => p[e.id]?.stars > 0).length;
  const totalStars = exercises.reduce((s, e) => s + (p[e.id]?.stars || 0), 0);
  return { completed, total: exercises.length, totalStars, maxStars: exercises.length * 3 };
}
