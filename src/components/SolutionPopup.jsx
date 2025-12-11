import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getCardDisplayInfo } from '../utils/cardDefinitions';

export default function SolutionPopup({ solution, onClose, onApply }) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!solution || solution.length === 0) return null;

  // Convert stored solution to display info
  const solutionCards = solution.map((card, index) =>
    getCardDisplayInfo({
      id: `solution-${card.type}-${index}`,
      type: card.type,
      params: card.params,
    })
  );

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <span className="text-lg font-bold text-slate-700">
              Solution Précédente
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors text-lg font-bold"
          >
            ×
          </button>
        </div>

        {/* Solution cards */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {solutionCards.map((card, index) => (
              <div key={card.id} className="flex items-center">
                {/* Card preview */}
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-3 border-2 border-slate-300 shadow-sm min-w-[100px]">
                  <div className="text-2xl text-center mb-1">{card.icon}</div>
                  <div className="text-xs font-bold text-center text-slate-700">{card.name}</div>
                  {card.paramLabel && (
                    <div className="mt-1 text-[10px] text-center text-slate-500 bg-white/50 rounded px-1 py-0.5 truncate">
                      {card.paramLabel}
                    </div>
                  )}
                </div>
                {/* Arrow */}
                {index < solutionCards.length - 1 && (
                  <span className="mx-2 text-2xl text-amber-500 font-bold">→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={() => {
              onApply(solutionCards);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors flex items-center gap-2"
          >
            <span>▶</span> Appliquer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
