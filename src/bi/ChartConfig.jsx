import { useState } from 'react';
import { createPortal } from 'react-dom';
import { recommendChart } from './charts';

const CHART_TYPES = [
  { id: 'bar', label: 'Barres', icon: '📊' },
  { id: 'line', label: 'Ligne', icon: '📈' },
  { id: 'pie', label: 'Camembert', icon: '🥧' },
  { id: 'kpi', label: 'KPI', icon: '🔢' },
  { id: 'scatter', label: 'Nuage', icon: '⚬' },
  { id: 'gauge', label: 'Jauge', icon: '🎯' },
  { id: 'treemap', label: 'Treemap', icon: '🟩' },
  { id: 'funnel', label: 'Entonnoir', icon: '🔻' },
  { id: 'map', label: 'Carte', icon: '🗺️' },
  { id: 'table', label: 'Table', icon: '📋' },
  { id: 'text', label: 'Texte', icon: '📝' },
  { id: 'separator', label: 'Séparateur', icon: '➖' },
  { id: 'slicer', label: 'Slicer', icon: '🔘' },
];

export default function ChartConfig({ columns: defaultColumns, data: defaultData, initialConfig, onConfirm, onCancel, allTables, defaultTableId }) {
  const [tableId, setTableId] = useState(initialConfig?.tableId || defaultTableId || (allTables?.[0]?.id || ''));
  const [chartType, setChartType] = useState(initialConfig?.chartType || 'bar');
  const [title, setTitle] = useState(initialConfig?.title || '');

  // Resolve columns from selected table
  const selectedTable = allTables?.find(t => t.id === tableId);
  const columns = selectedTable?.columns || defaultColumns;
  const data = selectedTable?.rows || defaultData;

  const [xCol, setXCol] = useState(initialConfig?.xCol || (columns[0] || ''));
  const [yCol, setYCol] = useState(initialConfig?.yCol || (columns[1] || columns[0] || ''));
  const [aggFunc, setAggFunc] = useState(initialConfig?.aggFunc || 'none');
  const [groupCol, setGroupCol] = useState(initialConfig?.groupCol || '');
  const [barMode, setBarMode] = useState(initialConfig?.barMode || 'simple');
  const [gaugeMin, setGaugeMin] = useState(initialConfig?.gaugeMin ?? 0);
  const [gaugeMax, setGaugeMax] = useState(initialConfig?.gaugeMax ?? 100);
  const [text, setText] = useState(initialConfig?.text || '');
  const [sepColor, setSepColor] = useState(initialConfig?.sepColor || '#CBD5E1');
  const [donut, setDonut] = useState(initialConfig?.donut || false);

  const recommended = recommendChart(columns, data);
  const needsXY = ['bar', 'line', 'scatter'].includes(chartType);
  const needsLabelValue = ['pie', 'treemap', 'map', 'funnel'].includes(chartType);
  const needsValue = ['kpi', 'gauge'].includes(chartType);
  const isSlicer = chartType === 'slicer';
  const isText = chartType === 'text';
  const isSep = chartType === 'separator';

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">Configurer le widget</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {allTables && allTables.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Source de donnees</label>
              <select value={tableId} onChange={e => { setTableId(e.target.value); const t = allTables.find(tt => tt.id === e.target.value); if (t?.columns?.[0]) { setXCol(t.columns[0]); setYCol(t.columns[1] || t.columns[0]); } }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
                {allTables.map(t => <option key={t.id} value={t.id}>{t.dbIcon} {t.tableName} ({t.rowCount})</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {CHART_TYPES.map(ct => (
                <button key={ct.id} onClick={() => setChartType(ct.id)}
                  className={`py-1.5 px-1 rounded-lg border-2 text-[10px] font-medium text-center transition-all relative ${
                    chartType === ct.id ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  <span className="text-base block">{ct.icon}</span>{ct.label}
                  {ct.id === recommended && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border border-white" title="Recommandé" />}
                </button>
              ))}
            </div>
          </div>

          {!isSep && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Titre</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Mon graphique"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none" />
            </div>
          )}

          {isText && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Contenu</label>
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Votre texte ici..."
                className="w-full h-20 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none resize-none" />
            </div>
          )}

          {isSep && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Couleur</label>
              <input type="color" value={sepColor} onChange={e => setSepColor(e.target.value)} className="w-12 h-8 rounded border border-slate-200" />
            </div>
          )}

          {isSlicer && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Colonne à filtrer</label>
              <select value={xCol} onChange={e => setXCol(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {(needsXY || needsLabelValue) && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{needsLabelValue ? 'Labels / Catégorie' : 'Axe X'}</label>
              <select value={xCol} onChange={e => setXCol(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {(needsXY || needsLabelValue || needsValue) && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{needsValue ? 'Valeur' : 'Axe Y / Valeurs'}</label>
              <select value={yCol} onChange={e => setYCol(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {(needsXY || needsLabelValue || needsValue) && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Agrégation</label>
              <select value={aggFunc} onChange={e => setAggFunc(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
                <option value="none">Aucune (somme)</option><option value="sum">SUM</option><option value="count">COUNT</option><option value="avg">AVG</option><option value="min">MIN</option><option value="max">MAX</option>
              </select>
            </div>
          )}

          {chartType === 'pie' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={donut} onChange={e => setDonut(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400" />
              <span className="text-xs font-medium text-slate-600">Mode Donut (trou central)</span>
            </label>
          )}

          {chartType === 'bar' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mode barres</label>
                <div className="flex gap-2">
                  {[['simple', 'Simple'], ['stacked', 'Empilé'], ['grouped', 'Groupé']].map(([id, label]) => (
                    <button key={id} onClick={() => setBarMode(id)} className={`flex-1 py-1.5 rounded-lg border text-xs font-medium ${barMode === id ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-600'}`}>{label}</button>
                  ))}
                </div>
              </div>
              {barMode !== 'simple' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Grouper par</label>
                  <select value={groupCol} onChange={e => setGroupCol(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
                    <option value="">-- Sélectionner --</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </>
          )}

          {chartType === 'gauge' && (
            <div className="flex gap-3">
              <div className="flex-1"><label className="block text-xs font-semibold text-slate-600 mb-1">Min</label>
                <input type="number" value={gaugeMin} onChange={e => setGaugeMin(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none" /></div>
              <div className="flex-1"><label className="block text-xs font-semibold text-slate-600 mb-1">Max</label>
                <input type="number" value={gaugeMax} onChange={e => setGaugeMax(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none" /></div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-200">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">Annuler</button>
          <button onClick={() => onConfirm({ chartType, title, xCol, yCol, aggFunc, groupCol, barMode, gaugeMin, gaugeMax, text, sepColor, donut, tableId })}
            className="flex-1 py-2 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600">Appliquer</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
