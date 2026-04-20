import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function LookupConfig({ mainColumns, refColumns, initialParams, onConfirm, onCancel }) {
  const commonCols = mainColumns.filter(c => refColumns.includes(c));
  const [column, setColumn] = useState(initialParams?.column || (commonCols[0] || ''));

  return createPortal(
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🔎</span>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Existe (Lookup)</h3>
            <p className="text-xs text-slate-500">Sépare les lignes trouvées / non trouvées dans la table de référence</p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
          <p><strong>Entrée 1</strong> (haut) : Table principale — {mainColumns.length} colonnes</p>
          <p><strong>Entrée 2</strong> (bas) : Table de référence — {refColumns.length} colonnes</p>
          <p className="text-indigo-500 font-medium mt-2">→ Sortie "Match" : lignes trouvées dans la référence</p>
          <p className="text-amber-500 font-medium">→ Sortie "No Match" : lignes absentes de la référence</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Colonne de correspondance</label>
          {commonCols.length > 0 ? (
            <select value={column} onChange={e => setColumn(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-700 focus:border-indigo-400 focus:outline-none">
              {commonCols.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <p className="text-sm text-red-500">Aucune colonne commune entre les deux tables</p>
          )}
          {commonCols.length === 0 && mainColumns.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">Ou sélectionnez manuellement :</p>
              <select value={column} onChange={e => setColumn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-700 focus:border-indigo-400 focus:outline-none">
                <option value="">-- Sélectionner --</option>
                {mainColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 px-4 rounded-lg border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50">Annuler</button>
          <button onClick={() => onConfirm({ column })} disabled={!column}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold ${column ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            Appliquer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
