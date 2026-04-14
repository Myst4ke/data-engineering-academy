import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';
import { applyPipeline, tablesEqual } from '../index.js';

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => { row[header] = values[index] || ''; });
    data.push(row);
  }
  return data;
}

// Known solutions for all exercises
const solutions = {
  'ex-01': [{ type: 'drop_duplicates' }],
  'ex-02': [{ type: 'delete_na' }],
  'ex-03': [{ type: 'sort', params: { column: 'Prix', order: 'asc' } }],
  'ex-04': [{ type: 'delete', params: { column: 'Notes' } }],
  'ex-05': [{ type: 'filter', params: { column: 'Statut', value: 'Actif' } }],
  'ex-06': [{ type: 'rename', params: { oldName: 'Qte', newName: 'Quantite' } }],
  'ex-07': [{ type: 'delete_na' }, { type: 'drop_duplicates' }],
  'ex-08': [{ type: 'filter', params: { column: 'Region', value: 'Nord' } }, { type: 'sort', params: { column: 'Montant', order: 'desc' } }],
  'ex-09': [{ type: 'select', params: { columns: ['Nom', 'Departement'] } }, { type: 'sort', params: { column: 'Nom', order: 'asc' } }],
  'ex-10': [{ type: 'fill_na', params: { column: 'Stock', value: '0' } }, { type: 'filter', params: { column: 'Status', value: 'Disponible' } }],
  'ex-11': [{ type: 'join', params: { column: 'SKU' } }],
  'ex-12': [{ type: 'delete', params: { column: 'Notes' } }, { type: 'delete', params: { column: 'Temp' } }, { type: 'drop_duplicates' }],
  'ex-13': [{ type: 'drop_duplicates' }, { type: 'delete_na' }, { type: 'filter', params: { column: 'Type', value: 'Premium' } }, { type: 'sort', params: { column: 'Score', order: 'desc' } }],
  'ex-19': [{ type: 'sort', params: { column: 'Prix', order: 'desc' } }, { type: 'delete', params: { column: 'Note' } }],
  'ex-19b': [{ type: 'filter', params: { column: 'Categorie', value: 'A' } }, { type: 'sort', params: { column: 'Score', order: 'desc' } }],
  'ex-20': [{ type: 'fill_na', params: { column: 'Departement', value: 'General' } }, { type: 'sort', params: { column: 'Salaire', order: 'desc' } }],
  'ex-21': [{ type: 'select', params: { columns: ['ID', 'Nom', 'Email'] } }, { type: 'rename', params: { oldName: 'Nom', newName: 'NomFamille' } }],
  'ex-22': [{ type: 'delete_na' }, { type: 'filter', params: { column: 'Categorie', value: 'Electronique' } }],
  'ex-23': [{ type: 'drop_duplicates' }, { type: 'select', params: { columns: ['Code', 'Libelle', 'Prix'] } }],
  'ex-25': [{ type: 'delete_na' }, { type: 'drop_duplicates' }, { type: 'sort', params: { column: 'Prix', order: 'asc' } }],
  'ex-26': [{ type: 'filter', params: { column: 'Actif', value: 'oui' } }, { type: 'rename', params: { oldName: 'Designation', newName: 'NomProduit' } }, { type: 'select', params: { columns: ['SKU', 'NomProduit', 'PrixHT'] } }],
  'ex-27': [{ type: 'delete_na' }, { type: 'filter', params: { column: 'Region', value: 'Nord' } }, { type: 'sort', params: { column: 'CA', order: 'desc' } }, { type: 'delete', params: { column: 'Note' } }],
  'ex-28': [{ type: 'join', params: { column: 'CodeProduit' } }, { type: 'delete', params: { column: 'Categorie' } }, { type: 'sort', params: { column: 'Prix', order: 'asc' } }],
  'ex-29': [{ type: 'rename', params: { oldName: 'qte', newName: 'Quantite' } }, { type: 'rename', params: { oldName: 'pu', newName: 'PrixUnitaire' } }, { type: 'sort', params: { column: 'PrixUnitaire', order: 'asc' } }],
  'ex-30': [{ type: 'filter', params: { column: 'Service', value: 'IT' } }, { type: 'select', params: { columns: ['ID', 'Nom', 'Salaire', 'Anciennete'] } }, { type: 'sort', params: { column: 'Salaire', order: 'desc' } }],
  'ex-31': [{ type: 'delete_na' }, { type: 'drop_duplicates' }, { type: 'filter', params: { column: 'Categorie', value: 'Deco' } }, { type: 'sort', params: { column: 'Prix', order: 'asc' } }, { type: 'delete', params: { column: 'Stock' } }],
  'ex-32': [{ type: 'delete_na' }, { type: 'filter', params: { column: 'Disponible', value: 'oui' } }, { type: 'rename', params: { oldName: 'PrixVente', newName: 'Prix' } }, { type: 'select', params: { columns: ['Code', 'Produit', 'Prix'] } }, { type: 'sort', params: { column: 'Prix', order: 'asc' } }],
  'ex-33': [{ type: 'join', params: { column: 'ID' } }, { type: 'delete_na' }, { type: 'sort', params: { column: 'Resultat', order: 'desc' } }, { type: 'rename', params: { oldName: 'Resultat', newName: 'Score' } }, { type: 'select', params: { columns: ['Nom', 'Service', 'Score'] } }],
  'ex-34': [{ type: 'concat' }, { type: 'drop_duplicates' }, { type: 'sort', params: { column: 'Prix', order: 'asc' } }],
  'ex-35': [{ type: 'fill_na', params: { column: 'note', value: 'ok' } }, { type: 'delete_na' }, { type: 'filter', params: { column: 'cat', value: 'periph' } }, { type: 'sort', params: { column: 'prix', order: 'desc' } }, { type: 'delete', params: { column: 'note' } }],
  'ex-36': [{ type: 'concat' }, { type: 'fill_na', params: { column: 'categorie', value: 'Info' } }, { type: 'delete_na' }, { type: 'drop_duplicates' }, { type: 'filter', params: { column: 'categorie', value: 'Info' } }, { type: 'rename', params: { oldName: 'stock', newName: 'quantite' } }, { type: 'sort', params: { column: 'quantite', order: 'desc' } }, { type: 'select', params: { columns: ['article', 'quantite', 'entrepot'] } }],
};

const exercisesDir = pathJoin(process.cwd(), 'public', 'exercises');

function loadExercise(id) {
  const dir = pathJoin(exercisesDir, id);
  const config = JSON.parse(readFileSync(pathJoin(dir, 'config.json'), 'utf8'));
  const input = parseCSV(readFileSync(pathJoin(dir, 'input.csv'), 'utf8'));
  const output = parseCSV(readFileSync(pathJoin(dir, 'output.csv'), 'utf8'));
  let secondTable = null;
  if (config.hasSecondTable) {
    try { secondTable = parseCSV(readFileSync(pathJoin(dir, 'input2.csv'), 'utf8')); } catch (e) { /* no input2 */ }
  }
  return { config, input, output, secondTable };
}

describe('Exercise solutions', () => {
  for (const [id, solution] of Object.entries(solutions)) {
    it(`${id} is solvable`, () => {
      const { input, output, secondTable } = loadExercise(id);
      const result = applyPipeline(input, solution, secondTable);
      expect(tablesEqual(result, output)).toBe(true);
    });
  }
});
