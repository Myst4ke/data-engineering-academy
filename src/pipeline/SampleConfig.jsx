import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function SampleConfig({ rowCount, initialParams, onConfirm, onCancel }) {
  const [mode, setMode] = useState(initialParams?.mode || 'top_n');
  const [value, setValue] = useState(initialParams?.value || '10');

  return createPortal(
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🎲</span>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Échantillonner</h3>
            <p className="text-xs text-slate-500">{rowCount} lignes en entrée</p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none">
              <option value="top_n">Premières N lignes</option>
              <option value="last_n">Dernières N lignes</option>
              <option value="every_nth">1 ligne sur N</option>
              <option value="percentage">Pourcentage aléatoire</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {mode === 'percentage' ? 'Pourcentage (1-100)' : 'Valeur N'}
            </label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)} min="1"
              max={mode === 'percentage' ? '100' : undefined}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 px-4 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">Annuler</button>
          <button onClick={() => onConfirm({ mode, value: parseInt(value) || 10 })}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600">
            Appliquer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
