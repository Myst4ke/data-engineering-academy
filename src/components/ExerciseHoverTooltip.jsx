import { createPortal } from 'react-dom';
import { Star, Lightbulb } from 'lucide-react';

export default function ExerciseHoverTooltip({ exercise, anchorRect, accentColor = '#6BA4FF' }) {
  if (!anchorRect || !exercise) return null;

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const tooltipW = 320;

  // Prefer placing to the right of the card; fall back to left, then below/above
  const spaceRight = viewportW - anchorRect.right;
  const spaceLeft = anchorRect.left;
  const placeHorizontal = spaceRight >= tooltipW + 16 ? 'right' : spaceLeft >= tooltipW + 16 ? 'left' : null;

  let style;
  if (placeHorizontal === 'right') {
    style = { top: anchorRect.top, left: anchorRect.right + 12 };
  } else if (placeHorizontal === 'left') {
    style = { top: anchorRect.top, left: anchorRect.left - tooltipW - 12 };
  } else {
    const showAbove = anchorRect.top > viewportH / 2;
    style = showAbove
      ? { bottom: viewportH - anchorRect.top + 8, left: anchorRect.left + anchorRect.width / 2, transform: 'translateX(-50%)' }
      : { top: anchorRect.bottom + 8, left: anchorRect.left + anchorRect.width / 2, transform: 'translateX(-50%)' };
  }

  // Clamp to viewport horizontally for the fallback above/below cases
  if (!placeHorizontal && style.left !== undefined) {
    const rawLeft = anchorRect.left + anchorRect.width / 2 - tooltipW / 2;
    const clamped = Math.max(12, Math.min(rawLeft, viewportW - tooltipW - 12));
    style = { ...style, left: clamped, transform: 'none' };
  }

  return createPortal(
    <div
      className="fixed z-50 rounded-xl p-4 pointer-events-none bg-white border border-[#EDE3D2]"
      style={{ ...style, width: tooltipW, boxShadow: '0 12px 32px rgba(0,0,0,0.14)' }}
      role="tooltip"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex" aria-hidden="true">
          {Array.from({ length: exercise.difficulty || 1 }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          ))}
        </div>
        <h3 className="font-display text-sm text-[#2B2D42] leading-tight flex-1">{exercise.title}</h3>
      </div>
      <div className="text-[11.5px] text-[#5A6072] leading-relaxed font-medium space-y-1.5">
        {exercise.description.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {exercise.hint && (
        <div className="mt-3 pt-2.5 border-t border-[#F4EADB] flex items-start gap-1.5">
          <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 flex-none" aria-hidden="true" />
          <p className="text-[10.5px] text-[#8A6F3B] leading-snug italic flex-1">{exercise.hint}</p>
        </div>
      )}
      {placeHorizontal === 'right' && (
        <div className="absolute top-4 -left-1 w-2 h-2 rotate-45 bg-white border-l border-b border-[#EDE3D2]" />
      )}
      <div
        className="absolute top-1 left-0 right-0 h-0.5 rounded-full"
        style={{ background: accentColor }}
      />
    </div>,
    document.body
  );
}
