import { useState, useEffect, useMemo, useRef } from 'react';
import { Star, Lock, Check, Sparkles } from 'lucide-react';
import { getProgress, setUnlockAll, isTierUnlocked, getBestRating } from '../utils/progress';
import ExercisePreview from './ExercisePreview';
import BackButton from './BackButton';

const TIERS = [
  { id: 'beginner',     name: 'Débutant',       stars: 1, cls: 'tier-t1' },
  { id: 'intermediate', name: 'Intermédiaire',  stars: 2, cls: 'tier-t2' },
  { id: 'hard',         name: 'Difficile',      stars: 3, cls: 'tier-t3' },
  { id: 'expert',       name: 'Expert',         stars: 4, cls: 'tier-t4' },
];

const TIER_OFFSETS = {
  beginner: 0,
  intermediate: 6,
  hard: 18,
  expert: 30,
};

const TIER_STAR_COLOR = {
  'tier-t1': 'text-[#9CA3AF]',
  'tier-t2': 'text-[#60A5FA]',
  'tier-t3': 'text-[#C084FC]',
  'tier-t4': 'text-[#F59E0B]',
};

const TIER_NAME_COLOR = {
  'tier-t1': 'text-[#4B5563]',
  'tier-t2': 'text-[#2563EB]',
  'tier-t3': 'text-[#9333EA]',
  'tier-t4': 'text-[#B45309]',
};

const TIER_DONE_CHECK = {
  'tier-t1': 'text-[#4B5563]',
  'tier-t2': 'text-[#1E40AF]',
  'tier-t3': 'text-[#6D28D9]',
  'tier-t4': 'text-[#92400E]',
};

export default function HomeScreen({ exercises, onSelectExercise, onSandbox, onBackToHub, introButton }) {
  const [unlockAll, setUnlockAllState] = useState(false);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [hoveredExercise, setHoveredExercise] = useState(null);
  const [hoverRect, setHoverRect] = useState(null);
  const hoverTimerRef = useRef(null);

  useEffect(() => {
    const progress = getProgress();
    setUnlockAllState(progress.unlockAll);
    setCompletedExercises(progress.completed);
  }, []);

  const exercisesByTier = useMemo(() => ({
    beginner:     exercises.filter(e => e.difficulty === 1),
    intermediate: exercises.filter(e => e.difficulty === 2),
    hard:         exercises.filter(e => e.difficulty === 3),
    expert:       exercises.filter(e => e.difficulty === 4),
  }), [exercises]);

  const handleToggleUnlock = () => {
    const newValue = !unlockAll;
    setUnlockAllState(newValue);
    setUnlockAll(newValue);
  };

  const handleExerciseClick = (exercise, tierUnlocked) => {
    if (!tierUnlocked) return;
    onSelectExercise(exercise.id);
  };

  const handleExerciseHover = (exercise, e) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    hoverTimerRef.current = setTimeout(() => {
      setHoveredExercise(exercise.id);
      setHoverRect(rect);
    }, 300);
  };

  const handleExerciseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredExercise(null);
    setHoverRect(null);
  };

  const totalCompleted = completedExercises.length;
  const totalExercises = exercises.length;
  const progressPct = totalExercises > 0 ? (totalCompleted / totalExercises) * 100 : 0;

  return (
    <div className="home-view p-4 sm:p-6 pb-12 relative">
      <div className="max-w-4xl mx-auto">
        {/* Back to hub */}
        {onBackToHub && (
          <div className="mb-5">
            <BackButton onClick={onBackToHub} label="Modules" ariaLabel="Retour à la liste des modules" />
          </div>
        )}

        {/* HERO */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="font-display text-3xl sm:text-5xl text-[#2B2D42] tracking-tight">
              Data <span className="font-display-italic text-[#FF8066]">Dojo</span>
            </h1>
            {introButton}
          </div>
          <p className="text-[#5A6072] text-sm sm:text-base font-medium">
            L'art de la transformation de données.
          </p>

          {/* Progress bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5A6072] mb-1.5">
              <span>Progression</span>
              <span className="text-[#2B2D42]">{totalCompleted} / {totalExercises}</span>
            </div>
            <div className="h-2.5 bg-[#F4EADB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF8066] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sandbox + Tout débloquer */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <button
            onClick={onSandbox}
            className="game-btn px-4 py-2 text-sm font-bold text-[#E85D41] flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Bac à sable
          </button>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span id="unlock-all-label" className="text-sm text-[#5A6072] font-semibold">Tout débloquer</span>
            <button
              onClick={handleToggleUnlock}
              role="switch"
              aria-checked={unlockAll}
              aria-labelledby="unlock-all-label"
              className={`relative w-12 h-6 rounded-full transition-colors ${
                unlockAll ? 'bg-[#FF8066]' : 'bg-[#E4D9C5]'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  unlockAll ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>

        {/* TIERS */}
        {TIERS.map((tier) => {
          const tierExercises = exercisesByTier[tier.id] || [];
          const tierUnlocked = isTierUnlocked(tier.id, exercisesByTier);
          const completedInTier = tierExercises.filter(e => completedExercises.includes(e.id)).length;
          const offset = TIER_OFFSETS[tier.id] || 0;

          return (
            <div key={tier.id} className={`mb-10 ${tier.cls}`}>
              {/* Tier Header */}
              <div className={`flex flex-wrap items-center gap-3 mb-4 ${!tierUnlocked ? 'opacity-55' : ''}`}>
                <h2 className={`font-display text-lg sm:text-xl ${TIER_NAME_COLOR[tier.cls]}`}>
                  {tier.name}
                </h2>
                <div className="flex" aria-label={`Niveau ${tier.stars} étoile${tier.stars > 1 ? 's' : ''}`}>
                  {Array.from({ length: tier.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${TIER_STAR_COLOR[tier.cls]} fill-current`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                {!tierUnlocked && (
                  <span className="inline-flex items-center gap-1 text-xs bg-[#E4D9C5]/60 text-[#5A6072] px-2.5 py-0.5 rounded-full font-bold">
                    <Lock className="w-3 h-3" aria-hidden="true" /> Verrouillé
                  </span>
                )}
                <span className="text-xs sm:text-sm text-[#9CA3AF] font-bold ml-auto">
                  {completedInTier} / {tierExercises.length}
                </span>
              </div>

              {/* Exercise Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {tierExercises.map((exercise, index) => {
                  const isCompleted = completedExercises.includes(exercise.id);
                  const exerciseNumber = index + 1 + offset;
                  const bestRating = getBestRating(exercise.id);

                  return (
                    <button
                      key={exercise.id}
                      onClick={() => handleExerciseClick(exercise, tierUnlocked)}
                      onMouseEnter={(e) => tierUnlocked && handleExerciseHover(exercise, e)}
                      onMouseLeave={handleExerciseLeave}
                      disabled={!tierUnlocked}
                      className={`ex-card flex flex-col items-center justify-center gap-1 p-2 ${
                        isCompleted ? 'done' : ''
                      } ${!tierUnlocked ? 'locked' : ''}`}
                      title={exercise.title}
                    >
                      {/* Exercise Number */}
                      <span className="text-xl sm:text-2xl font-bold text-[#2B2D42]">
                        {exerciseNumber}
                      </span>

                      {/* Status Icon */}
                      {tierUnlocked ? (
                        isCompleted ? (
                          <>
                            <Check
                              className={`absolute top-1.5 right-1.5 w-3.5 h-3.5 ${TIER_DONE_CHECK[tier.cls]}`}
                              strokeWidth={3}
                              aria-label="Terminé"
                            />
                            {bestRating > 0 && (
                              <div className="flex gap-0.5 mt-0.5" aria-label={`${bestRating} étoiles sur 3`}>
                                {Array.from({ length: 3 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${i < bestRating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#E4D9C5]'}`}
                                    aria-hidden="true"
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] sm:text-xs text-[#5A6072] text-center leading-tight font-sans font-medium">
                            {exercise.title}
                          </span>
                        )
                      ) : (
                        <Lock className="w-4 h-4 text-[#9CA3AF]" aria-label="Verrouillé" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Exercise Preview Tooltip */}
      {hoveredExercise && (
        <ExercisePreview
          exerciseId={hoveredExercise}
          anchorRect={hoverRect}
          onClose={() => setHoveredExercise(null)}
        />
      )}
    </div>
  );
}
