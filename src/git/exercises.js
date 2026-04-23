/**
 * Git Dojo exercises : 5 Tier 1 + 3 Tier 2 (MVP).
 * Tiers 3/4 will be added in later phases.
 *
 * Each exercise provides a pure builder returning an engine State. Exercises
 * cannot import the engine at module load time because of circular deps, so
 * the builder receives the engine as a parameter from the Dojo wrapper.
 */

export const GIT_TIERS = [
  { id: 1, name: 'Snapshots',     difficulty: 1 },
  { id: 2, name: 'Branches',      difficulty: 2 },
  { id: 3, name: 'Réécriture',    difficulty: 3 },
  { id: 4, name: 'Collaboration', difficulty: 4 },
];

export const GIT_EXERCISES = [
  // ════════════════ TIER 1 ════════════════
  {
    id: 'git-01',
    tier: 1,
    difficulty: 1,
    isTutorial: true,
    title: 'Premier commit',
    description: "Stager et committer une modification.",
    prompt: `Bienvenue dans le Git Dojo !

Ton fichier app.py vient d'être modifié. Git le voit comme "modifié" mais ne le suivra pas tant que tu ne lui as rien dit.

À faire :
• Stager app.py (git add)
• Committer avec un message clair

Un nouveau point apparaîtra sur le graphe à droite.`,
    hint: "Dans le panneau 'Working tree' à droite : clique 'Stager' à côté de app.py, puis le bouton 'Commiter' de la palette.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet' } });
      const r = eng.modifyFile(s, 'app.py', 'print("hello")'); s = r.state;
      return s;
    },
    target: { commitCount: 2, headBranch: 'main', headAtTip: true, indexEmpty: true, mustContainFile: 'app.py' },
  },

  {
    id: 'git-02',
    tier: 1,
    difficulty: 1,
    title: 'Chaîne linéaire',
    description: "Enchaîner 3 commits sur main.",
    prompt: `Tu as plusieurs petites modifications prêtes. Chacune mérite son propre commit (historique lisible).

À faire, trois fois de suite :
• Modifier un fichier
• Stager
• Commiter

Le graphe doit afficher 4 commits au total (le initial + tes 3).`,
    hint: "Après le premier commit, clique 'Modifier' sur un fichier pour ajouter du contenu, puis Stager et Commiter à nouveau.",
    build: (eng) => eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': '', 'config.json': '{}' } }),
    target: { commitCount: 4, headBranch: 'main', headAtTip: true, indexEmpty: true, linearChain: true },
  },

  {
    id: 'git-03',
    tier: 1,
    difficulty: 1,
    title: 'Stager sélectivement',
    description: "Commit uniquement app.py, laisse config.json de côté.",
    prompt: `Tu as modifié deux fichiers. Mais config.json contient des infos de debug : pas question de le partager pour l'instant.

À faire :
• Stager UNIQUEMENT app.py
• Committer
• config.json doit rester en statut "Modifié" (non commité)`,
    hint: "N'appuie sur 'Stager' QUE pour app.py. Puis 'Commiter'. config.json reste dans la section 'Modifié'.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': 'print("v1")', 'config.json': '{}' } });
      let r = eng.modifyFile(s, 'app.py', 'print("v2")'); s = r.state;
      r = eng.modifyFile(s, 'config.json', '{ "debug": true }'); s = r.state;
      return s;
    },
    target: { commitCount: 2, headBranch: 'main', headAtTip: true, indexEmpty: true, mustContainFile: 'app.py', mustNotCommitFile: 'config.json', workingTreeHasModified: 'config.json' },
  },

  {
    id: 'git-04',
    tier: 1,
    difficulty: 1,
    title: "Défaire un 'git add'",
    description: "Retire un fichier sensible du stage avant de commit.",
    prompt: `Oups, tu as stagé secrets.txt par erreur ! Il contient une clé API qui ne doit surtout pas finir dans l'historique.

À faire :
• Unstager secrets.txt (retire-le de la zone stagée)
• Committer uniquement app.py

secrets.txt reste dans le working tree mais hors du commit.`,
    hint: "Dans la section 'Stagé', clique 'Unstager' à côté de secrets.txt. Puis 'Commiter' pour valider app.py seul.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': 'print("v1")' } });
      let r = eng.modifyFile(s, 'app.py', 'print("v2")'); s = r.state;
      r = eng.modifyFile(s, 'secrets.txt', 'API_KEY=abc123'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.stage(s, 'secrets.txt'); s = r.state;
      return s;
    },
    target: { commitCount: 2, headBranch: 'main', headAtTip: true, indexEmpty: true, mustContainFile: 'app.py', mustNotCommitFile: 'secrets.txt' },
  },

  {
    id: 'git-05',
    tier: 1,
    difficulty: 1,
    title: 'Voyager dans le temps',
    description: "Checkout un commit ancien pour l'inspecter.",
    prompt: `Un bug a été introduit récemment. Pour voir ce qui tournait correctement avant, tu veux te placer temporairement sur le premier commit.

À faire :
• Clique sur le tout premier commit (le plus haut dans le graphe)
• Choisis 'Checkout' dans la palette

HEAD va devenir "détaché" : il pointe directement sur un commit, sans branche. C'est normal.`,
    hint: "Clique sur le cercle du PREMIER commit, puis dans la palette → 'Checkout'. HEAD va se déplacer.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet' } });
      let r = eng.modifyFile(s, 'app.py', 'print("v1")'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'feat: ajouter app.py' }); s = r.state;
      r = eng.modifyFile(s, 'app.py', 'print("v2")'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'refactor: améliorer app.py' }); s = r.state;
      return s;
    },
    target: { headDetached: true, headAtRootCommit: true },
  },

  // ════════════════ TIER 2 ════════════════
  {
    id: 'git-06',
    tier: 2,
    difficulty: 2,
    title: 'Nouvelle branche',
    description: "Crée feature/login depuis main.",
    prompt: `Tu veux tester une nouvelle feature sans polluer main. La règle : toujours coder dans une branche dédiée.

À faire :
• Créer une branche nommée "feature/login"
• HEAD doit pointer sur cette nouvelle branche

La branche est un simple pointeur : le contenu des fichiers ne change pas.`,
    hint: "Palette → 'Nouvelle branche'. Nomme-la 'feature/login'. Git te positionne automatiquement dessus.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': 'print("v1")' } });
      let r = eng.modifyFile(s, 'app.py', 'print("v2")'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'init: v2' }); s = r.state;
      return s;
    },
    target: { hasBranch: 'feature/login', headBranch: 'feature/login' },
  },

  {
    id: 'git-07',
    tier: 2,
    difficulty: 2,
    title: 'Divergence',
    description: "Un commit sur feature, un commit sur main : deux lignes de vie.",
    prompt: `Tu es sur feature/analytics. Scénario :

1. Fais un commit sur feature/analytics (modifie app.py).
2. Switch sur main (clique sur 'main' dans le graphe).
3. Fais un commit sur main (modifie README.md).

Les deux branches auront divergé : chacune a son propre commit que l'autre n'a pas.`,
    hint: "Après le commit sur feature, clique sur le pill 'main' dans le graphe → 'Checkout'. Puis modifie README et commit.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': 'print("v1")' } });
      const r = eng.createBranch(s, 'feature/analytics'); s = r.state;
      return s;
    },
    target: { branchDivergence: { 'main': 1, 'feature/analytics': 1 }, headBranch: 'main', indexEmpty: true },
  },

  {
    id: 'git-08',
    tier: 2,
    difficulty: 2,
    title: 'Fast-forward merge',
    description: "Merger feature/patch dans main sans commit de merge.",
    prompt: `Ta branche feature/patch contient un commit, main n'a pas bougé depuis. Le merge sera donc "fast-forward" : juste un déplacement de pointeur.

À faire :
1. Switch sur main.
2. Merger feature/patch.

Aucun commit de merge n'est créé. L'historique reste linéaire.`,
    hint: "Clique sur 'main' dans le graphe → Checkout. Puis palette → 'Merger' → choisis 'feature/patch'.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': 'print("v1")' } });
      let r = eng.createBranch(s, 'feature/patch'); s = r.state;
      r = eng.modifyFile(s, 'app.py', 'print("v1.1")'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'fix: patch mineur' }); s = r.state;
      return s;
    },
    target: { mainAdvanced: true, noMergeCommit: true, headBranch: 'main' },
  },
];

export function getExerciseById(id) { return GIT_EXERCISES.find(e => e.id === id); }
export function getExercisesByTier(tierId) { return GIT_EXERCISES.filter(e => e.tier === tierId); }
