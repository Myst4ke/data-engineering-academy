import { useEffect, useState } from 'react';

export default function TableView({
  data,
  title,
  isTarget = false,
  isSuccess = false,
  animating = false,
}) {
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    if (animating) {
      setFlashClass('table-flash');
      const timer = setTimeout(() => setFlashClass(''), 400);
      return () => clearTimeout(timer);
    }
  }, [animating]);

  if (!data || data.length === 0) {
    return (
      <div className="game-panel p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-sm font-bold uppercase tracking-wide ${isTarget ? 'text-amber-600' : 'text-slate-700'}`}>
            {title}
          </span>
        </div>
        <p className="text-slate-400 italic text-sm">Aucune donnée</p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div
      className={`
        game-panel p-3 transition-all duration-300
        ${flashClass}
        ${isSuccess ? 'success-glow border-emerald-500' : ''}
        ${isTarget ? 'border-amber-400' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isTarget && <span className="text-lg">🎯</span>}
          {isSuccess && <span className="text-lg">✅</span>}
          <span className={`text-sm font-bold uppercase tracking-wide ${
            isTarget ? 'text-amber-600' :
            isSuccess ? 'text-emerald-600' : 'text-slate-700'
          }`}>
            {title}
          </span>
        </div>
        <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded font-medium">
          {data.length} ligne{data.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Table - NO max-height, show all data */}
      <div className="overflow-x-auto">
        <table className="game-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <td key={col}>
                    {row[col] === '' || row[col] === null || row[col] === undefined ? (
                      <span className="text-gray-500 italic">vide</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
