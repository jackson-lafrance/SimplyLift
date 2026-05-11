import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseApp } from "./auth";
import { firebaseConfigurationError } from "./config";

export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;

export function getRequiredDb(): Firestore {
  if (!db) {
    throw new Error(firebaseConfigurationError ?? "Firestore is not configured.");
  }

  return db;
}
