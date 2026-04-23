import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Bottom strip showing the last N real Git commands equivalent to the user's
 * visual actions. Each line is copyable.
 */
export default function CommandLog({ commands }) {
  const [copiedIdx, setCopiedIdx] = useState(null);
  if (!commands || commands.length === 0) {
    return (
      <div className="flex-none h-16 border-t border-slate-200 bg-slate-900 text-slate-400 text-[11px] font-mono px-3 py-2 italic overflow-hidden">
        Aucune commande encore. Tes actions visuelles apparaîtront ici en commandes Git.
      </div>
    );
  }
  const copy = (cmd, i) => {
    try {
      navigator.clipboard?.writeText(cmd);
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx(null), 1200);
    } catch { /* clipboard unavailable */ }
  };
  const last = commands.slice(-6);
  return (
    <div className="flex-none max-h-36 border-t border-slate-200 bg-slate-900 overflow-y-auto">
      {last.map((cmd, i) => {
        const trueIdx = commands.length - last.length + i;
        const isLast = i === last.length - 1;
        return (
          <div key={trueIdx}
            className={`flex items-center gap-2 px-3 py-1 font-mono text-[11px] ${isLast ? 'bg-slate-800 text-emerald-300' : 'text-slate-400'}`}
          >
            <span className="text-slate-500 select-none">$</span>
            <span className="flex-1 truncate">{cmd}</span>
            <button
              onClick={() => copy(cmd, trueIdx)}
              className="text-slate-500 hover:text-slate-200 p-0.5 rounded"
              title="Copier"
            >
              {copiedIdx === trueIdx
                ? <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                : <Copy className="w-3 h-3" aria-hidden="true" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
