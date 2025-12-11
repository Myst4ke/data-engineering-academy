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
      <div className="game-panel p-2 sm:p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs sm:text-sm font-bold uppercase tracking-wide ${isTarget ? 'text-amber-600' : 'text-slate-700'}`}>
            {title}
          </span>
        </div>
        <p className="text-slate-400 italic text-xs sm:text-sm">Aucune donnée</p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div
      className={`
        game-panel p-2 sm:p-3 transition-all duration-300
        ${flashClass}
        ${isSuccess ? 'success-glow border-emerald-500' : ''}
        ${isTarget ? 'border-amber-400' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <div className="flex items-center gap-1 sm:gap-2">
          {isTarget && <span className="text-sm sm:text-lg">🎯</span>}
          {isSuccess && <span className="text-sm sm:text-lg">✅</span>}
          <span className={`text-xs sm:text-sm font-bold uppercase tracking-wide ${
            isTarget ? 'text-amber-600' :
            isSuccess ? 'text-emerald-600' : 'text-slate-700'
          }`}>
            {title}
          </span>
        </div>
        <span className="text-[10px] sm:text-xs text-indigo-600 bg-indigo-100 px-1.5 sm:px-2 py-0.5 rounded font-medium">
          {data.length} ligne{data.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Table with max-height on mobile to allow scrolling */}
      <div className="overflow-x-auto max-h-[150px] sm:max-h-[200px] md:max-h-none overflow-y-auto">
        <table className="game-table text-xs sm:text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-2 sm:px-4 py-1 sm:py-2 whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <td key={col} className="px-2 sm:px-4 py-1 sm:py-2 whitespace-nowrap">
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
