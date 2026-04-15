import { useState } from 'react';
import { createPortal } from 'react-dom';

const FUNCTIONS = [
  { id: 'concat', label: 'CONCAT(col1, col2)', desc: 'Concatène deux colonnes', args: ['col1', 'col2', 'sep'] },
  { id: 'upper', label: 'UPPER(col)', desc: 'Met en majuscules', args: ['col'] },
  { id: 'lower', label: 'LOWER(col)', desc: 'Met en minuscules', args: ['col'] },
  { id: 'len', label: 'LEN(col)', desc: 'Longueur du texte', args: ['col'] },
  { id: 'year', label: 'YEAR(col)', desc: 'Extrait l\'année', args: ['col'] },
  { id: 'ifthen', label: 'IF(col = val, A, B)', desc: 'Condition par ligne', args: ['col', 'operator', 'value', 'then', 'else'] },
  { id: 'coalesce', label: 'COALESCE(col, defaut)', desc: 'Remplace vide par défaut', args: ['col', 'default'] },
  { id: 'prefix', label: 'PREFIX(texte, col)', desc: 'Ajoute un préfixe', args: ['prefix', 'col'] },
];

const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'contient'];

export default function ForEachRowConfig({ columns, sampleData, initialParams, onConfirm, onCancel }) {
  const [computedCols, setComputedCols] = useState(initialParams?.computedCols || []);

  const addCol = () => {
    setComputedCols(prev => [...prev, { name: 'nouvelle_col', func: 'concat', args: {} }]);
  };

  const updateCol = (index, field, value) => {
    setComputedCols(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const updateArg = (index, argName, value) => {
    setComputedCols(prev => prev.map((c, i) => i === index ? { ...c, args: { ...c.args, [argName]: value } } : c));
  };

  const removeCol = (index) => {
    setComputedCols(prev => prev.filter((_, i) => i !== index));
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <div>
              <h3 className="text-lg font-bold text-slate-800">ForEachRow — Colonnes calculées</h3>
              <p className="text-xs text-slate-500">Pour chaque ligne, créez de nouvelles colonnes à partir de formules</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {computedCols.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Ajoutez des colonnes calculées</p>
          )}

          {computedCols.map((col, i) => {
            const funcDef = FUNCTIONS.find(f => f.id === col.func);
            return (
              <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <input type="text" value={col.name} onChange={e => updateCol(i, 'name', e.target.value)}
                    className="flex-1 px-2 py-1 rounded border border-slate-200 text-sm font-mono focus:border-indigo-400 focus:outline-none"
                    placeholder="nom_colonne" />
                  <span className="text-xs text-slate-400">=</span>
                  <select value={col.func} onChange={e => updateCol(i, 'func', e.target.value)}
                    className="px-2 py-1 rounded border border-slate-200 text-xs focus:border-indigo-400 focus:outline-none">
                    {FUNCTIONS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                  <button onClick={() => removeCol(i)} className="w-6 h-6 rounded bg-red-50 text-red-400 hover:text-red-500 text-xs flex items-center justify-center">×</button>
                </div>

                <p className="text-[10px] text-slate-400 mb-2">{funcDef?.desc}</p>

                <div className="flex flex-wrap gap-2">
                  {col.func === 'concat' && (
                    <>
                      <select value={col.args.col1 || ''} onChange={e => updateArg(i, 'col1', e.target.value)}
                        className="px-2 py-1 rounded border border-slate-200 text-xs">
                        <option value="">col1</option>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input type="text" value={col.args.sep || ' '} onChange={e => updateArg(i, 'sep', e.target.value)}
                        className="w-12 px-2 py-1 rounded border border-slate-200 text-xs text-center" placeholder="sep" />
                      <select value={col.args.col2 || ''} onChange={e => updateArg(i, 'col2', e.target.value)}
                        className="px-2 py-1 rounded border border-slate-200 text-xs">
                        <option value="">col2</option>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </>
                  )}
                  {(col.func === 'upper' || col.func === 'lower' || col.func === 'len' || col.func === 'year') && (
                    <select value={col.args.col || ''} onChange={e => updateArg(i, 'col', e.target.value)}
                      className="px-2 py-1 rounded border border-slate-200 text-xs">
                      <option value="">colonne</option>
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                  {col.func === 'ifthen' && (
                    <>
                      <select value={col.args.col || ''} onChange={e => updateArg(i, 'col', e.target.value)}
                        className="px-2 py-1 rounded border border-slate-200 text-xs">
                        <option value="">colonne</option>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select value={col.args.operator || '='} onChange={e => updateArg(i, 'operator', e.target.value)}
                        className="px-1 py-1 rounded border border-slate-200 text-xs">
                        {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <input type="text" value={col.args.value || ''} onChange={e => updateArg(i, 'value', e.target.value)}
                        className="w-16 px-2 py-1 rounded border border-slate-200 text-xs" placeholder="valeur" />
                      <input type="text" value={col.args.then || ''} onChange={e => updateArg(i, 'then', e.target.value)}
                        className="w-16 px-2 py-1 rounded border border-slate-200 text-xs" placeholder="alors" />
                      <input type="text" value={col.args.else || ''} onChange={e => updateArg(i, 'else', e.target.value)}
                        className="w-16 px-2 py-1 rounded border border-slate-200 text-xs" placeholder="sinon" />
                    </>
                  )}
                  {col.func === 'coalesce' && (
                    <>
                      <select value={col.args.col || ''} onChange={e => updateArg(i, 'col', e.target.value)}
                        className="px-2 py-1 rounded border border-slate-200 text-xs">
                        <option value="">colonne</option>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input type="text" value={col.args.default || ''} onChange={e => updateArg(i, 'default', e.target.value)}
                        className="w-20 px-2 py-1 rounded border border-slate-200 text-xs" placeholder="défaut" />
                    </>
                  )}
                  {col.func === 'prefix' && (
                    <>
                      <input type="text" value={col.args.prefix || ''} onChange={e => updateArg(i, 'prefix', e.target.value)}
                        className="w-20 px-2 py-1 rounded border border-slate-200 text-xs" placeholder="préfixe" />
                      <select value={col.args.col || ''} onChange={e => updateArg(i, 'col', e.target.value)}
                        className="px-2 py-1 rounded border border-slate-200 text-xs">
                        <option value="">colonne</option>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          <button onClick={addCol}
            className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
            + Ajouter une colonne calculée
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600">Annuler</button>
          <button onClick={() => onConfirm({ computedCols })}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white">
            Appliquer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
