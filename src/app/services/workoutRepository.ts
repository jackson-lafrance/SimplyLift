import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "../../lib/firebase";
import type { Exercise, Workout } from "../context/appContext";
import {
  getPersistedExerciseTrackingMode,
  migrateExerciseSummary,
  migrateWorkoutToSetGroups,
} from "../utils/exerciseSets";
import type {
  WorkoutRoutine,
  WorkoutRoutineDraft,
  WorkoutRoutineExerciseTemplate,
  WorkoutRoutineUpdate,
  WorkoutSplit,
  WorkoutSplitDraft,
  WorkoutSplitUpdate,
} from "../types/workoutRoutine";

const LEGACY_EXERCISES_KEY = "exercises";
const LEGACY_WORKOUTS_KEY = "pastWorkouts";
const MIGRATION_KEY_PREFIX = "firestoreMigrationComplete";

interface StoredWorkout extends Omit<Workout, "date"> {
  date: Date | Timestamp | string | number;
}

interface FirestoreWorkout {
  name: string;
  time: number;
  date: Timestamp;
  exercises: Exercise[];
  routineId?: string;
  splitId?: string;
  splitDayId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface FirestoreExercise {
  name: string;
  normalizedName: string;
  trackingMode?: Exercise["trackingMode"];
  /** Legacy storage field. New writes should use trackingMode. */
  isUnilateral?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface LegacyFirestoreWorkoutRoutine {
  days?: {
    exercises?: WorkoutRoutineExerciseTemplate[];
  }[];
}

interface FirestoreWorkoutRoutine
  extends Omit<WorkoutRoutine, "id" | "createdAt" | "updatedAt">,
    LegacyFirestoreWorkoutRoutine {
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

interface FirestoreWorkoutSplit
  extends Omit<WorkoutSplit, "id" | "schedule" | "createdAt" | "updatedAt"> {
  schedule?: Partial<WorkoutSplit["schedule"]>;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

const requireFirestore = () => {
  if (!firestore) {
    throw new Error("Firebase is not configured. Add your EXPO_PUBLIC_FIREBASE_* values.");
  }

  return firestore;
};

const isPlainObject = (value: unknown) =>
  !!value &&
  typeof value === "object" &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

const stripUndefinedValues = <T,>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedValues) as T;
  }

  if (isPlainObject(value)) {
    return Object.entries(value as Record<string, unknown>).reduce(
      (cleaned, [key, nestedValue]) => {
        if (nestedValue !== undefined) {
          cleaned[key] = stripUndefinedValues(nestedValue);
        }

        return cleaned;
      },
      {} as Record<string, unknown>,
    ) as T;
  }

  return value;
};

const timestampToDate = (timestamp?: Timestamp | null) =>
  timestamp ? timestamp.toDate() : undefined;

export const normalizeExerciseName = (name: string) => name.trim().toLowerCase();

const exerciseDocId = (name: string) => {
  const normalizedName = normalizeExerciseName(name);
  return encodeURIComponent(normalizedName || "unnamed-exercise");
};

const userDoc = (uid: string) => doc(requireFirestore(), "users", uid);
const workoutsCollection = (uid: string) => collection(userDoc(uid), "workouts");
const exercisesCollection = (uid: string) => collection(userDoc(uid), "exercises");
const workoutRoutinesCollection = (uid: string) =>
  collection(userDoc(uid), "workoutRoutines");
const workoutSplitsCollection = (uid: string) =>
  collection(userDoc(uid), "workoutSplits");

const toWorkoutDate = (date: StoredWorkout["date"]): Date => {
  if (date instanceof Date) return date;
  if (date instanceof Timestamp) return date.toDate();

  return new Date(date);
};

const toFirestoreWorkout = (workout: Workout): FirestoreWorkout => {
  const normalizedWorkout = migrateWorkoutToSetGroups(workout);

  return stripUndefinedValues({
    name: normalizedWorkout.name,
    time: normalizedWorkout.time,
    date: Timestamp.fromDate(normalizedWorkout.date),
    exercises: normalizedWorkout.exercises,
    routineId: normalizedWorkout.routineId,
    splitId: normalizedWorkout.splitId,
    splitDayId: normalizedWorkout.splitDayId,
  });
};

const fromFirestoreWorkout = (id: string, data: FirestoreWorkout): Workout =>
  migrateWorkoutToSetGroups({
    id,
    name: data.name,
    time: data.time,
    date: data.date.toDate(),
    exercises: data.exercises ?? [],
    routineId: data.routineId,
    splitId: data.splitId,
    splitDayId: data.splitDayId,
  });

const normalizeRoutineExerciseTemplate = (
  exercise: WorkoutRoutineExerciseTemplate,
): WorkoutRoutineExerciseTemplate => ({
  id: exercise.id,
  name: exercise.name,
  trackingMode:
    exercise.trackingMode ?? getPersistedExerciseTrackingMode(exercise),
  notes: exercise.notes,
});

const normalizeRoutineExercises = (
  data: FirestoreWorkoutRoutine,
): WorkoutRoutineExerciseTemplate[] => {
  if (Array.isArray(data.exercises)) {
    return data.exercises.map(normalizeRoutineExerciseTemplate);
  }

  return (
    data.days?.flatMap((day) =>
      (day.exercises ?? []).map(normalizeRoutineExerciseTemplate),
    ) ?? []
  );
};

const toFirestoreWorkoutRoutine = (
  routine: WorkoutRoutineDraft,
): Omit<FirestoreWorkoutRoutine, "createdAt" | "updatedAt"> =>
  stripUndefinedValues({
    name: routine.name.trim(),
    exercises: routine.exercises.map(normalizeRoutineExerciseTemplate),
  });

const fromFirestoreWorkoutRoutine = (
  id: string,
  data: FirestoreWorkoutRoutine,
): WorkoutRoutine => ({
  id,
  name: data.name,
  exercises: normalizeRoutineExercises(data),
  createdAt: timestampToDate(data.createdAt),
  updatedAt: timestampToDate(data.updatedAt),
});

const toFirestoreWorkoutSplit = (
  split: WorkoutSplitDraft,
): Omit<FirestoreWorkoutSplit, "createdAt" | "updatedAt"> =>
  stripUndefinedValues({
    name: split.name.trim(),
    isActive: split.isActive,
    currentDayId: split.currentDayId,
    schedule: split.schedule,
    days: split.days,
  });

const normalizeFirestoreSplitSchedule = (
  schedule: FirestoreWorkoutSplit["schedule"],
  days: WorkoutSplit["days"],
): WorkoutSplit["schedule"] => ({
  type: "splitOrder",
  dayIds: schedule?.dayIds?.length
    ? schedule.dayIds
    : days.map((day) => day.id),
});

const fromFirestoreWorkoutSplit = (
  id: string,
  data: FirestoreWorkoutSplit,
): WorkoutSplit => {
  const days = data.days ?? [];

  return {
    id,
    name: data.name,
    isActive: data.isActive ?? false,
    currentDayId: data.currentDayId ?? undefined,
    schedule: normalizeFirestoreSplitSchedule(data.schedule, days),
    days,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
};

const fromStoredWorkout = (workout: StoredWorkout): Workout =>
  migrateWorkoutToSetGroups({
    ...workout,
    date: toWorkoutDate(workout.date),
  });

const workoutImportKey = (workout: Workout) =>
  `${workout.name.trim().toLowerCase()}-${workout.date.getTime()}-${workout.time}`;

export const createUserProfile = async (uid: string, email: string | null) => {
  await setDoc(
    userDoc(uid),
    {
      email,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const watchWorkouts = (
  uid: string,
  onChange: (workouts: Workout[]) => void,
  onError: (error: Error) => void,
) => {
  const workoutsQuery = query(workoutsCollection(uid), orderBy("date", "desc"));

  return onSnapshot(
    workoutsQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((workoutDoc) =>
          fromFirestoreWorkout(
            workoutDoc.id,
            workoutDoc.data() as FirestoreWorkout,
          ),
        ),
      );
    },
    onError,
  );
};

export const watchExercises = (
  uid: string,
  onChange: (exercises: Exercise[]) => void,
  onError: (error: Error) => void,
) => {
  const exercisesQuery = query(exercisesCollection(uid), orderBy("normalizedName", "asc"));

  return onSnapshot(
    exercisesQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((exerciseDoc) => {
          const data = exerciseDoc.data() as FirestoreExercise;
          return migrateExerciseSummary({
            name: data.name,
            trackingMode:
              data.trackingMode ?? getPersistedExerciseTrackingMode(data),
          });
        }),
      );
    },
    onError,
  );
};

export const watchWorkoutRoutines = (
  uid: string,
  onChange: (workoutRoutines: WorkoutRoutine[]) => void,
  onError: (error: Error) => void,
) => {
  const workoutRoutinesQuery = query(
    workoutRoutinesCollection(uid),
    orderBy("updatedAt", "desc"),
  );

  return onSnapshot(
    workoutRoutinesQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((routineDoc) =>
          fromFirestoreWorkoutRoutine(
            routineDoc.id,
            routineDoc.data() as FirestoreWorkoutRoutine,
          ),
        ),
      );
    },
    onError,
  );
};

export const watchWorkoutSplits = (
  uid: string,
  onChange: (workoutSplits: WorkoutSplit[]) => void,
  onError: (error: Error) => void,
) => {
  const workoutSplitsQuery = query(
    workoutSplitsCollection(uid),
    orderBy("updatedAt", "desc"),
  );

  return onSnapshot(
    workoutSplitsQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((splitDoc) =>
          fromFirestoreWorkoutSplit(
            splitDoc.id,
            splitDoc.data() as FirestoreWorkoutSplit,
          ),
        ),
      );
    },
    onError,
  );
};

export const saveCompletedWorkout = async (uid: string, workout: Workout) => {
  await addDoc(workoutsCollection(uid), {
    ...toFirestoreWorkout(workout),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateCompletedWorkout = async (uid: string, workout: Workout) => {
  if (!workout.id) {
    throw new Error("This workout does not have a Firestore id yet.");
  }

  await updateDoc(doc(workoutsCollection(uid), workout.id), {
    ...toFirestoreWorkout(workout),
    updatedAt: serverTimestamp(),
  });
};

export const deleteWorkout = async (uid: string, workoutId: string) => {
  await deleteDoc(doc(workoutsCollection(uid), workoutId));
};

export const createWorkoutRoutine = async (
  uid: string,
  routine: WorkoutRoutineDraft,
) => {
  const routineDoc = await addDoc(workoutRoutinesCollection(uid), {
    ...toFirestoreWorkoutRoutine(routine),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return routineDoc.id;
};

export const updateWorkoutRoutine = async (
  uid: string,
  routineId: string,
  routine: WorkoutRoutineUpdate,
) => {
  const normalizedRoutine = routine.exercises
    ? {
        ...routine,
        exercises: routine.exercises.map(normalizeRoutineExerciseTemplate),
      }
    : routine;

  await setDoc(
    doc(workoutRoutinesCollection(uid), routineId),
    {
      ...stripUndefinedValues(normalizedRoutine),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const deleteWorkoutRoutine = async (uid: string, routineId: string) => {
  await deleteDoc(doc(workoutRoutinesCollection(uid), routineId));
};

export const createWorkoutSplit = async (uid: string, split: WorkoutSplitDraft) => {
  const splitDoc = await addDoc(workoutSplitsCollection(uid), {
    ...toFirestoreWorkoutSplit(split),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return splitDoc.id;
};

export const updateWorkoutSplit = async (
  uid: string,
  splitId: string,
  split: WorkoutSplitUpdate,
) => {
  await setDoc(
    doc(workoutSplitsCollection(uid), splitId),
    {
      ...stripUndefinedValues(split),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const deleteWorkoutSplit = async (uid: string, splitId: string) => {
  await deleteDoc(doc(workoutSplitsCollection(uid), splitId));
};

export const activateWorkoutSplit = async (
  uid: string,
  splitId: string,
  currentDayId?: string,
) => {
  const snapshot = await getDocs(workoutSplitsCollection(uid));
  const batch = writeBatch(requireFirestore());

  snapshot.docs.forEach((splitDoc) => {
    const isSelectedSplit = splitDoc.id === splitId;

    batch.set(
      splitDoc.ref,
      {
        isActive: isSelectedSplit,
        currentDayId: isSelectedSplit ? currentDayId ?? null : null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  await batch.commit();
};

export const deactivateWorkoutSplits = async (uid: string) => {
  const snapshot = await getDocs(workoutSplitsCollection(uid));
  const batch = writeBatch(requireFirestore());

  snapshot.docs.forEach((splitDoc) => {
    batch.set(
      splitDoc.ref,
      {
        isActive: false,
        currentDayId: null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  await batch.commit();
};

const deleteCollectionDocuments = async (
  uid: string,
  collectionName: "workouts" | "exercises" | "workoutRoutines" | "workoutSplits",
) => {
  const collectionRef = collection(userDoc(uid), collectionName);
  const snapshot = await getDocs(collectionRef);

  if (snapshot.empty) return;

  let batch = writeBatch(requireFirestore());
  let operationCount = 0;

  for (const documentSnapshot of snapshot.docs) {
    batch.delete(documentSnapshot.ref);
    operationCount += 1;

    if (operationCount === 450) {
      await batch.commit();
      batch = writeBatch(requireFirestore());
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }
};

export const clearFirestoreWorkoutData = async (uid: string) => {
  await deleteCollectionDocuments(uid, "workouts");
  await deleteCollectionDocuments(uid, "exercises");
  await deleteCollectionDocuments(uid, "workoutRoutines");
  await deleteCollectionDocuments(uid, "workoutSplits");
};

export const upsertExercises = async (uid: string, exercises: Exercise[]) => {
  const uniqueExercises = new Map<string, Exercise>();

  exercises.forEach((exercise) => {
    const normalizedName = normalizeExerciseName(exercise.name);
    if (!normalizedName) return;

    const trackingMode =
      getPersistedExerciseTrackingMode(exercise) ??
      getPersistedExerciseTrackingMode(uniqueExercises.get(normalizedName));

    uniqueExercises.set(normalizedName, {
      name: exercise.name.trim(),
      trackingMode,
    });
  });

  if (!uniqueExercises.size) return;

  const batch = writeBatch(requireFirestore());

  uniqueExercises.forEach((exercise) => {
    const normalizedName = normalizeExerciseName(exercise.name);
    batch.set(
      doc(exercisesCollection(uid), exerciseDocId(exercise.name)),
      {
        name: exercise.name,
        normalizedName,
        trackingMode: exercise.trackingMode ?? "standard",
        isUnilateral: exercise.trackingMode === "leftRight",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  await batch.commit();
};

const parseLegacyExercises = (rawExercises: string | null): Exercise[] => {
  if (!rawExercises) return [];

  try {
    return (JSON.parse(rawExercises) as Exercise[]).map(
      migrateExerciseSummary,
    );
  } catch {
    return [];
  }
};

const parseLegacyWorkouts = (rawWorkouts: string | null): Workout[] => {
  if (!rawWorkouts) return [];

  try {
    return (JSON.parse(rawWorkouts) as StoredWorkout[]).map(fromStoredWorkout);
  } catch {
    return [];
  }
};

export const importLegacyLocalData = async (uid: string) => {
  const migrationKey = `${MIGRATION_KEY_PREFIX}:${uid}`;
  const alreadyMigrated = await AsyncStorage.getItem(migrationKey);

  if (alreadyMigrated) {
    return { importedWorkouts: 0, importedExercises: 0, skipped: true };
  }

  const [rawExercises, rawWorkouts] = await AsyncStorage.multiGet([
    LEGACY_EXERCISES_KEY,
    LEGACY_WORKOUTS_KEY,
  ]);

  const exercises = parseLegacyExercises(rawExercises[1]);
  const workouts = parseLegacyWorkouts(rawWorkouts[1]);

  const existingWorkouts = await getDocs(workoutsCollection(uid));
  const existingWorkoutKeys = new Set(
    existingWorkouts.docs.map((workoutDoc) =>
      workoutImportKey(
        fromFirestoreWorkout(
          workoutDoc.id,
          workoutDoc.data() as FirestoreWorkout,
        ),
      ),
    ),
  );
  const workoutsToImport = workouts.filter(
    (workout) => !existingWorkoutKeys.has(workoutImportKey(workout)),
  );

  for (const workout of workoutsToImport) {
    await saveCompletedWorkout(uid, workout);
  }

  await upsertExercises(uid, [
    ...exercises,
    ...workouts.flatMap((workout) => workout.exercises),
  ]);

  await AsyncStorage.setItem(migrationKey, new Date().toISOString());

  return {
    importedWorkouts: workoutsToImport.length,
    importedExercises: exercises.length,
    skipped: false,
  };
};
