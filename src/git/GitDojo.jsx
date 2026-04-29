import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star, Lightbulb, FileText } from 'lucide-react';
import BackButton from '../components/BackButton';
import ExerciseHoverTooltip from '../components/ExerciseHoverTooltip';
import DojoIntro, { useDojoIntro, GIT_DOJO_INTRO } from '../components/DojoIntro';
import GitCanvas from './GitCanvas';
import { GIT_EXERCISES, GIT_TIERS, getExercisesByTier } from './exercises';
import { validateGit } from './Validator';

// ── Tutorial (6 steps, spotlight) ──
const TUTORIAL_STEPS = [
  { target: null, title: 'Bienvenue !', text: "Git, c'est un carnet de bord pour ton projet : tu prends des photos de tes fichiers, et tu peux y revenir à tout moment. On va voir comment, étape par étape." },
  { target: '[data-tutorial="files-window"]', title: 'Tes fichiers', text: 'À droite, ce sont les fichiers de ton projet. Bordure rouge = modifié depuis la dernière photo. Bordure pointillée verte = tout nouveau, jamais sauvegardé.' },
  { target: '[data-tutorial="staging-zone"]', title: 'La Staging Zone', text: "C'est la sélection avant la photo. Glisse un fichier rouge ici pour dire à Git : « celui-là, je veux le sauvegarder dans la prochaine photo »." },
  { target: '[data-tutorial="commit-btn"]', title: 'Commiter = prendre la photo', text: "Clique « Commiter ». Tu donnes un titre court à ta photo (ex : « ajout du login ») et c'est sauvegardé dans l'historique. C'est ça, un commit." },
  { target: '[data-tutorial="canvas"]', title: "L'historique", text: "Au centre, chaque rond est une photo. Ils s'enchaînent dans l'ordre où tu les as prises. Plus tard, quand tu auras des branches, tu pourras switcher entre elles en cliquant sur leur nom dans le graphe." },
  { target: '[data-tutorial="validate-btn"]', title: 'Valider', text: "Quand l'historique correspond à ce que l'exercice demande, clique « Valider ». À toi de jouer !" },
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
      <div className="fixed z-[62] rounded-xl shadow-2xl p-4 max-w-xs bg-white border border-violet-200 modal-content"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <p className="text-xs text-violet-600 font-semibold mb-1">Étape {step + 1}/{TUTORIAL_STEPS.length}</p>
        <h3 className="text-sm font-bold text-slate-800 mb-1">{current.title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">{current.text}</p>
        <div className="flex justify-between items-center">
          <button onClick={onComplete} className="text-xs text-slate-500 hover:text-slate-700">Passer</button>
          <button onClick={next} className="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg">
            {step < TUTORIAL_STEPS.length - 1 ? 'Suivant' : 'J\'ai compris'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const STORAGE_KEY = 'gitDojo_progress';

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

const SANDBOX_FILES = {
  'README.md': '# Mon projet\n\nBac à sable Git : essaie tout ce que tu veux.',
  'app.py': 'def main():\n    print("hello")\n',
  'notes.md': 'Idées, notes libres...',
};

function ExerciseSelector({ onBack, onSelect, onSandbox, progress, IntroButton }) {
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
    setHovered(null); setHoverRect(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFC]">
      <div className="flex-none flex items-center justify-between px-4 sm:px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-[#EDE3D2] shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} label="Accueil" />
          <h1 className="font-display text-xl sm:text-2xl text-[#2B2D42] tracking-tight flex items-center gap-2">
            Git <span className="font-display-italic text-[#6D28D9]">Dojo</span>
          </h1>
          {IntroButton && <IntroButton />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Kata IV · Gestion de versions</span>
          {onSandbox && (
            <button
              onClick={onSandbox}
              className="px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 shadow-[0_4px_0_rgba(0,0,0,0.08)] transition-colors"
              title="Mode libre, sans exercice ni validation"
            >
              Bac à sable
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-10 pb-48">
          {GIT_TIERS.map((tier, tierIdx) => {
            const exs = getExercisesByTier(tier.id);
            const tierCls = TIER_CLS[tierIdx] || 'tier-t1';
            const nameCls = NAME_COLOR[tierIdx] || 'text-[#4B5563]';
            const starCls = STAR_COLOR[tierIdx] || 'text-[#9CA3AF]';
            const completedCount = exs.filter(e => (progress[e.id]?.stars || 0) > 0).length;
            return (
              <div key={tier.id} className={tierCls}>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h2 className={`font-display text-lg sm:text-xl ${nameCls}`}>{tier.name}</h2>
                  <div className="flex" aria-label={`Niveau ${tier.difficulty}`}>
                    {Array.from({ length: tier.difficulty }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${starCls} fill-current`} aria-hidden="true" />
                    ))}
                  </div>
                  {exs.length > 0 && (
                    <div className="flex-1 min-w-[120px] flex items-center gap-2 ml-2">
                      <div className="flex-1 h-1.5 bg-[#F4EADB] rounded-full overflow-hidden">
                        <div className="h-full bg-[#8B5CF6] rounded-full transition-all duration-500" style={{ width: `${(completedCount / exs.length) * 100}%` }} />
                      </div>
                      <span className="text-xs text-[#9CA3AF] font-bold">{completedCount}/{exs.length}</span>
                    </div>
                  )}
                </div>

                {exs.length > 0 ? (
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
                            <span className="absolute -top-2 -right-2 bg-[#8B5CF6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_2px_0_rgba(0,0,0,0.08)]">TUTO</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">Bientôt disponible.</div>
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

export default function GitDojo({ onBackToHub }) {
  const [showDojoIntro, setShowDojoIntro, DojoIntroButton] = useDojoIntro('git-dojo');
  const [mode, setMode] = useState('select');
  const [currentExercise, setCurrentExercise] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [progressTick, setProgressTick] = useState(0);

  const progress = useMemo(() => loadProgress(), [progressTick]);

  const handleSelect = useCallback((ex) => {
    setCurrentExercise(ex);
    setValidationResult(null);
    if (ex.isTutorial && !localStorage.getItem('gitDojo_tutorialSeen')) {
      setShowTutorial(true);
      setShowPrompt(false);
    } else {
      setShowPrompt(true);
    }
    setMode('exercise');
  }, []);

  const handleSandbox = useCallback(() => {
    setCurrentExercise(null);
    setValidationResult(null);
    setShowPrompt(false);
    setMode('sandbox');
  }, []);

  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem('gitDojo_tutorialSeen', '1');
    setShowPrompt(true);
  }, []);

  const handleBack = useCallback(() => {
    setMode('select');
    setCurrentExercise(null);
    setValidationResult(null);
    setProgressTick(t => t + 1);
  }, []);

  const handleValidate = useCallback((state) => {
    if (!currentExercise) return;
    const result = validateGit(state, currentExercise);
    setValidationResult(result);
    if (result.passed) {
      saveProgress(currentExercise.id, result.stars);
      setProgressTick(t => t + 1);
    }
  }, [currentExercise]);

  if (mode === 'select') {
    return (
      <>
        <ExerciseSelector onBack={onBackToHub} onSelect={handleSelect} onSandbox={handleSandbox} progress={progress} IntroButton={DojoIntroButton} />
        {showDojoIntro && <DojoIntro {...GIT_DOJO_INTRO} onClose={() => setShowDojoIntro(false)} />}
      </>
    );
  }

  return (
    <div className="relative">
      <GitCanvas
        key={mode === 'sandbox' ? 'sandbox' : currentExercise?.id}
        onBack={handleBack}
        exercise={mode === 'sandbox' ? null : currentExercise}
        initialFiles={mode === 'sandbox' ? SANDBOX_FILES : undefined}
        onValidate={mode === 'sandbox' ? null : handleValidate}
      />

      {currentExercise && (
        <div className="fixed top-[52px] left-44 right-0 bg-violet-50 border-b border-violet-200 px-4 py-1.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex shrink-0">
              {Array.from({ length: currentExercise.difficulty }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" aria-hidden="true" />
              ))}
            </div>
            <span className="text-xs font-bold text-violet-800 shrink-0">{currentExercise.title}</span>
            <span className="text-xs text-violet-600 truncate">{currentExercise.description}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowHint(true)}
              className="text-xs text-amber-700 font-medium px-2 py-1 rounded hover:bg-amber-100 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" /> Indice
            </button>
            <button onClick={() => setShowPrompt(true)}
              className="text-xs text-violet-700 font-medium px-2 py-1 rounded hover:bg-violet-100 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Énoncé
            </button>
          </div>
        </div>
      )}

      {showTutorial && <Tutorial onComplete={handleTutorialComplete} />}

      {showDojoIntro && <DojoIntro {...GIT_DOJO_INTRO} onClose={() => setShowDojoIntro(false)} />}

      {showPrompt && currentExercise && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setShowPrompt(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[28rem] max-w-[90vw] modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex">
                {Array.from({ length: currentExercise.difficulty }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" aria-hidden="true" />
                ))}
              </div>
              <h3 className="font-display text-2xl text-violet-800">{currentExercise.title}</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-4 whitespace-pre-line">{currentExercise.prompt}</p>
            <button onClick={() => setShowPrompt(false)} className="w-full py-2.5 rounded-xl bg-violet-500 text-white font-bold hover:bg-violet-600 shadow">C'est parti</button>
          </div>
        </div>
      )}

      {showHint && currentExercise && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setShowHint(false)}>
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-2xl p-5 w-96 modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4" aria-hidden="true" /> Indice
            </h3>
            <p className="text-xs text-amber-700 mb-3">{currentExercise.hint}</p>
            <button onClick={() => setShowHint(false)} className="w-full py-2 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600">Compris</button>
          </div>
        </div>
      )}

      {validationResult && (
        validationResult.passed ? (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setValidationResult(null)}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 text-center modal-content" onClick={e => e.stopPropagation()}>
              <div className="font-display text-3xl text-violet-600 mb-2">Bravo</div>
              <div className="flex justify-center mb-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Star key={i} className={`w-6 h-6 ${i < validationResult.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} aria-hidden="true" />
                ))}
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Ton historique Git respecte l'objectif de l'exercice.
                {validationResult.warnings.length > 0 && (
                  <span className="block text-xs text-amber-600 mt-1">
                    {validationResult.warnings.length} remarque{validationResult.warnings.length > 1 ? 's' : ''} pour atteindre 3 étoiles.
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setValidationResult(null)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Revoir</button>
                <button onClick={() => { setValidationResult(null); handleBack(); }} className="flex-1 py-2 rounded-lg bg-violet-500 text-white font-bold hover:bg-violet-600 shadow">Suivant</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setValidationResult(null)}>
            <div className="bg-white rounded-2xl shadow-2xl p-5 w-[26rem] modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-red-600 mb-3">À revoir</h3>
              <ul className="space-y-1.5 mb-4 max-h-60 overflow-y-auto">
                {validationResult.warnings.map((w, i) => (
                  <li key={i} className={`text-xs flex gap-1.5 ${w.level === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                    <span>{w.level === 'error' ? '❌' : '⚠️'}</span>
                    <span className="flex-1">{w.message}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setValidationResult(null)} className="w-full py-2 rounded-lg bg-slate-500 text-white font-bold hover:bg-slate-600">Continuer</button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
