jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/src/services/firestore-leaderboard", () => ({
  getLeaderboard: jest.fn(),
}));
jest.mock("@/src/helpers/logger", () => ({ logger: { warn: jest.fn() } }));

import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { LeaderboardError, primeLeaderboardCache, useLeaderboard } from "@/src/hooks/useLeaderboard";
import { getLeaderboard } from "@/src/services/firestore-leaderboard";
import { LeaderboardTab, type LeaderboardEntry } from "@/src/types";

const renderer = jest.requireActual<{
  create: (element: React.ReactElement) => { unmount: () => void };
}>("react-test-renderer");
const { act } = React;
const mockGetLeaderboard = jest.mocked(getLeaderboard);
const cacheKey = "leaderboard:cache:today";
const day = "2026-11-18";
const entry: LeaderboardEntry = {
  uid: "player",
  displayName: "ნინო",
  photoURL: null,
  rank: 1,
  points: 9,
  gamesPlayed: 0,
  timeMs: 90_000,
};

let latest: ReturnType<typeof useLeaderboard>;
let tree: ReturnType<typeof renderer.create>;

const Harness = () => {
  latest = useLeaderboard({ tab: LeaderboardTab.TODAY });
  return null;
};

const mount = async () => {
  await act(async () => {
    tree = renderer.create(React.createElement(Harness));
  });
};

beforeEach(async () => {
  jest.useFakeTimers().setSystemTime(new Date("2026-11-18T19:59:59.500Z"));
  await AsyncStorage.clear();
  mockGetLeaderboard.mockReset().mockRejectedValue(new Error("offline"));
});

afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.useRealTimers();
});

it("clears yesterday's visible leaderboard at midnight even if the new request fails", async () => {
  await primeLeaderboardCache(LeaderboardTab.TODAY, [entry], day);
  await mount();
  expect(latest.entries).toEqual([entry]);
  expect(mockGetLeaderboard).not.toHaveBeenCalled();

  await act(async () => jest.advanceTimersByTime(650));

  expect(mockGetLeaderboard).toHaveBeenCalledWith(LeaderboardTab.TODAY, "2026-11-19");
  expect(latest.entries).toEqual([]);
  expect(latest.error).toBe(LeaderboardError.OFFLINE);
});

it("ignores a previous-build cache entry that has no Tbilisi date", async () => {
  await AsyncStorage.setItem(cacheKey, JSON.stringify({ entries: [entry], fetchedAt: Date.now() }));
  await mount();
  expect(mockGetLeaderboard).toHaveBeenCalledWith(LeaderboardTab.TODAY, day);
  expect(latest.entries).toEqual([]);
});
