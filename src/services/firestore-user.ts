import AsyncStorage from "@react-native-async-storage/async-storage";
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

// `lastSeenAt` is the load-bearing signal for the inactive-user cleanup
// Cloud Function (`pruneInactiveUsers`). We refresh it at most once per
// week per *uid* (not per device) so a user's throttle window never
// hides their activity behind another uid that signed in on the same
// device — see INFRASTRUCTURE.md §17.3.
const LAST_SEEN_LOCAL_KEY_PREFIX = "lastSeen:syncedAt:v2:";
const LAST_SEEN_THROTTLE_MS = 7 * 24 * 60 * 60 * 1000;

const lastSeenLocalKey = (uid: string): string =>
  `${LAST_SEEN_LOCAL_KEY_PREFIX}${uid}`;

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

/**
 * Writes `users/{uid}.lastSeenAt = serverTimestamp()` at most once every 7
 * days *per uid*. Drives the 180-day inactive-user cleanup Cloud Function
 * — see INFRASTRUCTURE.md §17.3.
 *
 * The throttle cache key includes the uid so that multi-account flows on
 * a single device (sign in as A, sign out → fresh anon B, switch back) do
 * not let one uid's recent throttle hide another uid's activity. Each uid
 * has an independent cache entry.
 *
 * Cache key prefix is bumped to v2 to invalidate the previous device-wide
 * key — first sign-in after the new binary writes a fresh per-uid entry.
 *
 * Fire-and-forget: a transient failure here just means `lastSeenAt` isn't
 * advanced this session, the cache isn't updated, and the next open
 * retries. No user-visible impact.
 */
export const touchLastSeen = async (uid: string): Promise<void> => {
  const key = lastSeenLocalKey(uid);
  const cachedRaw = await AsyncStorage.getItem(key);
  const cachedMs = cachedRaw ? Number(cachedRaw) : 0;
  const elapsed = Date.now() - cachedMs;

  // Skip only when the cached timestamp is in the past AND inside the
  // throttle window. A negative `elapsed` (cached timestamp is in the
  // future, e.g. clock skew, manual time change, restored AsyncStorage
  // from another device) or NaN (corrupted cache) falls through and
  // forces a fresh write — otherwise an active user's `lastSeenAt` could
  // freeze and they'd be deleted as inactive.
  if (elapsed >= 0 && elapsed < LAST_SEEN_THROTTLE_MS) return;

  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    lastSeenAt: serverTimestamp(),
  });
  await AsyncStorage.setItem(key, String(Date.now()));
};

// Exported for tests.
export const __TEST_LAST_SEEN_INTERNALS = {
  LAST_SEEN_LOCAL_KEY_PREFIX,
  LAST_SEEN_THROTTLE_MS,
  lastSeenLocalKey,
};
