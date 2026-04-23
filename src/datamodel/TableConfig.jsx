import { useState } from 'react';
import { TABLE_TYPES } from './datamodelTypes';

export default function TableConfig({ initialTable, onConfirm, onCancel, onDelete }) {
  const [name, setName] = useState(initialTable?.name || '');
  const [type, setType] = useState(initialTable?.type || 'base');

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-96 modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Configurer la table</h3>

        <label className="block text-xs text-slate-500 font-semibold mb-1">Nom</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onConfirm({ name: name.trim(), type }); }}
          placeholder="ex : Clients"
          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm mb-3 focus:border-indigo-400 focus:outline-none"
        />

        <label className="block text-xs text-slate-500 font-semibold mb-1">Type</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.entries(TABLE_TYPES).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setType(k)}
              className={`px-3 py-2 rounded-lg border-2 text-xs text-left transition-colors ${type === k ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="font-bold" style={{ color: v.color }}>{v.name}</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{v.description}</div>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {onDelete && initialTable && (
            <button
              onClick={onDelete}
              className="px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 font-semibold"
            >
              Supprimer
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm({ name: name.trim(), type })}
            disabled={!name.trim()}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${name.trim() ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}
