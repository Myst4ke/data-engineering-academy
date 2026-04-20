import { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';

export default function HintPopup({ hint }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  if (!hint) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="game-btn px-3 py-1 text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
        aria-label="Afficher un indice pour l'exercice"
      >
        <Lightbulb className="w-4 h-4" aria-hidden="true" />
        <span>Indice</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="hint-title"
        >
          <div
            className="game-panel modal-content max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-8 h-8 text-amber-500" aria-hidden="true" />
              <h3 id="hint-title" className="text-xl font-bold text-amber-600">Indice</h3>
            </div>
            <p className="text-slate-700 mb-6 leading-relaxed">{hint}</p>
            <button
              onClick={() => setIsOpen(false)}
              className="game-btn w-full py-2 text-slate-700 font-semibold"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
