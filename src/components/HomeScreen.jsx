import { useState, useEffect, useMemo } from 'react';
import { getProgress, setUnlockAll, isTierUnlocked, isExerciseCompleted } from '../utils/progress';

const TIERS = [
  { id: 'beginner', name: 'Débutant', stars: 1, color: 'emerald' },
  { id: 'intermediate', name: 'Intermédiaire', stars: 2, color: 'amber' },
  { id: 'expert', name: 'Expert', stars: 3, color: 'rose' },
];

export default function HomeScreen({ exercises, onSelectExercise }) {
  const [unlockAll, setUnlockAllState] = useState(false);
  const [completedExercises, setCompletedExercises] = useState([]);

  useEffect(() => {
    const progress = getProgress();
    setUnlockAllState(progress.unlockAll);
    setCompletedExercises(progress.completed);
  }, []);

  const exercisesByTier = useMemo(() => {
    return {
      beginner: exercises.filter(e => e.difficulty === 1),
      intermediate: exercises.filter(e => e.difficulty === 2),
      expert: exercises.filter(e => e.difficulty === 3),
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

  const totalCompleted = completedExercises.length;
  const totalExercises = exercises.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
            DATA DOJO
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            L'art de la transformation de données
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
                style={{ width: `${(totalCompleted / totalExercises) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Unlock All Toggle */}
        <div className="flex justify-end mb-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-slate-600">Tout débloquer</span>
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
          const tierExercises = exercisesByTier[tier.id];
          const tierUnlocked = isTierUnlocked(tier.id, exercisesByTier);
          const completedInTier = tierExercises.filter(e => completedExercises.includes(e.id)).length;

          return (
            <div key={tier.id} className="mb-8">
              {/* Tier Header */}
              <div className={`flex items-center gap-3 mb-4 ${!tierUnlocked ? 'opacity-50' : ''}`}>
                <div className="flex">
                  {Array.from({ length: tier.stars }).map((_, i) => (
                    <span key={i} className="text-2xl">⭐</span>
                  ))}
                </div>
                <h2 className="text-xl font-bold text-slate-700">
                  {tier.name}
                </h2>
                <span className="text-sm text-slate-500 font-medium">
                  ({completedInTier}/{tierExercises.length})
                </span>
                {!tierUnlocked && (
                  <span className="ml-2 text-2xl">🔒</span>
                )}
              </div>

              {/* Exercise Grid */}
              <div className="grid grid-cols-6 gap-3">
                {tierExercises.map((exercise, index) => {
                  const isCompleted = completedExercises.includes(exercise.id);
                  const exerciseNumber = index + 1 + (tier.id === 'intermediate' ? 6 : tier.id === 'expert' ? 12 : 0);

                  return (
                    <button
                      key={exercise.id}
                      onClick={() => handleExerciseClick(exercise, tierUnlocked)}
                      disabled={!tierUnlocked}
                      className={`
                        relative aspect-square rounded-xl border-3 transition-all
                        flex flex-col items-center justify-center gap-1
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
                      <span className={`text-2xl font-bold ${
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
                          <span className="text-lg">✓</span>
                        ) : (
                          <span className="text-xs text-slate-400 truncate max-w-full px-1">
                            {exercise.title.slice(0, 10)}
                          </span>
                        )
                      ) : (
                        <span className="text-lg">🔒</span>
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
  );
}
