import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/firebase";
import type { Difficulty } from "@/src/types/quizQuestion";
import type { GameResultDoc, UserDoc } from "@/src/types";

import { mondayTbilisi } from "@/src/utils/weekStart";

const USERS_COLLECTION = "users";
const GAME_RESULTS_COLLECTION = "game_results";

export type GameEndPayload = {
  score: number;
  correctCount: number;
  totalQuestions: number;
  selectedDifficulty: Difficulty | null;
  scoreByDifficulty: Record<Difficulty, number>;
};

export class GameResultRulesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameResultRulesError";
  }
}

export class GameResultTransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameResultTransientError";
  }
}

const isRulesError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "permission-denied" || code === "failed-precondition";
};

const isTransientError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return (
    code === "unavailable" ||
    code === "deadline-exceeded" ||
    code === "cancelled" ||
    code === "aborted"
  );
};

export const saveGameAndUpdateStats = async (
  uid: string,
  resultId: string,
  payload: GameEndPayload,
): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const resultRef = doc(db, GAME_RESULTS_COLLECTION, `${uid}_${resultId}`);
  const currentWeekStart = mondayTbilisi();

  try {
    await runTransaction(db, async (transaction) => {
      const existingResult = await transaction.get(resultRef);
      if (existingResult.exists()) return;

      const userSnap = await transaction.get(userRef);
      const userData = userSnap.exists()
        ? (userSnap.data() as UserDoc)
        : null;

      const previousBest = userData?.bestSingleGameScore ?? 0;
      const newBest = Math.max(previousBest, payload.score);

      const previousWeekStart = userData?.weekStart;
      const newWeekPoints =
        previousWeekStart === currentWeekStart
          ? (userData?.weekPoints ?? 0) + payload.score
          : payload.score;

      const resultDoc: GameResultDoc = {
        userId: uid,
        score: payload.score,
        correctCount: payload.correctCount,
        totalQuestions: payload.totalQuestions,
        selectedDifficulty: payload.selectedDifficulty,
        scoreByDifficulty: payload.scoreByDifficulty,
        createdAt: Timestamp.now(),
      };

      transaction.set(resultRef, resultDoc);

      if (!userSnap.exists()) {
        transaction.set(userRef, {
          displayName: null,
          photoURL: null,
          isAnonymous: true,
          totalPoints: payload.score,
          gamesPlayed: 1,
          totalCorrect: payload.correctCount,
          totalQuestions: payload.totalQuestions,
          bestSingleGameScore: newBest,
          weekPoints: newWeekPoints,
          weekStart: currentWeekStart,
          hasSeenSignInNudge: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return;
      }

      transaction.update(userRef, {
        totalPoints: increment(payload.score),
        gamesPlayed: increment(1),
        totalCorrect: increment(payload.correctCount),
        totalQuestions: increment(payload.totalQuestions),
        bestSingleGameScore: newBest,
        weekPoints: newWeekPoints,
        weekStart: currentWeekStart,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    if (isRulesError(error)) {
      throw new GameResultRulesError(
        `Rules rejected game result for ${uid}_${resultId}: ${String(error)}`,
      );
    }
    if (isTransientError(error)) {
      throw new GameResultTransientError(
        `Transient error saving game result for ${uid}_${resultId}: ${String(error)}`,
      );
    }
    throw error;
  }
};

