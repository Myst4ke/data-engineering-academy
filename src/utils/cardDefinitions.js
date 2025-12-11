/**
 * Card definitions with French labels and detailed explanations
 */

export const CARD_DEFINITIONS = {
  drop_duplicates: {
    name: 'Supprimer Doublons',
    shortName: 'drop_duplicates',
    icon: '🔄',
    description: 'Supprime les lignes en double dans le tableau.',
    detailedExplanation: `Cette carte supprime toutes les lignes qui sont des doublons exacts.

• Compare chaque ligne avec les autres
• Seules les correspondances EXACTES sont supprimees
• Si une seule cellule differe, la ligne est conservee`,
    example: {
      before: [
        { SKU: '123', Prix: '125' },
        { SKU: '456', Prix: '450' },
        { SKU: '123', Prix: '125' },
      ],
      after: [
        { SKU: '123', Prix: '125' },
        { SKU: '456', Prix: '450' },
      ],
    },
  },

  sort: {
    name: 'Trier',
    shortName: 'sort',
    icon: '↕️',
    description: 'Trie les donnees par une colonne specifique.',
    detailedExplanation: `Cette carte trie toutes les lignes selon une colonne choisie.

• Trie par ordre croissant (A-Z, 0-9) ou decroissant
• Les nombres sont tries numeriquement
• Les textes sont tries alphabetiquement`,
    example: {
      before: [
        { Article: 'C', Prix: '300' },
        { Article: 'A', Prix: '100' },
      ],
      after: [
        { Article: 'A', Prix: '100' },
        { Article: 'C', Prix: '300' },
      ],
    },
  },

  delete: {
    name: 'Suppr. Colonne',
    shortName: 'delete',
    icon: '🗑️',
    description: 'Supprime une colonne du tableau.',
    detailedExplanation: `Cette carte supprime entierement une colonne du tableau.

• La colonne specifiee est retiree de toutes les lignes
• Les autres colonnes restent intactes
• Utile pour retirer des informations non necessaires`,
    example: {
      before: [
        { SKU: '123', Prix: '125', Note: 'test' },
      ],
      after: [
        { SKU: '123', Prix: '125' },
      ],
    },
  },

  delete_na: {
    name: 'Suppr. Vides',
    shortName: 'delete_na',
    icon: '🧹',
    description: 'Supprime les lignes contenant des cellules vides.',
    detailedExplanation: `Cette carte nettoie le tableau en supprimant les lignes incompletes.

• Verifie chaque cellule de chaque ligne
• Si UNE cellule est vide, toute la ligne est supprimee
• Les cellules avec des espaces sont considerees vides`,
    example: {
      before: [
        { SKU: '123', Prix: '125' },
        { SKU: '789', Prix: '' },
      ],
      after: [
        { SKU: '123', Prix: '125' },
      ],
    },
  },

  filter: {
    name: 'Filtrer',
    shortName: 'filter',
    icon: '🔍',
    description: 'Garde uniquement les lignes correspondant a un critere.',
    detailedExplanation: `Cette carte filtre le tableau pour ne garder que certaines lignes.

• Specifie une colonne et une valeur
• Seules les lignes ou la colonne = valeur sont gardees
• Comparaison exacte`,
    example: {
      before: [
        { SKU: '123', Type: 'A' },
        { SKU: '456', Type: 'B' },
      ],
      after: [
        { SKU: '123', Type: 'A' },
      ],
    },
  },

  join: {
    name: 'Joindre',
    shortName: 'join',
    icon: '🔗',
    description: 'Fusionne deux tables sur une colonne commune.',
    detailedExplanation: `Cette carte combine deux tables en utilisant une colonne commune.

• Choisit une colonne présente dans les deux tables
• Pour chaque correspondance, fusionne les informations
• Si plusieurs correspondances, crée plusieurs lignes`,
    example: {
      before: [
        { SKU: '123', Nom: 'Produit A' },
        { SKU: '456', Nom: 'Produit B' },
      ],
      secondTable: [
        { SKU: '123', Prix: '100' },
        { SKU: '456', Prix: '200' },
      ],
      after: [
        { SKU: '123', Nom: 'Produit A', Prix: '100' },
        { SKU: '456', Nom: 'Produit B', Prix: '200' },
      ],
    },
  },

  rename: {
    name: 'Renommer',
    shortName: 'rename',
    icon: '✏️',
    description: 'Renomme une colonne du tableau.',
    detailedExplanation: `Cette carte change le nom d'une colonne.

• Sélectionne la colonne à renommer
• Donne le nouveau nom souhaité
• Les données de la colonne restent inchangées`,
    example: {
      before: [
        { SKU: '123', Prix: '100' },
        { SKU: '456', Prix: '200' },
      ],
      after: [
        { Code: '123', Prix: '100' },
        { Code: '456', Prix: '200' },
      ],
    },
  },

  select: {
    name: 'Sélectionner',
    shortName: 'select',
    icon: '✅',
    description: 'Garde uniquement les colonnes choisies.',
    detailedExplanation: `Cette carte ne garde que certaines colonnes du tableau.

• Sélectionne les colonnes à conserver
• Toutes les autres colonnes sont supprimées
• L'ordre des colonnes est préservé`,
    example: {
      before: [
        { SKU: '123', Nom: 'A', Prix: '100', Note: 'test' },
      ],
      after: [
        { SKU: '123', Nom: 'A' },
      ],
    },
  },

  fill_na: {
    name: 'Remplir Vides',
    shortName: 'fill_na',
    icon: '🔧',
    description: 'Remplit les cellules vides avec une valeur.',
    detailedExplanation: `Cette carte remplace les cellules vides par une valeur donnée.

• Sélectionne la colonne à traiter
• Indique la valeur de remplacement
• Seules les cellules vides sont modifiées`,
    example: {
      before: [
        { SKU: '123', Stock: '50' },
        { SKU: '456', Stock: '' },
      ],
      after: [
        { SKU: '123', Stock: '50' },
        { SKU: '456', Stock: '0' },
      ],
    },
  },

  concat: {
    name: 'Concaténer',
    shortName: 'concat',
    icon: '⬇️',
    description: 'Empile deux tables verticalement.',
    detailedExplanation: `Cette carte combine deux tables l'une sous l'autre.

• Les lignes de la table secondaire sont ajoutées
• Les colonnes doivent être compatibles
• Utile pour fusionner des données similaires`,
    example: {
      before: [
        { SKU: '123', Nom: 'A' },
      ],
      secondTable: [
        { SKU: '456', Nom: 'B' },
      ],
      after: [
        { SKU: '123', Nom: 'A' },
        { SKU: '456', Nom: 'B' },
      ],
    },
  },
};

/**
 * Get card display info with params
 */
export function getCardDisplayInfo(card) {
  const definition = CARD_DEFINITIONS[card.type];
  if (!definition) return null;

  let paramLabel = '';
  if (card.params) {
    if (card.type === 'filter') {
      paramLabel = `${card.params.column} = ${card.params.value}`;
    } else if (card.type === 'sort') {
      const orderLabel = card.params.order === 'desc' ? '↓' : '↑';
      paramLabel = `${card.params.column} ${orderLabel}`;
    } else if (card.type === 'delete') {
      paramLabel = card.params.column;
    } else if (card.type === 'join') {
      paramLabel = `sur ${card.params.column}`;
    } else if (card.type === 'rename') {
      paramLabel = `${card.params.oldName} → ${card.params.newName}`;
    } else if (card.type === 'select') {
      paramLabel = card.params.columns.join(', ');
    } else if (card.type === 'fill_na') {
      paramLabel = `${card.params.column} ← "${card.params.value}"`;
    } else if (card.type === 'concat') {
      paramLabel = 'tables empilées';
    }
  }

  return {
    ...definition,
    paramLabel,
    id: card.id,
    type: card.type,
    params: card.params,
  };
}

/**
 * Get all 10 cards as generic versions (no pre-configured params)
 * Users will configure params themselves via popup
 */
export function getAllCards() {
  const allTypes = [
    'drop_duplicates', 'sort', 'delete', 'delete_na', 'filter', 'join',
    'rename', 'select', 'fill_na', 'concat'
  ];

  // Return generic cards without any pre-configured params
  return allTypes.map((type) => {
    return getCardDisplayInfo({
      id: `generic-${type}`,
      type,
      params: null,
    });
  });
}
