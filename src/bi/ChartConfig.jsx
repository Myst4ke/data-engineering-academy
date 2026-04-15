import { useState } from 'react';
import { createPortal } from 'react-dom';

const CHART_TYPES = [
  { id: 'bar', label: 'Barres', icon: '📊' },
  { id: 'line', label: 'Ligne', icon: '📈' },
  { id: 'pie', label: 'Camembert', icon: '🥧' },
  { id: 'kpi', label: 'KPI', icon: '🔢' },
  { id: 'scatter', label: 'Nuage', icon: '⚬' },
  { id: 'table', label: 'Table', icon: '📋' },
];

export default function ChartConfig({ columns, initialConfig, onConfirm, onCancel }) {
  const [chartType, setChartType] = useState(initialConfig?.chartType || 'bar');
  const [title, setTitle] = useState(initialConfig?.title || '');
  const [xCol, setXCol] = useState(initialConfig?.xCol || (columns[0] || ''));
  const [yCol, setYCol] = useState(initialConfig?.yCol || (columns[1] || columns[0] || ''));
  const [aggFunc, setAggFunc] = useState(initialConfig?.aggFunc || 'none');

  const needsXY = ['bar', 'line', 'scatter'].includes(chartType);
  const needsLabelValue = chartType === 'pie';
  const needsValue = chartType === 'kpi';

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Configurer le graphique</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CHART_TYPES.map(ct => (
                <button key={ct.id} onClick={() => setChartType(ct.id)}
                  className={`py-2 px-2 rounded-lg border-2 text-xs font-medium text-center transition-all ${
                    chartType === ct.id ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  <span className="text-lg block">{ct.icon}</span>
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Titre</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Mon graphique"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>

          {(needsXY || needsLabelValue) && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{needsLabelValue ? 'Labels' : 'Axe X'}</label>
              <select value={xCol} onChange={e => setXCol(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {(needsXY || needsLabelValue || needsValue) && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{needsValue ? 'Valeur' : needsLabelValue ? 'Valeurs' : 'Axe Y'}</label>
              <select value={yCol} onChange={e => setYCol(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {(needsXY || needsLabelValue) && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Agrégation</label>
              <select value={aggFunc} onChange={e => setAggFunc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
                <option value="none">Aucune (lignes brutes)</option>
                <option value="sum">SUM</option>
                <option value="count">COUNT</option>
                <option value="avg">AVG</option>
                <option value="min">MIN</option>
                <option value="max">MAX</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-2 px-4 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">Annuler</button>
          <button onClick={() => onConfirm({ chartType, title, xCol, yCol, aggFunc })}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600">
            Appliquer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
