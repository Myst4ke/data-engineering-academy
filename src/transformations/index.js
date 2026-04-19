/**
 * Transformation functions for data tables
 * Each function takes a table (array of objects) and optional params
 * Returns a new transformed table
 */

/**
 * drop_duplicates - Remove duplicate rows
 * If params.columns is provided, only those columns are used to detect duplicates (keeps first occurrence)
 * Otherwise, all columns are compared (exact match)
 */
export function dropDuplicates(table, params) {
  const subset = params?.columns;
  const seen = new Set();
  return table.filter(row => {
    const key = subset
      ? JSON.stringify(subset.map(c => row[c]))
      : JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * sort - Sort by a column (ascending or descending)
 */
export function sort(table, params) {
  const { column, order = 'asc' } = params;
  return [...table].sort((a, b) => {
    const valA = a[column];
    const valB = b[column];

    // Handle numeric comparison
    const numA = parseFloat(valA);
    const numB = parseFloat(valB);

    if (!isNaN(numA) && !isNaN(numB)) {
      return order === 'asc' ? numA - numB : numB - numA;
    }

    // String comparison
    const strA = String(valA || '').toLowerCase();
    const strB = String(valB || '').toLowerCase();

    if (order === 'asc') {
      return strA.localeCompare(strB);
    }
    return strB.localeCompare(strA);
  });
}

/**
 * delete - Remove a column from the table
 */
export function deleteColumn(table, params) {
  const { column } = params;
  return table.map(row => {
    const newRow = { ...row };
    delete newRow[column];
    return newRow;
  });
}

/**
 * delete_na - Remove rows with empty/null cells
 * @param {Object} params - Optional: { columns: ['col1', 'col2'] } to check only specific columns
 *                          If no columns specified, checks ALL columns
 */
export function deleteNa(table, params) {
  const cols = params?.columns?.length > 0 ? params.columns : null;
  return table.filter(row => {
    const values = cols ? cols.map(c => row[c]) : Object.values(row);
    return values.every(value => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    });
  });
}

/**
 * filter - Keep only rows where column equals value
 */
export function filter(table, params) {
  const { column, value } = params;
  return table.filter(row => {
    const cellValue = row[column];
    // Compare as strings to handle different types
    return String(cellValue).trim() === String(value).trim();
  });
}

/**
 * join - Join two tables on a common column (inner join style, but keeps all matches)
 */
export function join(table1, table2, params) {
  const { column } = params;
  const result = [];

  for (const row1 of table1) {
    const matchingRows = table2.filter(row2 =>
      String(row1[column]).trim() === String(row2[column]).trim()
    );

    for (const row2 of matchingRows) {
      // Merge rows, excluding duplicate join column from table2
      const mergedRow = { ...row1 };
      for (const [key, value] of Object.entries(row2)) {
        if (key !== column) {
          mergedRow[key] = value;
        }
      }
      result.push(mergedRow);
    }
  }

  return result;
}

/**
 * rename - Rename a column
 */
export function rename(table, params) {
  const { oldName, newName } = params;
  return table.map(row => {
    const newRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (key === oldName) {
        newRow[newName] = value;
      } else {
        newRow[key] = value;
      }
    }
    return newRow;
  });
}

/**
 * select - Keep only specified columns
 */
export function select(table, params) {
  const { columns } = params;
  return table.map(row => {
    const newRow = {};
    for (const col of columns) {
      if (row.hasOwnProperty(col)) {
        newRow[col] = row[col];
      }
    }
    return newRow;
  });
}

/**
 * fill_na - Fill empty cells with a value
 */
export function fillNa(table, params) {
  const { column, value } = params;
  return table.map(row => {
    const newRow = { ...row };
    const cellValue = newRow[column];
    if (cellValue === null || cellValue === undefined ||
        (typeof cellValue === 'string' && cellValue.trim() === '')) {
      newRow[column] = value;
    }
    return newRow;
  });
}

/**
 * concat - Concatenate two tables vertically (union)
 */
export function concat(table1, table2) {
  return [...table1, ...table2];
}

/**
 * Apply a transformation card to the current table state
 */
export function applyTransformation(table, card, secondTable = null) {
  const { type, params = {} } = card;

  switch (type) {
    case 'drop_duplicates':
      return dropDuplicates(table, params);
    case 'sort':
      return sort(table, params);
    case 'delete':
      return deleteColumn(table, params);
    case 'delete_na':
      return deleteNa(table, params);
    case 'filter':
      return filter(table, params);
    case 'join':
      if (!secondTable) {
        console.warn('Join requires a second table');
        return table;
      }
      return join(table, secondTable, params);
    case 'rename':
      return rename(table, params);
    case 'select':
      return select(table, params);
    case 'fill_na':
      return fillNa(table, params);
    case 'concat':
      if (!secondTable) {
        console.warn('Concat requires a second table');
        return table;
      }
      return concat(table, secondTable);
    default:
      console.warn(`Unknown transformation type: ${type}`);
      return table;
  }
}

/**
 * Apply a sequence of transformations
 */
export function applyPipeline(initialTable, cards, secondTable = null) {
  return cards.reduce((table, card) => {
    return applyTransformation(table, card, secondTable);
  }, initialTable);
}

/**
 * Compare two tables for equality
 */
export function tablesEqual(table1, table2) {
  if (table1.length !== table2.length) return false;
  if (table1.length === 0) return true;

  const cols1 = Object.keys(table1[0]);
  const cols2 = Object.keys(table2[0]);

  if (cols1.length !== cols2.length) return false;

  // Case-insensitive column matching: build a mapping from table1 cols to table2 cols
  const colMap = new Map();
  const usedCols2 = new Set();
  for (const c1 of cols1) {
    const match = cols2.find(c2 => !usedCols2.has(c2) && c1.toLowerCase() === c2.toLowerCase());
    if (!match) return false;
    colMap.set(c1, match);
    usedCols2.add(match);
  }

  for (let i = 0; i < table1.length; i++) {
    for (const col1 of cols1) {
      const col2 = colMap.get(col1);
      const val1 = String(table1[i][col1] ?? '').trim();
      const val2 = String(table2[i][col2] ?? '').trim();
      if (val1 !== val2) return false;
    }
  }

  return true;
}
