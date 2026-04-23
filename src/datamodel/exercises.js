/**
 * Data Modeling Dojo : 6 exercises Tier 1 (Phase 1 MVP).
 * Tiers 2/3/4 will be added in later phases.
 */

export const DM_TIERS = [
  { id: 1, name: 'Bases',                 difficulty: 1 },
  { id: 2, name: 'Modèle dimensionnel',   difficulty: 2 },
  { id: 3, name: 'Historique & clés',     difficulty: 3 },
  { id: 4, name: 'Architecture',          difficulty: 4 },
];

export const DM_EXERCISES = [
  {
    id: 'dm-01',
    tier: 1,
    difficulty: 1,
    isTutorial: true,
    title: 'Première table',
    description: "Crée ta première table Clients avec une clé primaire.",
    prompt: `Bienvenue dans le Data Modeling Dojo !

Pour démarrer, crée une table Clients avec ces 3 colonnes :
• client_id (Entier, clé primaire)
• nom (Texte)
• email (Texte)

La clé primaire permet d'identifier chaque ligne sans ambiguïté.`,
    hint: "Clique sur 'Tables' dans la palette à gauche. Nomme la table Clients. Clique sur '+ colonne' pour ajouter chaque colonne, et coche 'Clé primaire' pour client_id.",
    initialTables: [],
    initialRelations: [],
    target: {
      tables: [
        { name: 'Clients', columns: [
          { name: 'client_id', type: 'INT', pk: true },
          { name: 'nom', type: 'TEXT' },
          { name: 'email', type: 'TEXT' },
        ]},
      ],
      relations: [],
    },
  },

  {
    id: 'dm-02',
    tier: 1,
    difficulty: 1,
    title: 'La clé primaire',
    description: "Ajoute un identifiant unique à la table Employes.",
    prompt: `La table Employes a uniquement un nom et un poste. Problème : deux employés peuvent avoir le même nom (Martin Dupont × 2 !).

Ajoute une colonne employe_id (Entier, clé primaire) pour les distinguer sans ambiguïté.`,
    hint: "Clic droit sur la colonne nom pour éditer, ou 'Ajouter une colonne' pour insérer employe_id avec 🔑 Clé primaire cochée.",
    initialTables: [
      { id: 'init-t1', name: 'Employes', type: 'base', x: 320, y: 180, columns: [
        { id: 'init-c1', name: 'nom',   type: 'TEXT' },
        { id: 'init-c2', name: 'poste', type: 'TEXT' },
      ]},
    ],
    initialRelations: [],
    target: {
      tables: [
        { name: 'Employes', columns: [
          { name: 'employe_id', type: 'INT', pk: true },
          { name: 'nom', type: 'TEXT' },
          { name: 'poste', type: 'TEXT' },
        ]},
      ],
      relations: [],
    },
  },

  {
    id: 'dm-03',
    tier: 1,
    difficulty: 1,
    title: 'Deux tables reliées',
    description: "Relie Commandes à Clients avec une clé étrangère.",
    prompt: `Crée deux tables :

Clients
• client_id (Entier, clé primaire)
• nom (Texte)

Commandes
• commande_id (Entier, clé primaire)
• client_id (Entier)
• date (Date)
• total (Décimal)

Puis trace une relation depuis Commandes.client_id vers Clients.client_id (c'est une clé étrangère).`,
    hint: "Pour tracer une relation : clique et maintiens sur le petit cercle à droite d'une colonne, drag jusqu'au cercle à gauche d'une autre colonne, relâche.",
    initialTables: [],
    initialRelations: [],
    target: {
      tables: [
        { name: 'Clients', columns: [
          { name: 'client_id', type: 'INT', pk: true },
          { name: 'nom', type: 'TEXT' },
        ]},
        { name: 'Commandes', columns: [
          { name: 'commande_id', type: 'INT', pk: true },
          { name: 'client_id', type: 'INT' },
          { name: 'date', type: 'DATE' },
          { name: 'total', type: 'DECIMAL' },
        ]},
      ],
      relations: [
        { fromTable: 'Commandes', fromColumn: 'client_id', toTable: 'Clients', toColumn: 'client_id', cardinality: '1-N' },
      ],
    },
  },

  {
    id: 'dm-04',
    tier: 1,
    difficulty: 1,
    title: 'Un vs plusieurs',
    description: "Ajuste la cardinalité de la relation.",
    prompt: `Les deux tables sont déjà en place avec une relation, mais la cardinalité est incorrecte.

Règle métier : un client peut passer plusieurs commandes, mais une commande appartient à un seul client.

Clique sur la ligne de relation et choisis la bonne cardinalité.`,
    hint: "Un client → plusieurs commandes : c'est la cardinalité 1 : N (Un à plusieurs).",
    initialTables: [
      { id: 'init-t1', name: 'Clients', type: 'base', x: 200, y: 180, columns: [
        { id: 'init-c1', name: 'client_id', type: 'INT', pk: true },
        { id: 'init-c2', name: 'nom', type: 'TEXT' },
      ]},
      { id: 'init-t2', name: 'Commandes', type: 'base', x: 620, y: 180, columns: [
        { id: 'init-c3', name: 'commande_id', type: 'INT', pk: true },
        { id: 'init-c4', name: 'client_id', type: 'INT' },
        { id: 'init-c5', name: 'total', type: 'DECIMAL' },
      ]},
    ],
    initialRelations: [
      { id: 'init-r1', fromTableId: 'init-t2', fromColumnId: 'init-c4', toTableId: 'init-t1', toColumnId: 'init-c1', cardinality: '1-1' },
    ],
    target: {
      tables: [
        { name: 'Clients',   columns: [{ name: 'client_id', type: 'INT', pk: true }, { name: 'nom', type: 'TEXT' }] },
        { name: 'Commandes', columns: [{ name: 'commande_id', type: 'INT', pk: true }, { name: 'client_id', type: 'INT' }, { name: 'total', type: 'DECIMAL' }] },
      ],
      relations: [
        { fromTable: 'Commandes', fromColumn: 'client_id', toTable: 'Clients', toColumn: 'client_id', cardinality: '1-N' },
      ],
    },
  },

  {
    id: 'dm-05',
    tier: 1,
    difficulty: 1,
    title: 'Éviter la répétition',
    description: "Extrais l'adresse dupliquée dans une table à part.",
    prompt: `La table Commandes contient rue, ville, code_postal à chaque ligne. Si un client passe 10 commandes, son adresse est dupliquée 10 fois !

À faire :
• Crée une table Adresses (adresse_id PK, rue, ville, code_postal)
• Retire rue / ville / code_postal de Commandes
• Ajoute adresse_id dans Clients et relie à Adresses

Résultat : 1 seule ligne par adresse, pas de duplication.`,
    hint: "Crée Adresses avec sa propre PK. Ajoute adresse_id comme FK dans Clients (un client a une adresse). Supprime les colonnes d'adresse de Commandes.",
    initialTables: [
      { id: 'init-t1', name: 'Clients', type: 'base', x: 160, y: 140, columns: [
        { id: 'init-c1', name: 'client_id', type: 'INT', pk: true },
        { id: 'init-c2', name: 'nom', type: 'TEXT' },
      ]},
      { id: 'init-t2', name: 'Commandes', type: 'base', x: 600, y: 140, columns: [
        { id: 'init-c3', name: 'commande_id', type: 'INT', pk: true },
        { id: 'init-c4', name: 'client_id', type: 'INT' },
        { id: 'init-c5', name: 'rue', type: 'TEXT' },
        { id: 'init-c6', name: 'ville', type: 'TEXT' },
        { id: 'init-c7', name: 'code_postal', type: 'TEXT' },
      ]},
    ],
    initialRelations: [
      { id: 'init-r1', fromTableId: 'init-t2', fromColumnId: 'init-c4', toTableId: 'init-t1', toColumnId: 'init-c1', cardinality: '1-N' },
    ],
    target: {
      tables: [
        { name: 'Clients',   columns: [{ name: 'client_id', type: 'INT', pk: true }, { name: 'nom', type: 'TEXT' }, { name: 'adresse_id', type: 'INT' }] },
        { name: 'Commandes', columns: [{ name: 'commande_id', type: 'INT', pk: true }, { name: 'client_id', type: 'INT' }] },
        { name: 'Adresses',  columns: [{ name: 'adresse_id', type: 'INT', pk: true }, { name: 'rue', type: 'TEXT' }, { name: 'ville', type: 'TEXT' }, { name: 'code_postal', type: 'TEXT' }] },
      ],
      relations: [
        { fromTable: 'Commandes', fromColumn: 'client_id', toTable: 'Clients', toColumn: 'client_id', cardinality: '1-N' },
        { fromTable: 'Clients', fromColumn: 'adresse_id', toTable: 'Adresses', toColumn: 'adresse_id', cardinality: '1-N' },
      ],
      forbiddenColumnsByTable: {
        Commandes: ['rue', 'ville', 'code_postal'],
      },
    },
  },

  {
    id: 'dm-06',
    tier: 1,
    difficulty: 1,
    title: 'Plusieurs à plusieurs',
    description: "Crée une table de jointure pour relier commandes et produits.",
    prompt: `Une commande peut contenir plusieurs produits, et un produit peut être dans plusieurs commandes. Impossible de relier directement.

Solution : une table de jointure Lignes_Commande avec :
• commande_id (FK vers Commandes)
• produit_id (FK vers Produits)
• quantite (Entier)

Les deux FK forment ensemble la clé primaire (clé composite).`,
    hint: "Ajoute une table de type 'Jointure' depuis la palette. Nomme-la Lignes_Commande. Ajoute les 3 colonnes ; coche 🔑 sur commande_id ET sur produit_id. Puis relie chaque FK à sa table parente.",
    initialTables: [
      { id: 'init-t1', name: 'Commandes', type: 'base', x: 160, y: 180, columns: [
        { id: 'init-c1', name: 'commande_id', type: 'INT', pk: true },
        { id: 'init-c2', name: 'date', type: 'DATE' },
      ]},
      { id: 'init-t2', name: 'Produits', type: 'base', x: 660, y: 180, columns: [
        { id: 'init-c3', name: 'produit_id', type: 'INT', pk: true },
        { id: 'init-c4', name: 'nom', type: 'TEXT' },
        { id: 'init-c5', name: 'prix', type: 'DECIMAL' },
      ]},
    ],
    initialRelations: [],
    target: {
      tables: [
        { name: 'Commandes', columns: [{ name: 'commande_id', type: 'INT', pk: true }, { name: 'date', type: 'DATE' }] },
        { name: 'Produits',  columns: [{ name: 'produit_id', type: 'INT', pk: true }, { name: 'nom', type: 'TEXT' }, { name: 'prix', type: 'DECIMAL' }] },
        { name: 'Lignes_Commande', columns: [
          { name: 'commande_id', type: 'INT', pk: true },
          { name: 'produit_id', type: 'INT', pk: true },
          { name: 'quantite', type: 'INT' },
        ]},
      ],
      relations: [
        { fromTable: 'Lignes_Commande', fromColumn: 'commande_id', toTable: 'Commandes', toColumn: 'commande_id', cardinality: '1-N' },
        { fromTable: 'Lignes_Commande', fromColumn: 'produit_id', toTable: 'Produits',  toColumn: 'produit_id',  cardinality: '1-N' },
      ],
    },
  },
];

export function getDmExerciseById(id) {
  return DM_EXERCISES.find(e => e.id === id);
}

export function getDmExercisesByTier(tierId) {
  return DM_EXERCISES.filter(e => e.tier === tierId);
}
