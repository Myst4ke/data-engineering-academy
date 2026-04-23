import { NODE_TYPES } from './nodeTypes';

/**
 * Build the live checklist for a Pipeline exercise.
 *
 * Uses:
 * - exercise.hintNodes : ordered list of required node types
 * - exercise.sources   : optional map of source type → tables to load
 * - exercise.validate  : optional function ran to check the final output
 *
 * Returns [{ id, group, label, done }]
 */
export function buildPipelineChecklist(exercise, nodes, connections, nodeConfigs, nodeOutputs) {
  if (!exercise) return [];
  const items = [];
  const hintNodes = exercise.hintNodes || [];

  // Count nodes currently placed per type
  const placedCounts = {};
  for (const n of nodes) placedCounts[n.type] = (placedCounts[n.type] || 0) + 1;

  // Count required per type
  const neededCounts = {};
  for (const t of hintNodes) neededCounts[t] = (neededCounts[t] || 0) + 1;

  // Items : "Add node X (i/n)"
  for (const [type, need] of Object.entries(neededCounts)) {
    const def = NODE_TYPES[type];
    if (!def) continue;
    const have = placedCounts[type] || 0;
    for (let i = 0; i < need; i++) {
      items.push({
        id: `node-${type}-${i}`,
        group: 'Activités',
        label: need > 1 ? `Ajouter ${def.name} (${i + 1}/${need})` : `Ajouter ${def.name}`,
        done: have > i,
      });
    }
  }

  // Sources : for each source type, "Load table X"
  if (exercise.sources) {
    for (const [sourceType, tableList] of Object.entries(exercise.sources)) {
      for (const t of (tableList || [])) {
        const loaded = nodes.some((n) => {
          if (n.type !== sourceType) return false;
          const childTargets = connections.filter((c) => c.from === n.id).map((c) => c.to);
          return childTargets.some((childId) => {
            const cfg = nodeConfigs?.[childId];
            return cfg?.tableName && cfg.tableName.toLowerCase() === t.name.toLowerCase();
          });
        });
        items.push({
          id: `source-${sourceType}-${t.name}`,
          group: 'Sources',
          label: `Charger la table ${t.name}`,
          done: loaded,
        });
      }
    }
  }

  // Connections count : total hint nodes minus 1 (approximate chain)
  const expectedConnections = Math.max(0, hintNodes.length - 1);
  if (expectedConnections > 0) {
    items.push({
      id: 'connections',
      group: 'Flux',
      label: expectedConnections === 1
        ? 'Relier les activités'
        : `Relier les activités (${expectedConnections} liens au minimum)`,
      done: connections.length >= expectedConnections,
    });
  }

  // Destination presence
  const needsDestination = hintNodes.some((t) => NODE_TYPES[t]?.category === 'destination');
  if (needsDestination) {
    const hasDestination = nodes.some((n) => NODE_TYPES[n.type]?.category === 'destination');
    items.push({
      id: 'destination',
      group: 'Flux',
      label: 'Ajouter une destination (export, dashboard, entrepôt...)',
      done: hasDestination,
    });
  }

  // Final validation
  if (exercise.validate) {
    let ok = false;
    let msg = '';
    try {
      const res = exercise.validate(nodeOutputs || {}, nodes, connections, nodeConfigs);
      ok = !!res?.ok;
      msg = res?.msg || '';
    } catch {
      /* validator threw ; treat as not done */
    }
    items.push({
      id: 'validate',
      group: 'Résultat',
      label: ok ? 'Résultat attendu' : (msg ? `Objectif : ${msg}`.slice(0, 90) : 'Obtenir le résultat attendu'),
      done: ok,
    });
  }

  return items;
}
