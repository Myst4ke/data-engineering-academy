import { useState } from 'react';
import { createPortal } from 'react-dom';

const LEVELS = [
  { id: 'info', label: 'INFO', color: '#3B82F6', icon: 'ℹ️' },
  { id: 'warn', label: 'WARN', color: '#F59E0B', icon: '⚠️' },
  { id: 'error', label: 'ERROR', color: '#EF4444', icon: '❌' },
  { id: 'success', label: 'SUCCESS', color: '#22C55E', icon: '✅' },
];

export default function LogConfig({ columns, initialParams, onConfirm, onCancel }) {
  const [level, setLevel] = useState(initialParams?.level || 'info');
  const [message, setMessage] = useState(initialParams?.message || '');

  return createPortal(
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📋</span>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Journal (Log)</h3>
            <p className="text-xs text-slate-500">Écrit un message dans le journal d'exécution</p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Niveau</label>
            <div className="flex gap-2">
              {LEVELS.map(l => (
                <button key={l.id} onClick={() => setLevel(l.id)}
                  className={`flex-1 py-2 px-2 rounded-lg border-2 text-xs font-semibold transition-all text-center ${
                    level === l.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  {l.icon} {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Pipeline terminé : {nb_lignes} lignes traitées"
              className="w-full h-20 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none resize-none" />
            <p className="text-[10px] text-slate-400 mt-1">
              Variables : {'{nb_lignes}'}, {'{nb_colonnes}'}, {'{premiere_valeur:col}'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 px-4 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">Annuler</button>
          <button onClick={() => onConfirm({ level, message })}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600">
            Appliquer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
