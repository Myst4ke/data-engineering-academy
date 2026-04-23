import { createPortal } from 'react-dom';
import { DojoEmojiAuto } from '../components/DojoEmoji';

export default function DataPreview({ data, title, onClose }) {
  if (!data) return null;
  const cols = data.length > 0 ? Object.keys(data[0]) : [];

  return createPortal(
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <DojoEmojiAuto native="🔎" size={20} />
            <h3 className="text-sm font-bold text-slate-700">{title}</h3>
            <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded font-medium">
              {data.length} ligne{data.length !== 1 ? 's' : ''} · {cols.length} colonne{cols.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-lg font-bold">×</button>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {data.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Aucune donnée — connectez une source en amont</p>
          ) : (
            <table className="text-xs border-collapse w-full">
              <thead className="sticky top-0">
                <tr>
                  <th className="px-3 py-2 bg-slate-100 text-slate-500 font-medium text-left border-b border-slate-200 text-[10px]">#</th>
                  {cols.map(c => (
                    <th key={c} className="px-3 py-2 bg-slate-100 text-slate-600 font-semibold text-left border-b-2 border-indigo-200 whitespace-nowrap">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 100).map((row, i) => (
                  <tr key={i} className="hover:bg-indigo-50/30">
                    <td className="px-3 py-1.5 text-slate-400 border-b border-slate-100 text-[10px]">{i + 1}</td>
                    {cols.map(c => (
                      <td key={c} className="px-3 py-1.5 text-slate-700 border-b border-slate-100 whitespace-nowrap">
                        {row[c] === '' || row[c] == null ? <span className="text-slate-300 italic">vide</span> : String(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {data.length > 100 && <p className="text-xs text-slate-400 text-center py-2">Affichage de 100/{data.length} lignes</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}
