import type { Workout } from "../context/appContext";

/** Format a workout duration for the editor and the workout timer. */
export const formatWorkoutDuration = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}`;
};

/**
 * Parse the HH:MM:SS value used by the duration editor.
 * Returns null while the user is entering an incomplete or invalid value.
 */
export const parseWorkoutDuration = (value: string): number | null => {
  const parts = value.trim().split(":");

  if (parts.length !== 3 || parts.some((part) => !/^\d{1,3}$/.test(part))) {
    return null;
  }

  const [hoursText, minutesText, secondsText] = parts;
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  const seconds = Number(secondsText);

  if (minutes > 59 || seconds > 59) return null;

  return (hours * 3600 + minutes * 60 + seconds) * 1000;
};

export const cloneWorkout = (workout: Workout): Workout => ({
  ...workout,
  date: new Date(workout.date),
  exercises: workout.exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets?.map((set) => ({ ...set })),
  })),
});

export const isSameWorkout = (left: Workout, right: Workout) => {
  if (left.id && right.id) return left.id === right.id;

  return (
    left.name === right.name && left.date.getTime() === right.date.getTime()
  );
};

export const replaceWorkout = (
  workouts: Workout[],
  originalWorkout: Workout,
  updatedWorkout: Workout,
) =>
  workouts.map((workout) =>
    isSameWorkout(workout, originalWorkout) ? updatedWorkout : workout,
  );
