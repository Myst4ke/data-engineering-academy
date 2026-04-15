import { useState } from 'react';
import { createPortal } from 'react-dom';

const AGG_FUNCS = [
  { id: 'count', label: 'COUNT' },
  { id: 'sum', label: 'SUM' },
  { id: 'avg', label: 'AVG' },
  { id: 'min', label: 'MIN' },
  { id: 'max', label: 'MAX' },
];

export default function AggregateConfig({ columns, initialParams, onConfirm, onCancel }) {
  const [groupBy, setGroupBy] = useState(initialParams?.groupBy || []);
  const [aggs, setAggs] = useState(initialParams?.aggs || []);

  const toggleGroupBy = (col) => {
    setGroupBy(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const addAgg = () => setAggs(prev => [...prev, { column: columns[0] || '', func: 'count', alias: '' }]);
  const updateAgg = (i, field, val) => setAggs(prev => prev.map((a, j) => j === i ? { ...a, [field]: val } : a));
  const removeAgg = (i) => setAggs(prev => prev.filter((_, j) => j !== i));

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Agréger (Group By)</h3>
              <p className="text-xs text-slate-500">Regroupez les lignes et calculez des agrégats</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Colonnes de regroupement</label>
            <div className="flex flex-wrap gap-1.5">
              {columns.map(col => (
                <button key={col} onClick={() => toggleGroupBy(col)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                    groupBy.includes(col) ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  {groupBy.includes(col) ? '✓ ' : ''}{col}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Agrégations</label>
            {aggs.map((agg, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <select value={agg.func} onChange={e => updateAgg(i, 'func', e.target.value)}
                  className="px-2 py-1.5 rounded border border-slate-200 text-xs font-medium">
                  {AGG_FUNCS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <span className="text-xs text-slate-400">(</span>
                <select value={agg.column} onChange={e => updateAgg(i, 'column', e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded border border-slate-200 text-xs">
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="text-xs text-slate-400">)</span>
                <span className="text-xs text-slate-400">→</span>
                <input type="text" value={agg.alias} onChange={e => updateAgg(i, 'alias', e.target.value)}
                  placeholder={`${agg.func}_${agg.column}`}
                  className="w-28 px-2 py-1.5 rounded border border-slate-200 text-xs font-mono" />
                <button onClick={() => removeAgg(i)} className="text-red-400 hover:text-red-500 text-xs">×</button>
              </div>
            ))}
            <button onClick={addAgg}
              className="w-full py-1.5 border-2 border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-indigo-400 hover:text-indigo-500">
              + Ajouter une agrégation
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600">Annuler</button>
          <button onClick={() => onConfirm({ groupBy, aggs })} disabled={aggs.length === 0}
            className={`px-5 py-2 rounded-xl text-sm font-semibold ${aggs.length > 0 ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            Appliquer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
