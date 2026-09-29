import { describe, it, expect } from 'vitest';
import { applyWindowFunction } from '../windowFunctions';

// Jeu de pipe-31 : les deux ventes P01 à 1200 créent une égalité.
const VENTES = [
  { id: 'V1', montant: '1200', categorie: 'Informatique' },
  { id: 'V2', montant: '1200', categorie: 'Informatique' },
  { id: 'V3', montant: '450', categorie: 'Informatique' },
  { id: 'V4', montant: '120', categorie: 'Audio' },
  { id: 'V5', montant: '35', categorie: 'Audio' },
];

const ranksOf = (func, extra = {}) =>
  applyWindowFunction(VENTES, { func, orderBy: 'montant', orderDir: 'desc', alias: 'rang', ...extra })
    .map(r => r.rang);

describe('applyWindowFunction : rangs', () => {
  it('ROW_NUMBER numérote sans tenir compte des égalités', () => {
    expect(ranksOf('row_number')).toEqual(['1', '2', '3', '4', '5']);
  });

  // Régression : le code lisait le rang précédent sur la ligne d'entrée, qui ne
  // porte pas encore la colonne calculée. RANK retombait donc sur i+1.
  it('RANK donne le même rang aux ex aequo puis saute', () => {
    expect(ranksOf('rank')).toEqual(['1', '1', '3', '4', '5']);
  });

  // Même cause : DENSE_RANK renvoyait "1" partout.
  it('DENSE_RANK donne le même rang aux ex aequo sans sauter', () => {
    expect(ranksOf('dense_rank')).toEqual(['1', '1', '2', '3', '4']);
  });

  it('sans égalité, RANK et DENSE_RANK suivent ROW_NUMBER', () => {
    const rows = [{ m: '30' }, { m: '20' }, { m: '10' }];
    const run = (func) => applyWindowFunction(rows, { func, orderBy: 'm', orderDir: 'desc', alias: 'r' }).map(r => r.r);
    expect(run('rank')).toEqual(['1', '2', '3']);
    expect(run('dense_rank')).toEqual(['1', '2', '3']);
  });

  it('le rang repart à 1 dans chaque partition', () => {
    const rows = applyWindowFunction(VENTES, {
      func: 'rank', orderBy: 'montant', orderDir: 'desc', partitionBy: 'categorie', alias: 'rang',
    });
    const byCat = {};
    rows.forEach(r => { (byCat[r.categorie] ??= []).push(r.rang); });
    expect(byCat.Informatique).toEqual(['1', '1', '3']);
    expect(byCat.Audio).toEqual(['1', '2']);
  });
});

describe('applyWindowFunction : autres fonctions', () => {
  it('trie croissant et cumule', () => {
    const rows = applyWindowFunction(VENTES, { func: 'sum_cum', orderBy: 'montant', orderDir: 'asc', valueCol: 'montant', alias: 'cumul' });
    expect(rows.map(r => r.cumul)).toEqual(['35', '155', '605', '1805', '3005']);
  });

  it('LAG et LEAD lisent les lignes voisines', () => {
    const lag = applyWindowFunction(VENTES, { func: 'lag', orderBy: 'montant', orderDir: 'desc', valueCol: 'id', alias: 'prec' });
    expect(lag.map(r => r.prec)).toEqual(['', 'V1', 'V2', 'V3', 'V4']);
    const lead = applyWindowFunction(VENTES, { func: 'lead', orderBy: 'montant', orderDir: 'desc', valueCol: 'id', alias: 'suiv' });
    expect(lead.map(r => r.suiv)).toEqual(['V2', 'V3', 'V4', 'V5', '']);
  });

  it('renvoie les lignes telles quelles si la config est incomplète', () => {
    expect(applyWindowFunction(VENTES, { func: 'rank' })).toEqual(VENTES);
    expect(applyWindowFunction(VENTES, undefined)).toEqual(VENTES);
  });
});
