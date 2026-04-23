import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, StickyNote } from 'lucide-react';

const storageKey = (exerciseId) => `exerciseNotes_${exerciseId || 'sandbox'}`;

/**
 * Floating sticky note, persisted per exerciseId in localStorage.
 *
 * Props:
 * - exerciseId: string (used as localStorage key suffix)
 * - topOffset: px (default 16)
 * - leftOffset: px (default 16)
 * - width: px (default 260)
 */
export default function ExerciseNote({
  exerciseId,
  topOffset = 16,
  leftOffset = 16,
  width = 260,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    try {
      setText(localStorage.getItem(storageKey(exerciseId)) || '');
    } catch { /* localStorage unavailable */ }
  }, [exerciseId]);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    try {
      if (value) localStorage.setItem(storageKey(exerciseId), value);
      else localStorage.removeItem(storageKey(exerciseId));
    } catch { /* localStorage unavailable */ }
  };

  return (
    <div
      className="absolute bg-[#FFFBEB] border border-[#FDE68A] rounded-xl shadow-lg overflow-hidden"
      style={{ top: topOffset, left: leftOffset, width, zIndex: 15 }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 px-3 py-2 border-b border-[#FDE68A]/60 bg-[#FEF3C7] hover:bg-[#FEF9C3] transition-colors focus:outline-none focus-visible:outline-none focus-visible:shadow-none"
        aria-expanded={!collapsed}
      >
        {collapsed
          ? <ChevronRight className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
          : <ChevronDown className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />}
        <StickyNote className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
        <span className="text-xs font-bold text-amber-900 flex-1 text-left">Mes notes</span>
        {text && <span className="text-[9px] text-amber-700">{text.length} car.</span>}
      </button>

      {!collapsed && (
        <textarea
          value={text}
          onChange={handleChange}
          placeholder="Écris ici ton plan, tes rappels, un brouillon de schéma..."
          className="w-full px-3 py-2 text-[11.5px] text-amber-900 bg-transparent outline-none resize-none placeholder:text-amber-700/40 leading-snug focus:outline-none focus-visible:outline-none focus-visible:shadow-none"
          style={{ height: 200, fontFamily: "'Inter', sans-serif", boxShadow: 'none' }}
        />
      )}
    </div>
  );
}
