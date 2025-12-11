import { useState } from 'react';

export default function HintPopup({ hint }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!hint) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="game-btn px-3 py-1 text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
      >
        <span>💡</span> Indice
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="game-panel max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">💡</span>
              <h3 className="text-xl font-bold text-amber-600">Indice</h3>
            </div>
            <p className="text-slate-700 mb-6 leading-relaxed">{hint}</p>
            <button
              onClick={() => setIsOpen(false)}
              className="game-btn w-full py-2 text-slate-700 font-semibold"
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
}
