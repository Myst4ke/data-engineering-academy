import { useState } from 'react';
import { createPortal } from 'react-dom';

const CONDITIONS = [
  { id: 'table_empty', label: 'Table vide', desc: 'Vrai si 0 lignes', needsCol: false },
  { id: 'table_not_empty', label: 'Table non vide', desc: 'Vrai si au moins 1 ligne', needsCol: false },
  { id: 'row_count_gt', label: 'Nb lignes >', desc: 'Nombre de lignes supérieur à N', needsCol: false, needsValue: true },
  { id: 'row_count_lt', label: 'Nb lignes <', desc: 'Nombre de lignes inférieur à N', needsCol: false, needsValue: true },
  { id: 'col_has_nulls', label: 'Colonne a des vides', desc: 'Vrai si la colonne contient des cellules vides', needsCol: true },
  { id: 'col_no_nulls', label: 'Colonne sans vides', desc: 'Vrai si aucune cellule vide', needsCol: true },
  { id: 'col_all_unique', label: 'Valeurs uniques', desc: 'Vrai si toutes les valeurs sont distinctes', needsCol: true },
  { id: 'col_contains_value', label: 'Colonne contient valeur', desc: 'Vrai si au moins une ligne a cette valeur', needsCol: true, needsValue: true },
];

export default function IfConfig({ columns, rowCount, initialParams, onConfirm, onCancel }) {
  const [condition, setCondition] = useState(initialParams?.condition || 'table_not_empty');
  const [column, setColumn] = useState(initialParams?.column || (columns[0] || ''));
  const [value, setValue] = useState(initialParams?.value || '');

  const condDef = CONDITIONS.find(c => c.id === condition);

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">⚡</span>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Si / Sinon</h3>
            <p className="text-xs text-slate-500">Teste une condition sur la table ({rowCount} lignes)</p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
          <p className="text-emerald-600 font-medium">✅ Vrai → les données passent en sortie "Vrai"</p>
          <p className="text-red-500 font-medium">❌ Faux → les données passent en sortie "Faux"</p>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Condition</label>
            <select value={condition} onChange={e => setCondition(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
              {CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label} — {c.desc}</option>)}
            </select>
          </div>

          {condDef?.needsCol && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Colonne</label>
              <select value={column} onChange={e => setColumn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {condDef?.needsValue && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Valeur</label>
              <input type="text" value={value} onChange={e => setValue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="Valeur à tester" />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 px-4 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">Annuler</button>
          <button onClick={() => onConfirm({ condition, column, value })}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600">
            Appliquer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
