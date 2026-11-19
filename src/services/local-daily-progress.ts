import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DAILY_MAX_TIME_MS,
  DAILY_STREAK_KEY,
  dailyRecordKey,
  dailyStreakCheckedKey,
} from "@/src/constants/daily";
import { EMPTY_STREAK, mergeStreaks, nextStreak } from "@/src/helpers/dailyStreak";
import { addDaysToDate } from "@/src/utils/tbilisiDate";
import {
  DailyStatus,
  type DailyAnswer,
  type DailyRecord,
  type DailyStreak,
} from "@/src/types";

const RECORD_PREFIX = dailyRecordKey("");
// Older records only feed sync, which can no longer upload them.
const RECORD_KEEP_DAYS = 7;
const completionListeners = new Set<() => void>();

export const subscribeToDailyCompletion = (listener: () => void) => {
  completionListeners.add(listener);
  return () => {
    completionListeners.delete(listener);
  };
};

const write = (record: DailyRecord) =>
  AsyncStorage.setItem(dailyRecordKey(record.date), JSON.stringify(record));

export const readRecord = async (date: string): Promise<DailyRecord | null> => {
  const raw = await AsyncStorage.getItem(dailyRecordKey(date));
  return raw ? (JSON.parse(raw) as DailyRecord) : null;
};

export const readStreak = async (): Promise<DailyStreak> => {
  const raw = await AsyncStorage.getItem(DAILY_STREAK_KEY);
  return raw ? (JSON.parse(raw) as DailyStreak) : EMPTY_STREAK;
};

// The server's streak is read once per account on this phone, so a reinstall keeps it.
export const needsCloudStreak = async (uid: string): Promise<boolean> =>
  (await AsyncStorage.getItem(dailyStreakCheckedKey(uid))) === null;

// Streak updates read, then write; one at a time so a restore and a finish can't overwrite each other.
let streakQueue: Promise<unknown> = Promise.resolve();
const serializeStreak = <T>(task: () => Promise<T>): Promise<T> => {
  const run = streakQueue.then(task, task);
  streakQueue = run.catch(() => undefined);
  return run;
};

// Returns true when merging in the server's streak changed the phone's.
export const adoptCloudStreak = (
  uid: string,
  cloud: DailyStreak | null,
): Promise<boolean> =>
  serializeStreak(async () => {
    const local = await readStreak();
    const merged = cloud ? mergeStreaks(local, cloud) : local;
    const changed = JSON.stringify(merged) !== JSON.stringify(local);
    const writes: [string, string][] = [[dailyStreakCheckedKey(uid), "1"]];
    if (changed) writes.push([DAILY_STREAK_KEY, JSON.stringify(merged)]);
    await AsyncStorage.multiSet(writes);
    return changed;
  });

// Starting counts as the day's one attempt; a second call returns the same attempt.
export const startDaily = async (date: string): Promise<DailyRecord> => {
  const existing = await readRecord(date);
  if (existing) return existing;
  const record: DailyRecord = {
    date,
    status: DailyStatus.IN_PROGRESS,
    answers: [],
    elapsedMs: 0,
    questionShownAt: null,
    syncedUid: null,
  };
  await write(record);
  return record;
};

// Time so far, including a question that was open when the app was closed.
export const resumeElapsed = (record: DailyRecord, now: number): number => {
  const open =
    record.questionShownAt === null ? 0 : now - record.questionShownAt;
  return Math.min(DAILY_MAX_TIME_MS, record.elapsedMs + Math.max(0, open));
};

export const markQuestionShown = async (
  date: string,
  elapsedMs: number,
  now: number,
): Promise<void> => {
  const record = await readRecord(date);
  if (!record || record.status === DailyStatus.DONE) return;
  await write({ ...record, elapsedMs, questionShownAt: now });
};

export const saveAnswer = async (
  date: string,
  answer: DailyAnswer,
  elapsedMs: number,
): Promise<DailyRecord> => {
  const record = (await readRecord(date)) ?? (await startDaily(date));
  // A retry can follow a successful answer write and a failed completion write.
  if (
    record.status === DailyStatus.DONE ||
    record.answers[record.answers.length - 1]?.ticketId === answer.ticketId
  ) {
    return record;
  }
  const next: DailyRecord = {
    ...record,
    answers: [...record.answers, answer],
    elapsedMs,
    questionShownAt: null,
  };
  await write(next);
  return next;
};

export const finishDaily = (
  date: string,
  elapsedMs: number,
): Promise<DailyRecord> => serializeStreak(() => finishDailyNow(date, elapsedMs));

const finishDailyNow = async (
  date: string,
  elapsedMs: number,
): Promise<DailyRecord> => {
  const record = (await readRecord(date)) ?? (await startDaily(date));
  if (record.status === DailyStatus.DONE) return record;
  const streak = nextStreak(await readStreak(), date);
  const done: DailyRecord = {
    ...record,
    status: DailyStatus.DONE,
    elapsedMs,
    questionShownAt: null,
  };
  // One write, so a kill can't leave the day DONE without its streak.
  await AsyncStorage.multiSet([
    [dailyRecordKey(date), JSON.stringify(done)],
    [DAILY_STREAK_KEY, JSON.stringify(streak)],
  ]);
  for (const listener of completionListeners) listener();
  return done;
};

export const markSynced = async (date: string, uid: string): Promise<void> => {
  const record = await readRecord(date);
  if (record) await write({ ...record, syncedUid: uid });
};

export const correctCount = (record: DailyRecord): number =>
  record.answers.filter((a) => a.isCorrect).length;

const readAllRecords = async (): Promise<DailyRecord[]> => {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) =>
    k.startsWith(RECORD_PREFIX),
  );
  const pairs = await AsyncStorage.multiGet(keys);
  return pairs
    .map(([, raw]) => (raw ? (JSON.parse(raw) as DailyRecord) : null))
    .filter((r): r is DailyRecord => !!r);
};

// Finished but not uploaded to this account (played offline, or the account changed), newest first.
export const unsyncedDoneRecords = async (
  uid: string,
): Promise<DailyRecord[]> =>
  (await readAllRecords())
    .filter((r) => r.status === DailyStatus.DONE && r.syncedUid !== uid)
    .sort((a, b) => b.date.localeCompare(a.date));

export const pruneOldRecords = async (today: string): Promise<void> => {
  const cutoff = addDaysToDate(today, -RECORD_KEEP_DAYS);
  const stale = (await readAllRecords()).filter((r) => r.date < cutoff);
  if (stale.length)
    await AsyncStorage.multiRemove(stale.map((r) => dailyRecordKey(r.date)));
};
