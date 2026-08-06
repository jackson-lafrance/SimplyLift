interface NamedExercise {
  name: string;
}

interface WorkoutWithExercises {
  exercises: NamedExercise[];
}

const normalizeExerciseName = (name: string) => name.trim().toLowerCase();

/**
 * Keeps the saved exercise metadata that still has an exercise entry in a
 * completed workout. Saved exercise documents are retained for sync and
 * migration purposes, so consumers should use this view when displaying or
 * suggesting exercises.
 */
export const filterExercisesWithWorkoutHistory = <
  T extends NamedExercise,
>(
  exercises: readonly T[],
  workouts: readonly WorkoutWithExercises[],
): T[] => {
  const usedExerciseNames = new Set(
    workouts.flatMap((workout) =>
      workout.exercises
        .map((exercise) => normalizeExerciseName(exercise.name))
        .filter(Boolean),
    ),
  );

  return exercises.filter((exercise) =>
    usedExerciseNames.has(normalizeExerciseName(exercise.name)),
  );
};
