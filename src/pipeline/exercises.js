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
  { id: 'P01', nom: 'Laptop Pro', categorie: 'Informatique', prix: '1200', stock: '45' },
  { id: 'P02', nom: 'Souris RGB', categorie: 'Informatique', prix: '35', stock: '200' },
  { id: 'P03', nom: 'Ecran 27p', categorie: 'Informatique', prix: '450', stock: '80' },
  { id: 'P05', nom: 'Casque Audio', categorie: 'Audio', prix: '120', stock: '90' },
  { id: 'P07', nom: 'Enceinte BT', categorie: 'Audio', prix: '45', stock: '180' },
  { id: 'P09', nom: 'Chaise Ergo', categorie: 'Mobilier', prix: '350', stock: '25' },
];

const DEPARTEMENTS = [
  { id: 'D1', nom: 'IT', responsable: 'Dupont Marie', budget: '500000' },
  { id: 'D2', nom: 'RH', responsable: 'Martin Pierre', budget: '200000' },
  { id: 'D3', nom: 'Finance', responsable: 'Bernard Julie', budget: '350000' },
  { id: 'D4', nom: 'Marketing', responsable: 'Petit Luc', budget: '300000' },
  { id: 'D5', nom: 'Ventes', responsable: 'Moreau Sophie', budget: '400000' },
];

const FOURNISSEURS = [
  { id: 'F01', nom: 'TechCo', pays: 'France', contact: 'contact@techco.fr', categorie: 'Informatique' },
  { id: 'F02', nom: 'AudioMax', pays: 'Allemagne', contact: 'info@audiomax.de', categorie: 'Audio' },
  { id: 'F03', nom: 'PeriphPlus', pays: 'France', contact: 'vente@periphplus.fr', categorie: 'Accessoire' },
  { id: 'F04', nom: 'MobilierPro', pays: 'Italie', contact: 'sales@mobilier.it', categorie: 'Mobilier' },
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
  { product_id: 'P03', name: 'Ecran 27p', category: 'IT', price: '450', qty: '80' },
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
  { region: 'Nord', produit: 'Ecran', montant: '450', date: '2024-02-10' },
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
    id: 'pipe-01', title: 'Mon premier pipeline', difficulty: 1, isTutorial: true,
    description: 'Connectez une source de donnees, chargez la table clients et exportez-la en CSV.',
    hint: 'Ajoutez une Source CSV → clic droit pour charger la table clients → connectez a un Export CSV.',
    hintNodes: ['csv_source', 'csv_export'],
    sources: { 'csv_source': [{ name: 'clients', data: CLEAN_CLIENTS }] },
    validate: (outputs, nodes, conns) => {
      const data = getDestinationData(outputs, nodes, conns);
      if (data === null) return { ok: false, msg: 'Ajoutez un noeud Export CSV.' };
      if (data.length === 0) return { ok: false, msg: 'Aucune donnee ne parvient a l\'export.' };
      if (data[0].nom) return { ok: true, msg: 'Pipeline fonctionnel !' };
      return { ok: false, msg: 'Les donnees ne semblent pas etre la table clients.' };
    },
  },
  {
    id: 'pipe-02', title: 'Nettoyage express', difficulty: 1,
    description: 'Des commandes ont des cellules vides (montant ou statut manquant). Supprimez les lignes incompletes et exportez le resultat.',
    hint: 'Source → Suppr. Vides → Export CSV. La carte "Suppr. Vides" retire toute ligne avec un champ vide.',
    hintNodes: ['csv_source', 'clean_na', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: COMMANDES_WITH_EMPTY }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => n.type === 'csv_export');
      if (!exp) return { ok: false, msg: 'Ajoutez un Export CSV.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      const clean = COMMANDES_WITH_EMPTY.filter(r => r.montant && r.statut);
      if (data.length === clean.length) return { ok: true, msg: 'Donnees nettoyees !' };
      return { ok: false, msg: `Attendu: ${clean.length} lignes sans vides. Recu: ${data.length}.` };
    },
  },
  {
    id: 'pipe-03', title: 'Doublons clients', difficulty: 1,
    description: 'Le catalogue clients a ete importe deux fois. Eliminez les doublons.',
    hint: 'Source → Dedoublonner → Export CSV.',
    hintNodes: ['csv_source', 'deduplicate', 'csv_export'],
    sources: { 'csv_source': [{ name: 'clients', data: CLIENTS_WITH_DUPES }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => n.type === 'csv_export');
      if (!exp) return { ok: false, msg: 'Ajoutez un Export CSV.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length === 5) return { ok: true, msg: 'Doublons supprimes !' };
      return { ok: false, msg: `Attendu: 5 clients uniques. Recu: ${data.length}.` };
    },
  },
  {
    id: 'pipe-04', title: 'Tri des salaires', difficulty: 1,
    description: 'Triez les employes par salaire decroissant pour un rapport RH.',
    hint: 'Source → Trier (colonne: salaire, ordre: decroissant) → Export CSV.',
    hintNodes: ['csv_source', 'sort', 'csv_export'],
    sources: { 'csv_source': [{ name: 'employes', data: EMPLOYES_FULL }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => n.type === 'csv_export');
      if (!exp) return { ok: false, msg: 'Ajoutez un Export CSV.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length !== 8) return { ok: false, msg: `Attendu 8 employes, recu ${data.length}.` };
      for (let i = 1; i < data.length; i++) {
        if (parseFloat(data[i].salaire) > parseFloat(data[i - 1].salaire)) return { ok: false, msg: 'Les salaires ne sont pas tries par ordre decroissant.' };
      }
      return { ok: true, msg: 'Employes tries par salaire !' };
    },
  },
  {
    id: 'pipe-05', title: 'Colonnes inutiles', difficulty: 1,
    description: 'Le fichier clients contient des colonnes techniques (_hash, _internal_id). Gardez uniquement id, nom, email, ville.',
    hint: 'Source → Selectionner colonnes (id, nom, email, ville) → Export CSV.',
    hintNodes: ['csv_source', 'select_cols', 'csv_export'],
    sources: { 'csv_source': [{ name: 'clients', data: CLIENTS_WITH_EXTRA_COLS }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => n.type === 'csv_export');
      if (!exp) return { ok: false, msg: 'Ajoutez un Export CSV.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length !== 5) return { ok: false, msg: `Attendu 5 lignes, recu ${data.length}.` };
      const cols = Object.keys(data[0] || {});
      if (cols.includes('_hash') || cols.includes('_internal_id')) return { ok: false, msg: 'Les colonnes techniques sont encore presentes.' };
      if (!cols.includes('nom') || !cols.includes('email')) return { ok: false, msg: 'Il manque des colonnes (nom, email...).' };
      return { ok: true, msg: 'Colonnes nettoyees !' };
    },
  },
  {
    id: 'pipe-06', title: 'Renommer pour le metier', difficulty: 1,
    description: 'Les colonnes des commandes ont des noms techniques (cmd_id, clt_id, dt_cmd, mnt, st). Renommez cmd_id→id et mnt→montant.',
    hint: 'Source → Renommer (cmd_id → id) → Renommer (mnt → montant) → Export CSV.',
    hintNodes: ['csv_source', 'rename_col', 'rename_col', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: COMMANDES_TECH_NAMES }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => n.type === 'csv_export');
      if (!exp) return { ok: false, msg: 'Ajoutez un Export CSV.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length !== 5) return { ok: false, msg: `Attendu 5 lignes.` };
      const cols = Object.keys(data[0] || {});
      if (cols.includes('cmd_id')) return { ok: false, msg: 'La colonne cmd_id n\'a pas ete renommee.' };
      if (cols.includes('mnt')) return { ok: false, msg: 'La colonne mnt n\'a pas ete renommee.' };
      if (!cols.includes('id') || !cols.includes('montant')) return { ok: false, msg: 'Renommez cmd_id en id et mnt en montant.' };
      return { ok: true, msg: 'Colonnes renommees !' };
    },
  },

  // ══════════ INTERMEDIAIRE (10) ══════════
  {
    id: 'pipe-07', title: 'Nettoyer puis filtrer', difficulty: 2,
    description: 'Les commandes ont des vides. Supprimez les lignes incompletes PUIS filtrez uniquement les commandes "Livree".',
    hint: 'Source → Suppr. Vides → Filtrer (statut = Livree) → Export CSV. L\'ordre est important !',
    hintNodes: ['csv_source', 'clean_na', 'filter', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: COMMANDES_WITH_EMPTY }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => n.type === 'csv_export');
      if (!exp) return { ok: false, msg: 'Ajoutez un Export CSV.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      const expected = COMMANDES_WITH_EMPTY.filter(r => r.montant && r.statut).filter(r => r.statut === 'Livree');
      if (data.length === expected.length && data.every(r => r.statut === 'Livree')) return { ok: true, msg: 'Pipeline correct !' };
      return { ok: false, msg: `Attendu: ${expected.length} commandes livrees sans vides. Recu: ${data.length}.` };
    },
  },
  {
    id: 'pipe-08', title: 'Enrichir les commandes', difficulty: 2,
    description: 'Joignez les commandes avec les clients sur la colonne client_id pour ajouter le nom du client a chaque commande.',
    hint: 'Source 1 (commandes) + Source 2 (clients) → Joindre (sur client_id) → Export CSV. Les deux tables ont une colonne client_id.',
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
      const exp = nodes.find(n => ['csv_export', 'warehouse', 'dashboard'].includes(n.type));
      if (!exp) return { ok: false, msg: 'Ajoutez une destination.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length !== 3) return { ok: false, msg: `Attendu 3 lignes jointes. Recu: ${data.length}.` };
      if (!data[0].nom) return { ok: false, msg: 'La colonne nom (du client) manque. Verifiez la jointure.' };
      return { ok: true, msg: 'Commandes enrichies avec les clients !' };
    },
  },
  {
    id: 'pipe-09', title: 'Concatener les regions', difficulty: 2,
    description: 'Deux fichiers de ventes (Nord et Sud). Fusionnez-les en un seul fichier.',
    hint: 'Source 1 (Nord) + Source 2 (Sud) → Concatener → Export CSV.',
    hintNodes: ['csv_source', 'csv_source', 'concat', 'csv_export'],
    sources: {
      'csv_source': [{ name: 'ventes_nord', data: VENTES_NORD }],
      'db_source': [{ name: 'ventes_sud', data: VENTES_SUD }],
    },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => n.type === 'csv_export');
      if (!exp) return { ok: false, msg: 'Ajoutez un Export CSV.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length === 6) return { ok: true, msg: 'Tables fusionnees !' };
      return { ok: false, msg: `Attendu 6 lignes (3 Nord + 3 Sud). Recu: ${data.length}.` };
    },
  },
  {
    id: 'pipe-10', title: 'Ingestion Bronze', difficulty: 2,
    description: 'Chargez les tables clients et produits depuis une source et stockez-les dans un Lakehouse Bronze.',
    hint: 'Source → tables clients et produits → connectez chacune au Lakehouse Bronze (2 liens = 2 tables dans le lakehouse).',
    hintNodes: ['csv_source', 'lakehouse_bronze'],
    sources: { 'csv_source': [{ name: 'clients', data: CLEAN_CLIENTS }, { name: 'produits', data: PRODUITS_SMALL }] },
    validate: (outputs, nodes, conns, cfgs) => {
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_bronze', 2))
        return { ok: false, msg: 'Le Lakehouse Bronze doit contenir au moins 2 tables.' };
      return { ok: true, msg: 'Ingestion Bronze reussie !' };
    },
  },
  {
    id: 'pipe-11', title: 'Remplir les trous', difficulty: 2,
    description: 'Les evaluations ont des commentaires vides. Remplacez-les par "Non evalue" au lieu de supprimer les lignes.',
    hint: 'Source → Remplir Vides (colonne: commentaire, valeur: Non evalue) → Export CSV.',
    hintNodes: ['csv_source', 'fill_na', 'csv_export'],
    sources: { 'csv_source': [{ name: 'evaluations', data: EVALUATIONS_WITH_EMPTY }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => n.type === 'csv_export');
      if (!exp) return { ok: false, msg: 'Ajoutez un Export CSV.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length !== 8) return { ok: false, msg: `Gardez les 8 lignes ! (recu: ${data.length})` };
      if (data.some(r => !r.commentaire || r.commentaire.trim() === '')) return { ok: false, msg: 'Il reste des commentaires vides.' };
      return { ok: true, msg: 'Commentaires remplis !' };
    },
  },
  {
    id: 'pipe-12', title: 'Pipeline complet', difficulty: 2,
    description: 'Nettoyez les commandes : dedoublonnez, supprimez les vides, filtrez statut="Livree", triez par montant decroissant.',
    hint: 'Source → Dedoublonner → Suppr. Vides → Filtrer (Livree) → Trier (montant desc) → Export.',
    hintNodes: ['csv_source', 'deduplicate', 'clean_na', 'filter', 'sort', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: COMMANDES_DIRTY }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => ['csv_export', 'warehouse', 'dashboard'].includes(n.type));
      if (!exp) return { ok: false, msg: 'Ajoutez une destination.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length === 0) return { ok: false, msg: 'Aucune donnee en sortie.' };
      if (data.some(r => r.statut !== 'Livree')) return { ok: false, msg: 'Toutes les lignes doivent avoir statut = Livree.' };
      for (let i = 1; i < data.length; i++) {
        if (parseFloat(data[i].montant) > parseFloat(data[i - 1].montant)) return { ok: false, msg: 'Le tri par montant decroissant n\'est pas correct.' };
      }
      return { ok: true, msg: 'Pipeline complet reussi !' };
    },
  },
  {
    id: 'pipe-13', title: 'Mapping de colonnes', difficulty: 2,
    description: 'Les produits ont des noms de colonnes en anglais. Utilisez un Mapping pour renommer product_id→id, name→nom, category→categorie, price→prix, qty→stock.',
    hint: 'Source → Mapping (configurez les correspondances) → Export CSV.',
    hintNodes: ['csv_source', 'mapping', 'csv_export'],
    sources: { 'csv_source': [{ name: 'produits', data: PRODUITS_EN }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => n.type === 'csv_export');
      if (!exp) return { ok: false, msg: 'Ajoutez un Export CSV.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length !== 4) return { ok: false, msg: `Attendu 4 lignes.` };
      const cols = Object.keys(data[0] || {});
      if (!cols.includes('nom') || !cols.includes('prix')) return { ok: false, msg: 'Les colonnes doivent etre en francais: id, nom, categorie, prix, stock.' };
      return { ok: true, msg: 'Mapping reussi !' };
    },
  },
  {
    id: 'pipe-14', title: 'Premier agregat', difficulty: 2,
    description: 'Calculez le nombre de commandes et le montant total par client_id a partir des commandes propres.',
    hint: 'Source → Agreger (Group By: client_id, Aggs: count + sum montant) → Export.',
    hintNodes: ['csv_source', 'aggregate', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: [
      { id: 'CMD001', client_id: '1', montant: '150' }, { id: 'CMD002', client_id: '2', montant: '230' },
      { id: 'CMD003', client_id: '1', montant: '85' }, { id: 'CMD004', client_id: '3', montant: '320' },
      { id: 'CMD005', client_id: '2', montant: '175' }, { id: 'CMD006', client_id: '1', montant: '210' },
    ] }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => ['csv_export', 'warehouse', 'dashboard'].includes(n.type));
      if (!exp) return { ok: false, msg: 'Ajoutez une destination.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length !== 3) return { ok: false, msg: `Attendu 3 groupes (clients 1, 2, 3). Recu: ${data.length}.` };
      return { ok: true, msg: 'Agregation reussie !' };
    },
  },
  {
    id: 'pipe-15', title: 'Bronze vers Silver', difficulty: 2,
    description: 'Prenez les commandes du Bronze (deja chargees), nettoyez-les (doublons + vides) et stockez en Silver.',
    hint: 'Source → Bronze → sortie table → Dedoublonner → Suppr. Vides → Silver.',
    hintNodes: ['csv_source', 'lakehouse_bronze', 'deduplicate', 'clean_na', 'lakehouse_silver'],
    sources: { 'csv_source': [{ name: 'commandes', data: COMMANDES_DIRTY }] },
    validate: (outputs, nodes, conns, cfgs) => {
      const hasBronze = nodes.some(n => n.type === 'lakehouse_bronze');
      const hasSilver = nodes.some(n => n.type === 'lakehouse_silver');
      if (!hasBronze || !hasSilver) return { ok: false, msg: 'Utilisez un Lakehouse Bronze ET un Lakehouse Silver.' };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_silver', 1))
        return { ok: false, msg: 'Le Lakehouse Silver doit contenir au moins 1 table nettoyee.' };
      return { ok: true, msg: 'Transition Bronze → Silver reussie !' };
    },
  },
  {
    id: 'pipe-16', title: 'Echantillon de test', difficulty: 2,
    description: 'Extrayez les 3 premieres lignes des employes pour un test rapide.',
    hint: 'Source → Echantillonner (mode: Top N, valeur: 3) → Export CSV.',
    hintNodes: ['csv_source', 'sample', 'csv_export'],
    sources: { 'csv_source': [{ name: 'employes', data: EMPLOYES_FULL }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => n.type === 'csv_export');
      if (!exp) return { ok: false, msg: 'Ajoutez un Export CSV.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length === 3) return { ok: true, msg: 'Echantillon extrait !' };
      return { ok: false, msg: `Attendu 3 lignes. Recu: ${data.length}.` };
    },
  },

  // ══════════ DIFFICILE (10) ══════════
  {
    id: 'pipe-17', title: 'Aiguillage qualite', difficulty: 3,
    description: 'Verifiez si les commandes ne sont pas vides avec Si/Sinon, puis filtrez les livrees d\'un cote et les annulees de l\'autre. Exportez les deux flux.',
    hint: 'Source → Si/Sinon (table_not_empty) → Vrai → Filtrer (statut=Livree) → Export 1 / Filtrer (statut=Annulee) → Export 2.',
    hintNodes: ['csv_source', 'if_condition', 'filter', 'filter', 'csv_export', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: [
      { id: 'CMD001', montant: '150', statut: 'Livree' }, { id: 'CMD002', montant: '230', statut: 'Livree' },
      { id: 'CMD003', montant: '320', statut: 'En cours' }, { id: 'CMD004', montant: '85', statut: 'Livree' },
      { id: 'CMD005', montant: '210', statut: 'Annulee' }, { id: 'CMD006', montant: '95', statut: 'Livree' },
    ] }] },
    validate: (outputs, nodes, conns) => {
      const hasIf = nodes.some(n => n.type === 'if_condition');
      if (!hasIf) return { ok: false, msg: 'Utilisez un noeud Si/Sinon.' };
      const filters = nodes.filter(n => n.type === 'filter');
      if (filters.length < 2) return { ok: false, msg: `Utilisez au moins 2 filtres pour separer les flux. Actuellement: ${filters.length}.` };
      const exports = nodes.filter(n => ['csv_export', 'warehouse', 'dashboard'].includes(n.type));
      if (exports.length < 2) return { ok: false, msg: 'Ajoutez 2 destinations (une par flux).' };
      return { ok: true, msg: 'Aiguillage reussi !' };
    },
  },
  {
    id: 'pipe-18', title: 'Recherche fournisseur', difficulty: 3,
    description: 'Verifiez si chaque produit a un fournisseur connu en comparant la categorie. Separez Match / No Match.',
    hint: 'Source produits + Source fournisseurs → Lookup (sur categorie). 2 sorties: Match et No Match.',
    hintNodes: ['csv_source', 'csv_source', 'lookup'],
    sources: {
      'csv_source': [{ name: 'produits', data: [
        ...PRODUITS_SMALL,
        { id: 'P99', nom: 'Gadget X', categorie: 'Divers', prix: '25', stock: '50' },
      ]}],
      'db_source': [{ name: 'fournisseurs', data: FOURNISSEURS }],
    },
    validate: (outputs, nodes) => {
      const lk = nodes.find(n => n.type === 'lookup');
      if (!lk) return { ok: false, msg: 'Utilisez un noeud Lookup (Existe).' };
      const match = outputs[`${lk.id}_match`] || [];
      const noMatch = outputs[`${lk.id}_nomatch`] || [];
      if (match.length > 0 && noMatch.length > 0) return { ok: true, msg: `Lookup reussi ! Match: ${match.length}, No Match: ${noMatch.length}` };
      if (match.length > 0 || noMatch.length > 0) return { ok: true, msg: `Lookup configure. Match: ${match.length}, No Match: ${noMatch.length}` };
      return { ok: false, msg: 'Configurez le lookup sur la colonne categorie.' };
    },
  },
  {
    id: 'pipe-19', title: 'Colonne calculee', difficulty: 3,
    description: 'Ajoutez une colonne nom_complet = concat(prenom, " ", nom) aux employes.',
    hint: 'Source → ForEachRow (ajouter colonne: nom_complet, fonction: concat, col1: prenom, col2: nom) → Export.',
    hintNodes: ['csv_source', 'foreach_row', 'csv_export'],
    sources: { 'csv_source': [{ name: 'employes', data: EMPLOYES_FULL }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => ['csv_export', 'warehouse', 'dashboard'].includes(n.type));
      if (!exp) return { ok: false, msg: 'Ajoutez une destination.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length !== 8) return { ok: false, msg: `Attendu 8 lignes.` };
      if (!data[0].nom_complet) return { ok: false, msg: 'La colonne nom_complet est manquante.' };
      return { ok: true, msg: 'Colonne calculee ajoutee !' };
    },
  },
  {
    id: 'pipe-20', title: 'Classement ventes', difficulty: 3,
    description: 'Ajoutez un rang (row_number) aux commandes triees par montant decroissant.',
    hint: 'Source → Fenetre (row_number, orderBy: montant, desc, alias: rang) → Export.',
    hintNodes: ['csv_source', 'window_func', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: [
      { id: 'CMD001', montant: '150' }, { id: 'CMD002', montant: '230' },
      { id: 'CMD003', montant: '320' }, { id: 'CMD004', montant: '85' },
      { id: 'CMD005', montant: '210' },
    ] }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => ['csv_export', 'warehouse', 'dashboard'].includes(n.type));
      if (!exp) return { ok: false, msg: 'Ajoutez une destination.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length !== 5) return { ok: false, msg: `Attendu 5 lignes.` };
      const hasRank = Object.keys(data[0] || {}).some(c => c !== 'id' && c !== 'montant');
      if (!hasRank) return { ok: false, msg: 'La colonne de rang est manquante. Configurez la fenetre.' };
      return { ok: true, msg: 'Classement ajoute !' };
    },
  },
  {
    id: 'pipe-21', title: 'Bronze → Silver complet', difficulty: 3,
    description: 'Depuis les commandes brutes : dedoublonner, supprimer vides, renommer mnt→montant et st→statut, filtrer statut=Livree, stocker en Silver.',
    hint: 'Source → Bronze → sortie → Dedup → Clean NA → Renommer (mnt→montant) → Renommer (st→statut) → Filtrer (statut=Livree) → Silver.',
    hintNodes: ['csv_source', 'lakehouse_bronze', 'deduplicate', 'clean_na', 'rename_col', 'rename_col', 'filter', 'lakehouse_silver'],
    sources: { 'csv_source': [{ name: 'commandes', data: [
      ...COMMANDES_TECH_NAMES,
      { cmd_id: 'CMD001', clt_id: '1', dt_cmd: '2024-01-10', mnt: '150', st: 'Livree' }, // dupe
      { cmd_id: 'CMD006', clt_id: '3', dt_cmd: '2024-03-01', mnt: '', st: 'En cours' }, // empty
    ] }] },
    validate: (outputs, nodes, conns, cfgs) => {
      const hasBronze = nodes.some(n => n.type === 'lakehouse_bronze');
      const hasSilver = nodes.some(n => n.type === 'lakehouse_silver');
      if (!hasBronze) return { ok: false, msg: 'Ajoutez un Lakehouse Bronze.' };
      if (!hasSilver) return { ok: false, msg: 'Ajoutez un Lakehouse Silver.' };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_silver', 1))
        return { ok: false, msg: 'Le Silver doit contenir au moins 1 table.' };
      return { ok: true, msg: 'Pipeline Bronze → Silver complet !' };
    },
  },
  {
    id: 'pipe-22', title: 'Silver → Gold : KPIs', difficulty: 3,
    description: 'Depuis les commandes Silver, agregez par client_id : COUNT et SUM montant. Stockez dans Gold.',
    hint: 'Source → Silver → sortie → Agreger (groupBy: client_id, count + sum montant) → Gold.',
    hintNodes: ['csv_source', 'lakehouse_silver', 'aggregate', 'lakehouse_gold'],
    sources: { 'csv_source': [{ name: 'commandes', data: [
      { id: 'CMD001', client_id: '1', montant: '150' }, { id: 'CMD002', client_id: '2', montant: '230' },
      { id: 'CMD003', client_id: '1', montant: '85' }, { id: 'CMD004', client_id: '3', montant: '320' },
      { id: 'CMD005', client_id: '2', montant: '175' },
    ] }] },
    validate: (outputs, nodes, conns, cfgs) => {
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_gold', 1))
        return { ok: false, msg: 'Le Gold doit contenir au moins 1 table agregee.' };
      return { ok: true, msg: 'KPIs Gold generes !' };
    },
  },
  {
    id: 'pipe-23', title: 'Pipeline avec monitoring', difficulty: 3,
    description: 'Construisez un pipeline Source → Filtre → Export avec un noeud Journal (Log) apres chaque etape pour tracer l\'execution.',
    hint: 'Source → Log("Donnees chargees") → Filtrer → Log("Donnees filtrees") → Export.',
    hintNodes: ['csv_source', 'log', 'filter', 'log', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: COMMANDES_WITH_EMPTY.filter(r => r.montant && r.statut) }] },
    validate: (outputs, nodes) => {
      const logNodes = nodes.filter(n => n.type === 'log');
      if (logNodes.length < 2) return { ok: false, msg: `Utilisez au moins 2 noeuds Journal. Actuellement: ${logNodes.length}.` };
      const filterNodes = nodes.filter(n => n.type === 'filter');
      if (filterNodes.length === 0) return { ok: false, msg: 'Ajoutez un noeud Filtrer.' };
      return { ok: true, msg: 'Pipeline monitore !' };
    },
  },
  {
    id: 'pipe-24', title: 'Multi-source ingestion', difficulty: 3,
    description: 'Chargez clients (CSV), produits (SQL) et fournisseurs (API), stockez les 3 dans un Bronze.',
    hint: 'Source CSV + Source SQL + Source API → chacune connectee au Bronze (3 tables).',
    hintNodes: ['csv_source', 'db_source', 'api_source', 'lakehouse_bronze'],
    sources: {
      'csv_source': [{ name: 'clients', data: CLEAN_CLIENTS }],
      'db_source': [{ name: 'produits', data: PRODUITS_SMALL }],
      'api_source': [{ name: 'fournisseurs', data: FOURNISSEURS }],
    },
    validate: (outputs, nodes, conns, cfgs) => {
      const sources = nodes.filter(n => ['csv_source', 'db_source', 'api_source'].includes(n.type));
      if (sources.length < 3) return { ok: false, msg: `Utilisez 3 sources differentes. Actuellement: ${sources.length}.` };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_bronze', 3))
        return { ok: false, msg: 'Le Bronze doit contenir au moins 3 tables.' };
      return { ok: true, msg: 'Ingestion multi-source reussie !' };
    },
  },
  {
    id: 'pipe-25', title: 'ForEach batch', difficulty: 3,
    description: 'Appliquez le meme nettoyage (suppr vides + dedup) a toutes les tables d\'une source en une seule operation ForEach.',
    hint: 'Source (avec plusieurs tables) → ForEach [clean_na, deduplicate] → les tables nettoyees sortent automatiquement.',
    hintNodes: ['csv_source', 'foreach'],
    sources: { 'csv_source': [
      { name: 'clients', data: CLIENTS_WITH_DUPES },
      { name: 'commandes', data: COMMANDES_DIRTY },
    ]},
    validate: (outputs, nodes) => {
      const fe = nodes.find(n => n.type === 'foreach');
      if (!fe) return { ok: false, msg: 'Utilisez un noeud ForEach.' };
      const feOutput = outputs[fe.id];
      if (feOutput && feOutput.length > 0) return { ok: true, msg: 'Batch ForEach reussi !' };
      return { ok: false, msg: 'Configurez les etapes du ForEach (Suppr. Vides + Dedoublonner).' };
    },
  },
  {
    id: 'pipe-26', title: 'Detection anomalies', difficulty: 3,
    description: 'Ajoutez un classement par montant (window row_number) puis filtrez pour ne garder que le top 3.',
    hint: 'Source → Fenetre (row_number, montant desc, alias: rang) → Filtrer (rang ≤ 3)... astuce: filtrez sur rang=1, rang=2, rang=3 ou utilisez Sample Top 3.',
    hintNodes: ['csv_source', 'window_func', 'sample', 'csv_export'],
    sources: { 'csv_source': [{ name: 'commandes', data: [
      { id: 'CMD001', montant: '150' }, { id: 'CMD002', montant: '230' },
      { id: 'CMD003', montant: '320' }, { id: 'CMD004', montant: '85' },
      { id: 'CMD005', montant: '210' }, { id: 'CMD006', montant: '95' },
    ] }] },
    validate: (outputs, nodes, conns) => {
      const exp = nodes.find(n => ['csv_export', 'warehouse', 'dashboard'].includes(n.type));
      if (!exp) return { ok: false, msg: 'Ajoutez une destination.' };
      const inc = conns.filter(c => c.to === exp.id);
      const data = inc.length > 0 ? outputs[inc[0].from] || [] : [];
      if (data.length === 3) return { ok: true, msg: 'Top 3 extrait !' };
      return { ok: false, msg: `Attendu: 3 lignes (top montants). Recu: ${data.length}.` };
    },
  },

  // ══════════ EXPERT (6) ══════════
  {
    id: 'pipe-27', title: 'ETL E-Commerce complet', difficulty: 4,
    description: 'Pipeline complet : Sources (clients + commandes + produits) → Bronze → Silver (clean + join commandes/clients) → Gold (agregat par categorie) → Dashboard.',
    hint: '3 Sources → Bronze (3 tables) → sorties Bronze → Clean/Dedup → Join commandes+clients → Silver → Agreger → Gold → Dashboard.',
    hintNodes: ['csv_source', 'db_source', 'lakehouse_bronze', 'deduplicate', 'clean_na', 'join', 'lakehouse_silver', 'aggregate', 'lakehouse_gold', 'dashboard'],
    sources: {
      'csv_source': [{ name: 'clients', data: CLEAN_CLIENTS }, { name: 'commandes', data: COMMANDES_DIRTY }],
      'db_source': [{ name: 'produits', data: PRODUITS_SMALL }],
    },
    validate: (outputs, nodes, conns, cfgs) => {
      const hasBronze = nodes.some(n => n.type === 'lakehouse_bronze');
      const hasSilver = nodes.some(n => n.type === 'lakehouse_silver');
      const hasGold = nodes.some(n => n.type === 'lakehouse_gold');
      const hasDash = nodes.some(n => n.type === 'dashboard');
      if (!hasBronze || !hasSilver || !hasGold) return { ok: false, msg: 'Utilisez les 3 couches : Bronze, Silver, Gold.' };
      if (!hasDash) return { ok: false, msg: 'Ajoutez un Dashboard en sortie.' };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_bronze', 2)) return { ok: false, msg: 'Bronze: au moins 2 tables.' };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_silver', 1)) return { ok: false, msg: 'Silver: au moins 1 table nettoyee.' };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_gold', 1)) return { ok: false, msg: 'Gold: au moins 1 table agregee.' };
      return { ok: true, msg: 'ETL E-Commerce complet ! Architecture medallion maitrisee.' };
    },
  },
  {
    id: 'pipe-28', title: 'Pipeline RH Analytics', difficulty: 4,
    description: 'Joindre employes + departements (sur departement_id), ajouter une colonne nom_complet (ForEachRow), agreger le salaire moyen par departement, exporter vers Dashboard.',
    hint: 'Source employes + Source departements → Join (departement_id) → ForEachRow (nom_complet = concat prenom+nom) → Agreger (avg salaire par departement_id) → Dashboard.',
    hintNodes: ['csv_source', 'db_source', 'join', 'foreach_row', 'aggregate', 'dashboard'],
    sources: {
      'csv_source': [{ name: 'employes', data: EMPLOYES_FULL }],
      'db_source': [{ name: 'departements', data: DEPARTEMENTS.map(d => ({ departement_id: d.id, dept_nom: d.nom, responsable: d.responsable, budget: d.budget })) }],
    },
    validate: (outputs, nodes) => {
      const hasJoin = nodes.some(n => n.type === 'join');
      const hasAgg = nodes.some(n => n.type === 'aggregate');
      const hasDash = nodes.some(n => n.type === 'dashboard');
      if (!hasJoin) return { ok: false, msg: 'Utilisez un noeud Joindre.' };
      if (!hasAgg) return { ok: false, msg: 'Utilisez un noeud Agreger.' };
      if (!hasDash) return { ok: false, msg: 'Ajoutez un Dashboard.' };
      return { ok: true, msg: 'Pipeline RH Analytics complet !' };
    },
  },
  {
    id: 'pipe-29', title: 'Routage intelligent', difficulty: 4,
    description: 'Separez les commandes en 3 flux : Livrees → Gold, En cours → Silver, Annulees → Log + CSV archive. Utilisez Si/Sinon pour verifier que la table n\'est pas vide, puis filtrez par statut.',
    hint: 'Source → Si/Sinon (table_not_empty) → Sortie Vrai → Filtrer (Livree) → Gold / Filtrer (Annulee) → Log + CSV / Filtrer (En cours) → Silver.',
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
      const hasIf = nodes.some(n => n.type === 'if_condition');
      const hasLog = nodes.some(n => n.type === 'log');
      const filters = nodes.filter(n => n.type === 'filter');
      if (!hasIf) return { ok: false, msg: 'Utilisez un noeud Si/Sinon.' };
      if (filters.length < 2) return { ok: false, msg: `Utilisez au moins 2 filtres pour router par statut. Actuellement: ${filters.length}.` };
      if (!hasLog) return { ok: false, msg: 'Ajoutez un Journal pour les commandes annulees.' };
      const destinations = nodes.filter(n => ['lakehouse_gold', 'lakehouse_silver', 'csv_export', 'warehouse', 'dashboard'].includes(n.type));
      if (destinations.length < 2) return { ok: false, msg: 'Routez vers au moins 2 destinations.' };
      return { ok: true, msg: 'Routage intelligent reussi !' };
    },
  },
  {
    id: 'pipe-30', title: 'Data Quality Framework', difficulty: 4,
    description: 'Source avec donnees sales → ForEach(clean + dedup) → Lookup(table reference) → Match → Silver, NoMatch → Log + CSV rejet.',
    hint: 'Source (donnees sales) + Source (reference) → ForEach[clean, dedup] → Lookup → Match→Silver, NoMatch→Log+CSV.',
    hintNodes: ['csv_source', 'db_source', 'foreach', 'lookup', 'lakehouse_silver', 'log', 'csv_export'],
    sources: {
      'csv_source': [{ name: 'commandes', data: COMMANDES_DIRTY }],
      'db_source': [{ name: 'clients_ref', data: CLEAN_CLIENTS.map(c => ({ client_id: c.id, nom: c.nom, ville: c.ville })) }],
    },
    validate: (outputs, nodes) => {
      const hasFE = nodes.some(n => n.type === 'foreach');
      const hasLK = nodes.some(n => n.type === 'lookup');
      const hasLog = nodes.some(n => n.type === 'log');
      if (!hasFE) return { ok: false, msg: 'Utilisez ForEach pour le nettoyage batch.' };
      if (!hasLK) return { ok: false, msg: 'Utilisez Lookup pour la validation.' };
      if (!hasLog) return { ok: false, msg: 'Ajoutez un Journal pour les rejets.' };
      return { ok: true, msg: 'Framework Data Quality en place !' };
    },
  },
  {
    id: 'pipe-31', title: 'Dashboard temps reel', difficulty: 4,
    description: 'Ventes + Produits → Bronze → Silver (join sur produit_id, window rank par montant, ForEachRow categorie_upper) → Gold (agregat par categorie) → Dashboard.',
    hint: 'Source ventes + Source produits → Bronze → sorties → Join (produit_id) → Window(rank montant desc) → ForEachRow(upper categorie) → Silver → Agreger (sum montant par categorie) → Gold → Dashboard.',
    hintNodes: ['csv_source', 'db_source', 'lakehouse_bronze', 'join', 'window_func', 'foreach_row', 'lakehouse_silver', 'aggregate', 'lakehouse_gold', 'dashboard'],
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
      const has = (t) => nodes.some(n => n.type === t);
      if (!has('lakehouse_bronze') || !has('lakehouse_silver') || !has('lakehouse_gold'))
        return { ok: false, msg: 'Utilisez les 3 couches medallion.' };
      if (!has('window_func')) return { ok: false, msg: 'Utilisez une fonction fenetre.' };
      if (!has('dashboard')) return { ok: false, msg: 'Ajoutez un Dashboard.' };
      if (!lakehouseHasChildren(nodes, cfgs, 'lakehouse_gold', 1))
        return { ok: false, msg: 'Gold doit contenir au moins 1 table.' };
      return { ok: true, msg: 'Dashboard temps reel operationnel !' };
    },
  },
  {
    id: 'pipe-32', title: 'Architecture libre', difficulty: 4,
    description: 'Exercice sandbox note : construisez la meilleure architecture possible avec les donnees fournies. Score base sur : sources, nettoyage, lakehouse, monitoring, destinations.',
    hint: 'Utilisez un maximum d\'outils : sources multiples, Bronze/Silver/Gold, nettoyage, agrégats, journal, destinations multiples.',
    hintNodes: ['csv_source', 'db_source', 'lakehouse_bronze', 'lakehouse_silver', 'lakehouse_gold', 'log', 'dashboard', 'csv_export'],
    sources: {
      'csv_source': [{ name: 'clients', data: CLEAN_CLIENTS }, { name: 'commandes', data: COMMANDES_DIRTY }],
      'db_source': [{ name: 'produits', data: PRODUITS_SMALL }, { name: 'fournisseurs', data: FOURNISSEURS }],
      'api_source': [{ name: 'evaluations', data: EVALUATIONS_WITH_EMPTY }],
    },
    validate: (outputs, nodes, conns, cfgs) => {
      let score = 0;
      const msg = [];
      // Sources (max 3 pts)
      const srcTypes = new Set(nodes.filter(n => ['csv_source', 'db_source', 'api_source'].includes(n.type)).map(n => n.type));
      score += Math.min(3, srcTypes.size);
      if (srcTypes.size >= 2) msg.push(`${srcTypes.size} types de sources`);
      // Cleaning (max 2 pts)
      const cleanTypes = new Set(nodes.filter(n => ['clean_na', 'deduplicate', 'fill_na', 'filter'].includes(n.type)).map(n => n.type));
      score += Math.min(2, cleanTypes.size);
      if (cleanTypes.size > 0) msg.push(`${cleanTypes.size} etapes de nettoyage`);
      // Lakehouse (max 3 pts)
      ['lakehouse_bronze', 'lakehouse_silver', 'lakehouse_gold'].forEach(t => { if (nodes.some(n => n.type === t)) score++; });
      const lhCount = ['lakehouse_bronze', 'lakehouse_silver', 'lakehouse_gold'].filter(t => nodes.some(n => n.type === t)).length;
      if (lhCount > 0) msg.push(`${lhCount}/3 couches medallion`);
      // Monitoring (1 pt)
      if (nodes.some(n => n.type === 'log')) { score++; msg.push('monitoring'); }
      // Destinations (max 2 pts)
      const destTypes = new Set(nodes.filter(n => ['warehouse', 'dashboard', 'csv_export'].includes(n.type)).map(n => n.type));
      score += Math.min(2, destTypes.size);
      if (destTypes.size > 0) msg.push(`${destTypes.size} destinations`);
      // Transform complexity (max 2 pts)
      const advancedTypes = new Set(nodes.filter(n => ['aggregate', 'join', 'window_func', 'foreach_row', 'foreach', 'lookup', 'if_condition'].includes(n.type)).map(n => n.type));
      score += Math.min(2, advancedTypes.size);
      if (advancedTypes.size > 0) msg.push(`${advancedTypes.size} transformations avancees`);

      const maxScore = 13;
      const stars = score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;
      return { ok: score >= 4, msg: `Score: ${score}/${maxScore} — ${msg.join(', ')}`, stars };
    },
  },
];

export const TIERS = [
  { id: 1, name: 'Facile', color: 'from-emerald-400 to-green-500', icon: '🌱', minToUnlockNext: 6 },
  { id: 2, name: 'Intermediaire', color: 'from-blue-400 to-indigo-500', icon: '🔧', minToUnlockNext: 6 },
  { id: 3, name: 'Difficile', color: 'from-amber-400 to-orange-500', icon: '🔥', minToUnlockNext: 6 },
  { id: 4, name: 'Expert', color: 'from-red-400 to-rose-600', icon: '💎', minToUnlockNext: null },
];

export function getExercisesByTier(tier) {
  return EXERCISES.filter(e => e.difficulty === tier);
}

// Progress helpers (localStorage)
const PROGRESS_KEY = 'pipelineDojo_progress';

export function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
}

export function saveProgress(exerciseId, stars) {
  const p = getProgress();
  const prev = p[exerciseId]?.stars || 0;
  if (stars > prev) p[exerciseId] = { stars, date: new Date().toISOString() };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

export function isTierUnlocked(tier) {
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
