import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/firebase";
import {
  LeaderboardTab,
  type LeaderboardEntry,
  type UserDoc,
} from "@/src/types";

import { mondayTbilisi } from "@/src/utils/weekStart";

const USERS_COLLECTION = "users";
const LEADERBOARD_LIMIT = 20;

const buildEntry = (
  uid: string,
  data: UserDoc,
  rank: number,
  tab: LeaderboardTab,
): LeaderboardEntry => ({
  uid,
  displayName: data.displayName ?? "",
  photoURL: data.photoURL,
  rank,
  points: tab === LeaderboardTab.WEEKLY ? data.weekPoints : data.totalPoints,
  gamesPlayed: data.gamesPlayed,
});

export const getLeaderboard = async (
  tab: LeaderboardTab,
): Promise<LeaderboardEntry[]> => {
  const usersRef = collection(db, USERS_COLLECTION);

  const q =
    tab === LeaderboardTab.WEEKLY
      ? query(
          usersRef,
          where("displayName", "!=", null),
          where("weekStart", "==", mondayTbilisi()),
          orderBy("weekPoints", "desc"),
          limit(LEADERBOARD_LIMIT),
        )
      : query(
          usersRef,
          where("displayName", "!=", null),
          orderBy("totalPoints", "desc"),
          orderBy("gamesPlayed", "asc"),
          limit(LEADERBOARD_LIMIT),
        );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc, index) =>
    buildEntry(doc.id, doc.data() as UserDoc, index + 1, tab),
  );
};
