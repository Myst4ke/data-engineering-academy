import { useState, useEffect, useMemo, useRef } from 'react';
import { getProgress, setUnlockAll, isTierUnlocked, isExerciseCompleted, getBestRating } from '../utils/progress';
import ExercisePreview from './ExercisePreview';

const TIERS = [
  { id: 'beginner', name: 'Debutant', stars: 1, color: 'emerald' },
  { id: 'intermediate', name: 'Intermediaire', stars: 2, color: 'amber' },
  { id: 'hard', name: 'Difficile', stars: 3, color: 'rose' },
  { id: 'expert', name: 'Expert', stars: 4, color: 'purple' },
];

const TIER_OFFSETS = {
  beginner: 0,
  intermediate: 6,
  hard: 18,
  expert: 30,
};

export default function HomeScreen({ exercises, onSelectExercise, onSandbox }) {
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

  const exercisesByTier = useMemo(() => {
    return {
      beginner: exercises.filter(e => e.difficulty === 1),
      intermediate: exercises.filter(e => e.difficulty === 2),
      hard: exercises.filter(e => e.difficulty === 3),
      expert: exercises.filter(e => e.difficulty === 4),
    };
  }, [exercises]);

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
    hoverTimerRef.current = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect();
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

  return (
    <div className="home-view min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
            DATA DOJO
          </h1>
          <p className="text-slate-500 text-sm sm:text-lg font-medium">
            L'art de la transformation de donnees
          </p>

          {/* Progress bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
              <span>Progression</span>
              <span className="font-semibold">{totalCompleted}/{totalExercises}</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${totalExercises > 0 ? (totalCompleted / totalExercises) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Unlock All Toggle + Sandbox */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onSandbox}
            className="game-btn px-4 py-2 text-sm font-semibold text-indigo-600 flex items-center gap-2"
          >
            Bac a sable
          </button>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-slate-600">Tout debloquer</span>
            <button
              onClick={handleToggleUnlock}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                unlockAll ? 'bg-indigo-500' : 'bg-slate-300'
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

        {/* Tiers */}
        {TIERS.map((tier) => {
          const tierExercises = exercisesByTier[tier.id] || [];
          const tierUnlocked = isTierUnlocked(tier.id, exercisesByTier);
          const completedInTier = tierExercises.filter(e => completedExercises.includes(e.id)).length;
          const offset = TIER_OFFSETS[tier.id] || 0;

          return (
            <div key={tier.id} className="mb-8">
              {/* Tier Header */}
              <div className={`flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4 ${!tierUnlocked ? 'opacity-50' : ''}`}>
                <div className="flex">
                  {Array.from({ length: tier.stars }).map((_, i) => (
                    <span key={i} className="text-lg sm:text-2xl">{'\u2B50'}</span>
                  ))}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-700">
                  {tier.name}
                </h2>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  ({completedInTier}/{tierExercises.length})
                </span>
                {!tierUnlocked && (
                  <span className="ml-1 sm:ml-2 text-lg sm:text-2xl">{'\uD83D\uDD12'}</span>
                )}
              </div>

              {/* Exercise Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
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
                      className={`
                        relative aspect-square rounded-xl border-2 sm:border-3 transition-all
                        flex flex-col items-center justify-center gap-0.5 sm:gap-1 p-2
                        ${tierUnlocked
                          ? isCompleted
                            ? 'bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-400 hover:scale-105 cursor-pointer shadow-md'
                            : 'bg-white border-slate-200 hover:border-indigo-400 hover:scale-105 cursor-pointer shadow-md hover:shadow-lg'
                          : 'bg-slate-100 border-slate-200 cursor-not-allowed'
                        }
                      `}
                      title={exercise.title}
                    >
                      {/* Exercise Number */}
                      <span className={`text-xl sm:text-2xl font-bold ${
                        tierUnlocked
                          ? isCompleted
                            ? 'text-emerald-600'
                            : 'text-slate-700'
                          : 'text-slate-400'
                      }`}>
                        {exerciseNumber}
                      </span>

                      {/* Status Icon */}
                      {tierUnlocked ? (
                        isCompleted ? (
                          <div className="flex flex-col items-center">
                            <span className="text-base sm:text-lg">{'\u2713'}</span>
                            {bestRating > 0 && (
                              <div className="flex gap-0.5">
                                {Array.from({ length: 3 }, (_, i) => (
                                  <span key={i} className={`text-[8px] ${i < bestRating ? '' : 'opacity-30'}`}>
                                    {i < bestRating ? '\u2B50' : '\u2606'}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] sm:text-xs text-slate-400 text-center leading-tight">
                            {exercise.title}
                          </span>
                        )
                      ) : (
                        <span className="text-base sm:text-lg">{'\uD83D\uDD12'}</span>
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
