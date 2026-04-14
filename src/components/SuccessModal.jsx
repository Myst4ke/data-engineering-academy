import { useEffect, useState } from 'react';

function StarDisplay({ rating, maxStars = 3 }) {
  return (
    <div className="flex items-center justify-center gap-1 my-3">
      {Array.from({ length: maxStars }, (_, i) => (
        <span
          key={i}
          className={`text-3xl transition-all duration-300 ${
            i < rating ? 'scale-110' : 'opacity-30 grayscale'
          }`}
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          {i < rating ? '\u2B50' : '\u2606'}
        </span>
      ))}
    </div>
  );
}

export default function SuccessModal({ isOpen, onClose, onNextExercise, exerciseTitle, starRating = 3, cardCount = 0, optimalSteps = 0 }) {
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
          <div className="text-6xl mb-3">{'\uD83C\uDFC6'}</div>
          <h2 className="text-3xl font-bold text-emerald-600">
            VICTOIRE !
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-600 mb-2">
            Exercice <span className="text-slate-800 font-bold">{exerciseTitle}</span> complete !
          </p>

          {/* Star rating */}
          <StarDisplay rating={starRating} />

          {/* Card count vs optimal */}
          {optimalSteps > 0 && (
            <p className="text-sm text-slate-500 mb-4">
              {cardCount} carte{cardCount > 1 ? 's' : ''} utilisee{cardCount > 1 ? 's' : ''} — optimal : {optimalSteps}
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={onNextExercise}
              className="game-btn w-full py-3 text-amber-600 hover:text-amber-700 font-semibold border-amber-400"
            >
              Exercice Suivant
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
