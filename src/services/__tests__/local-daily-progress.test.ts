jest.mock("@react-native-async-storage/async-storage", () =>
  // The package ships an in-memory mock; jest.mock factories cannot use import.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyStatus } from "@/src/types";
import {
  adoptCloudStreak,
  finishDaily,
  markQuestionShown,
  markSynced,
  needsCloudStreak,
  pruneOldRecords,
  readRecord,
  readStreak,
  resumeElapsed,
  saveAnswer,
  startDaily,
  subscribeToDailyCompletion,
  unsyncedDoneRecords,
} from "@/src/services/local-daily-progress";

const DAY = "2026-11-18";

beforeEach(() => AsyncStorage.clear());

it("records answers and time, then finishes once", async () => {
  await startDaily(DAY);
  await saveAnswer(DAY, { ticketId: "a", isCorrect: true }, 4_000);
  await saveAnswer(DAY, { ticketId: "b", isCorrect: false }, 9_000);
  const done = await finishDaily(DAY, 9_000);
  expect(done.status).toBe(DailyStatus.DONE);
  expect(done.answers).toHaveLength(2);
  expect(done.elapsedMs).toBe(9_000);
  expect((await readStreak()).current).toBe(1);
  await finishDaily(DAY, 9_000);
  expect((await readStreak()).current).toBe(1);
});

it("never resets an attempt already begun", async () => {
  await startDaily(DAY);
  await saveAnswer(DAY, { ticketId: "a", isCorrect: true }, 3_000);
  await startDaily(DAY);
  expect((await readRecord(DAY))?.answers).toHaveLength(1);
});

it("keeps the time of a question left open when the app was closed", async () => {
  await startDaily(DAY);
  await saveAnswer(DAY, { ticketId: "a", isCorrect: true }, 5_000);
  await markQuestionShown(DAY, 5_000, 100_000);
  const record = await readRecord(DAY);
  expect(resumeElapsed(record!, 130_000)).toBe(35_000);
});

it("lists finished-but-unsynced days newest first", async () => {
  for (const day of ["2026-11-16", "2026-11-17", DAY]) {
    await startDaily(day);
    await finishDaily(day, 20_000);
  }
  await markSynced("2026-11-17", "u1");
  await startDaily("2026-11-19");
  expect((await unsyncedDoneRecords("u1")).map((r) => r.date)).toEqual([
    DAY,
    "2026-11-16",
  ]);
  // Another account has received none of them.
  expect(await unsyncedDoneRecords("u2")).toHaveLength(3);
});

it("saves the finished record and the streak together", async () => {
  await startDaily(DAY);
  await finishDaily(DAY, 20_000);
  expect((await readRecord(DAY))?.status).toBe(DailyStatus.DONE);
  expect((await readStreak()).current).toBe(1);
});

it("prunes records older than a week", async () => {
  for (const day of ["2026-11-10", "2026-11-11", DAY]) await startDaily(day);
  await pruneOldRecords(DAY);
  expect(await readRecord("2026-11-10")).toBeNull();
  expect(await readRecord("2026-11-11")).not.toBeNull();
  expect(await readRecord(DAY)).not.toBeNull();
});

it("retries the last answer after completion storage fails without appending it again", async () => {
  const completed = jest.fn();
  const unsubscribe = subscribeToDailyCompletion(completed);
  const answer = { ticketId: "last", isCorrect: true, option: "chosen" };
  try {
    await startDaily(DAY);
    await saveAnswer(DAY, answer, 24_000);
    jest.spyOn(AsyncStorage, "multiSet").mockRejectedValueOnce(new Error("storage"));
    await expect(finishDaily(DAY, 24_000)).rejects.toThrow("storage");
    expect(completed).not.toHaveBeenCalled();

    await saveAnswer(DAY, answer, 24_000);
    const record = await finishDaily(DAY, 24_000);
    expect(record.answers).toEqual([answer]);
    expect(record.status).toBe(DailyStatus.DONE);
    expect(completed).toHaveBeenCalledTimes(1);
  } finally {
    unsubscribe();
  }
});

describe("cloud streak", () => {
  const CLOUD = { current: 12, longest: 20, lastDate: "2026-11-17" };

  it("takes the server streak once on a fresh install, then counts on from it", async () => {
    expect(await needsCloudStreak("g1")).toBe(true);
    expect(await adoptCloudStreak("g1", CLOUD)).toBe(true);
    expect(await needsCloudStreak("g1")).toBe(false);
    await startDaily(DAY);
    await finishDaily(DAY, 30_000);
    expect(await readStreak()).toEqual({ current: 13, longest: 20, lastDate: DAY });
  });

  it("joins a streak played on the phone before the server answered", async () => {
    await startDaily(DAY);
    await finishDaily(DAY, 30_000);
    expect(await needsCloudStreak("g1")).toBe(true);
    expect(await adoptCloudStreak("g1", CLOUD)).toBe(true);
    expect(await readStreak()).toEqual({ current: 13, longest: 20, lastDate: DAY });
  });

  it.each([
    ["restore first", true],
    ["finish first", false],
  ])("restore and finish running together never lose a day (%s)", async (_label, restoreFirst) => {
    await startDaily(DAY);
    const restore = () => adoptCloudStreak("g1", CLOUD);
    const finish = () => finishDaily(DAY, 30_000);
    await Promise.all(restoreFirst ? [restore(), finish()] : [finish(), restore()]);
    expect(await readStreak()).toEqual({ current: 13, longest: 20, lastDate: DAY });
  });

  it("checks each account once, even when the server has no streak", async () => {
    expect(await adoptCloudStreak("a1", null)).toBe(false);
    expect(await needsCloudStreak("a1")).toBe(false);
    expect(await needsCloudStreak("g1")).toBe(true);
  });
});
