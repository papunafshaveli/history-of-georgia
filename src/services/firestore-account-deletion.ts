import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/firebase";

const USERS_COLLECTION = "users";
const GAME_RESULTS_COLLECTION = "game_results";
const PUSH_TOKENS_COLLECTION = "push_tokens";

// Firestore caps writeBatch at 500 operations.
const BATCH_LIMIT = 500;

const deleteDocsInBatches = async (
  docs: { ref: import("firebase/firestore").DocumentReference }[],
): Promise<void> => {
  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const chunk = docs.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
};

/**
 * Cascading client-side cleanup for the user-initiated account-deletion
 * flow (Settings → "Delete account & sign out", per INFRASTRUCTURE.md
 * §17.4). Deletes ALL of:
 *   - `push_tokens` docs uid-tagged with this uid (covers other-device
 *     tokens — `unregisterNotifications()` only handles the local one).
 *   - `game_results` docs where `userId == uid`.
 *   - The `users/{uid}` doc.
 *
 * Push tokens are deleted first so a partial failure leaves
 * `users/{uid}` alive as a retry handle. Once `users/{uid}` is gone, the
 * Firestore rule on `push_tokens` (owner uid match) still allows the
 * client to clean up tokens it owns — but only while signed in. Hence
 * the order.
 */
export const deleteUserData = async (uid: string): Promise<void> => {
  // 1. Push tokens — query by uid (added to the schema 2026-05-03 so
  //    the inactive-user cleanup Cloud Function and this user-initiated
  //    flow can both find them server-side without scanning the whole
  //    collection).
  const pushTokensQuery = query(
    collection(db, PUSH_TOKENS_COLLECTION),
    where("uid", "==", uid),
  );
  const pushTokensSnap = await getDocs(pushTokensQuery);
  if (pushTokensSnap.docs.length > 0) {
    await deleteDocsInBatches(pushTokensSnap.docs);
  }

  // 2. game_results — chunked.
  const resultsQuery = query(
    collection(db, GAME_RESULTS_COLLECTION),
    where("userId", "==", uid),
  );
  const resultsSnap = await getDocs(resultsQuery);
  await deleteDocsInBatches(resultsSnap.docs);

  // 3. users/{uid} — last so its presence is the retry handle for any
  //    earlier step that crashed.
  const userBatch = writeBatch(db);
  userBatch.delete(doc(db, USERS_COLLECTION, uid));
  await userBatch.commit();
};
