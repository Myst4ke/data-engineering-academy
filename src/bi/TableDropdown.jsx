import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { DojoEmojiAuto } from '../components/DojoEmoji';

/**
 * Stylized dropdown for table selection (replaces the native <select>).
 *
 * Props :
 *   tables  : [{ id, tableName, rowCount, dbIcon }]
 *   value   : current selected id
 *   onChange: (newId) => void
 */
export default function TableDropdown({ tables, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef(null);
  const listRef = useRef(null);

  const selected = tables.find(t => t.id === value);
  const selectedIndex = tables.findIndex(t => t.id === value);

  // Click outside closes
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    setActiveIdx(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.querySelector(`[data-idx="${activeIdx}"]`);
    item?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIdx]);

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(tables.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(0, i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActiveIdx(0); }
    else if (e.key === 'End') { e.preventDefault(); setActiveIdx(tables.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const t = tables[activeIdx];
      if (t) { onChange(t.id); setOpen(false); }
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg border bg-white text-left transition-colors ${
          open ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="shrink-0 inline-flex">
          <DojoEmojiAuto native={selected?.dbIcon} size={18} />
        </span>
        <span className="flex-1 min-w-0 text-xs font-medium text-slate-700 truncate">
          {selected ? `${selected.tableName} (${selected.rowCount})` : 'Choisir une table'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Sélection de la table source"
          className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1"
        >
          {tables.length === 0 ? (
            <li className="px-3 py-2 text-xs text-slate-400 italic">Aucune table disponible.</li>
          ) : tables.map((t, i) => {
            const isSelected = t.id === value;
            const isActive = i === activeIdx;
            return (
              <li
                key={t.id}
                data-idx={i}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => { onChange(t.id); setOpen(false); }}
                className={`group flex items-center gap-1.5 mx-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="shrink-0 inline-flex">
                  <DojoEmojiAuto native={t.dbIcon} size={16} />
                </span>
                <span className="flex-1 min-w-0 text-xs font-medium truncate">{t.tableName}</span>
                <span className={`text-[10px] tabular-nums ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>
                  {t.rowCount}
                </span>
                {isSelected && (
                  <Check className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-indigo-400'}`} aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
