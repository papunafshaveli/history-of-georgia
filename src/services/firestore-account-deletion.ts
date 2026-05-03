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

// Firestore caps writeBatch at 500 operations. Reserve one slot for the
// users/{uid} delete in the final chunk so it commits transactionally with
// the last set of game_results deletes.
const BATCH_LIMIT = 499;

export const deleteUserData = async (uid: string): Promise<void> => {
  const resultsQuery = query(
    collection(db, GAME_RESULTS_COLLECTION),
    where("userId", "==", uid),
  );
  const resultsSnapshot = await getDocs(resultsQuery);
  const userRef = doc(db, USERS_COLLECTION, uid);

  if (resultsSnapshot.docs.length === 0) {
    const batch = writeBatch(db);
    batch.delete(userRef);
    await batch.commit();
    return;
  }

  for (let i = 0; i < resultsSnapshot.docs.length; i += BATCH_LIMIT) {
    const chunk = resultsSnapshot.docs.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach((docSnap) => batch.delete(docSnap.ref));

    const isLastChunk = i + BATCH_LIMIT >= resultsSnapshot.docs.length;
    if (isLastChunk) {
      batch.delete(userRef);
    }

    await batch.commit();
  }
};
