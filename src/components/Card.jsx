import { useState } from 'react';
import { createPortal } from 'react-dom';
import CardInfo from './CardInfo';

const CARD_COLORS = {
  drop_duplicates: { bg: 'from-violet-500 to-purple-600', border: '#a78bfa', glow: 'rgba(167, 139, 250, 0.3)' },
  sort: { bg: 'from-cyan-400 to-blue-500', border: '#67e8f9', glow: 'rgba(103, 232, 249, 0.3)' },
  delete: { bg: 'from-rose-500 to-red-600', border: '#fda4af', glow: 'rgba(253, 164, 175, 0.3)' },
  delete_na: { bg: 'from-amber-400 to-orange-500', border: '#fcd34d', glow: 'rgba(252, 211, 77, 0.3)' },
  filter: { bg: 'from-emerald-400 to-green-500', border: '#6ee7b7', glow: 'rgba(110, 231, 183, 0.3)' },
  join: { bg: 'from-blue-500 to-indigo-600', border: '#93c5fd', glow: 'rgba(147, 197, 253, 0.3)' },
};

export default function Card({
  cardInfo,
  onClick,
  isInPipeline = false,
  onRemove = null,
  disabled = false,
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  if (!cardInfo) return null;

  const colors = CARD_COLORS[cardInfo.type] || CARD_COLORS.filter;

  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled || isInPipeline) return;

    setIsSelecting(true);
    setTimeout(() => {
      setIsSelecting(false);
      if (onClick) onClick(cardInfo);
    }, 200);
  };

  const handleInfoClick = (e) => {
    e.stopPropagation();
    setShowInfo(true);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) onRemove(cardInfo);
  };

  // Pipeline cards same size as hand cards
  const cardSize = isInPipeline ? 'w-32 h-44' : 'w-32 h-44';

  return (
    <>
      <div
        onClick={handleClick}
        className={`
          relative ${cardSize} cursor-pointer select-none
          ${!disabled && !isInPipeline ? 'card-hover' : ''}
          ${isSelecting ? 'card-select' : ''}
          ${isInPipeline ? 'card-enter-pipeline' : ''}
          ${disabled ? 'opacity-40 cursor-not-allowed saturate-50' : ''}
        `}
      >
        {/* Card body */}
        <div
          className={`
            absolute inset-0 rounded-xl overflow-hidden
            bg-gradient-to-br ${colors.bg}
            transition-all duration-200
          `}
          style={{
            border: `3px solid ${colors.border}`,
            boxShadow: disabled ? 'none' : `
              0 6px 20px rgba(0, 0, 0, 0.15),
              0 0 25px ${colors.glow}
            `,
          }}
        >
          {/* Shine overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, transparent 100%)',
            }}
          />

          {/* Card content */}
          <div className="relative h-full flex flex-col p-2 text-white">
            {/* Top buttons row */}
            <div className="flex justify-between items-start">
              {/* Info button - TOP LEFT */}
              <button
                onClick={handleInfoClick}
                className="w-6 h-6 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center text-[11px] font-bold transition-colors backdrop-blur-sm shadow-sm"
                title="Info"
              >
                ?
              </button>

              {/* Remove button - TOP RIGHT (only in pipeline) */}
              {isInPipeline && onRemove ? (
                <button
                  onClick={handleRemove}
                  className="w-6 h-6 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-red-500 hover:text-red-600 text-lg font-bold shadow-md transition-colors"
                  title="Retirer"
                >
                  ×
                </button>
              ) : (
                <div className="w-6 h-6" />
              )}
            </div>

            {/* Icon */}
            <div className="text-center text-4xl mt-2 drop-shadow-lg">
              {cardInfo.icon}
            </div>

            {/* Name */}
            <div className="text-center font-bold text-sm mt-1 drop-shadow-md leading-tight">
              {cardInfo.name}
            </div>

            {/* Technical name */}
            <div className="text-center text-[11px] opacity-80 font-mono">
              {cardInfo.shortName}
            </div>

            {/* Parameters - only show in pipeline */}
            {cardInfo.paramLabel && isInPipeline && (
              <div className="mt-auto">
                <div className="bg-white/25 backdrop-blur-sm rounded px-1.5 py-1 text-[9px] text-center truncate font-medium">
                  {cardInfo.paramLabel}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInfo && createPortal(
        <CardInfo cardInfo={cardInfo} onClose={() => setShowInfo(false)} />,
        document.body
      )}
    </>
  );
}
