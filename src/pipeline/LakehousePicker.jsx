import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function LakehousePicker({ lakehouseName, tables, alreadyExposedIds, onSelect, onClose }) {
  const [selected, setSelected] = useState(new Set());

  const toggle = (id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleConfirm = () => {
    const items = tables.filter(t => selected.has(t.id));
    if (items.length > 0) onSelect(items);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">{lakehouseName}</h3>
          <p className="text-xs text-slate-500">Sélectionnez les tables à exposer en sortie</p>
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto">
          {tables.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Aucune table — connectez des données en entrée</p>
          ) : (
            <div className="space-y-1">
              {tables.map(t => {
                const alreadyExposed = alreadyExposedIds.has(t.id);
                return (
                  <label key={t.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    alreadyExposed ? 'bg-emerald-50 opacity-60' : selected.has(t.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={selected.has(t.id) || alreadyExposed}
                      disabled={alreadyExposed}
                      onChange={() => !alreadyExposed && toggle(t.id)}
                      className="rounded border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-700">{t.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{t.cols} col × {t.rows} lignes</span>
                    </div>
                    {alreadyExposed && <span className="text-[10px] text-emerald-500 font-medium">déjà exposée</span>}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600">Annuler</button>
          <button onClick={handleConfirm} disabled={selected.size === 0}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              selected.size > 0 ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}>
            Exposer {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
