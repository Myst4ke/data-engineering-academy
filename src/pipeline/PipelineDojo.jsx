import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb, FileText, Star, Lock, Unlock, Wrench, PartyPopper } from 'lucide-react';
import PipelineCanvas from './PipelineCanvas';
import { TIERS, getExercisesByTier, getProgress, saveProgress, isTierUnlocked, getTierProgress, getUnlockAll, setUnlockAll } from './exercises';
import DojoIntro, { useDojoIntro, PIPELINE_DOJO_INTRO } from '../components/DojoIntro';
import BackButton from '../components/BackButton';
import ExerciseHoverTooltip from '../components/ExerciseHoverTooltip';

// ── Tutorial (5 steps, spotlight) ──
const TUTORIAL_STEPS = [
  { target: '[data-tutorial="palette"]', title: 'Les activités', text: 'Cliquez sur une activité pour l\'ajouter au canvas. Sources, transformations, stockage, destinations…' },
  { target: '[data-tutorial="canvas"]', title: 'Le canvas', text: 'C\'est votre espace de travail. Glissez les nœuds pour les organiser. Clic droit/molette pour naviguer.' },
  { target: null, title: 'Les sources', text: 'Ajoutez une Source CSV puis faites un clic droit dessus pour choisir quelles tables charger.' },
  { target: null, title: 'Les connexions', text: 'Glissez depuis un port de sortie (cercle droit) vers un port d\'entrée (cercle gauche) pour connecter deux nœuds.' },
  { target: null, title: 'Valider !', text: 'Quand votre pipeline est prêt, cliquez sur « Valider » pour vérifier votre solution. Bonne chance !' },
];

function Tutorial({ onComplete }) {
  const [step, setStep] = useState(0);
  const [targetEl, setTargetEl] = useState(null);
  const current = TUTORIAL_STEPS[step];

  useEffect(() => {
    if (!current?.target) { setTargetEl(null); return; }
    const timer = setTimeout(() => setTargetEl(document.querySelector(current.target)), 200);
    return () => clearTimeout(timer);
  }, [step, current]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onComplete(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onComplete]);

  const next = () => { if (step < TUTORIAL_STEPS.length - 1) setStep(s => s + 1); else onComplete(); };

  return createPortal(
    <div className="fixed inset-0 z-[59]">
      {targetEl && (() => {
        const r = targetEl.getBoundingClientRect();
        return <div style={{ position: 'fixed', top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16, borderRadius: 16, boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)', zIndex: 60, pointerEvents: 'none', transition: 'all 0.3s ease' }} />;
      })()}
      <div className="fixed inset-0 z-[61]" onClick={next} style={{ cursor: 'pointer' }} />
      <div className="fixed z-[62] rounded-xl shadow-2xl p-4 max-w-xs bg-white border border-indigo-200 modal-content"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <p className="text-xs text-indigo-500 font-semibold mb-1">Étape {step + 1}/{TUTORIAL_STEPS.length}</p>
        <h3 className="text-sm font-bold text-slate-800 mb-1">{current.title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">{current.text}</p>
        <div className="flex justify-between items-center">
          <button onClick={onComplete} className="text-xs text-slate-500 hover:text-slate-700">Passer</button>
          <button onClick={next} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg">
            {step < TUTORIAL_STEPS.length - 1 ? 'Suivant' : 'J\'ai compris'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Exercise popup (description + hints) ──
function ExercisePopup({ exercise, onClose }) {
  const [showHint, setShowHint] = useState(false);
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
            <div className="flex" aria-label={`Niveau ${exercise.difficulty} étoile${exercise.difficulty > 1 ? 's' : ''}`}>
              {Array.from({ length: exercise.difficulty }).map((_, i) => (
                <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" aria-hidden="true" />
              ))}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{exercise.title}</h3>
              <p className="text-xs text-slate-500 font-medium">{TIERS[exercise.difficulty - 1]?.name}</p>
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
              <p className="text-xs text-amber-700">{exercise.hint}</p>
              {exercise.hintNodes && (
                <div className="flex flex-wrap gap-1 mt-2" aria-label="Nœuds suggérés">
                  {exercise.hintNodes.map((nt, i) => {
                    const def = { csv_source: '📄', db_source: '🗄️', api_source: '🌐', filter: '🔍', sort: '↕️', join: '🔗', concat: '⬇️', aggregate: '📊', select_cols: '✅', delete_col: '🗑️', rename_col: '✏️', deduplicate: '🔄', clean_na: '🧹', fill_na: '🔧', mapping: '🗺️', window_func: '📐', sample: '🎲', foreach: '🔁', foreach_row: '📝', if_condition: '⚡', lookup: '🔎', log: '📋', lakehouse_bronze: '🥉', lakehouse_silver: '🥈', lakehouse_gold: '🥇', warehouse: '🏭', dashboard: '📈', csv_export: '💾' };
                    return <span key={i} className="text-base" title={nt} aria-label={nt}>{def[nt] || '?'}</span>;
                  })}
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
            <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600">Commencer</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Validation result popup ──
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
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600">
            {result.ok ? 'Continuer' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Star display ──
function Stars({ count, max = 3 }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${count} étoiles sur ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < count ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} aria-hidden="true" />
      ))}
    </span>
  );
}

// ═══════════════════════
// ── EXERCISE SELECTOR ──
// ═══════════════════════
const TIER_CLS_BY_DIFFICULTY = { 1: 'tier-t1', 2: 'tier-t2', 3: 'tier-t3', 4: 'tier-t4' };
const TIER_NAME_COLOR_CLS = {
  1: 'text-[#4B5563]',
  2: 'text-[#2563EB]',
  3: 'text-[#9333EA]',
  4: 'text-[#B45309]',
};
const TIER_STAR_COLOR_CLS = {
  1: 'text-[#9CA3AF]',
  2: 'text-[#60A5FA]',
  3: 'text-[#C084FC]',
  4: 'text-[#F59E0B]',
};

function ExerciseSelector({ onSelect, onSandbox, onBack, introButton }) {
  const [, forceUpdate] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [hoverRect, setHoverRect] = useState(null);
  const hoverTimerRef = useRef(null);
  const progress = getProgress();

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

  const allUnlocked = getUnlockAll();
  const toggleUnlockAll = () => {
    setUnlockAll(!allUnlocked);
    forceUpdate(v => v + 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-none flex items-center justify-between px-4 sm:px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-[#EDE3D2] shadow-sm flex-wrap gap-2 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} label="Accueil" />
          <h1 className="font-display text-xl sm:text-2xl text-[#2B2D42] tracking-tight flex items-center gap-2">
            Pipeline <span className="font-display-italic text-[#6BA4FF]">Dojo</span>
          </h1>
          {introButton}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleUnlockAll}
            role="switch"
            aria-checked={allUnlocked}
            className={`game-btn px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 ${allUnlocked ? 'bg-[#DCE8FF] text-[#3B7ADB] border-[#6BA4FF]' : ''}`}
            title={allUnlocked ? 'Rétablir la progression normale' : 'Accéder à tous les exercices sans les compléter'}
          >
            {allUnlocked ? <Lock className="w-3.5 h-3.5" aria-hidden="true" /> : <Unlock className="w-3.5 h-3.5" aria-hidden="true" />}
            {allUnlocked ? 'Verrouiller' : 'Tout débloquer'}
          </button>
          <button
            onClick={onSandbox}
            className="px-4 py-2 rounded-xl bg-[#6BA4FF] text-white text-sm font-bold hover:bg-[#3B7ADB] shadow-[0_4px_0_rgba(0,0,0,0.08)] transition-colors flex items-center gap-1.5"
          >
            Bac à sable
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-10">
          {TIERS.map(tier => {
            const exercises = getExercisesByTier(tier.id);
            const unlocked = isTierUnlocked(tier.id);
            const tp = getTierProgress(tier.id);
            const tierIdx = TIERS.findIndex(t => t.id === tier.id) + 1;
            const tierCls = TIER_CLS_BY_DIFFICULTY[tierIdx] || 'tier-t1';
            const nameCls = TIER_NAME_COLOR_CLS[tierIdx] || 'text-[#4B5563]';
            const starCls = TIER_STAR_COLOR_CLS[tierIdx] || 'text-[#9CA3AF]';

            return (
              <div key={tier.id} className={tierCls}>
                <div className={`flex flex-wrap items-center gap-3 mb-4 ${!unlocked ? 'opacity-55' : ''}`}>
                  <h2 className={`font-display text-lg sm:text-xl ${nameCls}`}>
                    {tier.name}
                  </h2>
                  <div className="flex" aria-label={`Niveau ${tierIdx}`}>
                    {Array.from({ length: tierIdx }).map((_, i) => (
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
                      <div
                        className="h-full bg-[#6BA4FF] rounded-full transition-all duration-500"
                        style={{ width: `${(tp.completed / tp.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#9CA3AF] font-bold">{tp.completed}/{tp.total}</span>
                  </div>
                </div>

                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${!unlocked ? 'pointer-events-none' : ''}`}>
                  {exercises.map((ex, i) => {
                    const p = progress[ex.id];
                    const stars = p?.stars || 0;
                    return (
                      <button
                        key={ex.id}
                        onClick={() => onSelect(ex)}
                        onMouseEnter={(e) => unlocked && handleHover(ex, e)}
                        onMouseLeave={handleLeave}
                        onFocus={(e) => unlocked && handleHover(ex, e)}
                        onBlur={handleLeave}
                        className={`ex-card ${stars > 0 ? 'done' : ''} ${!unlocked ? 'locked' : ''} group relative text-left p-3`}
                        style={{ aspectRatio: 'auto' }}
                        aria-label={`${ex.title}. ${ex.description.slice(0, 120)}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-[#9CA3AF] font-bold">#{i + 1}</span>
                          {stars > 0 && <Stars count={stars} />}
                        </div>
                        <p className="font-display text-sm text-[#2B2D42] mb-1 leading-tight">{ex.title}</p>
                        <p className="text-[11px] text-[#5A6072] leading-snug line-clamp-2 font-medium font-sans">{ex.description.slice(0, 80)}…</p>
                        {ex.isTutorial && !p && (
                          <span className="absolute -top-2 -right-2 bg-[#FF8066] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_2px_0_rgba(0,0,0,0.08)]">TUTO</span>
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

// ══════════════════════════
// ── MAIN PIPELINE DOJO ──
// ══════════════════════════
export default function PipelineDojo({ onBackToHub }) {
  const [showDojoIntro, setShowDojoIntro, DojoIntroButton] = useDojoIntro('pipeline-dojo');
  const [mode, setMode] = useState('select'); // 'select' | 'exercise' | 'sandbox'
  const [currentExercise, setCurrentExercise] = useState(null);
  const [showExercisePopup, setShowExercisePopup] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [exerciseStars, setExerciseStars] = useState(0);
  const [showHintPopup, setShowHintPopup] = useState(false);

  const handleSelectExercise = useCallback((exercise) => {
    setCurrentExercise(exercise);
    setMode('exercise');
    setValidationResult(null);
    if (exercise.isTutorial && !localStorage.getItem('pipelineDojo_tutorialSeen')) {
      setShowTutorial(true);
      setShowExercisePopup(false);
    } else {
      setShowExercisePopup(true);
    }
  }, []);

  const handleSandbox = useCallback(() => {
    setCurrentExercise(null);
    setMode('sandbox');
  }, []);

  const handleBack = useCallback(() => {
    setMode('select');
    setCurrentExercise(null);
    setValidationResult(null);
  }, []);

  const handleValidate = useCallback((nodeOutputs, nodes, connections, nodeConfigs) => {
    if (!currentExercise?.validate) return;
    const result = currentExercise.validate(nodeOutputs, nodes, connections, nodeConfigs);
    let stars = result.stars ?? (result.ok ? 3 : 0);
    setExerciseStars(stars);
    setValidationResult(result);
    if (result.ok && currentExercise) {
      saveProgress(currentExercise.id, stars);
    }
  }, [currentExercise]);

  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem('pipelineDojo_tutorialSeen', '1');
    setShowExercisePopup(true);
  }, []);

  // Exercise or sandbox mode
  if (mode === 'exercise' || mode === 'sandbox') {
    return (
      <div className="relative">
        <PipelineCanvas
          onBack={handleBack}
          exercise={currentExercise}
          onExerciseValidate={currentExercise ? handleValidate : null}
        />

        {/* Exercise info bar */}
        {currentExercise && (
          <div className="fixed top-[52px] left-48 right-0 bg-indigo-50 border-b border-indigo-200 px-4 py-1.5 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: currentExercise.difficulty }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" aria-hidden="true" />
                ))}
              </div>
              <span className="text-xs font-bold text-indigo-700">{currentExercise.title}</span>
              <span className="text-xs text-indigo-500 max-w-md truncate">{currentExercise.description}</span>
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
                className="text-xs text-indigo-600 font-medium px-2 py-1 rounded hover:bg-indigo-100 flex items-center gap-1"
                aria-label="Afficher l'énoncé complet"
              >
                <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Énoncé
              </button>
            </div>
          </div>
        )}

        {/* Tutorial */}
        {showTutorial && <Tutorial onComplete={handleTutorialComplete} />}

        {/* Exercise popup */}
        {showExercisePopup && currentExercise && (
          <ExercisePopup exercise={currentExercise} onClose={() => setShowExercisePopup(false)} />
        )}

        {/* Hint popup */}
        {showHintPopup && currentExercise && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setShowHintPopup(false)} role="dialog" aria-modal="true">
            <div className="modal-content bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-2xl p-5 w-96 max-w-[90vw]" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" aria-hidden="true" /> Indice
              </h3>
              <p className="text-xs text-amber-700 mb-3">{currentExercise.hint}</p>
              {currentExercise.hintNodes && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {currentExercise.hintNodes.map((nt, i) => {
                    const icons = { csv_source: '📄 Source CSV', db_source: '🗄️ Base SQL', api_source: '🌐 API REST', filter: '🔍 Filtrer', sort: '↕️ Trier', join: '🔗 Joindre', concat: '⬇️ Concaténer', aggregate: '📊 Agréger', select_cols: '✅ Sélectionner', delete_col: '🗑️ Suppr. col.', rename_col: '✏️ Renommer', deduplicate: '🔄 Dédup', clean_na: '🧹 Suppr. vides', fill_na: '🔧 Remplir', mapping: '🗺️ Mapping', window_func: '📐 Fenêtre', sample: '🎲 Échantillon', foreach: '🔁 ForEach', foreach_row: '📝 ForEachRow', if_condition: '⚡ Si/Sinon', lookup: '🔎 Lookup', log: '📋 Journal', lakehouse_bronze: '🥉 Bronze', lakehouse_silver: '🥈 Silver', lakehouse_gold: '🥇 Gold', warehouse: '🏭 Warehouse', dashboard: '📈 Dashboard', csv_export: '💾 Export CSV' };
                    return (
                      <span key={i} className="inline-flex items-center gap-1 bg-white border border-amber-200 rounded-lg px-2 py-0.5 text-xs font-medium text-amber-700">
                        {i > 0 && <span className="text-amber-300 -ml-1 mr-0.5" aria-hidden="true">→</span>}
                        {icons[nt] || nt}
                      </span>
                    );
                  })}
                </div>
              )}
              <button onClick={() => setShowHintPopup(false)} className="w-full py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">J'ai compris</button>
            </div>
          </div>
        )}

        {/* Validation result */}
        {validationResult && (
          <ValidationPopup result={validationResult} stars={exerciseStars}
            onClose={() => { setValidationResult(null); if (validationResult.ok) handleBack(); }}
            onRetry={() => setValidationResult(null)} />
        )}
      </div>
    );
  }

  return (<>
    <ExerciseSelector onSelect={handleSelectExercise} onSandbox={handleSandbox} onBack={onBackToHub} introButton={<DojoIntroButton />} />
    {showDojoIntro && <DojoIntro {...PIPELINE_DOJO_INTRO} onClose={() => setShowDojoIntro(false)} />}
  </>);
}
