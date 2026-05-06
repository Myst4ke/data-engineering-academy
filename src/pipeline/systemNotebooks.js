/**
 * Pre-defined system notebooks shipped with the Pipeline Dojo.
 * Read-only ; users can duplicate them via `duplicateAsUser()`.
 *
 * Card param shapes (from src/transformations/index.js) :
 *   drop_duplicates : {} or { columns: [..] }
 *   sort            : { column, order: 'asc'|'desc' }
 *   delete          : { column }
 *   delete_na       : {} or { columns: [..] }
 *   filter          : { column, value }   (string equality)
 *   rename          : { oldName, newName }
 *   select          : { columns: [..] }
 *   fill_na         : { column, value }
 *   join / concat   : require a second input table (NOT supported by the
 *                     1-input notebook node ; reserved for future 2-input variant)
 */

export const SYSTEM_NOTEBOOKS = [
  // ── Single-step utilities ───────────────────────────────────
  {
    id: 'sys-dedup',
    name: 'Dédoublonner',
    description: 'Supprime les lignes en doublon strict (toutes colonnes identiques).',
    inputTable: 'input',
    outputTable: 'unique',
    cards: [
      { type: 'drop_duplicates', name: 'Supprimer doublons', params: {} },
    ],
  },
  {
    id: 'sys-clean-na',
    name: 'Nettoyer les vides',
    description: 'Retire les lignes contenant au moins une cellule vide.',
    inputTable: 'input',
    outputTable: 'cleaned',
    cards: [
      { type: 'delete_na', name: 'Suppr. lignes vides', params: {} },
    ],
  },
  {
    id: 'sys-filter-active',
    name: 'Filtrer actifs',
    description: 'Garde les lignes où statut = "Livree".',
    inputTable: 'commandes',
    outputTable: 'commandes_actives',
    cards: [
      { type: 'filter', name: 'Filtrer', params: { column: 'statut', value: 'Livree' } },
    ],
  },
  {
    id: 'sys-sort-date-desc',
    name: 'Trier par date (récent → ancien)',
    description: 'Tri descendant sur la colonne date.',
    inputTable: 'input',
    outputTable: 'sorted',
    cards: [
      { type: 'sort', name: 'Trier', params: { column: 'date', order: 'desc' } },
    ],
  },
  {
    id: 'sys-rename-id-customer',
    name: 'Renommer id → customer_id',
    description: 'Renomme la colonne "id" en "customer_id" (homogénéisation).',
    inputTable: 'clients',
    outputTable: 'clients_renamed',
    cards: [
      { type: 'rename', name: 'Renommer', params: { oldName: 'id', newName: 'customer_id' } },
    ],
  },
  {
    id: 'sys-keep-essentials',
    name: 'Colonnes essentielles',
    description: 'Ne garde que id, nom et email.',
    inputTable: 'clients',
    outputTable: 'clients_minimal',
    cards: [
      { type: 'select', name: 'Sélectionner', params: { columns: ['id', 'nom', 'email'] } },
    ],
  },
  {
    id: 'sys-drop-internal',
    name: 'Retirer colonne interne',
    description: 'Supprime la colonne "_internal" (donnée technique non publiable).',
    inputTable: 'input',
    outputTable: 'clean',
    cards: [
      { type: 'delete', name: 'Suppr. colonne', params: { column: '_internal' } },
    ],
  },
  {
    id: 'sys-fill-zero',
    name: 'Remplir montants vides par 0',
    description: 'Met 0 sur les montants vides pour permettre les agrégations.',
    inputTable: 'commandes',
    outputTable: 'commandes_remplies',
    cards: [
      { type: 'fill_na', name: 'Remplir vides', params: { column: 'montant', value: '0' } },
    ],
  },

  // ── Multi-step pipelines (chaînes) ──────────────────────────
  {
    id: 'sys-clean-customers',
    name: 'Clients : pipeline de nettoyage',
    description: 'Dédoublonne, retire les vides, renomme id → customer_id.',
    inputTable: 'clients',
    outputTable: 'clients_clean',
    cards: [
      { type: 'drop_duplicates', name: 'Supprimer doublons', params: {} },
      { type: 'delete_na', name: 'Suppr. lignes vides', params: {} },
      { type: 'rename', name: 'Renommer', params: { oldName: 'id', newName: 'customer_id' } },
    ],
  },
  {
    id: 'sys-prep-orders',
    name: 'Commandes : préparation',
    description: 'Remplit les montants vides, dédoublonne, trie par date desc.',
    inputTable: 'commandes',
    outputTable: 'commandes_pretes',
    cards: [
      { type: 'fill_na', name: 'Remplir vides', params: { column: 'montant', value: '0' } },
      { type: 'drop_duplicates', name: 'Supprimer doublons', params: {} },
      { type: 'sort', name: 'Trier', params: { column: 'date', order: 'desc' } },
    ],
  },
  {
    id: 'sys-silver-clean',
    name: 'Silver : nettoyage standard',
    description: 'Suppr. doublons + suppr. vides + sélection des colonnes essentielles. Standard pour passer du Bronze au Silver.',
    inputTable: 'bronze',
    outputTable: 'silver',
    cards: [
      { type: 'drop_duplicates', name: 'Supprimer doublons', params: {} },
      { type: 'delete_na', name: 'Suppr. lignes vides', params: {} },
      { type: 'select', name: 'Sélectionner', params: { columns: ['id', 'nom', 'email', 'date_inscription'] } },
    ],
  },
  {
    id: 'sys-passthrough',
    name: 'Passthrough (vide)',
    description: 'Ne fait rien — sert de placeholder pendant la conception du pipeline.',
    inputTable: 'input',
    outputTable: 'output',
    cards: [],
  },
];
