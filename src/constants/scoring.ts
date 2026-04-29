import type { Difficulty } from "@/src/types/quizQuestion";

export const POINTS_PER_DIFFICULTY: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 20,
};

export const pointsFor = (difficulty: Difficulty): number =>
  POINTS_PER_DIFFICULTY[difficulty];

export const PENDING_RESULTS_QUEUE_CAP = 20;

export const PENDING_RESULTS_KEY = "pendingResults";
