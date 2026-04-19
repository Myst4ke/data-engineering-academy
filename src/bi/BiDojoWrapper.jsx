import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import BiDojo from './BiDojo';
import { BI_EXERCISES, BI_TIERS, getBiExercisesByTier, getBiProgress, saveBiProgress, isBiTierUnlocked, getBiTierProgress } from './biExercises';

// ── Exercise popup ──
function ExercisePopup({ exercise, onClose }) {
  const [showHint, setShowHint] = useState(false);
  const widgetIcons = { kpi: '🔢', bar: '📊', line: '📈', pie: '🥧', scatter: '⚬', gauge: '🎯', treemap: '🟩', funnel: '🔻', map: '🗺️', table: '📋', text: '📝', slicer: '🔘', separator: '➖' };
  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{exercise.difficulty === 1 ? '🌱' : exercise.difficulty === 2 ? '🔧' : exercise.difficulty === 3 ? '🔥' : '💎'}</span>
            <div>
              <h3 className="text-base font-bold text-slate-800">{exercise.title}</h3>
              <p className="text-[10px] text-slate-400 font-medium">{BI_TIERS[exercise.difficulty - 1]?.name}</p>
            </div>
          </div>
          <div className="text-sm text-slate-600 leading-relaxed mb-4 space-y-2">
            {exercise.description.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {showHint && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Indice</p>
              <p className="text-xs text-amber-600 mb-2">{exercise.hint}</p>
              {exercise.hintWidgets && (
                <div className="flex flex-wrap gap-1">
                  {exercise.hintWidgets.map((w, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white border border-amber-200 rounded-lg px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      {i > 0 && <span className="text-amber-300 -ml-1 mr-0.5">+</span>}
                      {widgetIcons[w] || '?'} {w}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            {!showHint && <button onClick={() => setShowHint(true)} className="flex-1 py-2 rounded-lg border border-amber-300 text-amber-600 text-sm font-medium hover:bg-amber-50">💡 Indice</button>}
            <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600">C'est parti !</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Validation result ──
function ValidationPopup({ result, stars, onClose, onRetry }) {
  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-6" onClick={e => e.stopPropagation()}>
        {result.ok ? (<><div className="text-5xl mb-3">🎉</div><h3 className="text-lg font-bold text-emerald-600 mb-1">Reussi !</h3><p className="text-sm text-slate-600 mb-3">{result.msg}</p><div className="text-3xl mb-4">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div></>)
          : (<><div className="text-5xl mb-3">🔧</div><h3 className="text-lg font-bold text-red-500 mb-1">Pas encore...</h3><p className="text-sm text-slate-600 mb-3">{result.msg}</p></>)}
        <div className="flex gap-2">
          {!result.ok && <button onClick={onRetry} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Reessayer</button>}
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600">{result.ok ? 'Continuer' : 'Fermer'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Stars({ count }) { return <span className="text-sm">{'⭐'.repeat(count)}{'☆'.repeat(3 - count)}</span>; }

// ── Exercise selector ──
function ExerciseSelector({ onSelect, onSandbox, onBack }) {
  const [, forceUpdate] = useState(0);
  const progress = getBiProgress();
  const unlockAll = () => {
    const p = getBiProgress();
    BI_EXERCISES.forEach(ex => { if (!p[ex.id]) p[ex.id] = { stars: 1, date: new Date().toISOString() }; });
    localStorage.setItem('biDojo_exerciseProgress', JSON.stringify(p));
    forceUpdate(v => v + 1);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="flex-none flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="game-btn px-3 py-1.5 text-sm font-semibold">← Accueil</button>
          <h1 className="text-lg font-bold text-emerald-600">📊 BI Dojo</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={unlockAll} className="px-3 py-2 rounded-xl border border-slate-300 text-slate-500 text-xs font-medium hover:bg-slate-50">🔓 Tout debloquer</button>
          <button onClick={onSandbox} className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 text-white text-sm font-bold hover:from-slate-700 hover:to-slate-800 shadow-lg">🏗️ Bac a sable</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {BI_TIERS.map(tier => {
            const exercises = getBiExercisesByTier(tier.id);
            const unlocked = isBiTierUnlocked(tier.id);
            const tp = getBiTierProgress(tier.id);
            return (
              <div key={tier.id}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{tier.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className={`text-base font-bold ${unlocked ? 'text-slate-800' : 'text-slate-400'}`}>{tier.name}</h2>
                      {!unlocked && <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-medium">🔒 Verrouillee</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full bg-gradient-to-r ${tier.color}`} style={{ width: `${(tp.completed / tp.total) * 100}%` }} /></div>
                      <span className="text-[10px] text-slate-400 font-medium">{tp.completed}/{tp.total}</span>
                    </div>
                  </div>
                </div>
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${!unlocked ? 'opacity-50 pointer-events-none' : ''}`}>
                  {exercises.map((ex, i) => {
                    const stars = progress[ex.id]?.stars || 0;
                    return (
                      <button key={ex.id} onClick={() => onSelect(ex)}
                        className={`group relative text-left p-3 rounded-xl border-2 transition-all hover:scale-[1.02] hover:shadow-lg ${stars > 0 ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400 font-medium">#{i + 1}</span>
                          {stars > 0 && <Stars count={stars} />}
                        </div>
                        <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-600 mb-1 leading-tight">{ex.title}</p>
                        <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{ex.description.split('\n')[0].slice(0, 80)}...</p>
                        {ex.tables?.some(t => t.dbIcon === '🔧') && <span className="absolute -top-1.5 -right-1.5 bg-cyan-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">PIPELINE</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════
// ── MAIN BI DOJO WRAPPER ──
// ══════════════════════
export default function BiDojoWrapper({ onBackToHub }) {
  const [mode, setMode] = useState('select');
  const [currentExercise, setCurrentExercise] = useState(null);
  const [showExercisePopup, setShowExercisePopup] = useState(false);
  const [showHintPopup, setShowHintPopup] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [exerciseStars, setExerciseStars] = useState(0);

  const widgetIcons = { kpi: '🔢', bar: '📊', line: '📈', pie: '🥧', scatter: '⚬', gauge: '🎯', treemap: '🟩', funnel: '🔻', map: '🗺️', table: '📋', text: '📝', slicer: '🔘' };

  const handleSelect = useCallback((ex) => {
    setCurrentExercise(ex);
    setMode('exercise');
    setShowExercisePopup(true);
    setValidationResult(null);
  }, []);

  const handleSandbox = useCallback(() => { setCurrentExercise(null); setMode('sandbox'); }, []);
  const handleBack = useCallback(() => { setMode('select'); setCurrentExercise(null); setValidationResult(null); }, []);

  const handleValidate = useCallback((widgets, pages) => {
    if (!currentExercise?.validate) return;
    // Flatten all widgets from all pages for validation
    const allWidgets = pages ? pages.flatMap(p => p.widgets) : widgets;
    const result = currentExercise.validate(allWidgets, pages);
    const stars = result.stars ?? (result.ok ? 3 : 0);
    setExerciseStars(stars);
    setValidationResult(result);
    if (result.ok) saveBiProgress(currentExercise.id, stars);
  }, [currentExercise]);

  if (mode === 'exercise' || mode === 'sandbox') {
    return (
      <div className="relative">
        <BiDojo onBackToHub={handleBack} exercise={currentExercise} onExerciseValidate={currentExercise ? handleValidate : null}
          exerciseBar={currentExercise ? (
            <div className="flex-none bg-emerald-50 border-b border-emerald-200 px-4 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{currentExercise.difficulty === 1 ? '🌱' : currentExercise.difficulty === 2 ? '🔧' : currentExercise.difficulty === 3 ? '🔥' : '💎'}</span>
                <span className="text-xs font-bold text-emerald-700">{currentExercise.title}</span>
                <span className="text-[10px] text-emerald-500 max-w-md truncate">{currentExercise.description.split('\n')[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowHintPopup(true)} className="text-xs text-amber-600 font-medium px-2 py-1 rounded hover:bg-amber-100">💡 Indice</button>
                <button onClick={() => setShowExercisePopup(true)} className="text-xs text-emerald-500 font-medium px-2 py-1 rounded hover:bg-emerald-100">📋 Enonce</button>
              </div>
            </div>
          ) : null} />

        {/* Exercise info bar is now inside BiDojo via exerciseBar prop */}

        {showExercisePopup && currentExercise && <ExercisePopup exercise={currentExercise} onClose={() => setShowExercisePopup(false)} />}

        {showHintPopup && currentExercise && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowHintPopup(false)}>
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-2xl p-5 w-96 max-w-[90vw]" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-amber-700 mb-2">💡 Indice</h3>
              <p className="text-xs text-amber-600 mb-3">{currentExercise.hint}</p>
              {currentExercise.hintWidgets && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {currentExercise.hintWidgets.map((w, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white border border-amber-200 rounded-lg px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      {widgetIcons[w] || '?'} {w}
                    </span>
                  ))}
                </div>
              )}
              <button onClick={() => setShowHintPopup(false)} className="w-full py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">Compris</button>
            </div>
          </div>
        )}

        {validationResult && (
          <ValidationPopup result={validationResult} stars={exerciseStars}
            onClose={() => { setValidationResult(null); if (validationResult.ok) handleBack(); }}
            onRetry={() => setValidationResult(null)} />
        )}
      </div>
    );
  }

  return <ExerciseSelector onSelect={handleSelect} onSandbox={handleSandbox} onBack={onBackToHub} />;
}
