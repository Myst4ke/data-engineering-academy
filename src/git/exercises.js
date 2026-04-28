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
    title: 'Premier merge',
    description: "Intégrer feature/patch dans main avec un commit de merge.",
    prompt: `Ta branche feature/patch contient un commit, main n'a pas bougé depuis. Tu vas l'intégrer dans main.

À faire :
1. Tu es déjà sur feature/patch (la source du merge).
2. Merger : destination = main.

Le merge crée un commit avec deux parents (l'ancien tip de main et le commit de feature/patch). main avance, feature/patch reste visible sur son rail.`,
    hint: "Palette → 'Merger' → destination = main.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': 'print("v1")' } });
      let r = eng.createBranch(s, 'feature/patch'); s = r.state;
      r = eng.modifyFile(s, 'app.py', 'print("v1.1")'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'fix: patch mineur' }); s = r.state;
      return s;
    },
    target: { headBranch: 'main', mainAdvanced: true, indexEmpty: true, headHasFiles: ['app.py'], hasMergeCommit: true },
  },

  {
    id: 'git-09',
    tier: 2,
    difficulty: 2,
    title: 'Vraie fusion',
    description: "Trois-way merge : créer un commit de merge.",
    prompt: `Deux features ont avancé en parallèle, chacune sur sa branche. Tu vas les intégrer dans main, en créant à chaque fois un commit de merge (deux parents).

À faire :
1. Switch sur feature/A (clique son pill). Merger : destination = main.
2. Switch sur feature/B. Merger : destination = main.

Chaque merge crée un commit avec deux parents : tu vois clairement les deux branches qui rejoignent main, et les branches restent visibles sur leur rail.`,
    hint: "Palette → 'Merger' → choisis feature/A. Recommence avec feature/B.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet' } });
      let r = eng.createBranch(s, 'feature/A'); s = r.state;
      r = eng.modifyFile(s, 'a.py', 'def a(): pass'); s = r.state;
      r = eng.stage(s, 'a.py'); s = r.state;
      r = eng.commit(s, { message: 'feat A' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      r = eng.createBranch(s, 'feature/B'); s = r.state;
      r = eng.modifyFile(s, 'b.py', 'def b(): pass'); s = r.state;
      r = eng.stage(s, 'b.py'); s = r.state;
      r = eng.commit(s, { message: 'feat B' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      return s;
    },
    target: { headBranch: 'main', headAtTip: true, hasMergeCommit: true, headHasFiles: ['a.py', 'b.py'] },
  },

  {
    id: 'git-10',
    tier: 2,
    difficulty: 2,
    title: 'Branche depuis le passé',
    description: "Créer une branche à partir d'un ancien commit.",
    prompt: `Trois commits sur main. Tu apprends qu'un bug a été introduit dans v2 (deuxième commit). Tu veux corriger en repartant de la version 1, pas de la dernière.

À faire :
1. Clique sur le tout premier commit (le plus haut, sans parent).
2. Choisis 'Checkout ce commit' : HEAD devient détaché.
3. Crée une nouvelle branche nommée 'fix-v1' à cet endroit.

La branche pointe maintenant sur le commit racine, pas sur la tête de main.`,
    hint: "Clique le commit racine du graphe → Checkout. Puis palette 'Nouvelle branche' nommée 'fix-v1'.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# v1', 'app.py': 'print("v1")' } });
      let r = eng.modifyFile(s, 'app.py', 'print("v2")'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'v2' }); s = r.state;
      r = eng.modifyFile(s, 'app.py', 'print("v3")'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'v3' }); s = r.state;
      return s;
    },
    target: { hasBranch: 'fix-v1', headBranch: 'fix-v1', branchAtRootCommit: 'fix-v1' },
  },

  // ════════════════ TIER 3 : Réécriture ════════════════
  {
    id: 'git-11',
    tier: 3,
    difficulty: 3,
    title: 'Corriger un message',
    description: "Amender le dernier commit pour corriger une typo.",
    prompt: `Tu viens de commiter mais oups, faute de frappe dans le message : « fix: ajot typo » au lieu de « fix: ajout typo ».

À faire :
• Amende le dernier commit avec le bon message : "fix: ajout typo"

Attention : amender, c'est réécrire. N'amende JAMAIS un commit déjà poussé sur un repo partagé : tu casserais l'historique de tes collègues.`,
    hint: "Palette → 'Amender'. Saisis 'fix: ajout typo' et valide.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet' } });
      let r = eng.modifyFile(s, 'app.py', 'def login(): pass'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'fix: ajot typo' }); s = r.state;
      return s;
    },
    target: { commitCount: 2, headBranch: 'main', headAtTip: true, indexEmpty: true, lastCommitMessage: 'fix: ajout typo' },
  },

  {
    id: 'git-12',
    tier: 3,
    difficulty: 3,
    title: 'Compléter un commit',
    description: "Ajouter un fichier oublié au dernier commit via amend.",
    prompt: `Tu as commité 'app.py' mais oublié 'tests.py'. Plutôt qu'un nouveau commit "fix: oublié les tests", tu peux amender : les deux fichiers vont fusionner dans le commit existant.

À faire :
1. Stage tests.py.
2. Amende le commit précédent (garde son message).

Résultat : un seul commit qui contient les deux fichiers.`,
    hint: "Stage tests.py (drag), puis palette 'Amender' (laisse le message tel quel).",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet' } });
      let r = eng.modifyFile(s, 'app.py', 'def main(): pass'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'feat: nouvelle feature' }); s = r.state;
      r = eng.modifyFile(s, 'tests.py', 'def test_main(): pass'); s = r.state;
      return s;
    },
    target: { commitCount: 2, headBranch: 'main', headAtTip: true, indexEmpty: true, headHasFiles: ['app.py', 'tests.py'] },
  },

  // ════════════════ TIER 4 : Collaboration ════════════════
  {
    id: 'git-13',
    tier: 4,
    difficulty: 4,
    title: 'Workflow GitFlow',
    description: "Faire remonter une feature de feature → develop → main.",
    prompt: `GitFlow : la branche stable est main, l'intégration se fait sur develop, les features sur feature/*. Tu es sur feature/login et tu veux livrer.

À faire :
1. Modifie un fichier (ex : app.py), stage, commit sur feature/login.
2. Tu es toujours sur feature/login. Merger : destination = develop.
3. Tu es maintenant sur develop (auto-switch). Merger : destination = main.

Ta feature voyage proprement jusqu'à la branche stable.`,
    hint: "Modifie app.py, stage, commit. Palette 'Merger' → destination 'develop'. Re-Merger → destination 'main'.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': 'print("v1")' } });
      let r = eng.createBranch(s, 'develop'); s = r.state;
      r = eng.createBranch(s, 'feature/login'); s = r.state;
      return s;
    },
    target: { headBranch: 'main', mainAdvanced: true, indexEmpty: true, headHasFiles: ['app.py'], hasBranch: 'develop' },
  },

  {
    id: 'git-14',
    tier: 4,
    difficulty: 4,
    title: 'Hotfix urgent',
    description: "Corriger un bug en prod sans toucher au travail en cours.",
    prompt: `Bug critique en prod ! Ton équipe travaille sur develop, mais le fix doit partir directement de main. Tu es sur main.

À faire :
1. Crée une branche 'hotfix/critical' depuis main (auto-switch dessus).
2. Modifie app.py pour corriger.
3. Stage et commit le fix sur hotfix/critical.
4. Tu es sur hotfix/critical. Merger : destination = main.

Le hotfix arrive en main sans interférer avec develop.`,
    hint: "Palette 'Nouvelle branche' → 'hotfix/critical'. Modifie app.py, stage, commit. Palette 'Merger' → destination 'main'.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': 'print("BUG")' } });
      let r = eng.createBranch(s, 'develop'); s = r.state;
      r = eng.modifyFile(s, 'wip.py', 'work in progress'); s = r.state;
      r = eng.stage(s, 'wip.py'); s = r.state;
      r = eng.commit(s, { message: 'wip: develop' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      return s;
    },
    target: { hasBranch: 'hotfix/critical', headBranch: 'main', mainAdvanced: true, indexEmpty: true, headHasFiles: ['app.py'] },
  },

  {
    id: 'git-15',
    tier: 4,
    difficulty: 4,
    title: 'Plusieurs équipes',
    description: "Intégrer trois branches d'équipe dans main.",
    prompt: `Trois équipes ont fini leur feature, chacune sur sa branche. Tu es le mainteneur, intègre tout dans main.

À faire (pour chaque branche d'équipe, dans l'ordre) :
1. Switch sur la branche d'équipe en cliquant son pill dans le graphe.
2. Ouvre Merger, choisis main comme destination.

Répète pour team-a/feature-a, team-b/feature-b, team-c/feature-c.

Chaque merge crée un commit sur main qui pointe vers la branche d'équipe : les branches restent visibles à côté du tronc, pratique si une équipe veut continuer à committer dessus plus tard.`,
    hint: "Pour chaque équipe : clic son pill (switch) → palette 'Merger' → destination = main.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet' } });
      let r = eng.createBranch(s, 'team-a/feature-a'); s = r.state;
      r = eng.modifyFile(s, 'a.py', 'A'); s = r.state;
      r = eng.stage(s, 'a.py'); s = r.state;
      r = eng.commit(s, { message: 'feat A' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      r = eng.createBranch(s, 'team-b/feature-b'); s = r.state;
      r = eng.modifyFile(s, 'b.py', 'B'); s = r.state;
      r = eng.stage(s, 'b.py'); s = r.state;
      r = eng.commit(s, { message: 'feat B' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      r = eng.createBranch(s, 'team-c/feature-c'); s = r.state;
      r = eng.modifyFile(s, 'c.py', 'C'); s = r.state;
      r = eng.stage(s, 'c.py'); s = r.state;
      r = eng.commit(s, { message: 'feat C' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      return s;
    },
    target: { headBranch: 'main', headAtTip: true, indexEmpty: true, headHasFiles: ['a.py', 'b.py', 'c.py'], hasMergeCommit: true },
  },

  // ════════════════ TIER 3 : Réécriture (suite) ════════════════
  {
    id: 'git-16',
    tier: 3,
    difficulty: 3,
    title: 'Annuler un commit',
    description: "Inverser un commit fautif via revert.",
    prompt: `Tu viens de pousser un commit qui casse la fonctionnalité. Plutôt que de réécrire l'historique (--amend / reset, dangereux sur un repo partagé), crée un nouveau commit qui ANNULE le précédent.

À faire :
1. Clique sur le dernier commit (HEAD) dans le graphe.
2. Choisis 'Revert ce commit'.

Un nouveau commit "Revert ..." est créé : il restaure l'état d'avant. L'historique reste droit et complet, on voit le bug ET sa correction.`,
    hint: "Clique sur HEAD → 'Revert ce commit'. Aucun stage manuel à faire.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': 'def login(): return True' } });
      let r = eng.modifyFile(s, 'app.py', 'def login(): return False  # cassé'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'feat: login (cassé)' }); s = r.state;
      return s;
    },
    target: { commitCount: 3, headBranch: 'main', headAtTip: true, indexEmpty: true, headFileEquals: { 'app.py': 'def login(): return True' }, lastCommitMessage: 'Revert' },
  },

  {
    id: 'git-17',
    tier: 3,
    difficulty: 3,
    title: 'Rebase pour rattraper main',
    description: "Rejouer un commit de feature au-dessus du nouveau main.",
    prompt: `Pendant que tu codais ta feature, main a avancé. Plutôt qu'un merge (qui crée un commit en plus), tu peux REBASER : Git rejoue tes commits au-dessus du nouveau tip de main, l'historique reste linéaire.

À faire :
1. Tu es sur feature/login.
2. Palette → 'Rebaser' → cible = main.

Ton commit obtient un nouveau parent (le dernier commit de main). L'ancien SHA est abandonné, un nouveau le remplace.`,
    hint: "Palette 'Rebaser' → choisis 'main' comme cible.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': 'v1' } });
      let r = eng.createBranch(s, 'feature/login'); s = r.state;
      r = eng.modifyFile(s, 'login.py', 'def login(): pass'); s = r.state;
      r = eng.stage(s, 'login.py'); s = r.state;
      r = eng.commit(s, { message: 'feat: login' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      r = eng.modifyFile(s, 'app.py', 'v2'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'chore: bump app v2' }); s = r.state;
      r = eng.checkout(s, 'feature/login'); s = r.state;
      return s;
    },
    target: { headBranch: 'feature/login', linearChain: true, headHasFiles: ['README.md', 'app.py', 'login.py'], headFileEquals: { 'app.py': 'v2' } },
  },

  {
    id: 'git-18',
    tier: 3,
    difficulty: 3,
    title: 'Rebase de plusieurs commits',
    description: "Rejouer 3 commits de feature sur le nouveau main.",
    prompt: `Ta branche feature/api a 3 commits. Pendant ce temps, main a reçu 2 nouveaux commits. Rebase pour les rejouer au-dessus.

À faire :
1. Tu es sur feature/api.
2. Palette → 'Rebaser' → cible = main.

Tes 3 commits obtiennent de nouveaux SHA (réécrits). Le graphe montre une chaîne linéaire propre.`,
    hint: "Palette 'Rebaser' → 'main'. Git rejoue automatiquement les 3 commits.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet' } });
      let r = eng.createBranch(s, 'feature/api'); s = r.state;
      r = eng.modifyFile(s, 'api.py', 'v1'); s = r.state;
      r = eng.stage(s, 'api.py'); s = r.state;
      r = eng.commit(s, { message: 'feat: api v1' }); s = r.state;
      r = eng.modifyFile(s, 'api.py', 'v2'); s = r.state;
      r = eng.stage(s, 'api.py'); s = r.state;
      r = eng.commit(s, { message: 'feat: api v2' }); s = r.state;
      r = eng.modifyFile(s, 'tests.py', 'tests'); s = r.state;
      r = eng.stage(s, 'tests.py'); s = r.state;
      r = eng.commit(s, { message: 'test: api' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      r = eng.modifyFile(s, 'README.md', '# Projet v2'); s = r.state;
      r = eng.stage(s, 'README.md'); s = r.state;
      r = eng.commit(s, { message: 'docs: update' }); s = r.state;
      r = eng.modifyFile(s, 'config.json', '{}'); s = r.state;
      r = eng.stage(s, 'config.json'); s = r.state;
      r = eng.commit(s, { message: 'chore: config' }); s = r.state;
      r = eng.checkout(s, 'feature/api'); s = r.state;
      return s;
    },
    target: { headBranch: 'feature/api', linearChain: true, headHasFiles: ['README.md', 'api.py', 'config.json', 'tests.py'], headFileEquals: { 'api.py': 'v2', 'README.md': '# Projet v2' } },
  },

  // ════════════════ TIER 4 : Collaboration (suite) ════════════════
  {
    id: 'git-19',
    tier: 4,
    difficulty: 4,
    title: 'Cherry-pick un fix',
    description: "Apporter un seul commit d'une autre branche.",
    prompt: `Une autre équipe a fait un fix urgent dans feature/exp, perdu au milieu de leurs commits exploratoires. Tu veux JUSTE ce fix dans main, pas le reste.

À faire :
1. Tu es sur main.
2. Clique sur le commit "fix: critique" (au milieu de feature/exp) dans le graphe.
3. Choisis 'Cherry-pick ce commit'.

Un nouveau commit identique en contenu (mais avec un nouveau SHA) est créé sur main. Les autres commits de feature/exp restent sur leur branche.`,
    hint: "Clic sur le commit 'fix: critique' dans le graphe → 'Cherry-pick ce commit'.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet' } });
      let r = eng.createBranch(s, 'feature/exp'); s = r.state;
      r = eng.modifyFile(s, 'exp1.py', 'expérimentation 1'); s = r.state;
      r = eng.stage(s, 'exp1.py'); s = r.state;
      r = eng.commit(s, { message: 'wip: expé 1' }); s = r.state;
      r = eng.modifyFile(s, 'fix.py', 'def fix_security(): pass'); s = r.state;
      r = eng.stage(s, 'fix.py'); s = r.state;
      r = eng.commit(s, { message: 'fix: critique' }); s = r.state;
      r = eng.modifyFile(s, 'exp2.py', 'expérimentation 2'); s = r.state;
      r = eng.stage(s, 'exp2.py'); s = r.state;
      r = eng.commit(s, { message: 'wip: expé 2' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      return s;
    },
    target: { headBranch: 'main', headHasFiles: ['README.md', 'fix.py'], headLacksFiles: ['exp1.py', 'exp2.py'] },
  },

  {
    id: 'git-20',
    tier: 4,
    difficulty: 4,
    title: 'Hotfix par cherry-pick',
    description: "Appliquer le même fix à deux branches.",
    prompt: `Un fix corrige un bug critique sur main. Le même fix doit aussi atterrir sur develop. Plutôt que de le re-coder, cherry-pick le commit.

À faire :
1. Tu es sur develop.
2. Clique sur le commit "fix: critical" (sur main) dans le graphe.
3. Choisis 'Cherry-pick ce commit'.

develop reçoit un nouveau commit avec le même contenu, mais un nouveau SHA. Les deux branches ont le fix.`,
    hint: "Clic sur 'fix: critical' (sur main) → 'Cherry-pick ce commit'.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': 'BUG' } });
      let r = eng.createBranch(s, 'develop'); s = r.state;
      r = eng.modifyFile(s, 'docs.md', 'doc'); s = r.state;
      r = eng.stage(s, 'docs.md'); s = r.state;
      r = eng.commit(s, { message: 'docs: nouvelle doc' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      r = eng.modifyFile(s, 'app.py', 'FIXED'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'fix: critical' }); s = r.state;
      r = eng.checkout(s, 'develop'); s = r.state;
      return s;
    },
    target: { headBranch: 'develop', headFileEquals: { 'app.py': 'FIXED' }, headHasFiles: ['docs.md'] },
  },

  {
    id: 'git-21',
    tier: 4,
    difficulty: 4,
    title: 'Premier conflit (garder ma version)',
    description: "Résoudre un conflit en gardant la version de la destination.",
    prompt: `Deux branches modifient config.json différemment. Le merge va créer un conflit que tu dois résoudre.

À faire :
1. Switch sur dev (clique son pill).
2. Merger : destination = main. Le merge va échouer en conflit.
3. Dans le popup de conflit : choisis "Garder la version de main (ours)" pour conserver la version de main.

Un commit de merge est créé avec la version de main.`,
    hint: "Switch sur dev → Merger → main. Popup de conflit → 'Garder la version de main'.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'config.json': '{"version": 1}' } });
      let r = eng.createBranch(s, 'dev'); s = r.state;
      r = eng.modifyFile(s, 'config.json', '{"version": 2, "by": "dev"}'); s = r.state;
      r = eng.stage(s, 'config.json'); s = r.state;
      r = eng.commit(s, { message: 'feat: dev config' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      r = eng.modifyFile(s, 'config.json', '{"version": 2, "by": "main"}'); s = r.state;
      r = eng.stage(s, 'config.json'); s = r.state;
      r = eng.commit(s, { message: 'feat: main config' }); s = r.state;
      return s;
    },
    target: { headBranch: 'main', hasMergeCommit: true, headFileEquals: { 'config.json': '{"version": 2, "by": "main"}' } },
  },

  {
    id: 'git-22',
    tier: 4,
    difficulty: 4,
    title: 'Conflit : prendre leur version',
    description: "Résoudre un conflit en prenant la version de la source.",
    prompt: `Même configuration que l'exercice précédent : conflit sur config.json. Cette fois tu décides de prendre la version de l'autre branche.

À faire :
1. Switch sur dev (clique son pill).
2. Merger : destination = main. Conflit !
3. Choisis "Prendre la version de dev (theirs)".`,
    hint: "Switch sur dev → Merger → main. Popup → 'Prendre la version de dev'.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'config.json': '{"version": 1}' } });
      let r = eng.createBranch(s, 'dev'); s = r.state;
      r = eng.modifyFile(s, 'config.json', '{"version": 2, "by": "dev"}'); s = r.state;
      r = eng.stage(s, 'config.json'); s = r.state;
      r = eng.commit(s, { message: 'feat: dev config' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      r = eng.modifyFile(s, 'config.json', '{"version": 2, "by": "main"}'); s = r.state;
      r = eng.stage(s, 'config.json'); s = r.state;
      r = eng.commit(s, { message: 'feat: main config' }); s = r.state;
      return s;
    },
    target: { headBranch: 'main', hasMergeCommit: true, headFileEquals: { 'config.json': '{"version": 2, "by": "dev"}' } },
  },

  {
    id: 'git-23',
    tier: 4,
    difficulty: 4,
    title: 'Annuler un merge',
    description: "Revert d'un commit de merge problématique.",
    prompt: `Tu as mergé feature/risky dans main, mais ça casse tout. Pour défaire le merge sans réécrire l'historique, fais un revert du commit de merge.

À faire :
1. Clique sur le commit de merge (le dernier sur main).
2. Choisis 'Revert ce commit'.

Un nouveau commit "Revert ..." est créé. Le contenu de feature/risky est extrait. main retourne à son état pré-merge.`,
    hint: "Clic sur le commit de merge → 'Revert ce commit'.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# stable' } });
      let r = eng.createBranch(s, 'feature/risky'); s = r.state;
      r = eng.modifyFile(s, 'risky.py', 'do something risky'); s = r.state;
      r = eng.stage(s, 'risky.py'); s = r.state;
      r = eng.commit(s, { message: 'feat: risky' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      r = eng.merge(s, 'feature/risky'); s = r.state;
      return s;
    },
    target: { headBranch: 'main', headLacksFiles: ['risky.py'], lastCommitMessage: 'Revert' },
  },

  {
    id: 'git-24',
    tier: 4,
    difficulty: 4,
    title: 'Workflow PR moderne',
    description: "Rebase une feature sur main, puis merge.",
    prompt: `Workflow GitHub typique : ta branche feature/ui est en retard sur main. Tu vas d'abord linéariser (rebase), puis créer la PR (merge).

À faire :
1. Tu es sur feature/ui. Rebase sur main : Palette → 'Rebaser' → main.
2. Toujours sur feature/ui, Merger : destination = main.

main avance avec un commit de merge propre.`,
    hint: "Rebaser sur main, puis Merger → destination main.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': 'v1' } });
      let r = eng.createBranch(s, 'feature/ui'); s = r.state;
      r = eng.modifyFile(s, 'ui.py', 'def render(): pass'); s = r.state;
      r = eng.stage(s, 'ui.py'); s = r.state;
      r = eng.commit(s, { message: 'feat: ui' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      r = eng.modifyFile(s, 'app.py', 'v2'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'chore: bump' }); s = r.state;
      r = eng.checkout(s, 'feature/ui'); s = r.state;
      return s;
    },
    target: { headBranch: 'main', headHasFiles: ['app.py', 'ui.py'], headFileEquals: { 'app.py': 'v2' }, hasMergeCommit: true },
  },

  {
    id: 'git-25',
    tier: 4,
    difficulty: 4,
    title: 'Cherry-pick ciblé',
    description: "Cherry-pick UN commit précis d'une chaîne de 3.",
    prompt: `feature/multi a 3 commits. Tu veux uniquement le 2ème (un fix de doc) sur main, sans les 2 autres.

À faire :
1. Tu es sur main.
2. Clique sur le 2ème commit "docs: corriger" de feature/multi.
3. Cherry-pick ce commit.

main reçoit le contenu de doc corrigée, sans le code spaghetti des autres commits.`,
    hint: "Clic sur le commit 'docs: corriger' au milieu de feature/multi → 'Cherry-pick ce commit'.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'docs.md': 'doc TODO' } });
      let r = eng.createBranch(s, 'feature/multi'); s = r.state;
      r = eng.modifyFile(s, 'spaghetti1.py', 'old code'); s = r.state;
      r = eng.stage(s, 'spaghetti1.py'); s = r.state;
      r = eng.commit(s, { message: 'feat: vieille feature' }); s = r.state;
      r = eng.modifyFile(s, 'docs.md', 'doc corrigée et complète'); s = r.state;
      r = eng.stage(s, 'docs.md'); s = r.state;
      r = eng.commit(s, { message: 'docs: corriger' }); s = r.state;
      r = eng.modifyFile(s, 'spaghetti2.py', 'more old'); s = r.state;
      r = eng.stage(s, 'spaghetti2.py'); s = r.state;
      r = eng.commit(s, { message: 'feat: encore' }); s = r.state;
      r = eng.checkout(s, 'main'); s = r.state;
      return s;
    },
    target: { headBranch: 'main', headFileEquals: { 'docs.md': 'doc corrigée et complète' }, headLacksFiles: ['spaghetti1.py', 'spaghetti2.py'] },
  },

  // ════════════════ TIER 1 : Snapshots (suite) ════════════════
  {
    id: 'git-26',
    tier: 1,
    difficulty: 1,
    title: 'Tout stager d\'un coup',
    description: "Utiliser le bouton 'Tout stager' pour préparer plusieurs fichiers en un clic.",
    prompt: `Tu as modifié trois fichiers (a.txt, b.txt, c.txt) et veux tous les commiter ensemble. Plutôt que de les glisser un par un, utilise le bouton 'Tout stager' dans le header de la fenêtre Files.

À faire :
1. Clique '+ Tout stager (3)' en haut de la fenêtre Files.
2. Commit avec un message au choix (ex : 'chore: nettoyage').`,
    hint: "Le bouton '+ Tout stager' apparaît dans le header de la fenêtre Files quand des fichiers sont modifiés.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'a.txt': 'A original', 'b.txt': 'B original', 'c.txt': 'C original' } });
      let r = eng.modifyFile(s, 'a.txt', 'A nouveau'); s = r.state;
      r = eng.modifyFile(s, 'b.txt', 'B nouveau'); s = r.state;
      r = eng.modifyFile(s, 'c.txt', 'C nouveau'); s = r.state;
      return s;
    },
    target: { commitCount: 2, headBranch: 'main', headAtTip: true, indexEmpty: true, headFileEquals: { 'a.txt': 'A nouveau', 'b.txt': 'B nouveau', 'c.txt': 'C nouveau' } },
  },

  {
    id: 'git-27',
    tier: 1,
    difficulty: 1,
    title: 'Créer un nouveau fichier',
    description: "Ajouter un fichier inexistant dans le dépôt via la tuile 'Nouveau'.",
    prompt: `Le repo n'a qu'un README. Tu veux ajouter une page de notes personnelles.

À faire :
1. Dans la fenêtre Files, clique sur la tuile 'Nouveau' (avec le +).
2. Saisis le nom 'notes.md' et un contenu de ton choix.
3. Le fichier apparaît en pointillé vert (non suivi).
4. Glisse-le vers la Staging Zone et commit.`,
    hint: "Tuile 'Nouveau' (+ pointillé) en bas du grid Files → saisis 'notes.md' → contenu → Créer.",
    build: (eng) => eng.makeInitialState({ files: { 'README.md': '# Projet' } }),
    target: { commitCount: 2, headBranch: 'main', headAtTip: true, indexEmpty: true, headHasFiles: ['README.md', 'notes.md'] },
  },

  // ════════════════ TIER 2 : Branches (suite) ════════════════
  {
    id: 'git-28',
    tier: 2,
    difficulty: 2,
    title: 'Feature en plusieurs étapes',
    description: "Construire une feature en 3 commits, puis la merger.",
    prompt: `Une vraie feature s'écrit rarement en un seul commit. Tu vas faire 3 étapes incrémentales sur feature/long, puis intégrer dans main.

À faire (sur feature/long) :
1. Crée step1.py avec contenu au choix, stage, commit.
2. Crée step2.py, stage, commit.
3. Crée step3.py, stage, commit.
4. Merger : destination = main.

main reçoit les 3 commits via un commit de merge propre.`,
    hint: "3 cycles : 'Nouveau' → contenu → stage → commit. Puis Merger → main.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet' } });
      let r = eng.createBranch(s, 'feature/long'); s = r.state;
      return s;
    },
    target: { headBranch: 'main', hasMergeCommit: true, indexEmpty: true, headHasFiles: ['step1.py', 'step2.py', 'step3.py'] },
  },

  {
    id: 'git-29',
    tier: 2,
    difficulty: 2,
    title: 'Trois branches sœurs',
    description: "Créer trois branches qui partent du même commit.",
    prompt: `Tu prépares trois pistes d'exploration en parallèle. Crée trois branches depuis main, sans rien y commiter.

À faire (depuis main, sans commit entre chaque création) :
1. Crée la branche 'feature/A'.
2. Switch sur main, crée 'feature/B'.
3. Switch sur main, crée 'feature/C'.

Les trois branches pointent toutes sur le commit initial. HEAD finit sur feature/C (la dernière créée).`,
    hint: "Palette 'Nouvelle branche' x3, en revenant sur main entre chaque création.",
    build: (eng) => eng.makeInitialState({ files: { 'README.md': '# Projet' } }),
    target: { hasBranches: ['main', 'feature/A', 'feature/B', 'feature/C'], headBranch: 'feature/C' },
  },

  // ════════════════ TIER 3 : Réécriture (suite) ════════════════
  {
    id: 'git-30',
    tier: 3,
    difficulty: 3,
    title: 'Amender deux fois',
    description: "Affiner le dernier commit en deux passes successives d'amend.",
    prompt: `Tu as commité un brouillon ('wip'). Tu vas l'amender deux fois pour arriver au commit final.

À faire :
1. Première passe : Amender → message = 'fix: corriger app'.
2. Modifie README.md (ajoute du contenu), stage.
3. Deuxième passe : Amender → message = 'fix: corriger app et doc'.

Le commit garde le même SHA dans le dojo (in-place). Son message et son contenu évoluent.`,
    hint: "Amender (1ère fois) → 'fix: corriger app'. Modifier README, stage. Amender (2ème fois) → 'fix: corriger app et doc'.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet' } });
      let r = eng.modifyFile(s, 'app.py', 'v1'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'wip' }); s = r.state;
      return s;
    },
    target: { commitCount: 2, headBranch: 'main', headAtTip: true, indexEmpty: true, headHasFiles: ['README.md', 'app.py'], lastCommitMessage: 'fix: corriger app et doc' },
  },

  {
    id: 'git-31',
    tier: 3,
    difficulty: 3,
    title: 'Revert d\'un ancien commit',
    description: "Annuler un commit qui n'est PAS le dernier de l'historique.",
    prompt: `Tu as 3 commits sur main. Le DEUXIÈME a introduit un bug, mais tu as déjà fait un autre commit après. Tu veux annuler juste ce commit fautif sans toucher au plus récent.

À faire :
1. Clique sur le commit "feat: bump v2 (a un bug)" (au milieu de l'historique).
2. Choisis 'Revert ce commit'.

Un nouveau commit "Revert ..." est créé. Le plus récent (feat: nouvelle feature) reste intact.`,
    hint: "Clic sur le commit du milieu → 'Revert ce commit'.",
    build: (eng) => {
      let s = eng.makeInitialState({ files: { 'README.md': '# Projet', 'app.py': 'v1' } });
      let r = eng.modifyFile(s, 'app.py', 'v2 (bug)'); s = r.state;
      r = eng.stage(s, 'app.py'); s = r.state;
      r = eng.commit(s, { message: 'feat: bump v2 (a un bug)' }); s = r.state;
      r = eng.modifyFile(s, 'feature.py', 'nouvelle feature'); s = r.state;
      r = eng.stage(s, 'feature.py'); s = r.state;
      r = eng.commit(s, { message: 'feat: nouvelle feature' }); s = r.state;
      return s;
    },
    target: { commitCount: 4, headBranch: 'main', headAtTip: true, indexEmpty: true, headFileEquals: { 'app.py': 'v1' }, headHasFiles: ['README.md', 'app.py', 'feature.py'], lastCommitMessage: 'Revert' },
  },
];

export function getExerciseById(id) { return GIT_EXERCISES.find(e => e.id === id); }
export function getExercisesByTier(tierId) { return GIT_EXERCISES.filter(e => e.tier === tierId); }
