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
  // For now, return hardcoded list
  // In a more dynamic setup, this could scan the exercises folder
  return [
    { id: 'exercice-1', title: 'Nettoyage des Articles', difficulty: 1 },
    { id: 'exercice-2', title: 'Deduplication des Familles', difficulty: 2 },
    { id: 'exercice-3', title: 'Jointure des Tables', difficulty: 3 },
  ];
}
