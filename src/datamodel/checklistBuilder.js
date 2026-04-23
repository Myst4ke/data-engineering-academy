/**
 * Build the live checklist for a Data Modeling exercise.
 * Derived entirely from exercise.target and current (tables, relations).
 */

const norm = (s) => (typeof s === 'string' ? s.trim().toLowerCase() : '');

export function buildDmChecklist(exercise, tables, relations) {
  const target = exercise?.target;
  if (!target) return [];

  const items = [];

  const initialTableNames = new Set(
    (exercise.initialTables || []).map((t) => norm(t.name))
  );
  const initialTablesByName = {};
  for (const t of (exercise.initialTables || [])) {
    initialTablesByName[norm(t.name)] = t;
  }

  // Tables and their columns
  for (const tt of target.tables || []) {
    const wasInitial = initialTableNames.has(norm(tt.name));
    const actual = tables.find((t) => norm(t.name) === norm(tt.name));

    items.push({
      id: `tbl-${norm(tt.name)}`,
      group: 'Tables',
      label: wasInitial
        ? `Conserver la table ${tt.name}`
        : `Créer la table ${tt.name}`,
      done: !!actual,
    });

    const initialTable = wasInitial ? initialTablesByName[norm(tt.name)] : null;
    for (const tc of tt.columns || []) {
      const wasInitialCol = initialTable?.columns?.some((c) => norm(c.name) === norm(tc.name));
      const actualCol = actual?.columns?.find((c) => norm(c.name) === norm(tc.name));
      const pkOk = tc.pk ? !!actualCol?.pk : true;
      let label;
      if (wasInitialCol) {
        label = tc.pk
          ? `Marquer ${tt.name}.${tc.name} comme clé primaire`
          : `Conserver ${tt.name}.${tc.name}`;
      } else {
        label = tc.pk
          ? `Ajouter ${tt.name}.${tc.name} (clé primaire)`
          : `Ajouter ${tt.name}.${tc.name}`;
      }
      items.push({
        id: `col-${norm(tt.name)}-${norm(tc.name)}`,
        group: 'Colonnes',
        label,
        done: !!actualCol && pkOk,
      });
    }
  }

  // Forbidden columns to remove
  if (target.forbiddenColumnsByTable) {
    for (const [tblName, cols] of Object.entries(target.forbiddenColumnsByTable)) {
      const actual = tables.find((t) => norm(t.name) === norm(tblName));
      for (const c of cols) {
        const present = actual?.columns?.find((ac) => norm(ac.name) === norm(c));
        items.push({
          id: `rm-${norm(tblName)}-${norm(c)}`,
          group: 'Nettoyage',
          label: `Retirer ${tblName}.${c}`,
          done: !present,
        });
      }
    }
  }

  // Relations
  for (const tr of target.relations || []) {
    const fromT = tables.find((t) => norm(t.name) === norm(tr.fromTable));
    const toT = tables.find((t) => norm(t.name) === norm(tr.toTable));
    const fromC = fromT?.columns?.find((c) => norm(c.name) === norm(tr.fromColumn));
    const toC = toT?.columns?.find((c) => norm(c.name) === norm(tr.toColumn));

    let done = false;
    if (fromT && toT && fromC && toC) {
      const actualRel = relations.find((r) =>
        r.fromTableId === fromT.id && r.fromColumnId === fromC.id &&
        r.toTableId === toT.id && r.toColumnId === toC.id
      );
      done = !!actualRel && (!tr.cardinality || actualRel.cardinality === tr.cardinality);
    }

    items.push({
      id: `rel-${norm(tr.fromTable)}.${norm(tr.fromColumn)}-${norm(tr.toTable)}.${norm(tr.toColumn)}`,
      group: 'Relations',
      label: tr.cardinality
        ? `Relier ${tr.fromTable}.${tr.fromColumn} → ${tr.toTable}.${tr.toColumn} (${tr.cardinality})`
        : `Relier ${tr.fromTable}.${tr.fromColumn} → ${tr.toTable}.${tr.toColumn}`,
      done,
    });
  }

  return items;
}
