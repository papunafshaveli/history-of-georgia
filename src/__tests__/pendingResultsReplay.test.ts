import AsyncStorage from "@react-native-async-storage/async-storage";

import { PENDING_RESULTS_KEY } from "@/src/constants/scoring";
import {
  replayPendingResults,
  type PendingResultEntry,
} from "@/src/services/pending-results";

const mockedSave = jest.fn();

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock("@/src/services/firestore-game-result", () => {
  // Re-export the real error classes so `instanceof` checks inside
  // replayPendingResults still work; only stub the network-touching call.
  class GameResultRulesError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "GameResultRulesError";
    }
  }
  class GameResultTransientError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "GameResultTransientError";
    }
  }
  return {
    saveGameAndUpdateStats: jest.fn((...args) => mockedSave(...args)),
    GameResultRulesError,
    GameResultTransientError,
  };
});

const getItemMock = AsyncStorage.getItem as jest.Mock;
const setItemMock = AsyncStorage.setItem as jest.Mock;

const buildEntry = (
  overrides: Partial<PendingResultEntry> = {},
): PendingResultEntry => ({
  resultId: "r-1",
  payload: {
    score: 100,
    correctCount: 5,
    totalQuestions: 10,
    selectedDifficulty: "easy",
    scoreByDifficulty: { easy: 100, medium: 0, hard: 0 },
  },
  gameEndedAt: new Date(0).toISOString(),
  uid: "uid-A",
  ...overrides,
});

beforeEach(() => {
  mockedSave.mockReset();
  getItemMock.mockReset();
  setItemMock.mockReset();
});

describe("replayPendingResults", () => {
  it("returns early when the queue is empty", async () => {
    getItemMock.mockResolvedValueOnce(null);

    const result = await replayPendingResults("uid-A");

    expect(mockedSave).not.toHaveBeenCalled();
    expect(result).toEqual({
      succeeded: 0,
      droppedRules: 0,
      droppedUidMismatch: 0,
      remaining: 0,
    });
  });

  it("replays entries whose uid matches the current uid", async () => {
    const entry = buildEntry({ uid: "uid-A", resultId: "r-keep" });
    getItemMock.mockResolvedValueOnce(JSON.stringify([entry]));
    mockedSave.mockResolvedValueOnce(undefined);

    const result = await replayPendingResults("uid-A");

    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(mockedSave).toHaveBeenCalledWith("uid-A", "r-keep", entry.payload);
    expect(result).toMatchObject({
      succeeded: 1,
      droppedUidMismatch: 0,
      remaining: 0,
    });
    expect(setItemMock).toHaveBeenCalledWith(PENDING_RESULTS_KEY, "[]");
  });

  it("drops entries whose stored uid does not match the current uid", async () => {
    // Common case: user signed out → fresh anon. The queued entry was
    // owned by the previous uid; the current uid should NOT inherit it.
    const stale = buildEntry({ uid: "uid-OLD", resultId: "r-stale" });
    getItemMock.mockResolvedValueOnce(JSON.stringify([stale]));

    const result = await replayPendingResults("uid-NEW");

    expect(mockedSave).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      succeeded: 0,
      droppedUidMismatch: 1,
      remaining: 0,
    });
    expect(setItemMock).toHaveBeenCalledWith(PENDING_RESULTS_KEY, "[]");
  });

  it("attributes legacy entries (no uid field) to the current uid rather than dropping them", async () => {
    // Older queue entries written before the uid field existed have
    // `uid` undefined. Treat them as owner-unknown — there's no other
    // uid that could own them, so attributing to the current uid is
    // the fairest available outcome (and avoids silent data loss on
    // upgrade from v1.1.0).
    const legacy = { ...buildEntry(), uid: undefined } as unknown as
      PendingResultEntry;
    getItemMock.mockResolvedValueOnce(JSON.stringify([legacy]));
    mockedSave.mockResolvedValueOnce(undefined);

    const result = await replayPendingResults("uid-CURRENT");

    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(mockedSave).toHaveBeenCalledWith(
      "uid-CURRENT",
      legacy.resultId,
      legacy.payload,
    );
    expect(result).toMatchObject({
      succeeded: 1,
      droppedUidMismatch: 0,
      remaining: 0,
    });
  });

  it("attributes pre-auth entries (uid: null) to the current uid", async () => {
    // Game-end before the anonymous sign-in resolved enqueues with
    // uid: null. Replay attributes to whoever signed in next.
    const preAuth = buildEntry({ uid: null });
    getItemMock.mockResolvedValueOnce(JSON.stringify([preAuth]));
    mockedSave.mockResolvedValueOnce(undefined);

    const result = await replayPendingResults("uid-FRESH-ANON");

    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(mockedSave).toHaveBeenCalledWith(
      "uid-FRESH-ANON",
      preAuth.resultId,
      preAuth.payload,
    );
    expect(result).toMatchObject({ succeeded: 1, droppedUidMismatch: 0 });
  });

  it("mixes succeed / mismatch / rules-drop / keep in a single replay pass", async () => {
    const { GameResultRulesError, GameResultTransientError } = jest.requireMock(
      "@/src/services/firestore-game-result",
    );

    const ok = buildEntry({ uid: "uid-A", resultId: "r-ok" });
    const stale = buildEntry({ uid: "uid-OLD", resultId: "r-stale" });
    const rulesViolation = buildEntry({ uid: "uid-A", resultId: "r-bad" });
    const transient = buildEntry({ uid: "uid-A", resultId: "r-retry" });

    getItemMock.mockResolvedValueOnce(
      JSON.stringify([ok, stale, rulesViolation, transient]),
    );
    mockedSave
      .mockResolvedValueOnce(undefined) // ok
      .mockRejectedValueOnce(new GameResultRulesError("rules said no")) // bad
      .mockRejectedValueOnce(new GameResultTransientError("network blip")); // retry

    const result = await replayPendingResults("uid-A");

    expect(mockedSave).toHaveBeenCalledTimes(3); // stale was skipped before saveGameAndUpdateStats
    expect(result).toEqual({
      succeeded: 1,
      droppedRules: 1,
      droppedUidMismatch: 1,
      remaining: 1,
    });
    // Only the transient-failed entry survives in the queue.
    const writtenQueueRaw = setItemMock.mock.calls[0][1] as string;
    const writtenQueue = JSON.parse(writtenQueueRaw);
    expect(writtenQueue).toHaveLength(1);
    expect(writtenQueue[0].resultId).toBe("r-retry");
  });
});
