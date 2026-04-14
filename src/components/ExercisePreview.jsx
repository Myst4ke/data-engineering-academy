import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { parseCSV } from '../utils/csvParser';

async function fetchPreview(exerciseId) {
  try {
    const basePath = `./exercises/${exerciseId}`;
    const [configRes, inputRes, outputRes] = await Promise.all([
      fetch(`${basePath}/config.json`),
      fetch(`${basePath}/input.csv`),
      fetch(`${basePath}/output.csv`),
    ]);

    if (!configRes.ok) return null;

    const config = await configRes.json();
    const inputCSV = await inputRes.text();
    const outputCSV = await outputRes.text();
    const input = parseCSV(inputCSV);
    const output = parseCSV(outputCSV);

    return {
      hint: config.hint,
      optimalSteps: config.optimalSteps,
      inputCols: input.length > 0 ? Object.keys(input[0]) : [],
      inputRows: input.length,
      inputSample: input.slice(0, 3),
      outputCols: output.length > 0 ? Object.keys(output[0]) : [],
      outputRows: output.length,
      outputSample: output.slice(0, 3),
    };
  } catch {
    return null;
  }
}

function MiniPreviewTable({ cols, rows, sample, label }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 mb-1">{label} ({rows} lignes)</p>
      <table className="text-[9px] border-collapse w-full">
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c} className="px-1 py-0.5 bg-slate-100 text-slate-600 font-semibold border border-slate-200 whitespace-nowrap truncate max-w-[80px]">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sample.map((row, i) => (
            <tr key={i}>
              {cols.map(c => (
                <td key={c} className="px-1 py-0.5 bg-white text-slate-700 border border-slate-200 whitespace-nowrap truncate max-w-[80px]">
                  {row[c] === '' ? <span className="text-slate-400 italic">vide</span> : row[c]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ExercisePreview({ exerciseId, anchorRect, onClose }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPreview(exerciseId).then(data => {
      if (!cancelled) {
        setPreview(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [exerciseId]);

  if (!anchorRect) return null;

  // Position tooltip above or below the tile
  const viewportH = window.innerHeight;
  const showAbove = anchorRect.top > viewportH / 2;
  const style = showAbove
    ? { bottom: viewportH - anchorRect.top + 8, left: anchorRect.left + anchorRect.width / 2, transform: 'translateX(-50%)' }
    : { top: anchorRect.bottom + 8, left: anchorRect.left + anchorRect.width / 2, transform: 'translateX(-50%)' };

  return createPortal(
    <div
      className="fixed z-50 rounded-xl shadow-2xl p-3 max-w-[360px] min-w-[260px] pointer-events-none bg-white border border-slate-200"
      style={{ ...style, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
    >
      {loading ? (
        <p className="text-xs text-slate-400 text-center py-2">Chargement...</p>
      ) : preview ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-indigo-500 font-semibold">{preview.optimalSteps} carte{preview.optimalSteps > 1 ? 's' : ''} optimal</span>
          </div>
          <MiniPreviewTable cols={preview.inputCols} rows={preview.inputRows} sample={preview.inputSample} label="Entrée" />
          <MiniPreviewTable cols={preview.outputCols} rows={preview.outputRows} sample={preview.outputSample} label="Objectif" />
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center py-2">Erreur de chargement</p>
      )}
    </div>,
    document.body
  );
}
