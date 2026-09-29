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

  it('refuse un Silver alimenté avec les données brutes', () => {
    const res = exo('pipe-15').validate({ sl: COMMANDES_DIRTY }, nodes, [], cfgs);
    expect(res.ok).toBe(false);
  });

  it('accepte un Silver nettoyé', () => {
    const cleaned = runNotebook(getNotebook('sys-silver-clean'), COMMANDES_DIRTY);
    const res = exo('pipe-15').validate({ sl: cleaned }, nodes, [], cfgs);
    expect(res.ok).toBe(true);
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
  const cfgs = {
    bt1: { parentId: 'b' }, bt2: { parentId: 'b' },
    st: { parentId: 'sl' }, gt: { parentId: 'g' },
  };
  const outputs = { g: [{ categorie: 'Informatique', ca: '1685' }] };

  it('refuse un Gold qui ne descend pas d\'un agrégat', () => {
    const conns = [{ from: 'nb', to: 'st' }, { from: 'sl', to: 'gt' }];
    expect(exo('pipe-27').validate(outputs, baseNodes, conns, cfgs).ok).toBe(false);
  });

  it('accepte un Silver nettoyé et un Gold agrégé', () => {
    const nodes = [...baseNodes, { id: 'agg', type: 'aggregate' }];
    const conns = [{ from: 'nb', to: 'st' }, { from: 'st', to: 'agg' }, { from: 'agg', to: 'gt' }];
    expect(exo('pipe-27').validate(outputs, nodes, conns, cfgs).ok).toBe(true);
  });
});
