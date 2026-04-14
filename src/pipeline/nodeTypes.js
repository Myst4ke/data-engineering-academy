export const NODE_TYPES = {
  // Sources
  csv_source: { name: 'Fichier CSV', icon: '📄', category: 'source', inputs: 0, outputs: 1, color: '#22C55E' },
  db_source: { name: 'Base SQL', icon: '🗄️', category: 'source', inputs: 0, outputs: 1, color: '#3B82F6' },
  api_source: { name: 'API REST', icon: '🌐', category: 'source', inputs: 0, outputs: 1, color: '#8B5CF6' },

  // Transformations (all Data Dojo cards + extras)
  filter: { name: 'Filtrer', icon: '🔍', category: 'transform', inputs: 1, outputs: 1, color: '#F59E0B' },
  sort: { name: 'Trier', icon: '↕️', category: 'transform', inputs: 1, outputs: 1, color: '#06B6D4' },
  join: { name: 'Joindre', icon: '🔗', category: 'transform', inputs: 2, outputs: 1, color: '#6366F1' },
  concat: { name: 'Concaténer', icon: '⬇️', category: 'transform', inputs: 2, outputs: 1, color: '#84CC16' },
  aggregate: { name: 'Agréger', icon: '📊', category: 'transform', inputs: 1, outputs: 1, color: '#EC4899' },
  select_cols: { name: 'Sélectionner', icon: '✅', category: 'transform', inputs: 1, outputs: 1, color: '#14B8A6' },
  delete_col: { name: 'Suppr. Colonne', icon: '🗑️', category: 'transform', inputs: 1, outputs: 1, color: '#DC2626' },
  rename_col: { name: 'Renommer', icon: '✏️', category: 'transform', inputs: 1, outputs: 1, color: '#F97316' },
  deduplicate: { name: 'Dédoublonner', icon: '🔄', category: 'transform', inputs: 1, outputs: 1, color: '#A855F7' },
  clean_na: { name: 'Suppr. Vides', icon: '🧹', category: 'transform', inputs: 1, outputs: 1, color: '#EF4444' },
  fill_na: { name: 'Remplir Vides', icon: '🔧', category: 'transform', inputs: 1, outputs: 1, color: '#64748B' },

  // Destinations
  warehouse: { name: 'Data Warehouse', icon: '🏭', category: 'destination', inputs: 1, outputs: 0, color: '#0EA5E9' },
  dashboard: { name: 'Dashboard', icon: '📈', category: 'destination', inputs: 1, outputs: 0, color: '#10B981' },
  csv_export: { name: 'Export CSV', icon: '💾', category: 'destination', inputs: 1, outputs: 0, color: '#78716C' },
};

export const CATEGORIES = [
  { id: 'source', name: 'Sources', icon: '📥' },
  { id: 'transform', name: 'Transformations', icon: '⚙️' },
  { id: 'destination', name: 'Destinations', icon: '📤' },
];
