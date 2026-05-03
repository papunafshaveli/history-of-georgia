import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  PENDING_RESULTS_KEY,
  PENDING_RESULTS_QUEUE_CAP,
} from "@/src/constants/scoring";
import { logger } from "@/src/helpers/logger";

import {
  GameResultRulesError,
  GameResultTransientError,
  saveGameAndUpdateStats,
  type GameEndPayload,
} from "./firestore-game-result";

export type PendingResultEntry = {
  resultId: string;
  payload: GameEndPayload;
  gameEndedAt: string;
  /**
   * The Firebase Auth uid that owned this game when it was played.
   *
   * If `uid` is set: replay refuses to write the entry against any other
   * uid — otherwise a sign-out / sign-in transition (or
   * auto-prune-then-fresh-anon) would silently re-attribute another
   * user's game data.
   *
   * If `uid` is null/undefined: the game was played before any auth state
   * was established (rare; e.g. anonymous sign-in failed at boot) OR
   * before this field existed (legacy queue entries from v1.1.0 binaries).
   * Replay attributes such entries to the current uid — there's no other
   * uid that could own them.
   */
  uid: string | null;
};

const readQueue = async (): Promise<PendingResultEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(PENDING_RESULTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingResultEntry[]) : [];
  } catch {
    return [];
  }
};

const writeQueue = async (queue: PendingResultEntry[]): Promise<void> => {
  await AsyncStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(queue));
};

export const enqueuePendingResult = async (
  entry: PendingResultEntry,
): Promise<{ evictedCount: number }> => {
  const queue = await readQueue();
  queue.push(entry);

  let evictedCount = 0;
  while (queue.length > PENDING_RESULTS_QUEUE_CAP) {
    queue.shift();
    evictedCount++;
  }

  await writeQueue(queue);
  return { evictedCount };
};

export type ReplayResult = {
  succeeded: number;
  droppedRules: number;
  /**
   * Entries whose stored uid did not match the current uid — i.e. the
   * game was played under a different account. These are silently
   * discarded (we cannot replay them under any other uid without
   * silently re-attributing another user's results).
   */
  droppedUidMismatch: number;
  remaining: number;
};

export const replayPendingResults = async (
  uid: string,
): Promise<ReplayResult> => {
  const queue = await readQueue();
  if (queue.length === 0) {
    return {
      succeeded: 0,
      droppedRules: 0,
      droppedUidMismatch: 0,
      remaining: 0,
    };
  }

  const remaining: PendingResultEntry[] = [];
  let succeeded = 0;
  let droppedRules = 0;
  let droppedUidMismatch = 0;

  for (const entry of queue) {
    // Owner check:
    //   - `entry.uid` set and != current → drop (would silently re-attribute
    //     another user's game data after sign-out / sign-in / prune).
    //   - `entry.uid` null / undefined → attribute to current uid. Either
    //     pre-auth (no uid existed when queued) or legacy v1.1.0 entry
    //     (predates the uid field). In both cases there's no other uid
    //     that could own them, so attributing to the current uid is the
    //     fairest available outcome.
    if (entry.uid && entry.uid !== uid) {
      droppedUidMismatch++;
      continue;
    }

    try {
      await saveGameAndUpdateStats(uid, entry.resultId, entry.payload);
      succeeded++;
    } catch (error) {
      if (error instanceof GameResultTransientError) {
        remaining.push(entry);
        continue;
      }
      if (error instanceof GameResultRulesError) {
        droppedRules++;
        continue;
      }
      remaining.push(entry);
      logger.warn("[pending-results] unexpected error during replay:", error);
    }
  }

  await writeQueue(remaining);
  return {
    succeeded,
    droppedRules,
    droppedUidMismatch,
    remaining: remaining.length,
  };
};

export const clearPendingResults = async (): Promise<void> => {
  await AsyncStorage.removeItem(PENDING_RESULTS_KEY);
};
