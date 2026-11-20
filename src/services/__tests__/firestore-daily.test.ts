jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/firebase", () => ({ functions: {}, db: {} }));
jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => args,
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));
// Pin "today" so past/today handling doesn't depend on the real clock.
jest.mock("@/src/utils/tbilisiDate", () => ({
  ...jest.requireActual("@/src/utils/tbilisiDate"),
  todayTbilisi: () => "2026-11-18",
}));
jest.mock("firebase/functions", () => ({
  httpsCallable: () => (...args: unknown[]) => mockSubmit(...args),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { restoreCloudStreak, syncDailyResults } from "@/src/services/firestore-daily";
import { finishDaily, readRecord, readStreak, saveAnswer, startDaily } from "@/src/services/local-daily-progress";

const mockSubmit = jest.fn();
const mockGetDoc = jest.fn();
const DAY = "2026-11-18";

const play = async (date: string, elapsedMs: number, legacy = false) => {
  await startDaily(date);
  for (let index = 0; index < 10; index++) {
    await saveAnswer(date, {
      ticketId: `t${index}`,
      isCorrect: index === 0,
      option: legacy ? undefined : `option ${index}`,
    }, elapsedMs);
  }
  await finishDaily(date, elapsedMs);
};

beforeEach(async () => {
  await AsyncStorage.clear();
  mockSubmit.mockReset().mockResolvedValue({ data: { accepted: true } });
  mockGetDoc.mockReset();
});

it("replays offline days oldest first using selected options", async () => {
  const yesterday = "2026-11-17";
  await play(yesterday, 4_000);
  await play(DAY, 108_000);

  await syncDailyResults("u1");

  const answers = Array.from({ length: 10 }, (_, index) => ({
    ticketId: `t${index}`,
    option: `option ${index}`,
  }));
  expect(mockSubmit.mock.calls).toEqual([
    [{ uid: "u1", date: yesterday, elapsedMs: 10_000, answers }],
    [{ uid: "u1", date: DAY, elapsedMs: 108_000, answers }],
  ]);
  expect((await readRecord(DAY))?.syncedUid).toBe("u1");
  await syncDailyResults("u1");
  expect(mockSubmit).toHaveBeenCalledTimes(2);
});

it("keeps the local result from a build that stored only correctness flags", async () => {
  await play(DAY, 30_000, true);
  await syncDailyResults("u1");
  expect(mockSubmit).not.toHaveBeenCalled();
  expect((await readRecord(DAY))?.answers).toHaveLength(10);
});

it("retries missing profiles, auth switches, and network errors", async () => {
  await play(DAY, 30_000);
  for (const code of ["functions/failed-precondition", "functions/permission-denied", "functions/unavailable"]) {
    mockSubmit.mockRejectedValueOnce(Object.assign(new Error(code), { code }));
    await syncDailyResults("u1");
    expect((await readRecord(DAY))?.syncedUid).toBeNull();
  }
  await syncDailyResults("u1");
  expect((await readRecord(DAY))?.syncedUid).toBe("u1");
});

it("replays a result when the player switches accounts", async () => {
  await play(DAY, 30_000);
  await syncDailyResults("anon");
  await syncDailyResults("google");
  expect(mockSubmit.mock.calls.map(([payload]) => payload.uid)).toEqual(["anon", "google"]);
});

it("continues after an overridden set is rejected", async () => {
  const yesterday = "2026-11-17";
  await play(yesterday, 30_000);
  await play(DAY, 30_000);
  mockSubmit.mockRejectedValueOnce(
    Object.assign(new Error("invalid"), { code: "functions/invalid-argument" }),
  );
  await syncDailyResults("u1");
  expect(mockSubmit).toHaveBeenCalledTimes(2);
  expect((await readRecord(yesterday))?.syncedUid).toBe("u1");
  expect((await readRecord(DAY))?.syncedUid).toBe("u1");
});

const fail = (code: string) => Object.assign(new Error(code), { code });

it("drops a past day the server can't score and still uploads the newer one", async () => {
  await play("2026-11-17", 30_000);
  await play(DAY, 40_000);
  mockSubmit
    .mockRejectedValueOnce(fail("functions/failed-precondition"))
    .mockResolvedValueOnce({ data: { accepted: true } });

  await syncDailyResults("u1");

  expect(mockSubmit.mock.calls.map(([call]) => call.date)).toEqual(["2026-11-17", DAY]);
  expect((await readRecord("2026-11-17"))?.syncedUid).toBe("u1");
  expect((await readRecord(DAY))?.syncedUid).toBe("u1");
});

it("retries today's day later when the server isn't ready for it", async () => {
  await play(DAY, 40_000);
  mockSubmit.mockRejectedValueOnce(fail("functions/failed-precondition"));
  await syncDailyResults("u1");
  expect((await readRecord(DAY))?.syncedUid).toBeNull();

  await syncDailyResults("u1");
  expect(mockSubmit).toHaveBeenCalledTimes(2);
  expect((await readRecord(DAY))?.syncedUid).toBe("u1");
});

it("keeps retrying after a network failure", async () => {
  await play(DAY, 40_000);
  mockSubmit.mockRejectedValueOnce(fail("functions/unavailable"));
  await syncDailyResults("u1");
  expect((await readRecord(DAY))?.syncedUid).toBeNull();
});

describe("restoreCloudStreak", () => {
  it("reads the account once and continues its streak", async () => {
    mockGetDoc.mockResolvedValue({
      data: () => ({ dailyDate: "2026-11-17", currentStreak: 12, longestStreak: 12 }),
    });
    expect(await restoreCloudStreak("g1")).toBe(true);
    expect(await readStreak()).toEqual({ current: 12, longest: 12, lastDate: "2026-11-17" });
    expect(await restoreCloudStreak("g1")).toBe(false);
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
  });

  it("tries again on the next open when the read fails", async () => {
    mockGetDoc
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ data: () => undefined });
    expect(await restoreCloudStreak("g1")).toBe(false);
    expect(await restoreCloudStreak("g1")).toBe(false);
    expect(await restoreCloudStreak("g1")).toBe(false);
    expect(mockGetDoc).toHaveBeenCalledTimes(2);
    expect((await readStreak()).current).toBe(0);
  });

  it("ignores the answer when the account changed during the read", async () => {
    mockGetDoc.mockResolvedValue({
      data: () => ({ dailyDate: "2026-11-17", currentStreak: 12, longestStreak: 12 }),
    });
    expect(await restoreCloudStreak("g1", () => false)).toBe(false);
    expect((await readStreak()).current).toBe(0);
    expect(await restoreCloudStreak("g1")).toBe(true);
  });

  it("keeps the server streak when today is finished while the read is pending", async () => {
    let answer: (value: unknown) => void = () => undefined;
    mockGetDoc.mockReturnValue(new Promise((resolve) => { answer = resolve; }));
    const restoring = restoreCloudStreak("g1");
    await play(DAY, 60_000);
    answer({ data: () => ({ dailyDate: "2026-11-17", currentStreak: 12, longestStreak: 12 }) });
    expect(await restoring).toBe(true);
    expect(await readStreak()).toEqual({ current: 13, longest: 13, lastDate: DAY });
  });
});
