import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb, FileText, Star, Lock, Unlock, Wrench, PartyPopper } from 'lucide-react';
import BiDojo from './BiDojo';
import { BI_EXERCISES, BI_TIERS, getBiExercisesByTier, getBiProgress, saveBiProgress, isBiTierUnlocked, getBiTierProgress } from './biExercises';
import DojoIntro, { useDojoIntro, BI_DOJO_INTRO } from '../components/DojoIntro';
import BackButton from '../components/BackButton';
import ExerciseHoverTooltip from '../components/ExerciseHoverTooltip';

// ── Exercise popup ──
function ExercisePopup({ exercise, onClose }) {
  const [showHint, setShowHint] = useState(false);
  const widgetIcons = { kpi: '🔢', bar: '📊', line: '📈', pie: '🥧', scatter: '◯', gauge: '🎯', treemap: '🟩', funnel: '🔻', map: '🗺️', table: '📋', text: '📝', slicer: '🔘', separator: '➖' };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="game-panel modal-content w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex" aria-label={`Niveau ${exercise.difficulty}`}>
              {Array.from({ length: exercise.difficulty }).map((_, i) => (
                <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" aria-hidden="true" />
              ))}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{exercise.title}</h3>
              <p className="text-xs text-slate-500 font-medium">{BI_TIERS[exercise.difficulty - 1]?.name}</p>
            </div>
          </div>
          <div className="text-sm text-slate-600 leading-relaxed mb-4 space-y-2">
            {exercise.description.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {showHint && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" /> Indice
              </p>
              <p className="text-xs text-amber-700 mb-2">{exercise.hint}</p>
              {exercise.hintWidgets && (
                <div className="flex flex-wrap gap-1">
                  {exercise.hintWidgets.map((w, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white border border-amber-200 rounded-lg px-2 py-0.5 text-xs font-medium text-amber-700">
                      {i > 0 && <span className="text-amber-300 -ml-1 mr-0.5" aria-hidden="true">+</span>}
                      {widgetIcons[w] || '?'} {w}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            {!showHint && (
              <button onClick={() => setShowHint(true)} className="flex-1 py-2 rounded-lg border border-amber-300 text-amber-600 text-sm font-medium hover:bg-amber-50 flex items-center justify-center gap-1.5">
                <Lightbulb className="w-4 h-4" aria-hidden="true" /> Indice
              </button>
            )}
            <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600">Commencer</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Validation result ──
function ValidationPopup({ result, stars, onClose, onRetry }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="game-panel modal-content w-full max-w-sm text-center p-6" onClick={e => e.stopPropagation()}>
        {result.ok ? (
          <>
            <PartyPopper className="w-14 h-14 mx-auto mb-3 text-emerald-500" aria-hidden="true" />
            <h3 className="text-lg font-bold text-emerald-600 mb-1">Réussi !</h3>
            <p className="text-sm text-slate-600 mb-3">{result.msg}</p>
            <div className="flex justify-center gap-1 mb-4" aria-label={`${stars} étoiles sur 3`}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Star key={i} className={`w-8 h-8 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} aria-hidden="true" />
              ))}
            </div>
          </>
        ) : (
          <>
            <Wrench className="w-14 h-14 mx-auto mb-3 text-red-400" aria-hidden="true" />
            <h3 className="text-lg font-bold text-red-500 mb-1">Pas encore…</h3>
            <p className="text-sm text-slate-600 mb-3">{result.msg}</p>
          </>
        )}
        <div className="flex gap-2">
          {!result.ok && <button onClick={onRetry} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Réessayer</button>}
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600">{result.ok ? 'Continuer' : 'Fermer'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Stars({ count }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${count} étoiles sur 3`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < count ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} aria-hidden="true" />
      ))}
    </span>
  );
}

// ── Exercise selector ──
function ExerciseSelector({ onSelect, onSandbox, onBack, introButton }) {
  const [, forceUpdate] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [hoverRect, setHoverRect] = useState(null);
  const hoverTimerRef = useRef(null);
  const progress = getBiProgress();

  const handleHover = (ex, e) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    hoverTimerRef.current = setTimeout(() => {
      setHovered(ex);
      setHoverRect(rect);
    }, 300);
  };

  const handleLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHovered(null);
    setHoverRect(null);
  };

  const unlockAll = () => {
    if (!window.confirm('Débloquer tous les exercices ?')) return;
    const p = getBiProgress();
    BI_EXERCISES.forEach(ex => { if (!p[ex.id]) p[ex.id] = { stars: 1, date: new Date().toISOString() }; });
    localStorage.setItem('biDojo_exerciseProgress', JSON.stringify(p));
    forceUpdate(v => v + 1);
  };

  const TIER_CLS = ['tier-t1', 'tier-t2', 'tier-t3', 'tier-t4'];
  const NAME_COLOR = ['text-[#4B5563]', 'text-[#2563EB]', 'text-[#9333EA]', 'text-[#B45309]'];
  const STAR_COLOR = ['text-[#9CA3AF]', 'text-[#60A5FA]', 'text-[#C084FC]', 'text-[#F59E0B]'];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-none flex items-center justify-between px-4 sm:px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-[#EDE3D2] shadow-sm flex-wrap gap-2 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} label="Accueil" />
          <h1 className="font-display text-xl sm:text-2xl text-[#2B2D42] tracking-tight flex items-center gap-2">
            BI <span className="font-display-italic text-[#5ED6B4]">Dojo</span>
          </h1>
          {introButton}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={unlockAll}
            className="game-btn px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
            title="Débloquer tous les exercices"
          >
            <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
            Tout débloquer
          </button>
          <button
            onClick={onSandbox}
            className="px-4 py-2 rounded-xl bg-[#5ED6B4] text-white text-sm font-bold hover:bg-[#0F9B7A] shadow-[0_4px_0_rgba(0,0,0,0.08)] transition-colors"
          >
            Bac à sable
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-10">
          {BI_TIERS.map((tier, tierIdx) => {
            const exercises = getBiExercisesByTier(tier.id);
            const unlocked = isBiTierUnlocked(tier.id);
            const tp = getBiTierProgress(tier.id);
            const tierCls = TIER_CLS[tierIdx] || 'tier-t1';
            const nameCls = NAME_COLOR[tierIdx] || 'text-[#4B5563]';
            const starCls = STAR_COLOR[tierIdx] || 'text-[#9CA3AF]';

            return (
              <div key={tier.id} className={tierCls}>
                <div className={`flex flex-wrap items-center gap-3 mb-4 ${!unlocked ? 'opacity-55' : ''}`}>
                  <h2 className={`font-display text-lg sm:text-xl ${nameCls}`}>
                    {tier.name}
                  </h2>
                  <div className="flex" aria-label={`Niveau ${tier.name}`}>
                    {Array.from({ length: tierIdx + 1 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${starCls} fill-current`} aria-hidden="true" />
                    ))}
                  </div>
                  {!unlocked && (
                    <span className="inline-flex items-center gap-1 text-xs bg-[#E4D9C5]/60 text-[#5A6072] px-2.5 py-0.5 rounded-full font-bold">
                      <Lock className="w-3 h-3" aria-hidden="true" /> Verrouillé
                    </span>
                  )}
                  <div className="flex-1 min-w-[120px] flex items-center gap-2 ml-2">
                    <div className="flex-1 h-1.5 bg-[#F4EADB] rounded-full overflow-hidden">
                      <div className="h-full bg-[#5ED6B4] rounded-full transition-all duration-500" style={{ width: `${(tp.completed / tp.total) * 100}%` }} />
                    </div>
                    <span className="text-xs text-[#9CA3AF] font-bold">{tp.completed}/{tp.total}</span>
                  </div>
                </div>
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${!unlocked ? 'pointer-events-none' : ''}`}>
                  {exercises.map((ex, i) => {
                    const stars = progress[ex.id]?.stars || 0;
                    return (
                      <button
                        key={ex.id}
                        onClick={() => onSelect(ex)}
                        onMouseEnter={(e) => unlocked && handleHover(ex, e)}
                        onMouseLeave={handleLeave}
                        onFocus={(e) => unlocked && handleHover(ex, e)}
                        onBlur={handleLeave}
                        aria-label={`${ex.title}. ${ex.description.split('\n')[0].slice(0, 120)}`}
                        className={`ex-card ${stars > 0 ? 'done' : ''} ${!unlocked ? 'locked' : ''} group relative text-left p-3`}
                        style={{ aspectRatio: 'auto' }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-[#9CA3AF] font-bold">#{i + 1}</span>
                          {stars > 0 && <Stars count={stars} />}
                        </div>
                        <p className="font-display text-sm text-[#2B2D42] mb-1 leading-tight">{ex.title}</p>
                        <p className="text-[11px] text-[#5A6072] leading-snug line-clamp-2 font-medium font-sans">{ex.description.split('\n')[0].slice(0, 80)}…</p>
                        {ex.tables?.some(t => t.dbIcon === '🔧') && (
                          <span className="absolute -top-2 -right-2 bg-[#6BA4FF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_2px_0_rgba(0,0,0,0.08)]">PIPELINE</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {hovered && <ExerciseHoverTooltip exercise={hovered} anchorRect={hoverRect} />}
    </div>
  );
}

// ══════════════════════
// ── MAIN BI DOJO WRAPPER ──
// ══════════════════════
export default function BiDojoWrapper({ onBackToHub }) {
  const [showDojoIntro, setShowDojoIntro, DojoIntroButton] = useDojoIntro('bi-dojo');
  const [mode, setMode] = useState('select');
  const [currentExercise, setCurrentExercise] = useState(null);
  const [showExercisePopup, setShowExercisePopup] = useState(false);
  const [showHintPopup, setShowHintPopup] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [exerciseStars, setExerciseStars] = useState(0);

  const widgetIcons = { kpi: '🔢', bar: '📊', line: '📈', pie: '🥧', scatter: '◯', gauge: '🎯', treemap: '🟩', funnel: '🔻', map: '🗺️', table: '📋', text: '📝', slicer: '🔘' };

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
        <BiDojo
          onBackToHub={handleBack}
          exercise={currentExercise}
          onExerciseValidate={currentExercise ? handleValidate : null}
          exerciseBar={currentExercise ? (
            <div className="flex-none bg-emerald-50 border-b border-emerald-200 px-4 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: currentExercise.difficulty }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <span className="text-xs font-bold text-emerald-700">{currentExercise.title}</span>
                <span className="text-xs text-emerald-600 max-w-md truncate">{currentExercise.description.split('\n')[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHintPopup(true)}
                  className="text-xs text-amber-700 font-medium px-2 py-1 rounded hover:bg-amber-100 flex items-center gap-1"
                  aria-label="Afficher l'indice"
                >
                  <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" /> Indice
                </button>
                <button
                  onClick={() => setShowExercisePopup(true)}
                  className="text-xs text-emerald-600 font-medium px-2 py-1 rounded hover:bg-emerald-100 flex items-center gap-1"
                  aria-label="Afficher l'énoncé complet"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Énoncé
                </button>
              </div>
            </div>
          ) : null}
        />

        {showExercisePopup && currentExercise && <ExercisePopup exercise={currentExercise} onClose={() => setShowExercisePopup(false)} />}

        {showHintPopup && currentExercise && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setShowHintPopup(false)} role="dialog" aria-modal="true">
            <div className="modal-content bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-2xl p-5 w-96 max-w-[90vw]" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" aria-hidden="true" /> Indice
              </h3>
              <p className="text-xs text-amber-700 mb-3">{currentExercise.hint}</p>
              {currentExercise.hintWidgets && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {currentExercise.hintWidgets.map((w, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white border border-amber-200 rounded-lg px-2 py-0.5 text-xs font-medium text-amber-700">
                      {widgetIcons[w] || '?'} {w}
                    </span>
                  ))}
                </div>
              )}
              <button onClick={() => setShowHintPopup(false)} className="w-full py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">J'ai compris</button>
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

  return (<>
    <ExerciseSelector onSelect={handleSelect} onSandbox={handleSandbox} onBack={onBackToHub} introButton={<DojoIntroButton />} />
    {showDojoIntro && <DojoIntro {...BI_DOJO_INTRO} onClose={() => setShowDojoIntro(false)} />}
  </>);
}
