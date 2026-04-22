/**
 * Pipeline Dojo exercises — 32 exercises across 4 difficulty tiers
 * Each exercise provides custom source data (sometimes with intentional errors)
 * and a validation function that checks the pipeline output.
 */

// ── Helper: deep-equal for table validation ──
function tablesMatch(actual, expected) {
  if (!actual || !expected) return false;
  if (actual.length !== expected.length) return false;
  const aCols = actual.length > 0 ? Object.keys(actual[0]).sort() : [];
  const eCols = expected.length > 0 ? Object.keys(expected[0]).sort() : [];
  if (aCols.length !== eCols.length) return false;
  for (let i = 0; i < aCols.length; i++) {
    if (aCols[i].toLowerCase() !== eCols[i].toLowerCase()) return false;
  }
  for (let i = 0; i < actual.length; i++) {
    for (const col of eCols) {
      if (String(actual[i][col] ?? '').trim() !== String(expected[i][col] ?? '').trim()) return false;
    }
  }
  return true;
}

// Looser check: same rows regardless of order, same columns
function tablesMatchUnordered(actual, expected) {
  if (!actual || !expected || actual.length !== expected.length) return false;
  const aCols = actual.length > 0 ? Object.keys(actual[0]).sort() : [];
  const eCols = expected.length > 0 ? Object.keys(expected[0]).sort() : [];
  if (aCols.join(',').toLowerCase() !== eCols.join(',').toLowerCase()) return false;
  const key = (row) => eCols.map(c => String(row[c] ?? '').trim()).join('|||');
  const aSet = actual.map(key).sort();
  const eSet = expected.map(key).sort();
  return aSet.join('\n') === eSet.join('\n');
}

// Check that a pipeline contains certain node types
function hasNodeTypes(nodes, nodeConfigs, requiredTypes) {
  const types = nodes.map(n => n.type);
  return requiredTypes.every(t => types.includes(t));
}

// Check lakehouse has N children
function lakehouseHasChildren(nodes, nodeConfigs, lakehouseType, minCount) {
  const lh = nodes.find(n => n.type === lakehouseType);
  if (!lh) return false;
  const children = nodes.filter(n => nodeConfigs[n.id]?.parentId === lh.id);
  return children.length >= minCount;
}

// ════════════════════════════════════════
// ── EXERCISE SOURCE DATA (with errors) ──
// ════════════════════════════════════════

const CLEAN_CLIENTS = [
  { id: '1', nom: 'Dupont Marie', email: 'marie@mail.com', ville: 'Paris', date_inscription: '2024-01-15' },
  { id: '2', nom: 'Martin Pierre', email: 'pierre@mail.com', ville: 'Lyon', date_inscription: '2024-02-20' },
  { id: '3', nom: 'Bernard Julie', email: 'julie@mail.com', ville: 'Marseille', date_inscription: '2024-03-10' },
  { id: '4', nom: 'Petit Luc', email: 'luc@mail.com', ville: 'Paris', date_inscription: '2024-03-22' },
  { id: '5', nom: 'Moreau Sophie', email: 'sophie@mail.com', ville: 'Toulouse', date_inscription: '2024-04-05' },
];

const CLIENTS_WITH_DUPES = [
  ...CLEAN_CLIENTS,
  { id: '1', nom: 'Dupont Marie', email: 'marie@mail.com', ville: 'Paris', date_inscription: '2024-01-15' },
  { id: '3', nom: 'Bernard Julie', email: 'julie@mail.com', ville: 'Marseille', date_inscription: '2024-03-10' },
];

const COMMANDES_WITH_EMPTY = [
  { id: 'CMD001', client_id: '1', date: '2024-01-10', montant: '150', statut: 'Livree' },
  { id: 'CMD002', client_id: '2', date: '2024-01-15', montant: '', statut: 'Livree' },
  { id: 'CMD003', client_id: '3', date: '2024-02-01', montant: '320', statut: 'En cours' },
  { id: 'CMD004', client_id: '1', date: '2024-02-14', montant: '85', statut: '' },
  { id: 'CMD005', client_id: '4', date: '2024-03-01', montant: '210', statut: 'Livree' },
  { id: 'CMD006', client_id: '5', date: '2024-03-15', montant: '95', statut: 'Annulee' },
  { id: 'CMD007', client_id: '2', date: '2024-04-01', montant: '', statut: 'En cours' },
  { id: 'CMD008', client_id: '3', date: '2024-04-20', montant: '175', statut: 'Livree' },
];

const EMPLOYES_FULL = [
  { id: 'E01', nom: 'Dupont', prenom: 'Marie', departement_id: 'D1', salaire: '4500', date_embauche: '2020-03-15', poste: 'Manager' },
  { id: 'E02', nom: 'Martin', prenom: 'Pierre', departement_id: 'D2', salaire: '4200', date_embauche: '2019-07-01', poste: 'Manager' },
  { id: 'E03', nom: 'Bernard', prenom: 'Julie', departement_id: 'D3', salaire: '4800', date_embauche: '2018-01-10', poste: 'Manager' },
  { id: 'E04', nom: 'Petit', prenom: 'Luc', departement_id: 'D4', salaire: '4300', date_embauche: '2021-02-28', poste: 'Manager' },
  { id: 'E05', nom: 'Moreau', prenom: 'Sophie', departement_id: 'D5', salaire: '4600', date_embauche: '2019-11-15', poste: 'Manager' },
  { id: 'E06', nom: 'Durand', prenom: 'Jean', departement_id: 'D1', salaire: '3200', date_embauche: '2022-06-01', poste: 'Dev Senior' },
  { id: 'E07', nom: 'Leroy', prenom: 'Emma', departement_id: 'D1', salaire: '2800', date_embauche: '2023-01-15', poste: 'Dev Junior' },
  { id: 'E08', nom: 'Roux', prenom: 'Thomas', departement_id: 'D3', salaire: '3500', date_embauche: '2021-09-01', poste: 'Analyste' },
];

const PRODUITS_SMALL = [
  { id: 'P01', nom: 'Laptop Pro', catégorie: 'Informatique', prix: '1200', stock: '45' },
  { id: 'P02', nom: 'Souris RGB', catégorie: 'Informatique', prix: '35', stock: '200' },
  { id: 'P03', nom: 'Écran 27p', catégorie: 'Informatique', prix: '450', stock: '80' },
  { id: 'P05', nom: 'Casque Audio', catégorie: 'Audio', prix: '120', stock: '90' },
  { id: 'P07', nom: 'Enceinte BT', catégorie: 'Audio', prix: '45', stock: '180' },
  { id: 'P09', nom: 'Chaise Ergo', catégorie: 'Mobilier', prix: '350', stock: '25' },
];

const DEPARTEMENTS = [
  { id: 'D1', nom: 'IT', responsable: 'Dupont Marie', budget: '500000' },
  { id: 'D2', nom: 'RH', responsable: 'Martin Pierre', budget: '200000' },
  { id: 'D3', nom: 'Finance', responsable: 'Bernard Julie', budget: '350000' },
  { id: 'D4', nom: 'Marketing', responsable: 'Petit Luc', budget: '300000' },
  { id: 'D5', nom: 'Ventes', responsable: 'Moreau Sophie', budget: '400000' },
];

const FOURNISSEURS = [
  { id: 'F01', nom: 'TechCo', pays: 'France', contact: 'contact@techco.fr', catégorie: 'Informatique' },
  { id: 'F02', nom: 'AudioMax', pays: 'Allemagne', contact: 'info@audiomax.de', catégorie: 'Audio' },
  { id: 'F03', nom: 'PeriphPlus', pays: 'France', contact: 'vente@periphplus.fr', catégorie: 'Accessoire' },
  { id: 'F04', nom: 'MobilierPro', pays: 'Italie', contact: 'sales@mobilier.it', catégorie: 'Mobilier' },
];

// Data with technical column names
const COMMANDES_TECH_NAMES = [
  { cmd_id: 'CMD001', clt_id: '1', dt_cmd: '2024-01-10', mnt: '150', st: 'Livree' },
  { cmd_id: 'CMD002', clt_id: '2', dt_cmd: '2024-01-15', mnt: '230', st: 'Livree' },
  { cmd_id: 'CMD003', clt_id: '3', dt_cmd: '2024-02-01', mnt: '320', st: 'En cours' },
  { cmd_id: 'CMD004', clt_id: '1', dt_cmd: '2024-02-14', mnt: '85', st: 'Livree' },
  { cmd_id: 'CMD005', clt_id: '4', dt_cmd: '2024-03-01', mnt: '210', st: 'Annulee' },
];

const CLIENTS_WITH_EXTRA_COLS = [
  { _hash: 'a1b2c3', id: '1', nom: 'Dupont Marie', email: 'marie@mail.com', ville: 'Paris', _internal_id: 'INT001' },
  { _hash: 'd4e5f6', id: '2', nom: 'Martin Pierre', email: 'pierre@mail.com', ville: 'Lyon', _internal_id: 'INT002' },
  { _hash: 'g7h8i9', id: '3', nom: 'Bernard Julie', email: 'julie@mail.com', ville: 'Marseille', _internal_id: 'INT003' },
  { _hash: 'j0k1l2', id: '4', nom: 'Petit Luc', email: 'luc@mail.com', ville: 'Paris', _internal_id: 'INT004' },
  { _hash: 'm3n4o5', id: '5', nom: 'Moreau Sophie', email: 'sophie@mail.com', ville: 'Toulouse', _internal_id: 'INT005' },
];

// Commandes with duplicates AND empty cells
const COMMANDES_DIRTY = [
  { id: 'CMD001', client_id: '1', date: '2024-01-10', montant: '150', statut: 'Livree' },
  { id: 'CMD002', client_id: '2', date: '2024-01-15', montant: '230', statut: 'Livree' },
  { id: 'CMD001', client_id: '1', date: '2024-01-10', montant: '150', statut: 'Livree' }, // dupe
  { id: 'CMD003', client_id: '3', date: '2024-02-01', montant: '', statut: 'En cours' }, // empty montant
  { id: 'CMD004', client_id: '1', date: '2024-02-14', montant: '85', statut: 'Livree' },
  { id: 'CMD005', client_id: '4', date: '2024-03-01', montant: '210', statut: '' }, // empty statut
  { id: 'CMD002', client_id: '2', date: '2024-01-15', montant: '230', statut: 'Livree' }, // dupe
  { id: 'CMD006', client_id: '5', date: '2024-03-15', montant: '95', statut: 'Annulee' },
  { id: 'CMD007', client_id: '2', date: '2024-04-01', montant: '175', statut: 'Livree' },
];

const PRODUITS_EN = [
  { product_id: 'P01', name: 'Laptop Pro', category: 'IT', price: '1200', qty: '45' },
  { product_id: 'P02', name: 'Souris RGB', category: 'IT', price: '35', qty: '200' },
  { product_id: 'P03', name: 'Écran 27p', category: 'IT', price: '450', qty: '80' },
  { product_id: 'P05', name: 'Casque Audio', category: 'Audio', price: '120', qty: '90' },
];

const EVALUATIONS_WITH_EMPTY = [
  { id: '1', employe_id: 'E01', annee: '2024', note: '5', commentaire: 'Excellent' },
  { id: '2', employe_id: 'E02', annee: '2024', note: '3', commentaire: '' },
  { id: '3', employe_id: 'E03', annee: '2024', note: '4', commentaire: 'Satisfaisant' },
  { id: '4', employe_id: 'E04', annee: '2024', note: '2', commentaire: '' },
  { id: '5', employe_id: 'E05', annee: '2024', note: '4', commentaire: '' },
  { id: '6', employe_id: 'E06', annee: '2024', note: '1', commentaire: 'A ameliorer' },
  { id: '7', employe_id: 'E07', annee: '2024', note: '3', commentaire: '' },
  { id: '8', employe_id: 'E08', annee: '2024', note: '5', commentaire: 'Excellent' },
];

const VENTES_NORD = [
  { region: 'Nord', produit: 'Laptop', montant: '1200', date: '2024-01-15' },
  { region: 'Nord', produit: 'Souris', montant: '35', date: '2024-01-20' },
  { region: 'Nord', produit: 'Écran', montant: '450', date: '2024-02-10' },
];
const VENTES_SUD = [
  { region: 'Sud', produit: 'Laptop', montant: '1200', date: '2024-01-18' },
  { region: 'Sud', produit: 'Casque', montant: '120', date: '2024-02-05' },
  { region: 'Sud', produit: 'Chaise', montant: '350', date: '2024-02-20' },
];

// ═══════════════════════
// ── EXERCISE DEFINITIONS ──
// ═══════════════════════

// Helper: get data arriving at any destination node
function getDestinationData(outputs, nodes, conns) {
  const dest = nodes.find(n => ['csv_export', 'warehouse', 'dashboard'].includes(n.type));
  if (!dest) return null;
  const inc = conns.filter(c => c.to === dest.id);
  return inc.length > 0 ? (outputs[inc[0].from] || []) : [];
}

export const EXERCISES = [
  // ══════════ FACILE (6) ══════════
  {
    id: 'pipe-01', title: 'Export clients', difficulty: 1, isTutorial: true,
    description: 'Le service commercial lance une campagne emailing et a besoin de la liste complété des clients avec leurs coordonnees. La base contient une table "clients" prete a l\'emploi.\n\nMethodologie : Chargez la table depuis une source de données et envoyez-la vers un fichier d\'export.',
    hint: 'Source CSV → clic droit pour charger clients → connectez a Export CSV.',
    hintNodes: ['csv_source', 'csv_export'],
    sources: { 'csv_source': [{ name: 'clients', data: CLEAN_CLIENTS }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez un noeud Export CSV.' };
      if (data.length === 0) return { ok: false, msg: 'Aucune donnée ne parvient a l\'export.' };
      if (data[0].nom) return { ok: true, msg: 'Pipeline fonctionnel !' };
      return { ok: false, msg: 'Les données ne semblent pas etre la table clients.' };
    },
  },
  {
    id: 'pipe-02', title: 'Commandes incompletes', difficulty: 1,
    description: 'Le service comptabilite signale que certaines commandes ont des champs vides (montant ou statut manquant). Ces lignes faussent les rapports financiers et doivent etre retirees avant tout traitement.\n\nMethodologie : Identifiez et supprimez les lignes contenant des cellules vides, puis exportez les données propres.',
    hint: 'Source → Suppr. Vides → Export CSV.',
    hintNodes: ['csv_source', 'clean_na', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: COMMANDES_WITH_EMPTY }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez une destination.' };
      const clean = COMMANDES_WITH_EMPTY.filter(r => r.montant && r.statut);
      if (data.length === clean.length) return { ok: true, msg: 'Données nettoyees !' };
      return { ok: false, msg: `Attendu: ${clean.length} lignes sans vides. Recu: ${data.length}.` };
    },
  },
  {
    id: 'pipe-03', title: 'Import en double', difficulty: 1,
    description: 'Suite a un problème technique, la table clients a ete importee deux fois dans le système. Le fichier contient donc des doublons exacts qu\'il faut eliminer avant de mettre a jour le CRM.\n\nMethodologie : Supprimez les lignes identiques pour ne garder qu\'un exemplaire de chaque client.',
    hint: 'Source → Dedoublonner → Export CSV.',
    hintNodes: ['csv_source', 'deduplicate', 'csv_export'],
    sources: { 'csv_source': [{ name: 'clients', data: CLIENTS_WITH_DUPES }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez une destination.' };
      if (data.length === 5) return { ok: true, msg: 'Doublons supprimes !' };
      return { ok: false, msg: `Attendu: 5 clients uniques. Recu: ${data.length}.` };
    },
  },
  {
    id: 'pipe-04', title: 'Rapport salaires', difficulty: 1,
    description: 'La direction demande un rapport des employes classes par salaire, du plus élevé au plus bas, pour preparer la revue annuelle des remunerations.\n\nMethodologie : Triez les employes et exportez la liste ordonnee.',
    hint: 'Source → Trier (salaire, décroissant) → Export CSV.',
    hintNodes: ['csv_source', 'sort', 'csv_export'],
    sources: { 'csv_source': [{ name: 'employes', data: EMPLOYES_FULL }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez une destination.' };
      if (data.length !== 8) return { ok: false, msg: `Attendu 8 employes, recu ${data.length}.` };
      for (let i = 1; i < data.length; i++) {
        if (parseFloat(data[i].salaire) > parseFloat(data[i - 1].salaire)) return { ok: false, msg: 'Les salaires ne sont pas tries par ordre décroissant.' };
      }
      return { ok: true, msg: 'Rapport salaires généré !' };
    },
  },
  {
    id: 'pipe-05', title: 'Nettoyage RGPD', difficulty: 1,
    description: 'Le DPO (responsable protection des données) a identifie que le fichier clients contient des colonnes techniques internes (_hash, _internal_id) qui ne doivent pas etre exposees. Seules les colonnes id, nom, email et ville doivent etre conservees.\n\nMethodologie : Selectionnez uniquement les colonnes autorisees et exportez le resultat.',
    hint: 'Source → Sélectionner colonnes (id, nom, email, ville) → Export CSV.',
    hintNodes: ['csv_source', 'select_cols', 'csv_export'],
    sources: { 'csv_source': [{ name: 'clients', data: CLIENTS_WITH_EXTRA_COLS }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez une destination.' };
      if (data.length !== 5) return { ok: false, msg: `Attendu 5 lignes, recu ${data.length}.` };
      const cols = Object.keys(data[0] || {});
      if (cols.includes('_hash') || cols.includes('_internal_id')) return { ok: false, msg: 'Les colonnes techniques sont encore presentes.' };
      if (!cols.includes('nom') || !cols.includes('email')) return { ok: false, msg: 'Il manque des colonnes (nom, email...).' };
      return { ok: true, msg: 'Données conformes RGPD !' };
    },
  },
  {
    id: 'pipe-06', title: 'API partenaire', difficulty: 1,
    description: 'Un partenaire logistique a besoin de recevoir nos commandes via son API, mais il attend des noms de colonnes specifiques : "id" (au lieu de cmd_id) et "montant" (au lieu de mnt). Les autres colonnes peuvent rester telles quelles.\n\nMethodologie : Renommez les colonnes pour respecter le format attendu par l\'API partenaire.',
    hint: 'Source → Renommer (cmd_id→id) → Renommer (mnt→montant) → Export.',
    hintNodes: ['csv_source', 'rename_col', 'rename_col', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: COMMANDES_TECH_NAMES }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez une destination.' };
      if (data.length !== 5) return { ok: false, msg: `Attendu 5 lignes.` };
      const cols = Object.keys(data[0] || {});
      if (cols.includes('cmd_id')) return { ok: false, msg: 'La colonne cmd_id n\'a pas ete renommee.' };
      if (cols.includes('mnt')) return { ok: false, msg: 'La colonne mnt n\'a pas ete renommee.' };
      if (!cols.includes('id') || !cols.includes('montant')) return { ok: false, msg: 'Renommez cmd_id→id et mnt→montant.' };
      return { ok: true, msg: 'Format API respecte !' };
    },
  },

  // ══════════ INTERMEDIAIRE (10) ══════════
  {
    id: 'pipe-07', title: 'Commandes livrees', difficulty: 2,
    description: 'Le service logistique veut un fichier contenant uniquement les commandes effectivement livrees, sans aucune donnée incomplete. Le fichier source contient des cellules vides et differents statuts.\n\nMethodologie : Commencez par retirer les lignes incompletes, puis isolez les commandes ayant le statut "Livree".',
    hint: 'Source → Suppr. Vides → Filtrer (statut=Livree) → Export. L\'ordre est important !',
    hintNodes: ['csv_source', 'clean_na', 'filter', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: COMMANDES_WITH_EMPTY }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez une destination.' };
      const expected = COMMANDES_WITH_EMPTY.filter(r => r.montant && r.statut).filter(r => r.statut === 'Livree');
      if (data.length === expected.length && data.every(r => r.statut === 'Livree')) return { ok: true, msg: 'Commandes livrees extraites !' };
      return { ok: false, msg: `Attendu: ${expected.length} commandes livrees. Recu: ${data.length}.` };
    },
  },
  {
    id: 'pipe-08', title: 'Enrichir les commandes', difficulty: 2,
    description: 'Pour le reporting mensuel, le directeur commercial souhaite voir le nom et la ville du client directement sur chaque ligne de commande. Les commandes contiennent un "client_id" et la table clients utilisé la même cle.\n\nMethodologie : Combinez les deux tables sur leur colonne commune pour enrichir les commandes.',
    hint: 'Source 1 (commandes) + Source 2 (clients) → Joindre (sur client_id) → Export.',
    hintNodes: ['csv_source', 'db_source', 'join', 'csv_export'],
    sources: {
      'csv_source': [{ name: 'commandes', data: [
        { id: 'CMD001', client_id: '1', montant: '150', statut: 'Livree' },
        { id: 'CMD002', client_id: '2', montant: '230', statut: 'Livree' },
        { id: 'CMD003', client_id: '3', montant: '320', statut: 'En cours' },
      ]}],
      'db_source': [{ name: 'clients', data: [
        { client_id: '1', nom: 'Dupont Marie', ville: 'Paris' },
        { client_id: '2', nom: 'Martin Pierre', ville: 'Lyon' },
        { client_id: '3', nom: 'Bernard Julie', ville: 'Marseille' },
      ]}],
    },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez une destination.' };
      if (data.length !== 3) return { ok: false, msg: `Attendu 3 lignes jointes. Recu: ${data.length}.` };
      if (!data[0].nom) return { ok: false, msg: 'La colonne nom du client est absente. Verifiez la jointure.' };
      return { ok: true, msg: 'Commandes enrichies !' };
    },
  },
  {
    id: 'pipe-09', title: 'Consolidation regionale', difficulty: 2,
    description: 'Les equipes Nord et Sud envoient chacune leurs ventes dans un fichier separe. La direction financiere a besoin d\'un fichier unique regroupant les ventes de toutes les regions pour le bilan trimestriel.\n\nMethodologie : Fusionnez les deux fichiers en un seul et exportez le resultat.',
    hint: 'Source 1 (Nord) + Source 2 (Sud) → Concaténer → Export CSV.',
    hintNodes: ['csv_source', 'db_source', 'concat', 'csv_export'],
    sources: {
      'csv_source': [{ name: 'ventes_nord', data: VENTES_NORD }],
      'db_source': [{ name: 'ventes_sud', data: VENTES_SUD }],
    },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez une destination.' };
      if (data.length === 6) return { ok: true, msg: 'Ventes consolidees !' };
      return { ok: false, msg: `Attendu 6 lignes (3+3). Recu: ${data.length}.` };
    },
  },
  {
    id: 'pipe-10', title: 'Ingestion Bronze', difficulty: 2,
    description: 'L\'equipe data demarre un nouveau projet de lakehouse. La premiere étape consiste a ingerer les données brutes (clients et produits) dans la couche Bronze, sans aucune transformation.\n\nMethodologie : Chargez les 2 tables et stockez-les telles quelles dans un Lakehouse Bronze.',
    hint: 'Source → tables clients + produits → connectez chacune au Bronze.',
    hintNodes: ['csv_source', 'lakehouse_bronze'],
    sources: { 'csv_source': [{ name: 'clients', data: CLEAN_CLIENTS }, { name: 'produits', data: PRODUITS_SMALL }] },
    validate: (outputs, nodes, conns, cfgs) => {
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_bronze', 2))
        return { ok: false, msg: 'Le Bronze doit contenir au moins 2 tables.' };
      return { ok: true, msg: 'Ingestion Bronze reussie !' };
    },
  },
  {
    id: 'pipe-11', title: 'Evaluations partielles', difficulty: 2,
    description: 'Les evaluations annuelles ont ete saisies mais certains managers n\'ont pas rempli le champ commentaire. Le RH souhaite que chaque evaluation ait un commentaire — les vides doivent indiquer "Non evalue" plutot que d\'etre supprimes.\n\nMethodologie : Comblez les trous sans perdre aucune ligne.',
    hint: 'Source → Remplir Vides (commentaire → "Non evalue") → Export.',
    hintNodes: ['csv_source', 'fill_na', 'csv_export'],
    sources: { 'csv_source': [{ name: 'evaluations', data: EVALUATIONS_WITH_EMPTY }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez une destination.' };
      if (data.length !== 8) return { ok: false, msg: `Gardez les 8 lignes ! (recu: ${data.length})` };
      if (data.some(r => !r.commentaire || r.commentaire.trim() === '')) return { ok: false, msg: 'Il reste des commentaires vides.' };
      return { ok: true, msg: 'Evaluations completes !' };
    },
  },
  {
    id: 'pipe-12', title: 'Nettoyage complet', difficulty: 2,
    description: 'Le fichier de commandes est un vrai cauchemar : doublons, cellules vides, et differents statuts melanges. Le controleur de gestion n\'a besoin que des commandes livrees, triees par montant décroissant.\n\nMethodologie : Appliquez dans l\'ordre : déduplication, suppression des vides, filtre sur statut, puis tri.',
    hint: 'Source → Dedup → Suppr. Vides → Filtrer (Livree) → Trier (montant desc) → Export.',
    hintNodes: ['csv_source', 'deduplicate', 'clean_na', 'filter', 'sort', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: COMMANDES_DIRTY }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez une destination.' };
      if (data.length === 0) return { ok: false, msg: 'Aucune donnée en sortie.' };
      if (data.some(r => r.statut !== 'Livree')) return { ok: false, msg: 'Toutes les lignes doivent avoir statut = Livree.' };
      for (let i = 1; i < data.length; i++) {
        if (parseFloat(data[i].montant) > parseFloat(data[i - 1].montant)) return { ok: false, msg: 'Le tri décroissant n\'est pas correct.' };
      }
      return { ok: true, msg: 'Nettoyage complet réussi !' };
    },
  },
  {
    id: 'pipe-13', title: 'Integration fournisseur', difficulty: 2,
    description: 'Un fournisseur international envoie son catalogue avec des colonnes en anglais (product_id, name, category, price, qty). Notre système interne attend les noms francais (id, nom, catégorie, prix, stock).\n\nMethodologie : Utilisez un mapping pour convertir le schema du fournisseur vers le notre.',
    hint: 'Source → Mapping (5 correspondances) → Export.',
    hintNodes: ['csv_source', 'mapping', 'csv_export'],
    sources: { 'csv_source': [{ name: 'produits', data: PRODUITS_EN }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez une destination.' };
      if (data.length !== 4) return { ok: false, msg: `Attendu 4 lignes.` };
      const cols = Object.keys(data[0] || {});
      if (!cols.includes('nom') || !cols.includes('prix')) return { ok: false, msg: 'Les colonnes doivent etre en francais.' };
      return { ok: true, msg: 'Catalogue integre !' };
    },
  },
  {
    id: 'pipe-14', title: 'KPI camembert statuts', difficulty: 2,
    description: 'Le directeur veut un graphique camembert montrant la répartition des commandes par statut (Livree, En cours, Annulee). Pour cela, il faut agréger les commandes par statut et compter le nombre dans chaque catégorie. Le resultat sera envoye vers un Dashboard.\n\nMethodologie : Agregez les données par statut avec un comptage, puis envoyez vers un Dashboard (clic droit pour sauvegarder vers le BI Dojo).',
    hint: 'Source → Agréger (Group By: statut, Agg: count) → Dashboard.',
    hintNodes: ['csv_source', 'aggregate', 'dashboard'],
    sources: { 'csv_source': [{ name: 'commandes', data: [
      { id: 'CMD001', client_id: '1', montant: '150', statut: 'Livree' }, { id: 'CMD002', client_id: '2', montant: '230', statut: 'Livree' },
      { id: 'CMD003', client_id: '1', montant: '85', statut: 'En cours' }, { id: 'CMD004', client_id: '3', montant: '320', statut: 'Livree' },
      { id: 'CMD005', client_id: '2', montant: '175', statut: 'Annulee' }, { id: 'CMD006', client_id: '1', montant: '210', statut: 'En cours' },
    ] }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez un Dashboard.' };
      if (data.length !== 3) return { ok: false, msg: `Attendu 3 groupes (Livree, En cours, Annulee). Recu: ${data.length}.` };
      if (!data[0].statut) return { ok: false, msg: 'Agregez par la colonne statut.' };
      return { ok: true, msg: 'KPIs prets pour le camembert !' };
    },
  },
  {
    id: 'pipe-15', title: 'Bronze vers Silver', difficulty: 2,
    description: 'Les commandes brutes sont stockees dans le Bronze mais contiennent des doublons et des lignes vides. L\'étape Silver consiste a nettoyer ces données pour les rendre exploitables par les analystes.\n\nMethodologie : Chargez les données dans le Bronze, puis appliquez un nettoyage (dedup + vides) avant de stocker en Silver.',
    hint: 'Source → Bronze → sortie table → Dedup → Suppr. Vides → Silver.',
    hintNodes: ['csv_source', 'lakehouse_bronze', 'deduplicate', 'clean_na', 'lakehouse_silver'],
    sources: { 'csv_source': [{ name: 'commandes', data: COMMANDES_DIRTY }] },
    validate: (outputs, nodes, conns, cfgs) => {
      const hasBronze = nodes.some(n => n.type === 'lakehouse_bronze');
      const hasSilver = nodes.some(n => n.type === 'lakehouse_silver');
      if (!hasBronze || !hasSilver) return { ok: false, msg: 'Utilisez un Lakehouse Bronze ET Silver.' };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_silver', 1))
        return { ok: false, msg: 'Le Silver doit contenir au moins 1 table nettoyee.' };
      return { ok: true, msg: 'Bronze → Silver réussi !' };
    },
  },
  {
    id: 'pipe-16', title: 'Échantillon de test', difficulty: 2,
    description: 'L\'equipe QA a besoin d\'un petit jeu de données pour tester un nouveau formulaire. Extrayez les 3 premiers employes du fichier pour créer un jeu de test rapide.\n\nMethodologie : Echantillonnez les premieres lignes et exportez.',
    hint: 'Source → Echantillonner (Top N: 3) → Export CSV.',
    hintNodes: ['csv_source', 'sample', 'csv_export'],
    sources: { 'csv_source': [{ name: 'employes', data: EMPLOYES_FULL }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez une destination.' };
      if (data.length === 3) return { ok: true, msg: 'Échantillon extrait !' };
      return { ok: false, msg: `Attendu 3 lignes. Recu: ${data.length}.` };
    },
  },

  // ══════════ DIFFICILE (10) ══════════
  {
    id: 'pipe-17', title: 'Aiguillage logistique', difficulty: 3,
    description: 'Le centre logistique doit router les commandes vers deux equipes differentes : les commandes livrees sont archivees, les commandes annulees sont transmises au service reclamation. Il faut d\'abord vérifier que le fichier n\'est pas vide avant de router.\n\nMethodologie : Validez la presence de données, puis separez en deux flux distincts avec des filtres.',
    hint: 'Source → Si/Sinon (table_not_empty) → Filtrer Livree → Export 1 / Filtrer Annulee → Export 2.',
    hintNodes: ['csv_source', 'if_condition', 'filter', 'filter', 'csv_export', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: [
      { id: 'CMD001', montant: '150', statut: 'Livree' }, { id: 'CMD002', montant: '230', statut: 'Livree' },
      { id: 'CMD003', montant: '320', statut: 'En cours' }, { id: 'CMD004', montant: '85', statut: 'Livree' },
      { id: 'CMD005', montant: '210', statut: 'Annulee' }, { id: 'CMD006', montant: '95', statut: 'Livree' },
    ] }] },
    validate: (outputs, nodes) => {
      const hasIf = nodes.some(n => n.type === 'if_condition');
      if (!hasIf) return { ok: false, msg: 'Utilisez un noeud Si/Sinon.' };
      const filters = nodes.filter(n => n.type === 'filter');
      if (filters.length < 2) return { ok: false, msg: `Utilisez au moins 2 filtres. (${filters.length} actuellement)` };
      const exports = nodes.filter(n => ['csv_export', 'warehouse', 'dashboard'].includes(n.type));
      if (exports.length < 2) return { ok: false, msg: 'Ajoutez 2 destinations.' };
      return { ok: true, msg: 'Aiguillage logistique operationnel !' };
    },
  },
  {
    id: 'pipe-18', title: 'Audit fournisseurs', difficulty: 3,
    description: 'Le service achats veut s\'assurer que chaque produit du catalogue est couvert par un fournisseur référence. Les produits dont la catégorie ne correspond a aucun fournisseur doivent etre identifies pour lancer un appel d\'offres.\n\nMethodologie : Comparez les catégories produits avec celles des fournisseurs pour separer les produits couverts des orphelins.',
    hint: 'Source produits + Source fournisseurs → Lookup (catégorie) → Match / No Match.',
    hintNodes: ['csv_source', 'db_source', 'lookup'],
    sources: {
      'csv_source': [{ name: 'produits', data: [...PRODUITS_SMALL, { id: 'P99', nom: 'Gadget X', catégorie: 'Divers', prix: '25', stock: '50' }] }],
      'db_source': [{ name: 'fournisseurs', data: FOURNISSEURS }],
    },
    validate: (outputs, nodes) => {
      const lk = nodes.find(n => n.type === 'lookup');
      if (!lk) return { ok: false, msg: 'Utilisez un noeud Lookup (Existe).' };
      const match = outputs[`${lk.id}_match`] || [];
      const noMatch = outputs[`${lk.id}_nomatch`] || [];
      if (match.length > 0 && noMatch.length > 0) return { ok: true, msg: `Audit termine ! Couverts: ${match.length}, Orphelins: ${noMatch.length}` };
      if (match.length > 0 || noMatch.length > 0) return { ok: true, msg: `Lookup ok. Match: ${match.length}, No Match: ${noMatch.length}` };
      return { ok: false, msg: 'Configurez le lookup sur la colonne catégorie.' };
    },
  },
  {
    id: 'pipe-19', title: 'Annuaire employes', difficulty: 3,
    description: 'L\'intranet a besoin d\'un annuaire affichant le nom complet de chaque employe. Le fichier source separe le nom et le prenom en deux colonnes distinctes, mais l\'annuaire attend une seule colonne "nom_complet".\n\nMethodologie : Creez une colonne calculee concatenant prenom et nom, puis exportez vers le Dashboard.',
    hint: 'Source → ForEachRow (concat prenom + nom → nom_complet) → Dashboard.',
    hintNodes: ['csv_source', 'foreach_row', 'dashboard'],
    sources: { 'csv_source': [{ name: 'employes', data: EMPLOYES_FULL }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez une destination.' };
      if (data.length !== 8) return { ok: false, msg: `Attendu 8 lignes.` };
      if (!data[0].nom_complet) return { ok: false, msg: 'La colonne nom_complet est manquante.' };
      return { ok: true, msg: 'Annuaire généré !' };
    },
  },
  {
    id: 'pipe-20', title: 'Top ventes Dashboard', difficulty: 3,
    description: 'Le directeur commercial veut un tableau de bord affichant les commandes classees par montant, avec un numéro de rang pour identifier rapidement les meilleures ventes. Ce classement sera envoye vers un Dashboard pour visualisation.\n\nMethodologie : Ajoutez un rang base sur le montant décroissant, puis envoyez au Dashboard.',
    hint: 'Source → Fenêtre (row_number, montant desc, alias: rang) → Dashboard.',
    hintNodes: ['csv_source', 'window_func', 'dashboard'],
    sources: { 'csv_source': [{ name: 'commandes', data: [
      { id: 'CMD001', montant: '150' }, { id: 'CMD002', montant: '230' },
      { id: 'CMD003', montant: '320' }, { id: 'CMD004', montant: '85' },
      { id: 'CMD005', montant: '210' },
    ] }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez un Dashboard.' };
      if (data.length !== 5) return { ok: false, msg: `Attendu 5 lignes.` };
      const hasRank = Object.keys(data[0] || {}).some(c => c !== 'id' && c !== 'montant');
      if (!hasRank) return { ok: false, msg: 'La colonne de rang est manquante.' };
      return { ok: true, msg: 'Dashboard top ventes pret !' };
    },
  },
  {
    id: 'pipe-21', title: 'Bronze → Silver transformation', difficulty: 3,
    description: 'Les commandes brutes du Bronze ont des problèmes multiples : doublons, cellules vides, et colonnes au format technique (mnt, st). La couche Silver doit contenir des données propres avec des noms métier, filtrees sur les commandes livrees.\n\nMethodologie : Nettoyez (dedup + vides), renommez les colonnes, filtrez, puis stockez en Silver.',
    hint: 'Bronze → Dedup → Suppr. Vides → Renommer (mnt→montant, st→statut) → Filtrer (Livree) → Silver.',
    hintNodes: ['csv_source', 'lakehouse_bronze', 'deduplicate', 'clean_na', 'rename_col', 'rename_col', 'filter', 'lakehouse_silver'],
    sources: { 'csv_source': [{ name: 'commandes', data: [
      ...COMMANDES_TECH_NAMES,
      { cmd_id: 'CMD001', clt_id: '1', dt_cmd: '2024-01-10', mnt: '150', st: 'Livree' },
      { cmd_id: 'CMD006', clt_id: '3', dt_cmd: '2024-03-01', mnt: '', st: 'En cours' },
    ] }] },
    validate: (outputs, nodes, conns, cfgs) => {
      if (!nodes.some(n => n.type === 'lakehouse_bronze')) return { ok: false, msg: 'Ajoutez un Bronze.' };
      if (!nodes.some(n => n.type === 'lakehouse_silver')) return { ok: false, msg: 'Ajoutez un Silver.' };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_silver', 1)) return { ok: false, msg: 'Le Silver doit contenir au moins 1 table.' };
      return { ok: true, msg: 'Pipeline Bronze → Silver complet !' };
    },
  },
  {
    id: 'pipe-22', title: 'Gold : CA par client', difficulty: 3,
    description: 'Pour alimenter un graphique en barres du chiffre d\'affaires par client, il faut agréger les commandes Silver : compter le nombre de commandes et sommer les montants par client_id. Le resultat ira dans la couche Gold puis vers un Dashboard.\n\nMethodologie : Agregez par client_id (count + sum montant) et stockez en Gold.',
    hint: 'Source → Silver → Agréger (client_id: count + sum montant) → Gold → Dashboard.',
    hintNodes: ['csv_source', 'lakehouse_silver', 'aggregate', 'lakehouse_gold', 'dashboard'],
    sources: { 'csv_source': [{ name: 'commandes', data: [
      { id: 'CMD001', client_id: '1', montant: '150' }, { id: 'CMD002', client_id: '2', montant: '230' },
      { id: 'CMD003', client_id: '1', montant: '85' }, { id: 'CMD004', client_id: '3', montant: '320' },
      { id: 'CMD005', client_id: '2', montant: '175' },
    ] }] },
    validate: (outputs, nodes, conns, cfgs) => {
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_gold', 1)) return { ok: false, msg: 'Le Gold doit contenir au moins 1 table.' };
      const hasDash = nodes.some(n => n.type === 'dashboard');
      if (!hasDash) return { ok: false, msg: 'Ajoutez un Dashboard pour la visualisation.' };
      return { ok: true, msg: 'Gold KPIs + Dashboard prets !' };
    },
  },
  {
    id: 'pipe-23', title: 'Pipeline auditable', difficulty: 3,
    description: 'L\'equipe conformite exige que chaque pipeline de production soit auditable. Pour chaque étape cle (chargement, filtrage), un journal doit enregistrer le nombre de lignes traitees.\n\nMethodologie : Intercalez des noeuds Journal entre vos étapes de transformation.',
    hint: 'Source → Log → Filtrer → Log → Export.',
    hintNodes: ['csv_source', 'log', 'filter', 'log', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: COMMANDES_WITH_EMPTY.filter(r => r.montant && r.statut) }] },
    validate: (outputs, nodes) => {
      const logs = nodes.filter(n => n.type === 'log');
      if (logs.length < 2) return { ok: false, msg: `Utilisez au moins 2 noeuds Journal. (${logs.length} actuellement)` };
      if (!nodes.some(n => n.type === 'filter')) return { ok: false, msg: 'Ajoutez un Filtrer.' };
      return { ok: true, msg: 'Pipeline auditable !' };
    },
  },
  {
    id: 'pipe-24', title: 'Ingestion multi-source', difficulty: 3,
    description: 'L\'entreprise recoit des données de 3 systèmes differents : les clients via un fichier CSV, les produits depuis une base SQL, et les fournisseurs par API REST. Toutes ces données doivent etre centralisees dans un seul Lakehouse Bronze.\n\nMethodologie : Utilisez 3 types de sources differentes et stockez tout dans un Bronze.',
    hint: '3 types de sources differents → chacune connectee au Bronze.',
    hintNodes: ['csv_source', 'db_source', 'api_source', 'lakehouse_bronze'],
    sources: {
      'csv_source': [{ name: 'clients', data: CLEAN_CLIENTS }],
      'db_source': [{ name: 'produits', data: PRODUITS_SMALL }],
      'api_source': [{ name: 'fournisseurs', data: FOURNISSEURS }],
    },
    validate: (outputs, nodes, conns, cfgs) => {
      const srcTypes = new Set(nodes.filter(n => ['csv_source', 'db_source', 'api_source'].includes(n.type)).map(n => n.type));
      if (srcTypes.size < 3) return { ok: false, msg: `Utilisez 3 sources differentes. (${srcTypes.size} actuellement)` };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_bronze', 3)) return { ok: false, msg: 'Le Bronze doit contenir 3 tables.' };
      return { ok: true, msg: 'Ingestion multi-source reussie !' };
    },
  },
  {
    id: 'pipe-25', title: 'Nettoyage en lot', difficulty: 3,
    description: 'Plusieurs tables (clients et commandes) souffrent des mêmes problèmes de qualite : doublons et cellules vides. Plutot que de créer un pipeline de nettoyage pour chacune, utilisez un traitement en lot qui applique les mêmes règles a toutes les tables.\n\nMethodologie : Configurez un ForEach avec les étapes de nettoyage communes.',
    hint: 'Source (2 tables) → ForEach [Suppr. Vides + Dedup] → sorties nettoyees.',
    hintNodes: ['csv_source', 'foreach'],
    sources: { 'csv_source': [
      { name: 'clients', data: CLIENTS_WITH_DUPES },
      { name: 'commandes', data: COMMANDES_DIRTY },
    ]},
    validate: (outputs, nodes) => {
      const fe = nodes.find(n => n.type === 'foreach');
      if (!fe) return { ok: false, msg: 'Utilisez un noeud ForEach.' };
      if (outputs[fe.id]?.length > 0) return { ok: true, msg: 'Nettoyage en lot réussi !' };
      return { ok: false, msg: 'Configurez les étapes du ForEach.' };
    },
  },
  {
    id: 'pipe-26', title: 'Podium des ventes', difficulty: 3,
    description: 'Pour la reunion commerciale, on veut presenter un podium des 3 meilleures ventes du trimestre. A partir de 6 commandes, il faut extraire uniquement les 3 plus gros montants et les envoyer vers un Dashboard.\n\nMethodologie : Triez ou classez par montant, puis extrayez le top 3 pour le Dashboard.',
    hint: 'Source → Trier (montant desc) → Echantillonner (Top 3) → Dashboard.',
    hintNodes: ['csv_source', 'sort', 'sample', 'dashboard'],
    sources: { 'csv_source': [{ name: 'commandes', data: [
      { id: 'CMD001', montant: '150' }, { id: 'CMD002', montant: '230' },
      { id: 'CMD003', montant: '320' }, { id: 'CMD004', montant: '85' },
      { id: 'CMD005', montant: '210' }, { id: 'CMD006', montant: '95' },
    ] }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez un Dashboard.' };
      if (data.length === 3) return { ok: true, msg: 'Podium pret pour la reunion !' };
      return { ok: false, msg: `Attendu: 3 lignes. Recu: ${data.length}.` };
    },
  },

  // ══════════ EXPERT (6) ══════════
  {
    id: 'pipe-27', title: 'ETL E-Commerce', difficulty: 4,
    description: 'Le projet data de la marketplace arrive a maturite. Il faut construire le pipeline complet : ingerer les données brutes (clients, commandes, produits) dans le Bronze, les nettoyer et enrichir (jointure commandes/clients) pour le Silver, puis agréger les ventes par catégorie pour le Gold. Le resultat alimente un Dashboard BI.\n\nMethodologie : Architecture medallion complété avec nettoyage, enrichissement et agrégation.',
    hint: 'Sources → Bronze (3 tables) → Clean/Dedup → Join → Silver → Agréger → Gold → Dashboard.',
    hintNodes: ['csv_source', 'db_source', 'lakehouse_bronze', 'deduplicate', 'clean_na', 'join', 'lakehouse_silver', 'aggregate', 'lakehouse_gold', 'dashboard'],
    sources: {
      'csv_source': [{ name: 'clients', data: CLEAN_CLIENTS }, { name: 'commandes', data: COMMANDES_DIRTY }],
      'db_source': [{ name: 'produits', data: PRODUITS_SMALL }],
    },
    validate: (outputs, nodes, conns, cfgs) => {
      const has = t => nodes.some(n => n.type === t);
      if (!has('lakehouse_bronze') || !has('lakehouse_silver') || !has('lakehouse_gold')) return { ok: false, msg: 'Utilisez les 3 couches medallion.' };
      if (!has('dashboard')) return { ok: false, msg: 'Ajoutez un Dashboard.' };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_bronze', 2)) return { ok: false, msg: 'Bronze: au moins 2 tables.' };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_silver', 1)) return { ok: false, msg: 'Silver: au moins 1 table.' };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_gold', 1)) return { ok: false, msg: 'Gold: au moins 1 table.' };
      return { ok: true, msg: 'ETL E-Commerce complet !' };
    },
  },
  {
    id: 'pipe-28', title: 'RH Analytics Dashboard', difficulty: 4,
    description: 'Le DRH demande un tableau de bord croisant les employes avec leurs departements. Il veut voir le nom complet de chaque employe et le salaire moyen par departement sous forme de graphique en barres.\n\nMethodologie : Joignez employes et departements, creez la colonne nom_complet, agregez le salaire moyen par departement, puis envoyez au Dashboard.',
    hint: 'Join (departement_id) → ForEachRow (nom_complet) → Agréger (avg salaire) → Dashboard.',
    hintNodes: ['csv_source', 'db_source', 'join', 'foreach_row', 'aggregate', 'dashboard'],
    sources: {
      'csv_source': [{ name: 'employes', data: EMPLOYES_FULL }],
      'db_source': [{ name: 'departements', data: DEPARTEMENTS.map(d => ({ departement_id: d.id, dept_nom: d.nom, responsable: d.responsable, budget: d.budget })) }],
    },
    validate: (outputs, nodes) => {
      const has = t => nodes.some(n => n.type === t);
      if (!has('join')) return { ok: false, msg: 'Joignez employes + departements.' };
      if (!has('aggregate')) return { ok: false, msg: 'Agregez les salaires.' };
      if (!has('dashboard')) return { ok: false, msg: 'Ajoutez un Dashboard.' };
      return { ok: true, msg: 'Dashboard RH Analytics complet !' };
    },
  },
  {
    id: 'pipe-29', title: 'Tri-routage commandes', difficulty: 4,
    description: 'Le centre de gestion a 3 workflows distincts pour les commandes : les livrees vont dans le Gold pour les KPIs, les commandes en cours restent en Silver pour suivi, et les annulees sont archivees en CSV avec un log d\'erreur. Il faut router chaque statut vers la bonne destination.\n\nMethodologie : Validez les données, puis creez 3 branches avec des filtres pour chaque statut.',
    hint: 'Si/Sinon (not empty) → Filtrer (Livree) → Gold / Filtrer (En cours) → Silver / Filtrer (Annulee) → Log + CSV.',
    hintNodes: ['csv_source', 'if_condition', 'filter', 'filter', 'filter', 'lakehouse_gold', 'lakehouse_silver', 'log', 'csv_export'],
    sources: {
      'csv_source': [{ name: 'commandes', data: [
        { id: 'CMD001', client_id: '1', montant: '150', statut: 'Livree' },
        { id: 'CMD002', client_id: '2', montant: '280', statut: 'Livree' },
        { id: 'CMD003', client_id: '3', montant: '320', statut: 'En cours' },
        { id: 'CMD004', client_id: '1', montant: '85', statut: 'Annulee' },
        { id: 'CMD005', client_id: '4', montant: '210', statut: 'Livree' },
        { id: 'CMD006', client_id: '5', montant: '95', statut: 'Annulee' },
      ] }],
    },
    validate: (outputs, nodes) => {
      const has = t => nodes.some(n => n.type === t);
      if (!has('if_condition')) return { ok: false, msg: 'Utilisez Si/Sinon.' };
      if (nodes.filter(n => n.type === 'filter').length < 2) return { ok: false, msg: 'Au moins 2 filtres necessaires.' };
      if (!has('log')) return { ok: false, msg: 'Ajoutez un Journal pour les annulees.' };
      const dests = nodes.filter(n => ['lakehouse_gold', 'lakehouse_silver', 'csv_export', 'warehouse', 'dashboard'].includes(n.type));
      if (dests.length < 2) return { ok: false, msg: 'Routez vers au moins 2 destinations.' };
      return { ok: true, msg: 'Tri-routage operationnel !' };
    },
  },
  {
    id: 'pipe-30', title: 'Contrôle qualite', difficulty: 4,
    description: 'Avant d\'integrer les nouvelles commandes dans le système, il faut vérifier qu\'elles referencent des clients connus. Les commandes sont sales (doublons, vides). Apres nettoyage, chaque commande est comparee a la table de référence clients. Les commandes valides vont en Silver, les invalides sont rejetees avec un log.\n\nMethodologie : Nettoyez en lot (ForEach), puis validez les références (Lookup).',
    hint: 'ForEach [clean + dedup] → Lookup (client_id) → Match→Silver / NoMatch→Log+CSV.',
    hintNodes: ['csv_source', 'db_source', 'foreach', 'lookup', 'lakehouse_silver', 'log', 'csv_export'],
    sources: {
      'csv_source': [{ name: 'commandes', data: COMMANDES_DIRTY }],
      'db_source': [{ name: 'clients_ref', data: CLEAN_CLIENTS.map(c => ({ client_id: c.id, nom: c.nom, ville: c.ville })) }],
    },
    validate: (outputs, nodes) => {
      const has = t => nodes.some(n => n.type === t);
      if (!has('foreach')) return { ok: false, msg: 'Utilisez ForEach.' };
      if (!has('lookup')) return { ok: false, msg: 'Utilisez Lookup.' };
      if (!has('log')) return { ok: false, msg: 'Ajoutez un Journal pour les rejets.' };
      return { ok: true, msg: 'Contrôle qualite en place !' };
    },
  },
  {
    id: 'pipe-31', title: 'Pipeline BI complet', difficulty: 4,
    description: 'Le comite de direction veut un Dashboard avec : le CA par catégorie (barres), le classement des ventes (table), et les produits enrichis avec leur catégorie. Les ventes et produits viennent de 2 sources differentes. L\'architecture doit suivre le modèle medallion.\n\nMethodologie : Bronze (ingestion) → Silver (join + window rank + enrichissement) → Gold (agregat par catégorie) → Dashboard.',
    hint: 'Sources → Bronze → Join (produit_id) → Window(rank) → Silver → Agréger → Gold → Dashboard.',
    hintNodes: ['csv_source', 'db_source', 'lakehouse_bronze', 'join', 'window_func', 'lakehouse_silver', 'aggregate', 'lakehouse_gold', 'dashboard'],
    sources: {
      'csv_source': [{ name: 'ventes', data: [
        { produit_id: 'P01', montant: '1200', date: '2024-01-15' },
        { produit_id: 'P02', montant: '35', date: '2024-01-20' },
        { produit_id: 'P03', montant: '450', date: '2024-02-10' },
        { produit_id: 'P05', montant: '120', date: '2024-02-15' },
        { produit_id: 'P01', montant: '1200', date: '2024-03-01' },
      ] }],
      'db_source': [{ name: 'produits', data: PRODUITS_SMALL.map(p => ({ ...p, produit_id: p.id })) }],
    },
    validate: (outputs, nodes, conns, cfgs) => {
      const has = t => nodes.some(n => n.type === t);
      if (!has('lakehouse_bronze') || !has('lakehouse_silver') || !has('lakehouse_gold')) return { ok: false, msg: 'Utilisez les 3 couches medallion.' };
      if (!has('window_func')) return { ok: false, msg: 'Utilisez une fonction fenêtre.' };
      if (!has('dashboard')) return { ok: false, msg: 'Ajoutez un Dashboard.' };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_gold', 1)) return { ok: false, msg: 'Gold: au moins 1 table.' };
      return { ok: true, msg: 'Pipeline BI complet !' };
    },
  },
  {
    id: 'pipe-32', title: 'Architecture libre', difficulty: 4,
    description: 'Vous etes le data engineer en charge de concevoir l\'architecture data d\'une startup e-commerce. Vous disposez de toutes les données (clients, commandes, produits, fournisseurs, evaluations) provenant de sources variees. Votre score depend de la richesse de votre architecture.\n\nMethodologie : Libre ! Utilisez un maximum d\'outils : sources multiples, medallion, nettoyage, transformations avancees, monitoring et destinations.',
    hint: 'Max de points : 3 sources + nettoyage + Bronze/Silver/Gold + Log + Dashboard + CSV + agregats/joins.',
    hintNodes: ['csv_source', 'db_source', 'api_source', 'lakehouse_bronze', 'lakehouse_silver', 'lakehouse_gold', 'log', 'dashboard', 'csv_export'],
    sources: {
      'csv_source': [{ name: 'clients', data: CLEAN_CLIENTS }, { name: 'commandes', data: COMMANDES_DIRTY }],
      'db_source': [{ name: 'produits', data: PRODUITS_SMALL }, { name: 'fournisseurs', data: FOURNISSEURS }],
      'api_source': [{ name: 'evaluations', data: EVALUATIONS_WITH_EMPTY }],
    },
    validate: (outputs, nodes, conns, cfgs) => {
      let score = 0;
      const msg = [];
      const srcTypes = new Set(nodes.filter(n => ['csv_source', 'db_source', 'api_source'].includes(n.type)).map(n => n.type));
      score += Math.min(3, srcTypes.size);
      if (srcTypes.size >= 2) msg.push(`${srcTypes.size} sources`);
      const cleanTypes = new Set(nodes.filter(n => ['clean_na', 'deduplicate', 'fill_na', 'filter'].includes(n.type)).map(n => n.type));
      score += Math.min(2, cleanTypes.size);
      if (cleanTypes.size > 0) msg.push(`${cleanTypes.size} nettoyage`);
      ['lakehouse_bronze', 'lakehouse_silver', 'lakehouse_gold'].forEach(t => { if (nodes.some(n => n.type === t)) score++; });
      const lhCount = ['lakehouse_bronze', 'lakehouse_silver', 'lakehouse_gold'].filter(t => nodes.some(n => n.type === t)).length;
      if (lhCount > 0) msg.push(`${lhCount}/3 medallion`);
      if (nodes.some(n => n.type === 'log')) { score++; msg.push('monitoring'); }
      const destTypes = new Set(nodes.filter(n => ['warehouse', 'dashboard', 'csv_export'].includes(n.type)).map(n => n.type));
      score += Math.min(2, destTypes.size);
      if (destTypes.size > 0) msg.push(`${destTypes.size} destinations`);
      const advTypes = new Set(nodes.filter(n => ['aggregate', 'join', 'window_func', 'foreach_row', 'foreach', 'lookup', 'if_condition'].includes(n.type)).map(n => n.type));
      score += Math.min(2, advTypes.size);
      if (advTypes.size > 0) msg.push(`${advTypes.size} transforms avancees`);
      const stars = score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;
      return { ok: score >= 4, msg: `Score: ${score}/13 — ${msg.join(', ')}`, stars };
    },
  },
];

export const TIERS = [
  { id: 1, name: 'Facile', color: 'from-emerald-400 to-green-500', icon: '🌱', minToUnlockNext: 6 },
  { id: 2, name: 'Intermédiaire', color: 'from-blue-400 to-indigo-500', icon: '🔧', minToUnlockNext: 6 },
  { id: 3, name: 'Difficile', color: 'from-amber-400 to-orange-500', icon: '🔥', minToUnlockNext: 6 },
  { id: 4, name: 'Expert', color: 'from-red-400 to-rose-600', icon: '💎', minToUnlockNext: null },
];

export function getExercisesByTier(tier) {
  return EXERCISES.filter(e => e.difficulty === tier);
}

// Progress helpers (localStorage)
const PROGRESS_KEY = 'pipelineDojo_progress';

const UNLOCK_ALL_KEY = 'pipelineDojo_unlockAll';

export function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
}

export function saveProgress(exerciseId, stars) {
  const p = getProgress();
  const prev = p[exerciseId]?.stars || 0;
  if (stars > prev) p[exerciseId] = { stars, date: new Date().toISOString() };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

export function getUnlockAll() {
  try { return localStorage.getItem(UNLOCK_ALL_KEY) === '1'; } catch { return false; }
}

export function setUnlockAll(value) {
  try { localStorage.setItem(UNLOCK_ALL_KEY, value ? '1' : '0'); } catch { /* ignore */ }
}

export function isTierUnlocked(tier) {
  if (getUnlockAll()) return true;
  if (tier === 1) return true;
  const p = getProgress();
  const prevTierExercises = EXERCISES.filter(e => e.difficulty === tier - 1);
  const completed = prevTierExercises.filter(e => p[e.id]?.stars > 0).length;
  return completed >= (TIERS[tier - 2]?.minToUnlockNext || 0);
}

export function getTierProgress(tier) {
  const p = getProgress();
  const exercises = EXERCISES.filter(e => e.difficulty === tier);
  const completed = exercises.filter(e => p[e.id]?.stars > 0).length;
  const totalStars = exercises.reduce((s, e) => s + (p[e.id]?.stars || 0), 0);
  return { completed, total: exercises.length, totalStars, maxStars: exercises.length * 3 };
}
