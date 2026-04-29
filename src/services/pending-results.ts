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
  remaining: number;
};

export const replayPendingResults = async (
  uid: string,
): Promise<ReplayResult> => {
  const queue = await readQueue();
  if (queue.length === 0) {
    return { succeeded: 0, droppedRules: 0, remaining: 0 };
  }

  const remaining: PendingResultEntry[] = [];
  let succeeded = 0;
  let droppedRules = 0;

  for (const entry of queue) {
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
  return { succeeded, droppedRules, remaining: remaining.length };
};

export const clearPendingResults = async (): Promise<void> => {
  await AsyncStorage.removeItem(PENDING_RESULTS_KEY);
};
