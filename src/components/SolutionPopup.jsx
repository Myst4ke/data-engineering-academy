import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb, X, Play } from 'lucide-react';
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
      className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="solution-title"
    >
      <div
        className="game-panel modal-content max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" aria-hidden="true" />
            <span id="solution-title" className="text-lg font-bold text-slate-700">
              Solution précédente
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
                  <span className="mx-2 text-2xl text-amber-500 font-bold" aria-hidden="true">→</span>
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
            className="px-4 py-2 rounded-lg bg-[#FF8066] hover:bg-[#E85D41] text-white font-medium transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4" aria-hidden="true" /> Appliquer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
