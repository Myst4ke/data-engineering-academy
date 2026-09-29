/**
 * Fonctions fenêtre du Pipeline Dojo.
 *
 * Extrait de l'exécuteur du canvas pour être testable : le calcul est pur,
 * (rows, params) => rows enrichies d'une colonne `alias`.
 *
 * params : { func, orderBy, orderDir, partitionBy?, valueCol?, alias }
 */
export function applyWindowFunction(rows, params) {
  const p = params;
  if (!p?.func || !p?.orderBy) return rows;

  const sorted = [...rows].sort((a, b) => {
    const va = parseFloat(a[p.orderBy]) || 0;
    const vb = parseFloat(b[p.orderBy]) || 0;
    return p.orderDir === 'desc' ? vb - va : va - vb;
  });

  const partitions = new Map();
  sorted.forEach(row => {
    const key = p.partitionBy ? String(row[p.partitionBy] ?? '') : '__all__';
    if (!partitions.has(key)) partitions.set(key, []);
    partitions.get(key).push(row);
  });

  const result = [];
  partitions.forEach(partitionRows => {
    // Les rangs se suivent d'une ligne à l'autre : ils sont tenus dans des
    // variables locales, car la ligne d'entrée ne porte pas la colonne calculée.
    let cumSum = 0, cumCount = 0;
    let prevKey = null, rank = 0, dense = 0;
    partitionRows.forEach((row, i) => {
      const newRow = { ...row };
      const val = parseFloat(row[p.valueCol]) || 0;
      cumSum += val; cumCount++;

      const key = parseFloat(row[p.orderBy]) || 0;
      const tie = i > 0 && key === prevKey;
      if (!tie) { rank = i + 1; dense += 1; }
      prevKey = key;

      switch (p.func) {
        case 'row_number': newRow[p.alias] = String(i + 1); break;
        case 'rank': newRow[p.alias] = String(rank); break;
        case 'dense_rank': newRow[p.alias] = String(dense); break;
        case 'sum_cum': newRow[p.alias] = String(cumSum); break;
        case 'avg_cum': newRow[p.alias] = String(Math.round((cumSum / cumCount) * 100) / 100); break;
        case 'lag': newRow[p.alias] = i > 0 ? String(partitionRows[i - 1][p.valueCol] ?? '') : ''; break;
        case 'lead': newRow[p.alias] = i < partitionRows.length - 1 ? String(partitionRows[i + 1][p.valueCol] ?? '') : ''; break;
        default: newRow[p.alias] = '';
      }
      result.push(newRow);
    });
  });

  return result;
}
