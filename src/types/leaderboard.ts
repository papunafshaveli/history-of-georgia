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
};

export enum LeaderboardTab {
  WEEKLY = "weekly",
  ALLTIME = "alltime",
}
