import {
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type {
  Exercise,
  ExerciseListItem,
  UserProfile,
  Workout,
  WorkoutSet,
} from "@/types/domain";

export function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase();
}

export function getExerciseDocumentId(name: string): string {
  return encodeURIComponent(normalizeExerciseName(name));
}

function mapWorkoutSet(rawSet: Partial<WorkoutSet> | undefined): WorkoutSet {
  return {
    reps: Number(rawSet?.reps ?? 0),
    weight: Number(rawSet?.weight ?? 0),
  };
}

function timestampToDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return new Date();
}

export function mapExerciseListDocument(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): ExerciseListItem {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    name: String(data.name ?? ""),
    normalizedName: String(
      data.normalizedName ?? normalizeExerciseName(String(data.name ?? "")),
    ),
    isArchived: Boolean(data.isArchived),
  };
}

export function mapWorkoutDocument(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): Workout {
  const data = snapshot.data();
  const exercises = Array.isArray(data.exercises) ? data.exercises : [];

  return {
    id: snapshot.id,
    name: String(data.name ?? "Untitled Workout"),
    time: Number(data.durationMs ?? 0),
    date: timestampToDate(data.performedAt),
    source: data.source === "terminal" ? "terminal" : "mobile",
    exercises: exercises.map((exercise: Partial<Exercise>, index: number) => ({
      exerciseId:
        typeof exercise.exerciseId === "string" ? exercise.exerciseId : null,
      name: String(exercise.name ?? `Exercise ${index + 1}`),
      normalizedName:
        typeof exercise.normalizedName === "string"
          ? exercise.normalizedName
          : normalizeExerciseName(String(exercise.name ?? "")),
      sets: Array.isArray(exercise.sets)
        ? exercise.sets.map((set) => mapWorkoutSet(set))
        : [],
    })),
  };
}

export function mapUserProfileDocument(
  uid: string,
  data: DocumentData | undefined,
): UserProfile {
  return {
    uid,
    email: typeof data?.email === "string" ? data.email : null,
    displayName: typeof data?.displayName === "string" ? data.displayName : null,
    units: data?.units === "kg" ? "kg" : "lbs",
    createdAt: timestampToDate(data?.createdAt),
    updatedAt: timestampToDate(data?.updatedAt),
    lastActiveAt: timestampToDate(data?.lastActiveAt),
  };
}

export function toWorkoutDocument(
  workout: Workout,
  exerciseList: ExerciseListItem[],
) {
  const exerciseLookup = new Map(
    exerciseList.map((exercise) => [exercise.normalizedName, exercise]),
  );

  return {
    name: workout.name.trim() || "Untitled Workout",
    performedAt: Timestamp.fromDate(workout.date),
    durationMs: workout.time,
    exerciseCount: workout.exercises.length,
    source: workout.source,
    exercises: workout.exercises.map((exercise, index) => {
      const normalizedName = normalizeExerciseName(exercise.name);
      const existingExercise = exerciseLookup.get(normalizedName);

      return {
        exerciseId: existingExercise?.id ?? null,
        name: exercise.name.trim(),
        normalizedName,
        order: index,
        sets: (exercise.sets ?? []).map((set) => mapWorkoutSet(set)),
      };
    }),
  };
}
