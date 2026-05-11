import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getRequiredDb } from "@/firebase/db";
import type { Exercise, ExerciseListItem } from "@/types/domain";
import {
  getExerciseDocumentId,
  mapExerciseListDocument,
  normalizeExerciseName,
} from "./mappers";

export async function listExerciseList(uid: string): Promise<ExerciseListItem[]> {
  const db = getRequiredDb();
  const exerciseQuery = query(
    collection(db, "userProfiles", uid, "exerciseLists"),
    orderBy("normalizedName", "asc"),
  );
  const snapshot = await getDocs(exerciseQuery);

  return snapshot.docs.map(mapExerciseListDocument);
}

export async function upsertExerciseListEntries(
  uid: string,
  exercises: Exercise[],
): Promise<ExerciseListItem[]> {
  const db = getRequiredDb();
  const uniqueExercises = new Map<string, string>();

  for (const exercise of exercises) {
    const trimmedName = exercise.name.trim();
    const normalizedName = normalizeExerciseName(trimmedName);

    if (!trimmedName || uniqueExercises.has(normalizedName)) {
      continue;
    }

    uniqueExercises.set(normalizedName, trimmedName);
  }

  for (const [normalizedName, name] of uniqueExercises.entries()) {
    const exerciseRef = doc(
      db,
      "userProfiles",
      uid,
      "exerciseLists",
      getExerciseDocumentId(normalizedName),
    );
    const existingSnapshot = await getDoc(exerciseRef);

    if (existingSnapshot.exists()) {
      await setDoc(
        exerciseRef,
        {
          name,
          normalizedName,
          isArchived: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      await setDoc(exerciseRef, {
        name,
        normalizedName,
        isArchived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  return listExerciseList(uid);
}
