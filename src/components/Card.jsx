import { useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';
import CardInfo from './CardInfo';
import { DojoEmojiAuto } from './DojoEmoji';

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
  onEdit = null,
  disabled = false,
  size = 'normal',
  small = false,
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  if (!cardInfo) return null;

  const colors = CARD_COLORS[cardInfo.type] || CARD_COLORS.filter;

  const effectiveSize = small ? 'small' : size;

  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled) return;

    // If in pipeline and onEdit is available, open edit popup
    if (isInPipeline && onEdit) {
      onEdit(cardInfo);
      return;
    }

    if (isInPipeline) return;

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

  const sizes = {
    small: {
      card: 'w-20 h-28',
      icon: 'text-2xl mt-1',
      name: 'text-[11px]',
      techName: 'text-[10px]',
      button: 'w-6 h-6',
      iconBtn: 'w-3 h-3',
      border: '2px',
      padding: 'p-1',
      showTechName: false,
    },
    medium: {
      card: 'w-24 h-32',
      icon: 'text-3xl mt-1',
      name: 'text-xs',
      techName: 'text-[10px]',
      button: 'w-6 h-6',
      iconBtn: 'w-3.5 h-3.5',
      border: '2px',
      padding: 'p-1.5',
      showTechName: false,
    },
    normal: {
      card: 'w-32 h-44',
      icon: 'text-4xl mt-2',
      name: 'text-sm',
      techName: 'text-[11px]',
      button: 'w-7 h-7',
      iconBtn: 'w-4 h-4',
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
                className={`${s.button} rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center transition-colors shadow-sm`}
                title={`Aide sur ${cardInfo.name}`}
                aria-label={`Aide sur ${cardInfo.name}`}
              >
                <HelpCircle className={s.iconBtn} aria-hidden="true" />
              </button>

              {/* Remove button - TOP RIGHT (only in pipeline) */}
              {isInPipeline && onRemove ? (
                <button
                  onClick={handleRemove}
                  className={`${s.button} rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-red-500 hover:text-red-600 shadow-md transition-colors`}
                  title={`Retirer ${cardInfo.name}`}
                  aria-label={`Retirer ${cardInfo.name}`}
                >
                  <X className={s.iconBtn} aria-hidden="true" />
                </button>
              ) : (
                <div className={s.button} />
              )}
            </div>

            {/* Icon */}
            <div className={`flex justify-center ${s.icon}`}>
              <DojoEmojiAuto native={cardInfo.icon} size={effectiveSize === 'small' ? 32 : effectiveSize === 'medium' ? 38 : 48} />
            </div>

            {/* Name — min-height réservé pour 2 lignes : position du paramLabel cohérente entre cartes à nom court/long */}
            <div
              className={`text-center font-bold ${s.name} mt-1 drop-shadow-md leading-tight min-h-[2.4em] flex items-center justify-center`}
            >
              <span>{cardInfo.name}</span>
            </div>

            {/* Technical name - hide on small/medium */}
            {s.showTechName && (
              <div className={`text-center ${s.techName} opacity-80 font-mono`}>
                {cardInfo.shortName}
              </div>
            )}

            {/* Parameters - only show in pipeline */}
            {cardInfo.paramLabel && isInPipeline && (
              <div className="mt-auto mx-0.5 mb-0.5">
                <div
                  className="bg-white/30 rounded-md px-1.5 py-1 text-[10px] text-center truncate font-medium"
                  title={cardInfo.paramLabel}
                >
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
