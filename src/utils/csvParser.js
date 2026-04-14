/**
 * Simple CSV parser for the exercises
 */

export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Load exercise data from public folder
 */
export async function loadExercise(exerciseId) {
  const basePath = `./exercises/${exerciseId}`;

  try {
    // Load config
    const configRes = await fetch(`${basePath}/config.json`);
    if (!configRes.ok) throw new Error('Config not found');
    const config = await configRes.json();

    // Load input table
    const inputRes = await fetch(`${basePath}/input.csv`);
    if (!inputRes.ok) throw new Error('Input CSV not found');
    const inputCSV = await inputRes.text();
    const inputTable = parseCSV(inputCSV);

    // Load output (target) table
    const outputRes = await fetch(`${basePath}/output.csv`);
    if (!outputRes.ok) throw new Error('Output CSV not found');
    const outputCSV = await outputRes.text();
    const outputTable = parseCSV(outputCSV);

    // Load second table if needed (for join)
    let secondTable = null;
    if (config.hasSecondTable) {
      const input2Res = await fetch(`${basePath}/input2.csv`);
      if (input2Res.ok) {
        const input2CSV = await input2Res.text();
        secondTable = parseCSV(input2CSV);
      }
    }

    return {
      config,
      inputTable,
      outputTable,
      secondTable,
    };
  } catch (error) {
    console.error(`Error loading exercise ${exerciseId}:`, error);
    throw error;
  }
}

/**
 * Get list of available exercises
 */
export async function getExerciseList() {
  return [
    // Facile (6) - 1 carte
    { id: 'ex-01', title: 'Inventaire', difficulty: 1 },
    { id: 'ex-02', title: 'Registre', difficulty: 1 },
    { id: 'ex-03', title: 'Catalogue', difficulty: 1 },
    { id: 'ex-04', title: 'Alléger', difficulty: 1 },
    { id: 'ex-05', title: 'Segment', difficulty: 1 },
    { id: 'ex-06', title: 'Clarifier', difficulty: 1 },
    // Intermédiaire (12) - 2 cartes
    { id: 'ex-07', title: 'Base Client', difficulty: 2 },
    { id: 'ex-08', title: 'Top Ventes', difficulty: 2 },
    { id: 'ex-09', title: 'Extraction', difficulty: 2 },
    { id: 'ex-10', title: 'Compléter', difficulty: 2 },
    { id: 'ex-11', title: 'Croisement', difficulty: 2 },
    { id: 'ex-12', title: 'Épurer', difficulty: 2 },
    { id: 'ex-19', title: 'Classement', difficulty: 2 },
    { id: 'ex-19b', title: 'Podium', difficulty: 2 },
    { id: 'ex-20', title: 'Effectifs', difficulty: 2 },
    { id: 'ex-21', title: 'Annuaire', difficulty: 2 },
    { id: 'ex-22', title: 'Magasin', difficulty: 2 },
    { id: 'ex-23', title: 'Commandes', difficulty: 2 },
    // Difficile (12) - 3-4 cartes
    { id: 'ex-13', title: 'Scoring', difficulty: 3 },
    { id: 'ex-14', title: 'Enrichir', difficulty: 3 },
    { id: 'ex-15', title: 'Reporting', difficulty: 3 },
    { id: 'ex-16', title: 'Audit', difficulty: 3 },
    { id: 'ex-17', title: 'Consolider', difficulty: 3 },
    { id: 'ex-25', title: 'Entrepôt', difficulty: 3 },
    { id: 'ex-26', title: 'Catalogue Pro', difficulty: 3 },
    { id: 'ex-27', title: 'Analyse Reg.', difficulty: 3 },
    { id: 'ex-28', title: 'Valorisation', difficulty: 3 },
    { id: 'ex-29', title: 'Normaliser', difficulty: 3 },
    { id: 'ex-30', title: 'Département', difficulty: 3 },
    { id: 'ex-34', title: 'Import Multi', difficulty: 3 },
    // Expert (6) - 5 cartes
    { id: 'ex-18', title: 'Data Master', difficulty: 4 },
    { id: 'ex-31', title: 'Showroom', difficulty: 4 },
    { id: 'ex-32', title: 'Full Pipeline', difficulty: 4 },
    { id: 'ex-33', title: 'Performance', difficulty: 4 },
    { id: 'ex-35', title: 'Périphériques', difficulty: 4 },
    { id: 'ex-36', title: 'Grand Master', difficulty: 4 },
  ];
}
