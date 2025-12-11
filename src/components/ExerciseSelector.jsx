/**
 * ExerciseSelector - Dropdown to select exercises
 */
export default function ExerciseSelector({
  exercises,
  currentExerciseId,
  onSelectExercise,
}) {
  const getDifficultyStars = (difficulty) => {
    return '⭐'.repeat(difficulty);
  };

  return (
    <div className="relative">
      <select
        value={currentExerciseId}
        onChange={(e) => onSelectExercise(e.target.value)}
        className="appearance-none bg-white/90 backdrop-blur border-2 border-white/50 rounded-xl px-4 py-3 pr-10 font-medium text-gray-700 cursor-pointer hover:border-white transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        {exercises.map((exercise) => (
          <option key={exercise.id} value={exercise.id}>
            {getDifficultyStars(exercise.difficulty)} {exercise.title}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
        ▼
      </div>
    </div>
  );
}
