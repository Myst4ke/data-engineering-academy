import { describe, it, expect } from 'vitest';
import { NODE_TYPES, CATEGORIES } from '../nodeTypes';
import { EXERCISES } from '../exercises';

// Catégories volontairement absentes de la palette :
//   'transform_card' : cartes disponibles seulement dans un notebook / ForEach
//   'table'          : nœuds créés automatiquement depuis une source
const NON_PALETTE_CATEGORIES = ['transform_card', 'table'];

const paletteTypes = new Set(
  Object.entries(NODE_TYPES)
    .filter(([, def]) => CATEGORIES.some(c => c.id === def.category))
    .map(([type]) => type)
);

const notebookCardTypes = new Set(
  Object.entries(NODE_TYPES)
    .filter(([, def]) => def.category === 'transform_card')
    .map(([type]) => type)
);

// Ces types ne sont utilisables que dans un notebook ou un ForEach : un indice
// qui les cite enverrait le joueur chercher une carte absente de la palette.
const isNotebookOnly = (type) => notebookCardTypes.has(type);

describe('palette du Pipeline Dojo', () => {
  // Cause racine du bug : la catégorie 'transform' avait été retirée de
  // CATEGORIES alors que 11 types y pointaient encore, les rendant inatteignables.
  it('chaque catégorie déclarée sur un type de nœud existe', () => {
    for (const [type, def] of Object.entries(NODE_TYPES)) {
      const known = CATEGORIES.some(c => c.id === def.category) || NON_PALETTE_CATEGORIES.includes(def.category);
      expect(known, `${type} utilise la catégorie inconnue "${def.category}"`).toBe(true);
    }
  });

  it.each(EXERCISES.map(ex => [ex.id, ex]))(
    '%s : les nœuds de l\'indice sont posables sur le canvas',
    (id, ex) => {
      for (const type of ex.hintNodes || []) {
        expect(isNotebookOnly(type), `${id} : "${type}" n'existe que dans un notebook, l'indice doit dire "notebook"`).toBe(false);
        expect(paletteTypes.has(type), `${id} : "${type}" est absent de la palette`).toBe(true);
      }
    }
  );
});
