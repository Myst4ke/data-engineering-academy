import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NODE_TYPES } from './nodeTypes';
import ParamInputPopup from '../components/ParamInputPopup';

// Transform types available inside ForEach
const AVAILABLE_TRANSFORMS = [
  'filter', 'sort', 'select_cols', 'delete_col', 'rename_col',
  'deduplicate', 'clean_na', 'fill_na', 'mapping',
];

function mapNodeTypeToCardType(nodeType) {
  const map = {
    filter: 'filter', sort: 'sort', select_cols: 'select', delete_col: 'delete',
    rename_col: 'rename', deduplicate: 'drop_duplicates', clean_na: 'delete_na', fill_na: 'fill_na',
  };
  return map[nodeType] || nodeType;
}

export default function ForEachConfig({ initialSteps, sampleColumns, sampleData, onConfirm, onCancel }) {
  const [steps, setSteps] = useState(initialSteps || []);
  const [configStepIndex, setConfigStepIndex] = useState(null); // index of step being configured

  // Steps that don't need params
  const NO_PARAMS = ['clean_na', 'deduplicate'];

  const addStep = (nodeType) => {
    setSteps(prev => [...prev, { nodeType, params: null }]);
    // Auto-open config only for steps that need params
    if (!NO_PARAMS.includes(nodeType)) {
      setConfigStepIndex(steps.length);
    }
  };

  const removeStep = (index) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const moveStep = (index, dir) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= steps.length) return;
    setSteps(prev => {
      const copy = [...prev];
      [copy[index], copy[newIdx]] = [copy[newIdx], copy[index]];
      return copy;
    });
  };

  const handleStepConfig = (params) => {
    if (configStepIndex === null) return;
    setSteps(prev => prev.map((s, i) => i === configStepIndex ? { ...s, params } : s));
    setConfigStepIndex(null);
  };

  // Compute columns available at each step (simulate pipeline)
  const getColumnsAtStep = (stepIndex) => {
    // For simplicity, use the sample columns from the first input table
    // A full implementation would simulate each step
    return sampleColumns;
  };

  const getStepLabel = (step) => {
    const p = step.params;
    if (!p) return '';
    if (p.column && p.value) return `${p.column}=${p.value}`;
    if (p.column && p.order) return `${p.column} ${p.order === 'desc' ? '↓' : '↑'}`;
    if (p.oldName && p.newName) return `${p.oldName}→${p.newName}`;
    if (p.column) return p.column;
    if (p.columns) return p.columns.join(', ');
    if (p.mappings) return `${p.mappings.length} cols`;
    return 'configuré';
  };

  return createPortal(
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔁</span>
            <div>
              <h3 className="text-lg font-bold text-slate-800">ForEach — Pipeline de transformations</h3>
              <p className="text-xs text-slate-500">Ces transformations s'appliqueront à chaque table en entrée</p>
            </div>
          </div>
        </div>

        {/* Steps list */}
        <div className="flex-1 overflow-y-auto p-4">
          {steps.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Ajoutez des transformations ci-dessous</p>
          ) : (
            <div className="space-y-2">
              {steps.map((step, i) => {
                const typeDef = NODE_TYPES[step.nodeType];
                if (!typeDef) return null;
                return (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 group">
                    <span className="text-lg">{typeDef.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-700">{typeDef.name}</span>
                      {step.params && (
                        <span className="text-xs text-indigo-500 ml-2">{getStepLabel(step)}</span>
                      )}
                      {!step.params && step.nodeType !== 'clean_na' && step.nodeType !== 'deduplicate' && (
                        <span className="text-xs text-amber-500 ml-2">non configuré</span>
                      )}
                    </div>
                    {!NO_PARAMS.includes(step.nodeType) && (
                      <button onClick={() => setConfigStepIndex(i)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                        title="Configurer">⚙️</button>
                    )}
                    <button onClick={() => moveStep(i, -1)} disabled={i === 0}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 transition-colors"
                      title="Monter">↑</button>
                    <button onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 transition-colors"
                      title="Descendre">↓</button>
                    <button onClick={() => removeStep(i)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-center hover:bg-red-50 hover:border-red-300 text-red-400 hover:text-red-500 transition-colors"
                      title="Supprimer">×</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add step */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-2">Ajouter une transformation</p>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TRANSFORMS.map(typeId => {
                const def = NODE_TYPES[typeId];
                if (!def) return null;
                return (
                  <button key={typeId} onClick={() => addStep(typeId)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 text-xs hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                    <span>{def.icon}</span>
                    <span className="text-slate-700">{def.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Preview of emoji chain */}
        {steps.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
            <p className="text-[10px] text-slate-400 mb-1">Pipeline</p>
            <div className="flex items-center gap-1 text-lg">
              {steps.map((s, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-xs text-slate-300">→</span>}
                  <span title={NODE_TYPES[s.nodeType]?.name}>{NODE_TYPES[s.nodeType]?.icon}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600">Annuler</button>
          <button onClick={() => onConfirm({ steps })}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white transition-all">
            Appliquer
          </button>
        </div>
      </div>

      {/* Step config popup */}
      {configStepIndex !== null && steps[configStepIndex] && (() => {
        const step = steps[configStepIndex];
        const cardType = mapNodeTypeToCardType(step.nodeType);
        const typeDef = NODE_TYPES[step.nodeType];
        return (
          <ParamInputPopup
            cardType={cardType}
            cardName={typeDef?.name || ''}
            cardIcon={typeDef?.icon || ''}
            columns={getColumnsAtStep(configStepIndex)}
            tableData={sampleData}
            onConfirm={handleStepConfig}
            onCancel={() => setConfigStepIndex(null)}
            initialParams={step.params}
          />
        );
      })()}
    </div>,
    document.body
  );
}
