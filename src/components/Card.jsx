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
  rename: { bg: 'from-pink-400 to-rose-500', border: '#f9a8d4', glow: 'rgba(249, 168, 212, 0.3)' },
  select: { bg: 'from-teal-400 to-cyan-500', border: '#5eead4', glow: 'rgba(94, 234, 212, 0.3)' },
  fill_na: { bg: 'from-slate-400 to-slate-600', border: '#94a3b8', glow: 'rgba(148, 163, 184, 0.3)' },
  concat: { bg: 'from-lime-400 to-green-500', border: '#bef264', glow: 'rgba(190, 242, 100, 0.3)' },
};

export default function Card({
  cardInfo,
  onClick,
  isInPipeline = false,
  onRemove = null,
  disabled = false,
  size = 'normal', // 'small', 'medium', 'normal'
  small = false, // deprecated, use size='small'
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  if (!cardInfo) return null;

  const colors = CARD_COLORS[cardInfo.type] || CARD_COLORS.filter;

  // Handle deprecated small prop
  const effectiveSize = small ? 'small' : size;

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

  // Card sizes based on size prop
  const sizes = {
    small: {
      card: 'w-20 h-28',
      icon: 'text-2xl mt-1',
      name: 'text-[10px]',
      techName: 'text-[8px]',
      button: 'w-4 h-4 text-[8px]',
      border: '2px',
      padding: 'p-1',
      showTechName: false,
    },
    medium: {
      card: 'w-24 h-32',
      icon: 'text-3xl mt-1',
      name: 'text-xs',
      techName: 'text-[9px]',
      button: 'w-5 h-5 text-[9px]',
      border: '2px',
      padding: 'p-1.5',
      showTechName: false,
    },
    normal: {
      card: 'w-32 h-44',
      icon: 'text-4xl mt-2',
      name: 'text-sm',
      techName: 'text-[11px]',
      button: 'w-6 h-6 text-[11px]',
      border: '3px',
      padding: 'p-2',
      showTechName: true,
    },
  };

  const s = sizes[effectiveSize] || sizes.normal;

  return (
    <>
      <div
        onClick={handleClick}
        className={`
          relative ${s.card} cursor-pointer select-none
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
            border: `${s.border} solid ${colors.border}`,
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
          <div className={`relative h-full flex flex-col ${s.padding} text-white`}>
            {/* Top buttons row */}
            <div className="flex justify-between items-start">
              {/* Info button - TOP LEFT */}
              <button
                onClick={handleInfoClick}
                className={`${s.button} rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center font-bold transition-colors backdrop-blur-sm shadow-sm`}
                title="Info"
              >
                ?
              </button>

              {/* Remove button - TOP RIGHT (only in pipeline) */}
              {isInPipeline && onRemove ? (
                <button
                  onClick={handleRemove}
                  className={`${s.button} rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-red-500 hover:text-red-600 font-bold shadow-md transition-colors`}
                  title="Retirer"
                >
                  ×
                </button>
              ) : (
                <div className={s.button} />
              )}
            </div>

            {/* Icon */}
            <div className={`text-center ${s.icon} drop-shadow-lg`}>
              {cardInfo.icon}
            </div>

            {/* Name */}
            <div className={`text-center font-bold ${s.name} mt-1 drop-shadow-md leading-tight`}>
              {cardInfo.name}
            </div>

            {/* Technical name - hide on small/medium */}
            {s.showTechName && (
              <div className={`text-center ${s.techName} opacity-80 font-mono`}>
                {cardInfo.shortName}
              </div>
            )}

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
