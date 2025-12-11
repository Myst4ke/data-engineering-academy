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
  const basePath = `/exercises/${exerciseId}`;

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
    // Beginner (1-6)
    { id: 'ex-01', title: 'Doublons', difficulty: 1 },
    { id: 'ex-02', title: 'Complet', difficulty: 1 },
    { id: 'ex-03', title: 'Tri Prix', difficulty: 1 },
    { id: 'ex-04', title: 'Suppr Col', difficulty: 1 },
    { id: 'ex-05', title: 'Filtrer', difficulty: 1 },
    { id: 'ex-06', title: 'Renommer', difficulty: 1 },
    // Intermediate (7-12)
    { id: 'ex-07', title: 'Nettoyer', difficulty: 2 },
    { id: 'ex-08', title: 'Tri+Filtre', difficulty: 2 },
    { id: 'ex-09', title: 'Sélection', difficulty: 2 },
    { id: 'ex-10', title: 'Remplir', difficulty: 2 },
    { id: 'ex-11', title: 'Fusion', difficulty: 2 },
    { id: 'ex-12', title: 'Multi-Sup', difficulty: 2 },
    // Expert (13-18)
    { id: 'ex-13', title: 'Pipeline', difficulty: 3 },
    { id: 'ex-14', title: 'Join++', difficulty: 3 },
    { id: 'ex-15', title: 'ETL', difficulty: 3 },
    { id: 'ex-16', title: 'Clean Pro', difficulty: 3 },
    { id: 'ex-17', title: 'Union', difficulty: 3 },
    { id: 'ex-18', title: 'Master', difficulty: 3 },
  ];
}
