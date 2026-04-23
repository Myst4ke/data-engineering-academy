import { useState } from 'react';
import { COLUMN_TYPES } from './datamodelTypes';

export default function ColumnEditor({ initialColumn, onConfirm, onCancel, onDelete }) {
  const [name, setName] = useState(initialColumn?.name || '');
  const [type, setType] = useState(initialColumn?.type || 'TEXT');
  const [pk, setPk] = useState(!!initialColumn?.pk);
  const [notNull, setNotNull] = useState(!!initialColumn?.notNull);
  const [unique, setUnique] = useState(!!initialColumn?.unique);

  const isEdit = !!initialColumn;

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-96 modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-800 mb-3">
          {isEdit ? 'Modifier la colonne' : 'Nouvelle colonne'}
        </h3>

        <label className="block text-xs text-slate-500 font-semibold mb-1">Nom</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onConfirm({ name: name.trim(), type, pk, notNull, unique }); }}
          placeholder="ex : client_id"
          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm mb-3 focus:border-indigo-400 focus:outline-none"
        />

        <label className="block text-xs text-slate-500 font-semibold mb-1">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm mb-3 bg-white focus:border-indigo-400 focus:outline-none"
        >
          {Object.entries(COLUMN_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v.label} ({k})</option>
          ))}
        </select>

        <div className="space-y-1.5 mb-4 bg-slate-50 rounded-lg p-2.5">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" checked={pk} onChange={(e) => setPk(e.target.checked)} />
            <span>🔑 Clé primaire (PK)</span>
            <span className="text-[10px] text-slate-400 ml-auto">identifiant unique</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" checked={notNull} onChange={(e) => setNotNull(e.target.checked)} />
            <span>Valeur obligatoire</span>
            <span className="text-[10px] text-slate-400 ml-auto">NOT NULL</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} />
            <span>Unique</span>
            <span className="text-[10px] text-slate-400 ml-auto">pas de doublons</span>
          </label>
        </div>

        <div className="flex gap-2">
          {onDelete && isEdit && (
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
            onClick={() => onConfirm({ name: name.trim(), type, pk, notNull, unique })}
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
