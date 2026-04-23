/**
 * Data Modeling Dojo validator.
 *
 * Inputs:
 *   tables    : current array of table objects {id, name, type, columns:[{id,name,type,pk,notNull,unique}], ...}
 *   relations : current array of relation objects {id, fromTableId, fromColumnId, toTableId, toColumnId, cardinality}
 *   exercise  : exercise descriptor with optional `target` property
 *
 * Output:
 *   { passed: bool, warnings: [{level, message, tableId?, columnId?, relationId?}], stars: 0..3 }
 *
 * The validator is tolerant to case/whitespace on names but strict on structure
 * (required tables, columns, PKs, relations, cardinality).
 */

const norm = (s) => (typeof s === 'string' ? s.trim().toLowerCase() : '');

export function validateModel(tables, relations, exercise) {
  const target = exercise?.target;
  if (!target) {
    // Sandbox : no validation, always passing.
    return { passed: true, warnings: [], stars: 3 };
  }

  const warnings = [];
  const actualByTargetName = {};

  // 1. Required tables and their columns
  for (const tt of target.tables || []) {
    const actual = tables.find(t => norm(t.name) === norm(tt.name));
    if (!actual) {
      warnings.push({ level: 'error', message: `Table "${tt.name}" manquante.` });
      continue;
    }
    actualByTargetName[tt.name] = actual;

    for (const tc of tt.columns || []) {
      const ac = actual.columns.find(c => norm(c.name) === norm(tc.name));
      if (!ac) {
        warnings.push({ level: 'error', message: `Colonne "${tc.name}" manquante dans ${actual.name}.`, tableId: actual.id });
        continue;
      }
      if (tc.pk && !ac.pk) {
        warnings.push({ level: 'error', message: `"${tc.name}" doit être clé primaire.`, tableId: actual.id, columnId: ac.id });
      }
      if (tc.type && ac.type && tc.type !== ac.type) {
        warnings.push({ level: 'warn', message: `Type de ${actual.name}.${tc.name} : attendu ${tc.type}, actuel ${ac.type}.`, tableId: actual.id, columnId: ac.id });
      }
    }
  }

  // 2. Forbidden columns (e.g. denormalized fields that should have been extracted)
  if (target.forbiddenColumnsByTable) {
    for (const [tblName, cols] of Object.entries(target.forbiddenColumnsByTable)) {
      const actual = tables.find(t => norm(t.name) === norm(tblName));
      if (!actual) continue;
      for (const c of cols) {
        const present = actual.columns.find(ac => norm(ac.name) === norm(c));
        if (present) {
          warnings.push({ level: 'error', message: `Colonne "${c}" à retirer de ${actual.name} (donnée dupliquée).`, tableId: actual.id, columnId: present.id });
        }
      }
    }
  }

  // 3. Required relations
  for (const tr of target.relations || []) {
    const fromT = actualByTargetName[tr.fromTable];
    const toT   = actualByTargetName[tr.toTable];
    if (!fromT || !toT) continue; // tables themselves already flagged as missing
    const fromC = fromT.columns.find(c => norm(c.name) === norm(tr.fromColumn));
    const toC   = toT.columns.find(c => norm(c.name) === norm(tr.toColumn));
    if (!fromC || !toC) continue; // columns already flagged
    const actualRel = relations.find(r =>
      r.fromTableId === fromT.id && r.fromColumnId === fromC.id &&
      r.toTableId   === toT.id   && r.toColumnId   === toC.id
    );
    if (!actualRel) {
      warnings.push({ level: 'error', message: `Relation manquante : ${fromT.name}.${tr.fromColumn} → ${toT.name}.${tr.toColumn}.` });
      continue;
    }
    if (tr.cardinality && actualRel.cardinality !== tr.cardinality) {
      warnings.push({ level: 'error', message: `Cardinalité de ${fromT.name}.${tr.fromColumn} → ${toT.name}.${tr.toColumn} : attendue ${tr.cardinality}, actuelle ${actualRel.cardinality}.`, relationId: actualRel.id });
    }
  }

  const errors = warnings.filter(w => w.level === 'error').length;
  const warns  = warnings.filter(w => w.level === 'warn').length;
  const passed = errors === 0;
  let stars = 0;
  if (passed) stars = warns === 0 ? 3 : (warns <= 2 ? 2 : 1);
  return { passed, warnings, stars };
}
