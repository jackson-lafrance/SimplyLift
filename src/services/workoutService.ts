import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getRequiredDb } from "@/firebase/db";
import type { ExerciseListItem, Workout } from "@/types/domain";
import { mapWorkoutDocument, toWorkoutDocument } from "./mappers";

export async function listWorkouts(uid: string): Promise<Workout[]> {
  const db = getRequiredDb();
  const workoutQuery = query(
    collection(db, "userProfiles", uid, "workouts"),
    orderBy("performedAt", "desc"),
  );
  const snapshot = await getDocs(workoutQuery);

  return snapshot.docs.map(mapWorkoutDocument);
}

export async function saveWorkout(
  uid: string,
  workout: Workout,
  exerciseList: ExerciseListItem[],
): Promise<Workout> {
  const db = getRequiredDb();
  const workoutRef = doc(collection(db, "userProfiles", uid, "workouts"));
  const workoutPayload = toWorkoutDocument(workout, exerciseList);

  await setDoc(workoutRef, {
    ...workoutPayload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    ...workout,
    id: workoutRef.id,
    name: workoutPayload.name,
    exercises: workoutPayload.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      normalizedName: exercise.normalizedName,
      sets: exercise.sets,
    })),
  };
}

export async function deleteWorkout(uid: string, workoutId: string): Promise<void> {
  const db = getRequiredDb();
  await deleteDoc(doc(db, "userProfiles", uid, "workouts", workoutId));
}
