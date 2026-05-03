import AsyncStorage from "@react-native-async-storage/async-storage";

import { logger } from "@/src/helpers/logger";

export const LIFETIME_STATS_KEY = "lifetimeStats:v1";

export type LifetimeStats = {
  totalGames: number;
  totalCorrect: number;
  totalQuestions: number;
  totalPoints: number;
  bestSingleGameScore: number;
  updatedAt: number;
};

const ZERO_STATS: LifetimeStats = {
  totalGames: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  totalPoints: 0,
  bestSingleGameScore: 0,
  updatedAt: 0,
};

export const getLifetimeStats = async (): Promise<LifetimeStats> => {
  const raw = await AsyncStorage.getItem(LIFETIME_STATS_KEY);
  if (!raw) return { ...ZERO_STATS };
  try {
    const parsed = JSON.parse(raw) as Partial<LifetimeStats>;
    return { ...ZERO_STATS, ...parsed };
  } catch (err) {
    logger.warn("[local-lifetime-stats] malformed JSON; resetting:", err);
    return { ...ZERO_STATS };
  }
};

export type RecordGameInput = {
  score: number;
  correctCount: number;
  totalQuestions: number;
};

export const recordGame = async (game: RecordGameInput): Promise<void> => {
  const current = await getLifetimeStats();
  const next: LifetimeStats = {
    totalGames: current.totalGames + 1,
    totalCorrect: current.totalCorrect + game.correctCount,
    totalQuestions: current.totalQuestions + game.totalQuestions,
    totalPoints: current.totalPoints + game.score,
    bestSingleGameScore: Math.max(current.bestSingleGameScore, game.score),
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(LIFETIME_STATS_KEY, JSON.stringify(next));
};

export const clearLifetimeStats = async (): Promise<void> => {
  await AsyncStorage.removeItem(LIFETIME_STATS_KEY);
};
