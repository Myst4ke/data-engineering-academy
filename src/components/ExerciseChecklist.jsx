import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react';

/**
 * Floating checklist panel.
 *
 * Props:
 * - items: array of { id, label, done, group? }
 * - title: string (default "Liste de tâches")
 * - topOffset: px from top of the container (default 16)
 * - leftOffset: px from left (default 16)
 * - width: px (default 260)
 */
export default function ExerciseChecklist({
  items,
  title = 'Liste de tâches',
  topOffset = 16,
  leftOffset = 16,
  width = 260,
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (!items || items.length === 0) return null;

  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const allDone = done === total;

  const groups = {};
  for (const item of items) {
    const g = item.group || '';
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  }
  const groupNames = Object.keys(groups);

  return (
    <div
      className="absolute bg-white/95 border border-slate-200 rounded-xl shadow-lg overflow-hidden"
      style={{ top: topOffset, left: leftOffset, width, zIndex: 15, maxHeight: 'calc(100vh - 160px)' }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors"
        aria-expanded={!collapsed}
      >
        {collapsed
          ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          : <ChevronDown className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />}
        <span className="text-xs font-bold text-slate-700 flex-1 text-left">{title}</span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${allDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
        >
          {done}/{total}
        </span>
      </button>

      {!collapsed && (
        <div className="overflow-y-auto p-2 space-y-2.5" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {groupNames.map((g, gi) => (
            <div key={g || gi}>
              {g && <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-1 px-1">{g}</div>}
              <ul className="space-y-0.5">
                {groups[g].map((item) => (
                  <li
                    key={item.id}
                    className={`flex items-start gap-1.5 text-[11px] px-1 py-1 rounded transition-colors ${item.done ? 'text-slate-400' : 'text-slate-700'}`}
                  >
                    {item.done
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-px" aria-hidden="true" />
                      : <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-px" aria-hidden="true" />}
                    <span className={`flex-1 leading-tight ${item.done ? 'line-through decoration-slate-300' : ''}`}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
