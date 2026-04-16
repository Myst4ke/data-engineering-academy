import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PipelineCanvas from './PipelineCanvas';
import { EXERCISES, TIERS, getExercisesByTier, getProgress, saveProgress, isTierUnlocked, getTierProgress } from './exercises';

// ── Tutorial (5 steps, spotlight) ──
const TUTORIAL_STEPS = [
  { target: '[data-tutorial="palette"]', title: 'Les activites', text: 'Cliquez sur une activite pour l\'ajouter au canvas. Sources, transformations, stockage, destinations...' },
  { target: '[data-tutorial="canvas"]', title: 'Le canvas', text: 'C\'est votre espace de travail. Glissez les noeuds pour les organiser. Clic droit/molette pour naviguer.' },
  { target: null, title: 'Les sources', text: 'Ajoutez une Source CSV puis faites un clic droit dessus pour choisir quelles tables charger.' },
  { target: null, title: 'Les connexions', text: 'Glissez depuis un port de sortie (cercle droit) vers un port d\'entree (cercle gauche) pour connecter deux noeuds.' },
  { target: null, title: 'Valider !', text: 'Quand votre pipeline est pret, cliquez sur "Valider" pour verifier votre solution. Bonne chance !' },
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

  const next = () => { if (step < TUTORIAL_STEPS.length - 1) setStep(s => s + 1); else onComplete(); };

  return createPortal(
    <div className="fixed inset-0 z-[59]">
      {targetEl && (() => {
        const r = targetEl.getBoundingClientRect();
        return <div style={{ position: 'fixed', top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16, borderRadius: 16, boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)', zIndex: 60, pointerEvents: 'none', transition: 'all 0.3s ease' }} />;
      })()}
      <div className="fixed inset-0 z-[61]" onClick={next} style={{ cursor: 'pointer' }} />
      <div className="fixed z-[62] rounded-xl shadow-2xl p-4 max-w-xs bg-white border border-indigo-200"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <p className="text-xs text-indigo-500 font-semibold mb-1">Etape {step + 1}/{TUTORIAL_STEPS.length}</p>
        <h3 className="text-sm font-bold text-slate-800 mb-1">{current.title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">{current.text}</p>
        <div className="flex justify-between items-center">
          <button onClick={onComplete} className="text-xs text-slate-400 hover:text-slate-600">Passer</button>
          <button onClick={next} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg">
            {step < TUTORIAL_STEPS.length - 1 ? 'Suivant' : 'Compris !'}
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
  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{exercise.difficulty === 1 ? '🌱' : exercise.difficulty === 2 ? '🔧' : exercise.difficulty === 3 ? '🔥' : '💎'}</span>
            <div>
              <h3 className="text-base font-bold text-slate-800">{exercise.title}</h3>
              <p className="text-[10px] text-slate-400 font-medium">{TIERS[exercise.difficulty - 1]?.name}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{exercise.description}</p>

          {showHint && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Indice</p>
              <p className="text-xs text-amber-600">{exercise.hint}</p>
              {exercise.hintNodes && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {exercise.hintNodes.map((nt, i) => {
                    const def = { csv_source: '📄', db_source: '🗄️', api_source: '🌐', filter: '🔍', sort: '↕️', join: '🔗', concat: '⬇️', aggregate: '📊', select_cols: '✅', delete_col: '🗑️', rename_col: '✏️', deduplicate: '🔄', clean_na: '🧹', fill_na: '🔧', mapping: '🗺️', window_func: '📐', sample: '🎲', foreach: '🔁', foreach_row: '📝', if_condition: '⚡', lookup: '🔎', log: '📋', lakehouse_bronze: '🥉', lakehouse_silver: '🥈', lakehouse_gold: '🥇', warehouse: '🏭', dashboard: '📈', csv_export: '💾' };
                    return <span key={i} className="text-base" title={nt}>{def[nt] || '?'}</span>;
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {!showHint && <button onClick={() => setShowHint(true)} className="flex-1 py-2 rounded-lg border border-amber-300 text-amber-600 text-sm font-medium hover:bg-amber-50">💡 Indice</button>}
            <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600">C'est parti !</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Validation result popup ──
function ValidationPopup({ result, stars, onClose, onRetry }) {
  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-6" onClick={e => e.stopPropagation()}>
        {result.ok ? (
          <>
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-emerald-600 mb-1">Reussi !</h3>
            <p className="text-sm text-slate-600 mb-3">{result.msg}</p>
            <div className="text-3xl mb-4">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
          </>
        ) : (
          <>
            <div className="text-5xl mb-3">🔧</div>
            <h3 className="text-lg font-bold text-red-500 mb-1">Pas encore...</h3>
            <p className="text-sm text-slate-600 mb-3">{result.msg}</p>
          </>
        )}
        <div className="flex gap-2">
          {!result.ok && <button onClick={onRetry} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Reessayer</button>}
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
  return <span className="text-sm">{'⭐'.repeat(count)}{'☆'.repeat(max - count)}</span>;
}

// ═══════════════════════
// ── EXERCISE SELECTOR ──
// ═══════════════════════
function ExerciseSelector({ onSelect, onSandbox, onBack }) {
  const [, forceUpdate] = useState(0);
  const progress = getProgress();

  const unlockAll = () => {
    const p = getProgress();
    EXERCISES.forEach(ex => { if (!p[ex.id]) p[ex.id] = { stars: 1, date: new Date().toISOString() }; });
    localStorage.setItem('pipelineDojo_progress', JSON.stringify(p));
    forceUpdate(v => v + 1);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-cyan-50 via-white to-blue-50">
      <div className="flex-none flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="game-btn px-3 py-1.5 text-sm font-semibold">← Accueil</button>
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">🔧 Pipeline Dojo</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={unlockAll} className="px-3 py-2 rounded-xl border border-slate-300 text-slate-500 text-xs font-medium hover:bg-slate-50 transition-all">
            🔓 Tout debloquer
          </button>
          <button onClick={onSandbox} className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 text-white text-sm font-bold hover:from-slate-700 hover:to-slate-800 shadow-lg transition-all">
            🏗️ Bac a sable
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {TIERS.map(tier => {
            const exercises = getExercisesByTier(tier.id);
            const unlocked = isTierUnlocked(tier.id);
            const tp = getTierProgress(tier.id);

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
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full bg-gradient-to-r ${tier.color}`} style={{ width: `${(tp.completed / tp.total) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{tp.completed}/{tp.total}</span>
                      <Stars count={Math.min(3, Math.floor(tp.totalStars / Math.max(1, tp.total)))} />
                    </div>
                  </div>
                </div>

                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${!unlocked ? 'opacity-50 pointer-events-none' : ''}`}>
                  {exercises.map((ex, i) => {
                    const p = progress[ex.id];
                    const stars = p?.stars || 0;
                    return (
                      <button key={ex.id} onClick={() => onSelect(ex)}
                        className={`group relative text-left p-3 rounded-xl border-2 transition-all hover:scale-[1.02] hover:shadow-lg ${
                          stars > 0 ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-indigo-300'
                        }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400 font-medium">#{i + 1}</span>
                          {stars > 0 && <Stars count={stars} />}
                        </div>
                        <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 mb-1 leading-tight">{ex.title}</p>
                        <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{ex.description.slice(0, 80)}...</p>
                        {ex.isTutorial && !p && <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">TUTO</span>}
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

// ══════════════════════════
// ── MAIN PIPELINE DOJO ──
// ══════════════════════════
export default function PipelineDojo({ onBackToHub }) {
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
    // Tutorial exercise: show tutorial first, then popup after tutorial completes
    if (exercise.isTutorial && !localStorage.getItem('pipelineDojo_tutorialSeen')) {
      setShowTutorial(true);
      setShowExercisePopup(false); // will show after tutorial
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
    // Calculate stars: result may provide stars directly (for exercise 32) or use default
    let stars = result.stars ?? (result.ok ? 3 : 0);
    // For now, all passing exercises get 3 stars (can refine later with step counting)
    setExerciseStars(stars);
    setValidationResult(result);
    if (result.ok && currentExercise) {
      saveProgress(currentExercise.id, stars);
    }
  }, [currentExercise]);

  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem('pipelineDojo_tutorialSeen', '1');
    // After tutorial, show the exercise popup
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
              <span className="text-sm">{currentExercise.difficulty === 1 ? '🌱' : currentExercise.difficulty === 2 ? '🔧' : currentExercise.difficulty === 3 ? '🔥' : '💎'}</span>
              <span className="text-xs font-bold text-indigo-700">{currentExercise.title}</span>
              <span className="text-[10px] text-indigo-500 max-w-md truncate">{currentExercise.description}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowHintPopup(true)} className="text-xs text-amber-600 font-medium px-2 py-1 rounded hover:bg-amber-100">💡 Indice</button>
              <button onClick={() => setShowExercisePopup(true)} className="text-xs text-indigo-500 font-medium px-2 py-1 rounded hover:bg-indigo-100">📋 Enonce</button>
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
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowHintPopup(false)}>
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-2xl p-5 w-96 max-w-[90vw]" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-amber-700 mb-2">💡 Indice</h3>
              <p className="text-xs text-amber-600 mb-3">{currentExercise.hint}</p>
              {currentExercise.hintNodes && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {currentExercise.hintNodes.map((nt, i) => {
                    const icons = { csv_source: '📄 Source CSV', db_source: '🗄️ Base SQL', api_source: '🌐 API REST', filter: '🔍 Filtrer', sort: '↕️ Trier', join: '🔗 Joindre', concat: '⬇️ Concatener', aggregate: '📊 Agreger', select_cols: '✅ Selectionner', delete_col: '🗑️ Suppr. Col', rename_col: '✏️ Renommer', deduplicate: '🔄 Dedup', clean_na: '🧹 Suppr. Vides', fill_na: '🔧 Remplir', mapping: '🗺️ Mapping', window_func: '📐 Fenetre', sample: '🎲 Echantillon', foreach: '🔁 ForEach', foreach_row: '📝 ForEachRow', if_condition: '⚡ Si/Sinon', lookup: '🔎 Lookup', log: '📋 Journal', lakehouse_bronze: '🥉 Bronze', lakehouse_silver: '🥈 Silver', lakehouse_gold: '🥇 Gold', warehouse: '🏭 Warehouse', dashboard: '📈 Dashboard', csv_export: '💾 Export CSV' };
                    return (
                      <span key={i} className="inline-flex items-center gap-1 bg-white border border-amber-200 rounded-lg px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        {i > 0 && <span className="text-amber-300 -ml-1 mr-0.5">→</span>}
                        {icons[nt] || nt}
                      </span>
                    );
                  })}
                </div>
              )}
              <button onClick={() => setShowHintPopup(false)} className="w-full py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">Compris</button>
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

  return <ExerciseSelector onSelect={handleSelectExercise} onSandbox={handleSandbox} onBack={onBackToHub} />;
}
