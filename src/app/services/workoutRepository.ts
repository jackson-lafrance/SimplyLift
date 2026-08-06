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
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface FirestoreExercise {
  name: string;
  normalizedName: string;
  isUnilateral?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

const requireFirestore = () => {
  if (!firestore) {
    throw new Error("Firebase is not configured. Add your EXPO_PUBLIC_FIREBASE_* values.");
  }

  return firestore;
};

export const normalizeExerciseName = (name: string) => name.trim().toLowerCase();

const exerciseDocId = (name: string) => {
  const normalizedName = normalizeExerciseName(name);
  return encodeURIComponent(normalizedName || "unnamed-exercise");
};

const userDoc = (uid: string) => doc(requireFirestore(), "users", uid);
const workoutsCollection = (uid: string) => collection(userDoc(uid), "workouts");
const exercisesCollection = (uid: string) => collection(userDoc(uid), "exercises");

const toWorkoutDate = (date: StoredWorkout["date"]): Date => {
  if (date instanceof Date) return date;
  if (date instanceof Timestamp) return date.toDate();

  return new Date(date);
};

const toFirestoreWorkout = (workout: Workout): FirestoreWorkout => ({
  name: workout.name,
  time: workout.time,
  date: Timestamp.fromDate(workout.date),
  exercises: workout.exercises,
});

const fromFirestoreWorkout = (id: string, data: FirestoreWorkout): Workout => ({
  id,
  name: data.name,
  time: data.time,
  date: data.date.toDate(),
  exercises: data.exercises ?? [],
});

const fromStoredWorkout = (workout: StoredWorkout): Workout => ({
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
          return {
            name: data.name,
            isUnilateral: data.isUnilateral,
          };
        }),
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

const deleteCollectionDocuments = async (
  uid: string,
  collectionName: "workouts" | "exercises",
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
};

export const upsertExercises = async (uid: string, exercises: Exercise[]) => {
  const uniqueExercises = new Map<string, Exercise>();

  exercises.forEach((exercise) => {
    const normalizedName = normalizeExerciseName(exercise.name);
    if (!normalizedName) return;
    uniqueExercises.set(normalizedName, {
      name: exercise.name.trim(),
      isUnilateral:
        exercise.isUnilateral ?? uniqueExercises.get(normalizedName)?.isUnilateral,
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
        isUnilateral: exercise.isUnilateral ?? false,
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
    return JSON.parse(rawExercises) as Exercise[];
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
