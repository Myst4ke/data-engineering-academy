import { describe, it, expect } from 'vitest';
import { EXERCISES } from '../exercises';
import { getNotebook, runNotebook } from '../notebooks';

const exo = (id) => EXERCISES.find(e => e.id === id);

// Même jeu que COMMANDES_DIRTY dans exercises.js : 9 lignes, 2 doublons,
// 2 lignes avec une cellule vide.
const COMMANDES_DIRTY = [
  { id: 'CMD001', client_id: '1', date: '2024-01-10', montant: '150', statut: 'Livree' },
  { id: 'CMD002', client_id: '2', date: '2024-01-15', montant: '230', statut: 'Livree' },
  { id: 'CMD001', client_id: '1', date: '2024-01-10', montant: '150', statut: 'Livree' },
  { id: 'CMD003', client_id: '3', date: '2024-02-01', montant: '', statut: 'En cours' },
  { id: 'CMD004', client_id: '1', date: '2024-02-14', montant: '85', statut: 'Livree' },
  { id: 'CMD005', client_id: '4', date: '2024-03-01', montant: '210', statut: '' },
  { id: 'CMD002', client_id: '2', date: '2024-01-15', montant: '230', statut: 'Livree' },
  { id: 'CMD006', client_id: '5', date: '2024-03-15', montant: '95', statut: 'Annulee' },
  { id: 'CMD007', client_id: '2', date: '2024-04-01', montant: '175', statut: 'Livree' },
];

describe('sys-silver-clean', () => {
  // Régression : la carte `select` du notebook imposait des colonnes clients
  // (id, nom, email, date_inscription) et réduisait les commandes à `id`.
  it('reste générique : garde toutes les colonnes de la table nettoyée', () => {
    const cleaned = runNotebook(getNotebook('sys-silver-clean'), COMMANDES_DIRTY);
    expect(cleaned).toHaveLength(5);
    expect(Object.keys(cleaned[0]).sort()).toEqual(['client_id', 'date', 'id', 'montant', 'statut']);
  });
});

describe('pipe-15 : Bronze vers Silver', () => {
  const nodes = [
    { id: 'b', type: 'lakehouse_bronze' },
    { id: 'sl', type: 'lakehouse_silver' },
    { id: 't', type: 'table_output' },
  ];
  const cfgs = { t: { parentId: 'sl' } };

  const validate = (rows) => exo('pipe-15').validate({ sl: rows }, nodes, [], cfgs);

  it('refuse un Silver alimenté avec les données brutes', () => {
    expect(validate(COMMANDES_DIRTY).ok).toBe(false);
  });

  it('refuse un Silver vide', () => {
    expect(validate([]).ok).toBe(false);
  });

  it('accepte le notebook système (5 lignes)', () => {
    const cleaned = runNotebook(getNotebook('sys-silver-clean'), COMMANDES_DIRTY);
    expect(cleaned).toHaveLength(5);
    expect(validate(cleaned).ok).toBe(true);
  });

  // L'énoncé propose le notebook créé en pipe-12, qui filtre en plus sur
  // statut = Livree et ne sort donc que 4 lignes : il doit passer aussi.
  it('accepte un notebook qui filtre en plus (4 lignes)', () => {
    const pipe12 = {
      cards: [
        { type: 'drop_duplicates', params: {} },
        { type: 'delete_na', params: {} },
        { type: 'filter', params: { column: 'statut', value: 'Livree' } },
        { type: 'sort', params: { column: 'date', order: 'desc' } },
      ],
    };
    const cleaned = runNotebook(pipe12, COMMANDES_DIRTY);
    expect(cleaned).toHaveLength(4);
    expect(validate(cleaned).ok).toBe(true);
  });
});

describe('pipe-18 : Audit fournisseurs', () => {
  const nodes = [{ id: 'lk', type: 'lookup' }];
  const produits = (n) => Array.from({ length: n }, (_, i) => ({ id: `P0${i + 1}` }));

  it('refuse un lookup qui renvoie n\'importe quoi', () => {
    const res = exo('pipe-18').validate({ lk_match: produits(2), lk_nomatch: produits(1) }, nodes, [], {});
    expect(res.ok).toBe(false);
  });

  it('signale les entrées inversées', () => {
    const res = exo('pipe-18').validate({ lk_match: produits(3), lk_nomatch: produits(1) }, nodes, [], {});
    expect(res.ok).toBe(false);
    expect(res.msg).toMatch(/inversees/i);
  });

  it('accepte 6 produits couverts et P99 orphelin', () => {
    const res = exo('pipe-18').validate({ lk_match: produits(6), lk_nomatch: [{ id: 'P99' }] }, nodes, [], {});
    expect(res.ok).toBe(true);
  });
});

describe('pipe-22 : Gold CA par client', () => {
  const nodes = [
    { id: 'g', type: 'lakehouse_gold' },
    { id: 't', type: 'table_output' },
    { id: 'd', type: 'dashboard' },
  ];
  const cfgs = { t: { parentId: 'g' } };

  it('refuse un Gold rempli de données non agrégées', () => {
    const raw = [
      { id: 'CMD001', client_id: '1', montant: '150' }, { id: 'CMD002', client_id: '2', montant: '230' },
      { id: 'CMD003', client_id: '1', montant: '85' }, { id: 'CMD004', client_id: '3', montant: '320' },
      { id: 'CMD005', client_id: '2', montant: '175' },
    ];
    expect(exo('pipe-22').validate({ g: raw }, nodes, [], cfgs).ok).toBe(false);
  });

  it('refuse un agrégat sans la somme des montants', () => {
    const countOnly = [
      { client_id: '1', nb: '2' }, { client_id: '2', nb: '2' }, { client_id: '3', nb: '1' },
    ];
    expect(exo('pipe-22').validate({ g: countOnly }, nodes, [], cfgs).ok).toBe(false);
  });

  it('accepte count + sum(montant) par client, quels que soient les alias', () => {
    const agg = [
      { client_id: '1', nb_commandes: '2', ca: '235' },
      { client_id: '2', nb_commandes: '2', ca: '405' },
      { client_id: '3', nb_commandes: '1', ca: '320' },
    ];
    expect(exo('pipe-22').validate({ g: agg }, nodes, [], cfgs).ok).toBe(true);
  });
});

describe('pipe-27 : ETL E-Commerce', () => {
  const baseNodes = [
    { id: 'b', type: 'lakehouse_bronze' },
    { id: 'bt1', type: 'table_output' }, { id: 'bt2', type: 'table_output' },
    { id: 'sl', type: 'lakehouse_silver' }, { id: 'st', type: 'table_output' },
    { id: 'g', type: 'lakehouse_gold' }, { id: 'gt', type: 'table_output' },
    { id: 'd', type: 'dashboard' },
    { id: 'nb', type: 'notebook' },
  ];
  const layers = {
    bt1: { parentId: 'b' }, bt2: { parentId: 'b' },
    st: { parentId: 'sl' }, gt: { parentId: 'g' },
  };
  const outputs = { g: [{ categorie: 'Informatique', ca: '1685' }] };
  // Chaine nominale : nettoyage → table Silver → agregat → table Gold.
  const conns = [{ from: 'nb', to: 'st' }, { from: 'st', to: 'agg' }, { from: 'agg', to: 'gt' }];
  const nodes = [...baseNodes, { id: 'agg', type: 'aggregate' }];
  const run = (cleaner) => exo('pipe-27').validate(outputs, nodes, conns, { ...layers, ...cleaner });

  it('refuse un Gold qui ne descend pas d\'un agrégat', () => {
    const noAgg = [{ from: 'nb', to: 'st' }, { from: 'sl', to: 'gt' }];
    const cfgs = { ...layers, nb: { notebookId: 'sys-silver-clean' } };
    expect(exo('pipe-27').validate(outputs, baseNodes, noAgg, cfgs).ok).toBe(false);
  });

  it('accepte le notebook système de nettoyage', () => {
    expect(run({ nb: { notebookId: 'sys-silver-clean' } }).ok).toBe(true);
  });

  // pipe-25 enseigne le nettoyage par ForEach : il doit compter ici aussi.
  it('accepte un ForEach dont les étapes nettoient', () => {
    const foreachNodes = nodes.map(n => n.id === 'nb' ? { id: 'nb', type: 'foreach' } : n);
    const cfgs = { ...layers, nb: { params: { steps: [{ nodeType: 'clean_na' }, { nodeType: 'deduplicate' }] } } };
    expect(exo('pipe-27').validate(outputs, foreachNodes, conns, cfgs).ok).toBe(true);
  });

  it('refuse un notebook Passthrough qui ne nettoie rien', () => {
    expect(run({ nb: { notebookId: 'sys-passthrough' } }).ok).toBe(false);
  });

  it('refuse un notebook non configuré', () => {
    expect(run({}).ok).toBe(false);
  });
});
