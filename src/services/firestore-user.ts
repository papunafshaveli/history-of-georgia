import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/firebase";
import type { UserDoc } from "@/src/types";

import { mondayTbilisi } from "@/src/utils/weekStart";

const USERS_COLLECTION = "users";

const buildZeroedDoc = (isAnonymous: boolean): Omit<UserDoc, "createdAt" | "updatedAt"> => ({
  displayName: null,
  photoURL: null,
  isAnonymous,
  totalPoints: 0,
  gamesPlayed: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  bestSingleGameScore: 0,
  weekPoints: 0,
  weekStart: mondayTbilisi(),
  hasSeenSignInNudge: false,
});

export const ensureUserDoc = async (
  uid: string,
  isAnonymous: boolean,
): Promise<void> => {
  const ref = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    ...buildZeroedDoc(isAnonymous),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getUserDoc = async (uid: string): Promise<UserDoc | null> => {
  const ref = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserDoc) : null;
};

export const updateDisplayName = async (
  uid: string,
  displayName: string,
): Promise<void> => {
  const ref = doc(db, USERS_COLLECTION, uid);
  await updateDoc(ref, {
    displayName,
    isAnonymous: false,
    updatedAt: serverTimestamp(),
  });
};

export const updateProviderProfile = async (
  uid: string,
  patch: { displayName?: string | null; photoURL?: string | null },
): Promise<void> => {
  const ref = doc(db, USERS_COLLECTION, uid);
  await updateDoc(ref, {
    ...patch,
    isAnonymous: false,
    updatedAt: serverTimestamp(),
  });
};

export const markSignInNudgeSeen = async (uid: string): Promise<void> => {
  const ref = doc(db, USERS_COLLECTION, uid);
  await updateDoc(ref, {
    hasSeenSignInNudge: true,
    updatedAt: serverTimestamp(),
  });
};
