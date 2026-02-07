import AsyncStorage from "@react-native-async-storage/async-storage";

export type GameResult = {
  score: number;
  questionsAnswered: number;
  date: string;
};

const HISTORY_KEY = "gameHistory";
const MAX_HISTORY = 50;

export const saveGameResult = async (result: GameResult): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(HISTORY_KEY);
    const history: GameResult[] = stored ? JSON.parse(stored) : [];
    const updated = [result, ...history].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Non-critical
  }
};

export const getGameHistory = async (): Promise<GameResult[]> => {
  try {
    const stored = await AsyncStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const getStats = (history: GameResult[]) => {
  if (history.length === 0) {
    return { totalGames: 0, averageScore: 0, bestScore: 0, totalQuestions: 0 };
  }

  const totalGames = history.length;
  const totalScore = history.reduce((sum, g) => sum + g.score, 0);
  const bestScore = Math.max(...history.map((g) => g.score));
  const totalQuestions = history.reduce(
    (sum, g) => sum + g.questionsAnswered,
    0
  );
  const averageScore = Math.round(totalScore / totalGames);

  return { totalGames, averageScore, bestScore, totalQuestions };
};
