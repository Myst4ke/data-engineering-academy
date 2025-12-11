import { useEffect, useState } from 'react';

export default function SuccessModal({ isOpen, onClose, onNextExercise, exerciseTitle }) {
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const newConfetti = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        color: ['#ffd700', '#00e676', '#40c4ff', '#e040fb', '#ff5252', '#ffab40'][
          Math.floor(Math.random() * 6)
        ],
        size: 8 + Math.random() * 8,
      }));
      setConfetti(newConfetti);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 overflow-hidden">
      {/* Confetti */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti 3s ease-out forwards`,
            animationDelay: `${piece.delay}s`,
            boxShadow: `0 0 6px ${piece.color}`,
          }}
        />
      ))}

      {/* Modal */}
      <div className="game-panel max-w-sm w-full mx-4 text-center overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-b from-emerald-100 to-transparent">
          <div className="text-6xl mb-3">🏆</div>
          <h2 className="text-3xl font-bold text-emerald-600">
            VICTOIRE !
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-600 mb-6">
            Exercice <span className="text-slate-800 font-bold">{exerciseTitle}</span> complété !
          </p>

          <div className="space-y-3">
            <button
              onClick={onNextExercise}
              className="game-btn w-full py-3 text-amber-600 hover:text-amber-700 font-semibold border-amber-400"
            >
              Exercice Suivant →
            </button>
            <button
              onClick={onClose}
              className="game-btn w-full py-2 text-slate-600 hover:text-slate-700"
            >
              Revoir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
