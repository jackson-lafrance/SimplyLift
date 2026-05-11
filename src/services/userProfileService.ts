import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getRequiredDb } from "@/firebase/db";
import type { UserProfile } from "@/types/domain";
import { mapUserProfileDocument } from "./mappers";

export async function upsertUserProfile(user: User): Promise<UserProfile> {
  const db = getRequiredDb();
  const profileRef = doc(db, "userProfiles", user.uid);
  const existingSnapshot = await getDoc(profileRef);

  if (existingSnapshot.exists()) {
    await setDoc(
      profileRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      },
      { merge: true },
    );
  } else {
    await setDoc(profileRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      units: "lbs",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });
  }

  const nextSnapshot = await getDoc(profileRef);
  return mapUserProfileDocument(user.uid, nextSnapshot.data());
}
