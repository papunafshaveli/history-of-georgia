import type { Timestamp } from "firebase/firestore";

import type { Difficulty } from "./quizQuestion";

export type UserDoc = {
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;

  totalPoints: number;
  gamesPlayed: number;
  totalCorrect: number;
  totalQuestions: number;
  bestSingleGameScore: number;

  weekPoints: number;
  weekStart: string;

  hasSeenSignInNudge: boolean;

  // Daily challenge (absent until the first daily is synced).
  dailyDate?: string;
  dailyCorrect?: number;
  dailyTimeMs?: number;
  currentStreak?: number;
  longestStreak?: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type GameResultDoc = {
  userId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  selectedDifficulty: Difficulty | null;
  scoreByDifficulty: Record<Difficulty, number>;
  createdAt: Timestamp;
};

export type LeaderboardEntry = {
  uid: string;
  displayName: string;
  photoURL: string | null;
  rank: number;
  points: number;
  gamesPlayed: number;
  // Today tab only: total daily time, the tie-breaker.
  timeMs?: number;
};

export enum LeaderboardTab {
  TODAY = "today",
  WEEKLY = "weekly",
  ALLTIME = "alltime",
}
