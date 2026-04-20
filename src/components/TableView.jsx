import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, X, Target, CheckCircle2 } from 'lucide-react';

function TablePopup({ data, title, isTarget, isSuccess, onClose }) {
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} en plein écran`}
    >
      <div
        className={`game-panel modal-content max-w-4xl w-full max-h-[90vh] flex flex-col
          ${isSuccess ? 'ring-2 ring-emerald-500' : ''}
          ${isTarget ? 'ring-2 ring-amber-400' : ''}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            {isTarget && <Target className="w-5 h-5 text-amber-500" aria-hidden="true" />}
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden="true" />}
            <span className={`text-lg font-bold uppercase tracking-wide ${
              isTarget ? 'text-amber-600' :
              isSuccess ? 'text-emerald-600' : 'text-slate-700'
            }`}>
              {title}
            </span>
            <span className="text-sm text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded font-medium ml-2">
              {data.length} ligne{data.length > 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="game-table w-full">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2 whitespace-nowrap">
                      {row[col] === '' || row[col] === null || row[col] === undefined ? (
                        <span className="text-slate-500 italic">vide</span>
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
    </div>
  );
}

export default function TableView({
  data,
  title,
  isTarget = false,
  isSuccess = false,
  animating = false,
}) {
  const [flashClass, setFlashClass] = useState('');
  const [showPopup, setShowPopup] = useState(false);

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
        <p className="text-slate-500 italic text-xs sm:text-sm">Aucune donnée disponible pour le moment.</p>
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
          {isTarget && <Target className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" aria-hidden="true" />}
          {isSuccess && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" aria-hidden="true" />}
          <span className={`text-xs sm:text-sm font-bold uppercase tracking-wide ${
            isTarget ? 'text-amber-600' :
            isSuccess ? 'text-emerald-600' : 'text-slate-700'
          }`}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setShowPopup(true)}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
            title="Agrandir"
            aria-label={`Agrandir la table ${title}`}
          >
            <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <span className="text-[11px] sm:text-xs text-indigo-600 bg-indigo-100 px-1.5 sm:px-2 py-0.5 rounded font-medium">
            {data.length} ligne{data.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table with max-height to allow scrolling */}
      <div className="overflow-x-auto max-h-[120px] sm:max-h-[150px] md:max-h-[180px] overflow-y-auto">
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

      {/* Fullscreen popup */}
      {showPopup && createPortal(
        <TablePopup
          data={data}
          title={title}
          isTarget={isTarget}
          isSuccess={isSuccess}
          onClose={() => setShowPopup(false)}
        />,
        document.body
      )}
    </div>
  );
}
