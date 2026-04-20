/**
 * BI Dojo exercises — 20 exercises across 4 tiers
 * Each provides custom tables and validates the dashboard structure.
 */

// ── Sample data for exercises ──
const CLIENTS = [
  { id: '1', nom: 'Dupont Marie', ville: 'Paris', date_inscription: '2024-01-15' },
  { id: '2', nom: 'Martin Pierre', ville: 'Lyon', date_inscription: '2024-02-20' },
  { id: '3', nom: 'Bernard Julie', ville: 'Marseille', date_inscription: '2024-03-10' },
  { id: '4', nom: 'Petit Luc', ville: 'Paris', date_inscription: '2024-03-22' },
  { id: '5', nom: 'Moreau Sophie', ville: 'Toulouse', date_inscription: '2024-04-05' },
  { id: '6', nom: 'Durand Jean', ville: 'Lyon', date_inscription: '2024-04-18' },
  { id: '7', nom: 'Leroy Emma', ville: 'Bordeaux', date_inscription: '2024-05-01' },
  { id: '8', nom: 'Roux Thomas', ville: 'Paris', date_inscription: '2024-05-14' },
];

const PRODUITS = [
  { id: 'P01', nom: 'Laptop Pro', catégorie: 'Informatique', prix: '1200', stock: '45' },
  { id: 'P02', nom: 'Souris RGB', catégorie: 'Informatique', prix: '35', stock: '200' },
  { id: 'P03', nom: 'Écran 27p', catégorie: 'Informatique', prix: '450', stock: '80' },
  { id: 'P05', nom: 'Casque Audio', catégorie: 'Audio', prix: '120', stock: '90' },
  { id: 'P07', nom: 'Enceinte BT', catégorie: 'Audio', prix: '45', stock: '180' },
  { id: 'P09', nom: 'Chaise Ergo', catégorie: 'Mobilier', prix: '350', stock: '25' },
];

const COMMANDES_PAR_STATUT = [
  { statut: 'Livree', count_commandes: '28' },
  { statut: 'En cours', count_commandes: '14' },
  { statut: 'Annulee', count_commandes: '8' },
];

const COMMANDES_PAR_MOIS = [
  { mois: '2024-01', montant: '2450' }, { mois: '2024-02', montant: '3120' },
  { mois: '2024-03', montant: '2890' }, { mois: '2024-04', montant: '4200' },
  { mois: '2024-05', montant: '3750' }, { mois: '2024-06', montant: '4500' },
];

const CA_PAR_CLIENT = [
  { client_id: '1', nom: 'Dupont Marie', count_commandes: '8', sum_montant: '1450' },
  { client_id: '2', nom: 'Martin Pierre', count_commandes: '6', sum_montant: '1230' },
  { client_id: '3', nom: 'Bernard Julie', count_commandes: '5', sum_montant: '980' },
  { client_id: '4', nom: 'Petit Luc', count_commandes: '4', sum_montant: '720' },
  { client_id: '5', nom: 'Moreau Sophie', count_commandes: '3', sum_montant: '510' },
];

const EMPLOYES = [
  { id: 'E01', nom_complet: 'Marie Dupont', departement: 'IT', salaire: '4500', poste: 'Manager' },
  { id: 'E02', nom_complet: 'Pierre Martin', departement: 'RH', salaire: '4200', poste: 'Manager' },
  { id: 'E03', nom_complet: 'Julie Bernard', departement: 'Finance', salaire: '4800', poste: 'Manager' },
  { id: 'E04', nom_complet: 'Jean Durand', departement: 'IT', salaire: '3200', poste: 'Dev Senior' },
  { id: 'E05', nom_complet: 'Emma Leroy', departement: 'IT', salaire: '2800', poste: 'Dev Junior' },
  { id: 'E06', nom_complet: 'Thomas Roux', departement: 'Finance', salaire: '3500', poste: 'Analyste' },
  { id: 'E07', nom_complet: 'Clara David', departement: 'Marketing', salaire: '2900', poste: 'Designer' },
  { id: 'E08', nom_complet: 'Hugo Bertrand', departement: 'Ventes', salaire: '2600', poste: 'Commercial' },
];

const SALAIRE_PAR_DEPT = [
  { departement: 'IT', avg_salaire: '3500', count_employes: '3' },
  { departement: 'RH', avg_salaire: '4200', count_employes: '1' },
  { departement: 'Finance', avg_salaire: '4150', count_employes: '2' },
  { departement: 'Marketing', avg_salaire: '2900', count_employes: '1' },
  { departement: 'Ventes', avg_salaire: '2600', count_employes: '1' },
];

const VENTES_PAR_CATEGORIE = [
  { catégorie: 'Informatique', sum_montant: '8500', count_ventes: '15' },
  { catégorie: 'Audio', sum_montant: '2400', count_ventes: '8' },
  { catégorie: 'Mobilier', sum_montant: '1750', count_ventes: '5' },
  { catégorie: 'Accessoire', sum_montant: '950', count_ventes: '12' },
];

const TOP_VENTES = [
  { rang: '1', id: 'CMD003', montant: '320', statut: 'Livree' },
  { rang: '2', id: 'CMD002', montant: '280', statut: 'Livree' },
  { rang: '3', id: 'CMD005', montant: '210', statut: 'Livree' },
];

// Helper to make table objects
function mkTable(name, data, icon = '📋') {
  return { id: `ex-${name}`, dbId: 'exercise', dbName: 'Exercice', dbIcon: icon, tableId: name, tableName: name, columns: data.length > 0 ? Object.keys(data[0]) : [], rowCount: data.length, rows: data };
}
function mkPipeTable(name, data) {
  return mkTable(name, data, '🔧');
}

// ════════════════════
// ── EXERCISES ──
// ════════════════════

export const BI_EXERCISES = [
  // ══════════ FACILE (5) ══════════
  {
    id: 'bi-01', title: 'Mon premier KPI', difficulty: 1, isTutorial: true,
    description: 'Le directeur veut voir en un coup d\'oeil le nombre total de clients. Un simple chiffre en grand suffit.\n\nMethodologie : Ajoutez un widget KPI, sélectionnez la colonne "id" comme valeur, puis changez l\'agrégation a COUNT.',
    hint: 'Ajoutez un widget KPI. Dans la config, sélectionnez la colonne "id" avec l\'agrégation COUNT.',
    hintWidgets: ['kpi'],
    tables: [mkTable('clients', CLIENTS)],
    validate: (widgets) => {
      const kpis = widgets.filter(w => w.config?.chartType === 'kpi');
      if (kpis.length === 0) return { ok: false, msg: 'Ajoutez un widget KPI.' };
      return { ok: true, msg: 'Premier KPI créé !' };
    },
  },
  {
    id: 'bi-02', title: 'Barres par catégorie', difficulty: 1,
    description: 'Le responsable produit souhaite visualiser combien de produits il y a dans chaque catégorie (Informatique, Audio, Mobilier). Un graphique en barres est ideal pour cette comparaison.\n\nMethodologie : Creez un graphique en barres avec la catégorie en axe X et un comptage en axe Y.',
    hint: 'Widget Barres → Axe X: catégorie, Axe Y: id, Agrégation: COUNT.',
    hintWidgets: ['bar'],
    tables: [mkTable('produits', PRODUITS)],
    validate: (widgets) => {
      const bars = widgets.filter(w => w.config?.chartType === 'bar');
      if (bars.length === 0) return { ok: false, msg: 'Ajoutez un graphique en Barres.' };
      if (bars[0].config?.xCol !== 'catégorie') return { ok: false, msg: 'Utilisez la colonne "catégorie" en Axe X.' };
      return { ok: true, msg: 'Barres par catégorie !' };
    },
  },
  {
    id: 'bi-03', title: 'Camembert des statuts', difficulty: 1,
    description: 'Le service logistique a besoin de visualiser la répartition des commandes par statut (Livree, En cours, Annulee). L\'equipe Pipeline a déjà prepare une table agrégée "commandes_par_statut" (similaire a l\'exercice Pipeline #14). A vous de la mettre en forme.\n\nMethodologie : Creez un camembert avec le statut comme label et le nombre de commandes comme valeur.',
    hint: 'Widget Camembert → Labels: statut, Valeur: count_commandes.',
    hintWidgets: ['pie'],
    tables: [mkPipeTable('commandes_par_statut', COMMANDES_PAR_STATUT)],
    validate: (widgets) => {
      const pies = widgets.filter(w => w.config?.chartType === 'pie');
      if (pies.length === 0) return { ok: false, msg: 'Ajoutez un Camembert.' };
      return { ok: true, msg: 'Camembert des statuts !' };
    },
  },
  {
    id: 'bi-04', title: 'Tendance mensuelle', difficulty: 1,
    description: 'Le controleur de gestion veut suivre l\'evolution du CA mois par mois. L\'equipe data a prepare une table "ca_mensuel" avec le montant agrégé par mois depuis le Pipeline Dojo.\n\nMethodologie : Creez un graphique en ligne avec le mois en axe X et le montant en axe Y.',
    hint: 'Widget Ligne → Axe X: mois, Axe Y: montant.',
    hintWidgets: ['line'],
    tables: [mkPipeTable('ca_mensuel', COMMANDES_PAR_MOIS)],
    validate: (widgets) => {
      const lines = widgets.filter(w => w.config?.chartType === 'line');
      if (lines.length === 0) return { ok: false, msg: 'Ajoutez un graphique en Ligne.' };
      return { ok: true, msg: 'Tendance mensuelle visualisee !' };
    },
  },
  {
    id: 'bi-05', title: 'Tableau employes', difficulty: 1,
    description: 'Le RH a besoin d\'un tableau affichant la liste des employes avec leur departement, poste et salaire pour une revue rapide.\n\nMethodologie : Ajoutez un widget Tableau (Table) pour afficher les données brutes.',
    hint: 'Widget Table. Il affiche automatiquement toutes les colonnes.',
    hintWidgets: ['table'],
    tables: [mkTable('employes', EMPLOYES)],
    validate: (widgets) => {
      const tables = widgets.filter(w => w.config?.chartType === 'table');
      if (tables.length === 0) return { ok: false, msg: 'Ajoutez un widget Table.' };
      return { ok: true, msg: 'Tableau employes créé !' };
    },
  },

  // ══════════ INTERMEDIAIRE (6) ══════════
  {
    id: 'bi-06', title: 'Dashboard KPI + Barres', difficulty: 2,
    description: 'Le directeur commercial veut un mini-dashboard montrant deux informations : le nombre total de clients (KPI) et la répartition des clients par ville (barres). Les deux widgets doivent etre sur la même page.\n\nMethodologie : Combinez un KPI (count) et un graphique en barres (ville) sur le même dashboard.',
    hint: 'KPI (count id) + Barres (X: ville, Y: id, count).',
    hintWidgets: ['kpi', 'bar'],
    tables: [mkTable('clients', CLIENTS)],
    validate: (widgets) => {
      const hasKPI = widgets.some(w => w.config?.chartType === 'kpi');
      const hasBar = widgets.some(w => w.config?.chartType === 'bar');
      if (!hasKPI) return { ok: false, msg: 'Ajoutez un widget KPI.' };
      if (!hasBar) return { ok: false, msg: 'Ajoutez un graphique en Barres.' };
      return { ok: true, msg: 'Dashboard 2 widgets !' };
    },
  },
  {
    id: 'bi-07', title: 'Filtrage par slicer', difficulty: 2,
    description: 'Le directeur regional veut pouvoir filtrer dynamiquement les données clients par ville. Quand il clique sur "Paris", tous les graphiques doivent se mettre a jour pour ne montrer que les clients parisiens.\n\nMethodologie : Ajoutez un Slicer sur la colonne "ville" et au moins un graphique qui sera filtre.',
    hint: 'Slicer (colonne: ville) + KPI ou Barres. Cliquez sur une ville dans le slicer pour filtrer.',
    hintWidgets: ['slicer', 'kpi'],
    tables: [mkTable('clients', CLIENTS)],
    validate: (widgets) => {
      const hasSlicer = widgets.some(w => w.config?.chartType === 'slicer');
      if (!hasSlicer) return { ok: false, msg: 'Ajoutez un widget Slicer.' };
      if (widgets.length < 2) return { ok: false, msg: 'Ajoutez au moins un graphique en plus du slicer.' };
      return { ok: true, msg: 'Slicer interactif en place !' };
    },
  },
  {
    id: 'bi-08', title: 'Donut CA clients', difficulty: 2,
    description: 'Pour la presentation investisseurs, on veut un donut chart montrant la répartition du CA par client. La table "ca_par_client" a ete générée par le pipeline d\'agrégation (exercice Pipeline #22 — Gold CA par client).\n\nMethodologie : Creez un Camembert en mode Donut avec les noms clients en labels et la somme des montants en valeur.',
    hint: 'Camembert → Labels: nom, Valeur: sum_montant, cochez "Mode Donut".',
    hintWidgets: ['pie'],
    tables: [mkPipeTable('ca_par_client', CA_PAR_CLIENT)],
    validate: (widgets) => {
      const pies = widgets.filter(w => w.config?.chartType === 'pie');
      if (pies.length === 0) return { ok: false, msg: 'Ajoutez un Camembert.' };
      if (!pies[0].config?.donut) return { ok: false, msg: 'Activez le mode Donut dans la configuration.' };
      return { ok: true, msg: 'Donut CA clients !' };
    },
  },
  {
    id: 'bi-09', title: 'Jauge d\'objectif', difficulty: 2,
    description: 'Le directeur a fixe un objectif de CA mensuel a 5000€. La table "ca_mensuel" issue du Pipeline contient le CA par mois. Il veut une jauge montrant ou en est le dernier mois (4500€) par rapport a l\'objectif.\n\nMethodologie : Creez une Jauge avec la valeur du CA et les bornes min/max appropriees.',
    hint: 'Jauge → Valeur: montant, Min: 0, Max: 5000. Le dernier mois a 4500€.',
    hintWidgets: ['gauge'],
    tables: [mkPipeTable('ca_mensuel', COMMANDES_PAR_MOIS)],
    validate: (widgets) => {
      const gauges = widgets.filter(w => w.config?.chartType === 'gauge');
      if (gauges.length === 0) return { ok: false, msg: 'Ajoutez une Jauge.' };
      return { ok: true, msg: 'Jauge d\'objectif créée !' };
    },
  },
  {
    id: 'bi-10', title: 'Vue d\'ensemble commandes', difficulty: 2,
    description: 'Le comite de pilotage veut une vue synthetique des commandes à partir de la table "commandes_par_statut" (Pipeline #14). Il faut un KPI pour le total, un camembert par statut, et un tableau detaille. Tout sur une seule page.\n\nMethodologie : Combinez 3 types de widgets differents pour offrir une vue multi-angle.',
    hint: 'KPI (count) + Camembert (statut) + Table.',
    hintWidgets: ['kpi', 'pie', 'table'],
    tables: [mkPipeTable('commandes_par_statut', COMMANDES_PAR_STATUT)],
    validate: (widgets) => {
      const types = new Set(widgets.map(w => w.config?.chartType));
      if (widgets.length < 3) return { ok: false, msg: `Ajoutez au moins 3 widgets. (${widgets.length} actuellement)` };
      if (types.size < 3) return { ok: false, msg: `Utilisez au moins 3 types differents. (${types.size} actuellement)` };
      return { ok: true, msg: 'Vue d\'ensemble complété !' };
    },
  },
  {
    id: 'bi-11', title: 'Entonnoir de conversion', difficulty: 2,
    description: 'L\'equipe growth veut visualiser l\'entonnoir : combien de commandes passent de "En cours" a "Livree", et combien sont "Annulees". Reutilisez la table "commandes_par_statut" du Pipeline #14.\n\nMethodologie : Creez un Entonnoir avec le statut en labels et le nombre de commandes en valeur.',
    hint: 'Entonnoir → Labels: statut, Valeur: count_commandes.',
    hintWidgets: ['funnel'],
    tables: [mkPipeTable('commandes_par_statut', COMMANDES_PAR_STATUT)],
    validate: (widgets) => {
      const funnels = widgets.filter(w => w.config?.chartType === 'funnel');
      if (funnels.length === 0) return { ok: false, msg: 'Ajoutez un Entonnoir.' };
      return { ok: true, msg: 'Entonnoir de conversion !' };
    },
  },

  // ══════════ DIFFICILE (5) ══════════
  {
    id: 'bi-12', title: 'Dashboard multi-tables', difficulty: 3,
    description: 'Le CEO veut un dashboard croisant 2 sources : la table "ventes_par_catégorie" produite par le pipeline ETL (Pipeline #27) et le catalogue produits brut. Un graphique pour le CA par catégorie, un tableau pour les produits.\n\nMethodologie : Utilisez le selecteur "Source de données" dans la config de chaque widget pour pointer vers des tables differentes.',
    hint: 'Barres (table: ventes_par_catégorie, X: catégorie, Y: sum_montant) + Table (table: produits).',
    hintWidgets: ['bar', 'table'],
    tables: [mkPipeTable('ventes_par_catégorie', VENTES_PAR_CATEGORIE), mkTable('produits', PRODUITS)],
    validate: (widgets) => {
      if (widgets.length < 2) return { ok: false, msg: 'Ajoutez au moins 2 widgets.' };
      const tableIds = new Set(widgets.map(w => w.config?.tableId).filter(Boolean));
      if (tableIds.size < 2) return { ok: false, msg: 'Utilisez 2 tables differentes (changez la source dans la config de chaque widget).' };
      return { ok: true, msg: 'Dashboard multi-tables !' };
    },
  },
  {
    id: 'bi-13', title: 'Dashboard commercial complet', difficulty: 3,
    description: 'Pour la reunion trimestrielle, le directeur commercial veut un dashboard complet. Vous disposez de 2 tables Pipeline : "commandes_par_statut" (Pipeline #14) et "ca_mensuel". Il faut au minimum un KPI, un camembert, une ligne, un slicer et un tableau.\n\nMethodologie : Construisez un dashboard riche combinant KPIs, graphiques et filtres interactifs (5 widgets minimum).',
    hint: 'KPI + Camembert + Ligne + Slicer + Table. Utilisez les tables Pipeline.',
    hintWidgets: ['kpi', 'pie', 'line', 'slicer', 'table'],
    tables: [mkPipeTable('commandes_par_statut', COMMANDES_PAR_STATUT), mkPipeTable('ca_mensuel', COMMANDES_PAR_MOIS)],
    validate: (widgets) => {
      if (widgets.length < 5) return { ok: false, msg: `Minimum 5 widgets. (${widgets.length} actuellement)` };
      const hasSlicer = widgets.some(w => w.config?.chartType === 'slicer');
      if (!hasSlicer) return { ok: false, msg: 'Ajoutez un Slicer pour le filtrage interactif.' };
      return { ok: true, msg: 'Dashboard commercial complet !' };
    },
  },
  {
    id: 'bi-14', title: 'Dashboard 2 pages', difficulty: 3,
    description: 'L\'entreprise veut un dashboard en 2 pages : Page 1 "Ventes" avec les KPIs sur la table "ventes_par_catégorie" (Pipeline #27), et Page 2 "Produits" avec un treemap et un tableau du catalogue brut.\n\nMethodologie : Utilisez le système de pages (onglets en bas) pour separer les vues.',
    hint: 'Creez 2 pages via le bouton "+" en bas. Mettez les ventes sur Page 1, les produits sur Page 2.',
    hintWidgets: ['kpi', 'bar', 'treemap', 'table'],
    tables: [mkPipeTable('ventes_par_catégorie', VENTES_PAR_CATEGORIE), mkTable('produits', PRODUITS)],
    validate: (widgets, pages) => {
      if (!pages || pages.length < 2) return { ok: false, msg: 'Creez au moins 2 pages.' };
      const pagesWithWidgets = pages.filter(p => p.widgets.length > 0);
      if (pagesWithWidgets.length < 2) return { ok: false, msg: 'Les 2 pages doivent contenir des widgets.' };
      return { ok: true, msg: 'Dashboard multi-pages !' };
    },
  },
  {
    id: 'bi-15', title: 'Treemap + Scatter', difficulty: 3,
    description: 'Le data analyst veut explorer les produits sous deux angles : un treemap montrant le poids de chaque catégorie (par prix total), et un nuage de points croisant prix et stock pour identifier les produits chers a faible stock.\n\nMethodologie : Creez un Treemap (catégorie/prix) et un Scatter (X: prix, Y: stock).',
    hint: 'Treemap (labels: catégorie, valeur: prix, sum) + Nuage (X: prix, Y: stock).',
    hintWidgets: ['treemap', 'scatter'],
    tables: [mkTable('produits', PRODUITS)],
    validate: (widgets) => {
      const hasTreemap = widgets.some(w => w.config?.chartType === 'treemap');
      const hasScatter = widgets.some(w => w.config?.chartType === 'scatter');
      if (!hasTreemap) return { ok: false, msg: 'Ajoutez un Treemap.' };
      if (!hasScatter) return { ok: false, msg: 'Ajoutez un Nuage de points.' };
      return { ok: true, msg: 'Treemap + Scatter !' };
    },
  },
  {
    id: 'bi-16', title: 'Top ventes Pipeline', difficulty: 3,
    description: 'L\'equipe commerciale a généré un classement des 3 meilleures ventes via le Pipeline Dojo (exercice Pipeline #26 — Podium des ventes). Vous devez maintenant presenter ces resultats dans un dashboard avec un KPI du montant total, un graphique en barres du podium, et un tableau detaille.\n\nMethodologie : Utilisez la table Pipeline "top_ventes" pour vos 3 widgets.',
    hint: 'KPI (sum montant) + Barres (X: id, Y: montant) + Table.',
    hintWidgets: ['kpi', 'bar', 'table'],
    tables: [mkPipeTable('top_ventes', TOP_VENTES)],
    validate: (widgets) => {
      if (widgets.length < 3) return { ok: false, msg: `Minimum 3 widgets. (${widgets.length})` };
      const types = new Set(widgets.map(w => w.config?.chartType));
      if (types.size < 3) return { ok: false, msg: `${types.size} types differents, il en faut 3.` };
      return { ok: true, msg: 'Dashboard top ventes !' };
    },
  },

  // ══════════ EXPERT (4) ══════════
  {
    id: 'bi-17', title: 'Dashboard direction', difficulty: 4,
    description: 'Le comite de direction veut un dashboard executif pour le bilan annuel. Vous disposez de 3 tables Pipeline : "commandes_par_statut" (#14), "ca_mensuel", et "ca_par_client" (#22). Le dashboard doit inclure des KPIs, des graphiques de répartition, l\'evolution temporelle, et des filtres. Minimum 6 widgets avec des titres.\n\nMethodologie : Construisez un dashboard riche et lisible avec au moins 4 types de graphiques differents.',
    hint: 'KPI×2 + Camembert + Barres + Ligne + Slicer + Table. Pensez aux titres !',
    hintWidgets: ['kpi', 'kpi', 'pie', 'bar', 'line', 'slicer', 'table'],
    tables: [mkPipeTable('commandes_par_statut', COMMANDES_PAR_STATUT), mkPipeTable('ca_mensuel', COMMANDES_PAR_MOIS), mkPipeTable('ca_par_client', CA_PAR_CLIENT)],
    validate: (widgets) => {
      if (widgets.length < 6) return { ok: false, msg: `Minimum 6 widgets. (${widgets.length})` };
      const types = new Set(widgets.map(w => w.config?.chartType));
      if (types.size < 4) return { ok: false, msg: `Utilisez au moins 4 types differents. (${types.size})` };
      const withTitles = widgets.filter(w => w.config?.title && w.config.title.trim());
      if (withTitles.length < 3) return { ok: false, msg: `Titrez vos widgets ! (${withTitles.length}/6 ont un titre)` };
      return { ok: true, msg: 'Dashboard direction valide !' };
    },
  },
  {
    id: 'bi-18', title: 'Analyse RH complété', difficulty: 4,
    description: 'Le DRH prepare une presentation sur la masse salariale. Vous disposez de la table brute "employes" et de la table "salaire_par_dept" générée par le pipeline RH (exercice Pipeline #28). Il veut un KPI du salaire moyen, des barres par departement, un camembert des postes, un tableau et un slicer.\n\nMethodologie : Croisez les 2 tables pour un dashboard complet avec au moins 5 widgets.',
    hint: '2 tables : "employes" + "salaire_par_dept". KPI + Barres + Camembert + Table + Slicer.',
    hintWidgets: ['kpi', 'bar', 'pie', 'table', 'slicer'],
    tables: [mkTable('employes', EMPLOYES), mkPipeTable('salaire_par_dept', SALAIRE_PAR_DEPT)],
    validate: (widgets) => {
      if (widgets.length < 5) return { ok: false, msg: `Minimum 5 widgets. (${widgets.length})` };
      const tableIds = new Set(widgets.map(w => w.config?.tableId).filter(Boolean));
      if (tableIds.size < 2) return { ok: false, msg: 'Utilisez les 2 tables (employes + salaire_par_dept).' };
      const hasSlicer = widgets.some(w => w.config?.chartType === 'slicer');
      if (!hasSlicer) return { ok: false, msg: 'Ajoutez un Slicer.' };
      return { ok: true, msg: 'Analyse RH complété !' };
    },
  },
  {
    id: 'bi-19', title: 'E-Commerce 360', difficulty: 4,
    description: 'Construisez le dashboard ultime e-commerce en croisant 3 tables issues du Pipeline : "ventes_par_catégorie" (#27), "ca_par_client" (#22) et "ca_mensuel". Le dashboard doit comporter 2 pages minimum, 7 widgets, et exploiter au moins 2 des 3 tables.\n\nMethodologie : Page 1 = vue globale (KPIs + camembert + ligne). Page 2 = detail clients + catégories.',
    hint: 'Page 1: KPI + Camembert + Ligne. Page 2: Barres + Treemap + Table. Slicer en bonus.',
    hintWidgets: ['kpi', 'pie', 'line', 'bar', 'treemap', 'table'],
    tables: [mkPipeTable('ventes_par_catégorie', VENTES_PAR_CATEGORIE), mkPipeTable('ca_par_client', CA_PAR_CLIENT), mkPipeTable('ca_mensuel', COMMANDES_PAR_MOIS)],
    validate: (widgets, pages) => {
      if (widgets.length < 7) return { ok: false, msg: `Minimum 7 widgets. (${widgets.length})` };
      if (!pages || pages.length < 2) return { ok: false, msg: 'Creez au moins 2 pages.' };
      const pagesOk = pages.filter(p => p.widgets.length > 0).length >= 2;
      if (!pagesOk) return { ok: false, msg: 'Les 2 pages doivent avoir des widgets.' };
      const tableIds = new Set(widgets.map(w => w.config?.tableId).filter(Boolean));
      if (tableIds.size < 2) return { ok: false, msg: `Utilisez au moins 2 tables Pipeline. (${tableIds.size})` };
      return { ok: true, msg: 'Dashboard E-Commerce 360 !' };
    },
  },
  {
    id: 'bi-20', title: 'Dashboard libre', difficulty: 4,
    description: 'Vous etes le data analyst en charge de créer le meilleur dashboard possible. Votre score depend de la diversite des widgets, l\'utilisation de tables multiples, les filtres interactifs, et la presentation (titres, pages).\n\nMethodologie : Libre ! Combinez un maximum de types de graphiques, tables et fonctionnalites.',
    hint: 'Max de points : widgets varies + multi-tables + slicer + pages + titres.',
    hintWidgets: ['kpi', 'bar', 'pie', 'line', 'slicer', 'treemap', 'table'],
    tables: [mkPipeTable('ventes_par_catégorie', VENTES_PAR_CATEGORIE), mkPipeTable('ca_par_client', CA_PAR_CLIENT), mkPipeTable('ca_mensuel', COMMANDES_PAR_MOIS), mkTable('produits', PRODUITS), mkTable('employes', EMPLOYES)],
    validate: (widgets, pages) => {
      let score = 0; const msg = [];
      // Widget count (max 3)
      score += Math.min(3, Math.floor(widgets.length / 2));
      if (widgets.length >= 4) msg.push(`${widgets.length} widgets`);
      // Widget variety (max 3)
      const types = new Set(widgets.map(w => w.config?.chartType));
      score += Math.min(3, types.size);
      if (types.size >= 3) msg.push(`${types.size} types`);
      // Tables (max 2)
      const tIds = new Set(widgets.map(w => w.config?.tableId).filter(Boolean));
      score += Math.min(2, tIds.size);
      if (tIds.size >= 2) msg.push(`${tIds.size} tables`);
      // Slicer (1)
      if (widgets.some(w => w.config?.chartType === 'slicer')) { score++; msg.push('slicer'); }
      // Pages (1)
      if (pages && pages.length >= 2 && pages.filter(p => p.widgets.length > 0).length >= 2) { score++; msg.push('multi-pages'); }
      // Titles (1)
      const titled = widgets.filter(w => w.config?.title?.trim()).length;
      if (titled >= 3) { score++; msg.push('titres'); }
      const stars = score >= 9 ? 3 : score >= 6 ? 2 : score >= 3 ? 1 : 0;
      return { ok: score >= 3, msg: `Score: ${score}/12 — ${msg.join(', ')}`, stars };
    },
  },
];

export const BI_TIERS = [
  { id: 1, name: 'Facile', color: 'from-emerald-400 to-green-500', icon: '🌱', minToUnlockNext: 5 },
  { id: 2, name: 'Intermédiaire', color: 'from-blue-400 to-indigo-500', icon: '🔧', minToUnlockNext: 4 },
  { id: 3, name: 'Difficile', color: 'from-amber-400 to-orange-500', icon: '🔥', minToUnlockNext: 3 },
  { id: 4, name: 'Expert', color: 'from-red-400 to-rose-600', icon: '💎', minToUnlockNext: null },
];

const BI_PROGRESS_KEY = 'biDojo_exerciseProgress';

export function getBiProgress() {
  try { return JSON.parse(localStorage.getItem(BI_PROGRESS_KEY) || '{}'); } catch { return {}; }
}

export function saveBiProgress(exerciseId, stars) {
  const p = getBiProgress();
  const prev = p[exerciseId]?.stars || 0;
  if (stars > prev) p[exerciseId] = { stars, date: new Date().toISOString() };
  localStorage.setItem(BI_PROGRESS_KEY, JSON.stringify(p));
}

export function isBiTierUnlocked(tier) {
  if (tier === 1) return true;
  const p = getBiProgress();
  const prevExercises = BI_EXERCISES.filter(e => e.difficulty === tier - 1);
  const completed = prevExercises.filter(e => p[e.id]?.stars > 0).length;
  return completed >= (BI_TIERS[tier - 2]?.minToUnlockNext || 0);
}

export function getBiTierProgress(tier) {
  const p = getBiProgress();
  const exercises = BI_EXERCISES.filter(e => e.difficulty === tier);
  return { completed: exercises.filter(e => p[e.id]?.stars > 0).length, total: exercises.length, totalStars: exercises.reduce((s, e) => s + (p[e.id]?.stars || 0), 0) };
}

export function getBiExercisesByTier(tier) {
  return BI_EXERCISES.filter(e => e.difficulty === tier);
}
