export const NODE_TYPES = {
  // Sources
  csv_source: { name: 'Fichier CSV', icon: '📄', category: 'source', inputs: 0, outputs: 1, color: '#22C55E', multiOutput: true },
  db_source: { name: 'Base SQL', icon: '🗄️', category: 'source', inputs: 0, outputs: 1, color: '#3B82F6', multiOutput: true },
  api_source: { name: 'API REST', icon: '🌐', category: 'source', inputs: 0, outputs: 1, color: '#8B5CF6', multiOutput: true },

  // Transformations (all Data Dojo cards + extras)
  filter: { name: 'Filtrer', icon: '🔍', category: 'transform', inputs: 1, outputs: 1, color: '#F59E0B' },
  sort: { name: 'Trier', icon: '↕️', category: 'transform', inputs: 1, outputs: 1, color: '#06B6D4' },
  join: { name: 'Joindre', icon: '🔀', category: 'transform', inputs: 2, outputs: 1, color: '#6366F1' },
  concat: { name: 'Concaténer', icon: '⬇️', category: 'transform', inputs: 2, outputs: 1, color: '#84CC16' },
  aggregate: { name: 'Agréger', icon: '📊', category: 'transform', inputs: 1, outputs: 1, color: '#EC4899' },
  select_cols: { name: 'Sélectionner', icon: '✅', category: 'transform', inputs: 1, outputs: 1, color: '#14B8A6' },
  delete_col: { name: 'Suppr. Colonne', icon: '🗑️', category: 'transform', inputs: 1, outputs: 1, color: '#DC2626' },
  rename_col: { name: 'Renommer', icon: '✏️', category: 'transform', inputs: 1, outputs: 1, color: '#F97316' },
  deduplicate: { name: 'Dédoublonner', icon: '🔄', category: 'transform', inputs: 1, outputs: 1, color: '#A855F7' },
  clean_na: { name: 'Suppr. Vides', icon: '🧹', category: 'transform', inputs: 1, outputs: 1, color: '#EF4444' },
  fill_na: { name: 'Remplir Vides', icon: '🔧', category: 'transform', inputs: 1, outputs: 1, color: '#64748B' },
  mapping: { name: 'Mapping', icon: '🗺️', category: 'transform', inputs: 1, outputs: 1, color: '#0D9488' },
  window_func: { name: 'Fenêtre', icon: '📐', category: 'transform', inputs: 1, outputs: 1, color: '#7E22CE' },
  sample: { name: 'Échantillonner', icon: '🎲', category: 'transform', inputs: 1, outputs: 1, color: '#EA580C' },

  // Table output (auto-created when selecting tables from a source or lakehouse)
  table_output: { name: 'Table', icon: '📋', category: 'table', inputs: 1, outputs: 1, color: '#22C55E' },

  // Logic (loops & conditions)
  foreach: { name: 'ForEach', icon: '🔁', category: 'logic', inputs: 1, outputs: 1, color: '#7C3AED', multiInput: true, multiOutput: true },
  if_condition: { name: 'Si / Sinon', icon: '⚡', category: 'logic', inputs: 1, outputs: 1, color: '#E11D48', multiOutput: true },
  lookup: { name: 'Existe', icon: '🔎', category: 'logic', inputs: 2, outputs: 1, color: '#D946EF', multiOutput: true },
  foreach_row: { name: 'ForEachRow', icon: '📝', category: 'logic', inputs: 1, outputs: 1, color: '#0891B2' },

  // Storage (Lakehouse medallion architecture)
  lakehouse_bronze: { name: 'Bronze', icon: '🥉', category: 'storage', inputs: 1, outputs: 1, color: '#CD7F32', multiInput: true, multiOutput: true },
  lakehouse_silver: { name: 'Silver', icon: '🥈', category: 'storage', inputs: 1, outputs: 1, color: '#A8A9AD', multiInput: true, multiOutput: true },
  lakehouse_gold: { name: 'Gold', icon: '🥇', category: 'storage', inputs: 1, outputs: 1, color: '#FFD700', multiInput: true, multiOutput: true },

  // Monitoring
  log: { name: 'Journal', icon: '📋', category: 'monitoring', inputs: 1, outputs: 1, color: '#475569', multiInput: true },

  // Destinations (single port, accepts multiple connections)
  warehouse: { name: 'Data Warehouse', icon: '🏭', category: 'destination', inputs: 1, outputs: 0, color: '#0EA5E9', multiInput: true },
  dashboard: { name: 'Dashboard', icon: '📈', category: 'destination', inputs: 1, outputs: 0, color: '#10B981', multiInput: true },
  csv_export: { name: 'Export CSV', icon: '💾', category: 'destination', inputs: 1, outputs: 0, color: '#78716C', multiInput: true },
};

export const CATEGORIES = [
  { id: 'source', name: 'Sources', icon: '📥' },
  { id: 'transform', name: 'Transformations', icon: '⚙️' },
  { id: 'logic', name: 'Boucles & Conditions', icon: '🔄' },
  { id: 'storage', name: 'Stockage', icon: '🗃️' },
  { id: 'monitoring', name: 'Monitoring', icon: '📊' },
  { id: 'destination', name: 'Destinations', icon: '📤' },
];
