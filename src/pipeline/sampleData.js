/**
 * Sample datasets for Pipeline Dojo
 * Two thèmes: E-commerce & RH
 */

export const DATABASES = {
  ecommerce: {
    name: 'E-Commerce',
    icon: '🛒',
    tables: {
      clients: {
        name: 'clients',
        rows: [
          { id: '1', nom: 'Dupont Marie', email: 'marie@mail.com', ville: 'Paris', date_inscription: '2024-01-15' },
          { id: '2', nom: 'Martin Pierre', email: 'pierre@mail.com', ville: 'Lyon', date_inscription: '2024-02-20' },
          { id: '3', nom: 'Bernard Julie', email: 'julie@mail.com', ville: 'Marseille', date_inscription: '2024-03-10' },
          { id: '4', nom: 'Petit Luc', email: 'luc@mail.com', ville: 'Paris', date_inscription: '2024-03-22' },
          { id: '5', nom: 'Moreau Sophie', email: 'sophie@mail.com', ville: 'Toulouse', date_inscription: '2024-04-05' },
          { id: '6', nom: 'Durand Jean', email: 'jean@mail.com', ville: 'Lyon', date_inscription: '2024-04-18' },
          { id: '7', nom: 'Leroy Emma', email: 'emma@mail.com', ville: 'Bordeaux', date_inscription: '2024-05-01' },
          { id: '8', nom: 'Roux Thomas', email: 'thomas@mail.com', ville: 'Paris', date_inscription: '2024-05-14' },
          { id: '9', nom: 'David Clara', email: 'clara@mail.com', ville: 'Nantes', date_inscription: '2024-06-02' },
          { id: '10', nom: 'Bertrand Hugo', email: 'hugo@mail.com', ville: 'Lille', date_inscription: '2024-06-20' },
        ],
      },
      produits: {
        name: 'produits',
        rows: [
          { id: 'P01', nom: 'Laptop Pro', catégorie: 'Informatique', prix: '1200', stock: '45' },
          { id: 'P02', nom: 'Souris RGB', catégorie: 'Informatique', prix: '35', stock: '200' },
          { id: 'P03', nom: 'Écran 27p', catégorie: 'Informatique', prix: '450', stock: '80' },
          { id: 'P04', nom: 'Clavier MK', catégorie: 'Informatique', prix: '75', stock: '150' },
          { id: 'P05', nom: 'Casque Audio', catégorie: 'Audio', prix: '120', stock: '90' },
          { id: 'P06', nom: 'Webcam HD', catégorie: 'Informatique', prix: '60', stock: '110' },
          { id: 'P07', nom: 'Enceinte BT', catégorie: 'Audio', prix: '45', stock: '180' },
          { id: 'P08', nom: 'Hub USB-C', catégorie: 'Accessoire', prix: '30', stock: '300' },
          { id: 'P09', nom: 'Chaise Ergo', catégorie: 'Mobilier', prix: '350', stock: '25' },
          { id: 'P10', nom: 'Bureau Ajust', catégorie: 'Mobilier', prix: '500', stock: '15' },
          { id: 'P11', nom: 'Tapis Souris', catégorie: 'Accessoire', prix: '15', stock: '400' },
          { id: 'P12', nom: 'Cable HDMI', catégorie: 'Accessoire', prix: '12', stock: '500' },
        ],
      },
      commandes: {
        name: 'commandes',
        rows: generateCommandes(),
      },
      fournisseurs: {
        name: 'fournisseurs',
        rows: [
          { id: 'F01', nom: 'TechCo', pays: 'France', contact: 'contact@techco.fr', catégorie: 'Informatique' },
          { id: 'F02', nom: 'AudioMax', pays: 'Allemagne', contact: 'info@audiomax.de', catégorie: 'Audio' },
          { id: 'F03', nom: 'PeriphPlus', pays: 'France', contact: 'vente@periphplus.fr', catégorie: 'Accessoire' },
          { id: 'F04', nom: 'MobilierPro', pays: 'Italie', contact: 'sales@mobilier.it', catégorie: 'Mobilier' },
          { id: 'F05', nom: 'GlobalTech', pays: 'USA', contact: 'order@globaltech.com', catégorie: 'Informatique' },
          { id: 'F06', nom: 'EuroSupply', pays: 'Espagne', contact: 'info@eurosupply.es', catégorie: 'Accessoire' },
        ],
      },
    },
  },
  rh: {
    name: 'Ressources Humaines',
    icon: '👥',
    tables: {
      departements: {
        name: 'departements',
        rows: [
          { id: 'D1', nom: 'IT', responsable: 'Dupont Marie', budget: '500000' },
          { id: 'D2', nom: 'RH', responsable: 'Martin Pierre', budget: '200000' },
          { id: 'D3', nom: 'Finance', responsable: 'Bernard Julie', budget: '350000' },
          { id: 'D4', nom: 'Marketing', responsable: 'Petit Luc', budget: '300000' },
          { id: 'D5', nom: 'Ventes', responsable: 'Moreau Sophie', budget: '400000' },
        ],
      },
      employes: {
        name: 'employes',
        rows: [
          { id: 'E01', nom: 'Dupont', prenom: 'Marie', departement_id: 'D1', salaire: '4500', date_embauche: '2020-03-15', poste: 'Manager' },
          { id: 'E02', nom: 'Martin', prenom: 'Pierre', departement_id: 'D2', salaire: '4200', date_embauche: '2019-07-01', poste: 'Manager' },
          { id: 'E03', nom: 'Bernard', prenom: 'Julie', departement_id: 'D3', salaire: '4800', date_embauche: '2018-01-10', poste: 'Manager' },
          { id: 'E04', nom: 'Petit', prenom: 'Luc', departement_id: 'D4', salaire: '4300', date_embauche: '2021-02-28', poste: 'Manager' },
          { id: 'E05', nom: 'Moreau', prenom: 'Sophie', departement_id: 'D5', salaire: '4600', date_embauche: '2019-11-15', poste: 'Manager' },
          { id: 'E06', nom: 'Durand', prenom: 'Jean', departement_id: 'D1', salaire: '3200', date_embauche: '2022-06-01', poste: 'Dev Senior' },
          { id: 'E07', nom: 'Leroy', prenom: 'Emma', departement_id: 'D1', salaire: '2800', date_embauche: '2023-01-15', poste: 'Dev Junior' },
          { id: 'E08', nom: 'Roux', prenom: 'Thomas', departement_id: 'D3', salaire: '3500', date_embauche: '2021-09-01', poste: 'Analyste' },
          { id: 'E09', nom: 'David', prenom: 'Clara', departement_id: 'D4', salaire: '2900', date_embauche: '2023-04-10', poste: 'Designer' },
          { id: 'E10', nom: 'Bertrand', prenom: 'Hugo', departement_id: 'D5', salaire: '2600', date_embauche: '2024-01-08', poste: 'Commercial' },
          { id: 'E11', nom: 'Garnier', prenom: 'Alice', departement_id: 'D1', salaire: '3000', date_embauche: '2022-11-20', poste: 'Dev Junior' },
          { id: 'E12', nom: 'Faure', prenom: 'Louis', departement_id: 'D5', salaire: '3100', date_embauche: '2021-05-15', poste: 'Commercial' },
          { id: 'E13', nom: 'Andre', prenom: 'Lea', departement_id: 'D2', salaire: '2700', date_embauche: '2023-08-01', poste: 'Assistante' },
          { id: 'E14', nom: 'Simon', prenom: 'Paul', departement_id: 'D1', salaire: '3400', date_embauche: '2020-10-01', poste: 'DevOps' },
          { id: 'E15', nom: 'Laurent', prenom: 'Nina', departement_id: 'D4', salaire: '2500', date_embauche: '2024-03-01', poste: 'Stagiaire' },
        ],
      },
      conges: {
        name: 'conges',
        rows: generateConges(),
      },
      evaluations: {
        name: 'evaluations',
        rows: generateEvaluations(),
      },
    },
  },
};

function generateCommandes() {
  const statuts = ['Livree', 'En cours', 'Annulee', 'Livree', 'Livree', 'En cours'];
  const rows = [];
  for (let i = 1; i <= 50; i++) {
    const clientId = String(((i - 1) % 10) + 1);
    const mois = String(((i - 1) % 12) + 1).padStart(2, '0');
    const jour = String(((i * 3) % 28) + 1).padStart(2, '0');
    rows.push({
      id: `CMD${String(i).padStart(3, '0')}`,
      client_id: clientId,
      date: `2024-${mois}-${jour}`,
      montant: String(Math.round(50 + Math.sin(i) * 200 + i * 15)),
      statut: statuts[i % statuts.length],
    });
  }
  return rows;
}

function generateConges() {
  const types = ['CP', 'RTT', 'Maladie', 'CP', 'CP', 'RTT'];
  const statuts = ['Approuve', 'En attente', 'Approuve', 'Refuse', 'Approuve'];
  const rows = [];
  for (let i = 1; i <= 40; i++) {
    const empId = `E${String(((i - 1) % 15) + 1).padStart(2, '0')}`;
    const mois = String(((i * 2) % 12) + 1).padStart(2, '0');
    const jour = String(((i * 5) % 28) + 1).padStart(2, '0');
    const duree = ((i % 5) + 1);
    const jourFin = String(Math.min(28, parseInt(jour) + duree)).padStart(2, '0');
    rows.push({
      id: String(i),
      employe_id: empId,
      type: types[i % types.length],
      date_debut: `2024-${mois}-${jour}`,
      date_fin: `2024-${mois}-${jourFin}`,
      statut: statuts[i % statuts.length],
    });
  }
  return rows;
}

function generateEvaluations() {
  const rows = [];
  let id = 1;
  for (let annee = 2022; annee <= 2024; annee++) {
    for (let e = 1; e <= 10; e++) {
      const empId = `E${String(e).padStart(2, '0')}`;
      const note = String(Math.round(2 + Math.sin(e + annee) * 1.5 + 1.5));
      rows.push({
        id: String(id++),
        employe_id: empId,
        annee: String(annee),
        note,
        commentaire: parseInt(note) >= 4 ? 'Excellent' : parseInt(note) >= 3 ? 'Satisfaisant' : 'A ameliorer',
      });
    }
  }
  return rows;
}

// Flat list of all tables for the explorer
export function getAllTables() {
  const tables = [];
  for (const [dbId, db] of Object.entries(DATABASES)) {
    for (const [tableId, table] of Object.entries(db.tables)) {
      tables.push({
        id: `${dbId}.${tableId}`,
        dbId,
        dbName: db.name,
        dbIcon: db.icon,
        tableId,
        tableName: table.name,
        columns: table.rows.length > 0 ? Object.keys(table.rows[0]) : [],
        rowCount: table.rows.length,
        rows: table.rows,
      });
    }
  }
  return tables;
}
