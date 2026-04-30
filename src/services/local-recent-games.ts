import AsyncStorage from "@react-native-async-storage/async-storage";

import { logger } from "@/src/helpers/logger";
import type { Difficulty } from "@/src/types/quizQuestion";

const STORAGE_KEY = "recentGames";
const MAX_STORED = 50;

export type LocalRecentGame = {
  resultId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  selectedDifficulty: Difficulty | null;
  createdAtMs: number;
};

const isLocalRecentGame = (value: unknown): value is LocalRecentGame => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.resultId === "string" &&
    typeof v.score === "number" &&
    typeof v.correctCount === "number" &&
    typeof v.totalQuestions === "number" &&
    typeof v.createdAtMs === "number"
  );
};

export const getLocalRecentGames = async (): Promise<LocalRecentGame[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLocalRecentGame);
  } catch (error) {
    logger.warn("[local-recent-games] read failed:", error);
    return [];
  }
};

export const addLocalRecentGame = async (
  game: LocalRecentGame,
): Promise<void> => {
  try {
    const current = await getLocalRecentGames();
    const next = [game, ...current].slice(0, MAX_STORED);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    logger.warn("[local-recent-games] write failed:", error);
  }
};

export const clearLocalRecentGames = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
