import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getLifetimeStats,
  recordGame,
  LIFETIME_STATS_KEY,
} from "@/src/services/local-lifetime-stats";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const ZERO_STATS = {
  totalGames: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  totalPoints: 0,
  bestSingleGameScore: 0,
  updatedAt: 0,
};

describe("local-lifetime-stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns zeros when no entry exists", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const stats = await getLifetimeStats();
    expect(stats).toEqual(ZERO_STATS);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(LIFETIME_STATS_KEY);
  });

  it("returns zeros when stored value is malformed JSON", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("not-json");
    const stats = await getLifetimeStats();
    expect(stats).toEqual(ZERO_STATS);
  });

  it("merges partial stored value with zeros (forward compat)", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ totalGames: 5, totalPoints: 200 }),
    );
    const stats = await getLifetimeStats();
    expect(stats.totalGames).toBe(5);
    expect(stats.totalPoints).toBe(200);
    expect(stats.totalCorrect).toBe(0);
    expect(stats.totalQuestions).toBe(0);
    expect(stats.bestSingleGameScore).toBe(0);
  });

  it("increments fields and updates best score on recordGame", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        totalGames: 1,
        totalCorrect: 5,
        totalQuestions: 7,
        totalPoints: 50,
        bestSingleGameScore: 50,
        updatedAt: 100,
      }),
    );
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    await recordGame({ score: 80, correctCount: 8, totalQuestions: 10 });

    const writtenRaw = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
    const written = JSON.parse(writtenRaw);
    expect(written).toMatchObject({
      totalGames: 2,
      totalCorrect: 13,
      totalQuestions: 17,
      totalPoints: 130,
      bestSingleGameScore: 80,
    });
    expect(written.updatedAt).toBeGreaterThan(100);
  });

  it("does not overwrite bestSingleGameScore with a lower value", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        totalGames: 1,
        totalCorrect: 9,
        totalQuestions: 10,
        totalPoints: 200,
        bestSingleGameScore: 200,
        updatedAt: 100,
      }),
    );

    await recordGame({ score: 50, correctCount: 5, totalQuestions: 10 });

    const writtenRaw = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
    const written = JSON.parse(writtenRaw);
    expect(written.bestSingleGameScore).toBe(200);
  });

  it("recordGame from a fresh slate initialises with zeros and adds the game", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    await recordGame({ score: 30, correctCount: 3, totalQuestions: 5 });

    const writtenRaw = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
    const written = JSON.parse(writtenRaw);
    expect(written).toMatchObject({
      totalGames: 1,
      totalCorrect: 3,
      totalQuestions: 5,
      totalPoints: 30,
      bestSingleGameScore: 30,
    });
  });
});
