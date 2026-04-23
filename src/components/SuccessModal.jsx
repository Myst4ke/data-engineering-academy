import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';

// Palette dojo : cohérente avec l'identité edtech
const CONFETTI_COLORS = ['#FF8066', '#5ED6B4', '#6BA4FF', '#FFC857', '#F472B6'];

function StarDisplay({ rating, maxStars = 3 }) {
  return (
    <div className="flex items-center justify-center gap-1 my-3" aria-label={`${rating} étoile${rating > 1 ? 's' : ''} sur ${maxStars}`}>
      {Array.from({ length: maxStars }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`text-3xl transition-all duration-300 ${
            i < rating ? 'scale-110' : 'opacity-30 grayscale'
          }`}
        >
          {i < rating ? '⭐' : '☆'}
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
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 8 + Math.random() * 8,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      }));
      setConfetti(newConfetti);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 modal-overlay flex items-center justify-center z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
    >
      {/* Confetti */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0"
          aria-hidden="true"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.borderRadius,
            animation: 'confetti 3s ease-out forwards',
            animationDelay: `${piece.delay}s`,
            boxShadow: `0 0 6px ${piece.color}`,
          }}
        />
      ))}

      {/* Modal */}
      <div className="game-panel modal-content max-w-sm w-full mx-4 text-center overflow-hidden">
        <div className="p-6 bg-gradient-to-b from-[#D4F4E9] to-transparent">
          <Trophy className="w-16 h-16 mx-auto mb-3 text-[#0F9B7A]" aria-hidden="true" />
          <h2 id="success-title" className="font-display text-4xl text-[#0F9B7A] tracking-tight">
            Bravo !
          </h2>
        </div>

        <div className="p-6">
          <p className="text-[#5A6072] mb-2 font-medium">
            Exercice <span className="font-display text-[#2B2D42]">{exerciseTitle}</span> terminé !
          </p>

          <StarDisplay rating={starRating} />

          {optimalSteps > 0 && (
            <p className="text-sm text-[#9CA3AF] mb-4 font-medium">
              {cardCount} carte{cardCount > 1 ? 's' : ''} utilisée{cardCount > 1 ? 's' : ''} : optimal : {optimalSteps}
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={onNextExercise}
              className="w-full py-3 rounded-xl bg-[#FF8066] hover:bg-[#E85D41] text-white font-bold transition-colors shadow-[0_4px_0_rgba(0,0,0,0.08)]"
            >
              Exercice suivant
            </button>
            <button
              onClick={onClose}
              className="game-btn w-full py-2 text-[#5A6072]"
              title="Fermer et retenter pour améliorer le score"
            >
              Retenter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
