import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DATA_TYPES = [
  { id: 'string', label: 'Texte', icon: 'Aa' },
  { id: 'integer', label: 'Entier', icon: '#' },
  { id: 'float', label: 'Décimal', icon: '.0' },
  { id: 'boolean', label: 'Booléen', icon: '✓✗' },
  { id: 'date', label: 'Date', icon: '📅' },
  { id: 'datetime', label: 'DateTime', icon: '🕐' },
];

function detectType(values) {
  if (values.length === 0) return 'string';
  const sample = values.filter(v => v !== '' && v != null).slice(0, 20);
  if (sample.length === 0) return 'string';

  if (sample.every(v => /^\d{4}-\d{2}-\d{2}T/.test(String(v)))) return 'datetime';
  if (sample.every(v => /^\d{4}-\d{2}-\d{2}$/.test(String(v)))) return 'date';
  if (sample.every(v => v === 'true' || v === 'false' || v === '0' || v === '1')) return 'boolean';
  if (sample.every(v => /^-?\d+$/.test(String(v)))) return 'integer';
  if (sample.every(v => /^-?\d+\.?\d*$/.test(String(v)))) return 'float';
  return 'string';
}

export default function MappingConfig({ columns, tableData, initialParams, onConfirm, onCancel }) {
  const [mappings, setMappings] = useState([]);

  useEffect(() => {
    if (columns.length === 0) return;

    if (initialParams?.mappings) {
      // Restore previous config, adding any new columns
      const existing = new Map(initialParams.mappings.map(m => [m.source, m]));
      setMappings(columns.map(col => existing.get(col) || {
        source: col,
        target: col,
        sourceType: detectType(tableData.map(r => r[col])),
        targetType: detectType(tableData.map(r => r[col])),
      }));
    } else {
      setMappings(columns.map(col => ({
        source: col,
        target: col,
        sourceType: detectType(tableData.map(r => r[col])),
        targetType: detectType(tableData.map(r => r[col])),
      })));
    }
  }, [columns, tableData, initialParams]);

  const updateMapping = (index, field, value) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const handleConfirm = () => {
    onConfirm({ mappings });
  };

  const hasChanges = mappings.some(m => m.source !== m.target || m.sourceType !== m.targetType);

  return createPortal(
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Mapping des colonnes</h3>
              <p className="text-xs text-slate-500">Renommez et typez les colonnes de sortie</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-lg font-bold">×</button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          {mappings.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Connectez une table en amont pour configurer le mapping</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs w-[30%]">Colonne source</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs w-[15%]">Type détecté</th>
                  <th className="text-center py-2 px-3 text-slate-400 text-xs w-[5%]">→</th>
                  <th className="text-left py-2 px-3 text-indigo-500 font-semibold text-xs w-[30%]">Colonne cible</th>
                  <th className="text-left py-2 px-3 text-indigo-500 font-semibold text-xs w-[20%]">Type cible</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m, i) => (
                  <tr key={m.source} className="border-b border-slate-100 hover:bg-slate-50">
                    {/* Source column name */}
                    <td className="py-2 px-3">
                      <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded">{m.source}</span>
                    </td>
                    {/* Detected type */}
                    <td className="py-2 px-3">
                      <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                        {DATA_TYPES.find(t => t.id === m.sourceType)?.label || m.sourceType}
                      </span>
                    </td>
                    {/* Arrow */}
                    <td className="py-2 px-3 text-center text-slate-300">→</td>
                    {/* Target column name (editable) */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={m.target}
                        onChange={(e) => updateMapping(i, 'target', e.target.value)}
                        className={`w-full px-2 py-1 rounded text-xs font-mono border focus:outline-none focus:border-indigo-400 ${
                          m.target !== m.source ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-700'
                        }`}
                      />
                    </td>
                    {/* Target type (select) */}
                    <td className="py-2 px-3">
                      <select
                        value={m.targetType}
                        onChange={(e) => updateMapping(i, 'targetType', e.target.value)}
                        className={`w-full px-2 py-1 rounded text-xs border focus:outline-none focus:border-indigo-400 ${
                          m.targetType !== m.sourceType ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        {DATA_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200">
          <div className="text-xs text-slate-400">
            {mappings.length} colonne{mappings.length > 1 ? 's' : ''}
            {hasChanges && <span className="ml-2 text-indigo-500 font-medium">· Modifications en cours</span>}
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Annuler</button>
            <button onClick={handleConfirm}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white transition-all">
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
