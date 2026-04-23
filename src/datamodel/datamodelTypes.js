export const TABLE_TYPES = {
  base: {
    name: 'Table',
    color: '#64748B',
    icon: '📋',
    description: 'Table opérationnelle standard',
  },
  dimension: {
    name: 'Dimension',
    color: '#6BA4FF',
    icon: '🧩',
    description: 'Décrit le qui / quoi / quand / où',
  },
  fact: {
    name: 'Fait',
    color: '#FFC857',
    icon: '⭐',
    description: 'Mesures (combien, fréquence)',
  },
  bridge: {
    name: 'Jointure',
    color: '#5ED6B4',
    icon: '🔀',
    description: 'Lie deux tables en N-N',
  },
};

export const COLUMN_TYPES = {
  TEXT:    { label: 'Texte',   icon: '📝' },
  INT:     { label: 'Entier',  icon: '🔢' },
  DECIMAL: { label: 'Décimal', icon: '💰' },
  DATE:    { label: 'Date',    icon: '📅' },
  BOOL:    { label: 'Oui / Non', icon: '🎲' },
};

export const CARDINALITIES = {
  '1-1': { label: '1 : 1', description: 'Un à un' },
  '1-N': { label: '1 : N', description: 'Un à plusieurs' },
  'N-N': { label: 'N : N', description: 'Plusieurs à plusieurs' },
};

// Palette categories shown in the canvas sidebar. Order matters.
export const TABLE_CATEGORIES = [
  { id: 'base',      name: 'Tables',     icon: '📋' },
  { id: 'dimension', name: 'Dimensions', icon: '🧩' },
  { id: 'fact',      name: 'Faits',      icon: '⭐' },
  { id: 'bridge',    name: 'Jointures',  icon: '🔀' },
];
