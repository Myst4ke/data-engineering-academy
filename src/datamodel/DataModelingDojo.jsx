import { useState, useCallback, useMemo, useRef } from 'react';
import { Star, Lightbulb, FileText } from 'lucide-react';
import BackButton from '../components/BackButton';
import ExerciseHoverTooltip from '../components/ExerciseHoverTooltip';
import DataModelCanvas from './DataModelCanvas';
import { DM_EXERCISES, DM_TIERS, getDmExercisesByTier } from './exercises';
import { validateModel } from './Validator';

const STORAGE_KEY = 'dataModelingDojo_progress';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveProgress(id, stars) {
  const p = loadProgress();
  const prev = p[id]?.stars || 0;
  p[id] = { stars: Math.max(prev, stars), date: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

const TIER_CLS = ['tier-t1', 'tier-t2', 'tier-t3', 'tier-t4'];
const NAME_COLOR = ['text-[#4B5563]', 'text-[#2563EB]', 'text-[#9333EA]', 'text-[#B45309]'];
const STAR_COLOR = ['text-[#9CA3AF]', 'text-[#60A5FA]', 'text-[#C084FC]', 'text-[#F59E0B]'];

function Stars({ count }) {
  return (
    <div className="flex">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" aria-hidden="true" />
      ))}
    </div>
  );
}

function ExerciseSelector({ onBack, onSelect, progress }) {
  const [hovered, setHovered] = useState(null);
  const [hoverRect, setHoverRect] = useState(null);
  const timerRef = useRef(null);

  const handleEnter = (ex, e) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    timerRef.current = setTimeout(() => {
      setHovered(ex);
      setHoverRect(rect);
    }, 250);
  };
  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHovered(null);
    setHoverRect(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFC]">
      <div className="flex-none flex items-center justify-between px-4 sm:px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-[#EDE3D2] shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} label="Accueil" />
          <h1 className="font-display text-xl sm:text-2xl text-[#2B2D42] tracking-tight flex items-center gap-2">
            Data Modeling <span className="font-display-italic text-[#C084FC]">Dojo</span>
          </h1>
        </div>
        <div className="text-xs text-slate-500">Kata IV · Modélisation</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-10 pb-48">
          {DM_TIERS.map((tier, tierIdx) => {
            const exs = getDmExercisesByTier(tier.id);
            if (exs.length === 0) return null;
            const tierCls = TIER_CLS[tierIdx] || 'tier-t1';
            const nameCls = NAME_COLOR[tierIdx] || 'text-[#4B5563]';
            const starCls = STAR_COLOR[tierIdx] || 'text-[#9CA3AF]';
            const completedCount = exs.filter((ex) => (progress[ex.id]?.stars || 0) > 0).length;

            return (
              <div key={tier.id} className={tierCls}>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h2 className={`font-display text-lg sm:text-xl ${nameCls}`}>{tier.name}</h2>
                  <div className="flex" aria-label={`Niveau ${tier.difficulty}`}>
                    {Array.from({ length: tier.difficulty }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${starCls} fill-current`} aria-hidden="true" />
                    ))}
                  </div>
                  <div className="flex-1 min-w-[120px] flex items-center gap-2 ml-2">
                    <div className="flex-1 h-1.5 bg-[#F4EADB] rounded-full overflow-hidden">
                      <div className="h-full bg-[#C084FC] rounded-full transition-all duration-500" style={{ width: `${exs.length ? (completedCount / exs.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-[#9CA3AF] font-bold">{completedCount}/{exs.length}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {exs.map((ex, i) => {
                    const stars = progress[ex.id]?.stars || 0;
                    return (
                      <button
                        key={ex.id}
                        onClick={() => onSelect(ex)}
                        onMouseEnter={(e) => handleEnter(ex, e)}
                        onMouseLeave={handleLeave}
                        onFocus={(e) => handleEnter(ex, e)}
                        onBlur={handleLeave}
                        className={`ex-card ${stars > 0 ? 'done' : ''} group relative text-left p-3`}
                        style={{ aspectRatio: 'auto' }}
                        aria-label={`${ex.title}. ${ex.description}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-[#9CA3AF] font-bold">#{i + 1}</span>
                          {stars > 0 && <Stars count={stars} />}
                        </div>
                        <p className="font-display text-sm text-[#2B2D42] mb-1 leading-tight">{ex.title}</p>
                        <p className="text-[11px] text-[#5A6072] leading-snug line-clamp-2 font-medium font-sans">{ex.description}</p>
                        {ex.isTutorial && stars === 0 && (
                          <span className="absolute -top-2 -right-2 bg-[#C084FC] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_2px_0_rgba(0,0,0,0.08)]">TUTO</span>
                        )}
                      </button>
                    );
                  })}
                  {exs.length === 0 && (
                    <div className="col-span-full text-xs text-slate-400 italic">Bientôt disponible.</div>
                  )}
                </div>

                {tier.id > 1 && exs.length === 0 && (
                  <div className="text-xs text-slate-400 italic">En préparation</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {hovered && <ExerciseHoverTooltip exercise={hovered} anchorRect={hoverRect} />}
    </div>
  );
}

export default function DataModelingDojo({ onBackToHub }) {
  const [mode, setMode] = useState('select'); // select | exercise
  const [currentExercise, setCurrentExercise] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [progressTick, setProgressTick] = useState(0);

  const progress = useMemo(() => loadProgress(), [progressTick]);

  const handleSelect = useCallback((ex) => {
    setCurrentExercise(ex);
    setValidationResult(null);
    setShowPrompt(true);
    setMode('exercise');
  }, []);

  const handleBack = useCallback(() => {
    setMode('select');
    setCurrentExercise(null);
    setValidationResult(null);
    setProgressTick((t) => t + 1);
  }, []);

  const handleValidate = useCallback((tables, relations) => {
    if (!currentExercise) return;
    const result = validateModel(tables, relations, currentExercise);
    setValidationResult(result);
    if (result.passed) {
      saveProgress(currentExercise.id, result.stars);
      setProgressTick((t) => t + 1);
    }
  }, [currentExercise]);

  if (mode === 'select') {
    return <ExerciseSelector onBack={onBackToHub} onSelect={handleSelect} progress={progress} />;
  }

  return (
    <div className="relative">
      <DataModelCanvas
        key={currentExercise?.id}
        onBack={handleBack}
        exercise={currentExercise}
        onExerciseValidate={handleValidate}
        initialTables={currentExercise?.initialTables}
        initialRelations={currentExercise?.initialRelations}
      />

      {currentExercise && (
        <div className="fixed top-[52px] left-48 right-0 bg-violet-50 border-b border-violet-200 px-4 py-1.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex shrink-0">
              {Array.from({ length: currentExercise.difficulty }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" aria-hidden="true" />
              ))}
            </div>
            <span className="text-xs font-bold text-violet-700 shrink-0">{currentExercise.title}</span>
            <span className="text-xs text-violet-500 truncate">{currentExercise.description}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowHint(true)}
              className="text-xs text-amber-700 font-medium px-2 py-1 rounded hover:bg-amber-100 flex items-center gap-1"
              aria-label="Afficher l'indice"
            >
              <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" /> Indice
            </button>
            <button
              onClick={() => setShowPrompt(true)}
              className="text-xs text-violet-600 font-medium px-2 py-1 rounded hover:bg-violet-100 flex items-center gap-1"
              aria-label="Afficher l'énoncé complet"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Énoncé
            </button>
          </div>
        </div>
      )}

      {showPrompt && currentExercise && (
        <div
          className="fixed inset-0 modal-overlay flex items-center justify-center z-50"
          onClick={() => setShowPrompt(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[28rem] max-w-[90vw] modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex">
                {Array.from({ length: currentExercise.difficulty }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" aria-hidden="true" />
                ))}
              </div>
              <h3 className="font-display text-2xl text-violet-700">{currentExercise.title}</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-4 whitespace-pre-line">{currentExercise.prompt}</p>
            <button
              onClick={() => setShowPrompt(false)}
              className="w-full py-2.5 rounded-xl bg-violet-500 text-white font-bold hover:bg-violet-600 shadow"
            >
              C'est parti
            </button>
          </div>
        </div>
      )}

      {showHint && currentExercise && (
        <div
          className="fixed inset-0 modal-overlay flex items-center justify-center z-50"
          onClick={() => setShowHint(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-2xl p-5 w-96 modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4" aria-hidden="true" /> Indice
            </h3>
            <p className="text-xs text-amber-700 mb-3">{currentExercise.hint}</p>
            <button
              onClick={() => setShowHint(false)}
              className="w-full py-2 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600"
            >
              Compris
            </button>
          </div>
        </div>
      )}

      {validationResult && (
        validationResult.passed ? (
          <div
            className="fixed inset-0 modal-overlay flex items-center justify-center z-50"
            onClick={() => setValidationResult(null)}
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 text-center modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="font-display text-3xl text-emerald-600 mb-2">Bravo</div>
              <div className="flex justify-center mb-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Star key={i} className={`w-6 h-6 ${i < validationResult.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} aria-hidden="true" />
                ))}
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Ton modèle respecte les règles de l'exercice.
                {validationResult.warnings.length > 0 && (
                  <span className="block text-xs text-amber-600 mt-1">
                    {validationResult.warnings.length} remarque{validationResult.warnings.length > 1 ? 's' : ''} de style pour atteindre 3 étoiles.
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setValidationResult(null)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Revoir
                </button>
                <button
                  onClick={() => { setValidationResult(null); handleBack(); }}
                  className="flex-1 py-2 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="fixed inset-0 modal-overlay flex items-center justify-center z-50"
            onClick={() => setValidationResult(null)}
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-5 w-[26rem] modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-red-600 mb-3">À revoir</h3>
              <ul className="space-y-1.5 mb-4 max-h-60 overflow-y-auto">
                {validationResult.warnings.map((w, i) => (
                  <li key={i} className={`text-xs flex gap-1.5 ${w.level === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                    <span>{w.level === 'error' ? '❌' : '⚠️'}</span>
                    <span className="flex-1">{w.message}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setValidationResult(null)}
                className="w-full py-2 rounded-lg bg-slate-500 text-white font-bold hover:bg-slate-600"
              >
                Continuer
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
