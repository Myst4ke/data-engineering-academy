import { useState } from 'react';
import { createPortal } from 'react-dom';

const WINDOW_FUNCS = [
  { id: 'row_number', label: 'ROW_NUMBER', desc: 'Numéro de ligne séquentiel' },
  { id: 'rank', label: 'RANK', desc: 'Rang (ex-aequo possibles, sauts)' },
  { id: 'dense_rank', label: 'DENSE_RANK', desc: 'Rang dense (pas de sauts)' },
  { id: 'sum_cum', label: 'SUM cumulatif', desc: 'Somme cumulative' },
  { id: 'avg_cum', label: 'AVG cumulatif', desc: 'Moyenne cumulative' },
  { id: 'lag', label: 'LAG', desc: 'Valeur de la ligne précédente' },
  { id: 'lead', label: 'LEAD', desc: 'Valeur de la ligne suivante' },
];

export default function WindowConfig({ columns, initialParams, onConfirm, onCancel }) {
  const [func, setFunc] = useState(initialParams?.func || 'row_number');
  const [partitionBy, setPartitionBy] = useState(initialParams?.partitionBy || '');
  const [orderBy, setOrderBy] = useState(initialParams?.orderBy || (columns[0] || ''));
  const [orderDir, setOrderDir] = useState(initialParams?.orderDir || 'asc');
  const [valueCol, setValueCol] = useState(initialParams?.valueCol || (columns[0] || ''));
  const [alias, setAlias] = useState(initialParams?.alias || 'window_result');

  const needsValueCol = ['sum_cum', 'avg_cum', 'lag', 'lead'].includes(func);

  return createPortal(
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📐</span>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Fonction Fenêtre</h3>
            <p className="text-xs text-slate-500">Calcul sur un groupe de lignes sans réduire le résultat</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Fonction</label>
            <select value={func} onChange={e => setFunc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
              {WINDOW_FUNCS.map(f => <option key={f.id} value={f.id}>{f.label} : {f.desc}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Partitionner par (optionnel)</label>
            <select value={partitionBy} onChange={e => setPartitionBy(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
              <option value="">Pas de partition</option>
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Trier par</label>
              <select value={orderBy} onChange={e => setOrderBy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ordre</label>
              <select value={orderDir} onChange={e => setOrderDir(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
                <option value="asc">↑ Croissant</option>
                <option value="desc">↓ Décroissant</option>
              </select>
            </div>
          </div>

          {needsValueCol && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Colonne de valeurs</label>
              <select value={valueCol} onChange={e => setValueCol(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nom de la colonne résultat</label>
            <input type="text" value={alias} onChange={e => setAlias(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:border-indigo-400 focus:outline-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-2 px-4 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">Annuler</button>
          <button onClick={() => onConfirm({ func, partitionBy, orderBy, orderDir, valueCol, alias })}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600">
            Appliquer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
