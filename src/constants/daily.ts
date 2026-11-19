export const DAILY_QUESTION_COUNT = 10;
export const DAILY_COLLECTION = "daily_challenges";
export const DAILY_STORAGE_PREFIX = "daily:";
export const DAILY_SET_PREFIX = `${DAILY_STORAGE_PREFIX}set:`;
export const dailySetKey = (date: string) => `${DAILY_SET_PREFIX}${date}`;
export const dailyRecordKey = (date: string) =>
  `${DAILY_STORAGE_PREFIX}record:${date}`;
export const DAILY_STREAK_KEY = `${DAILY_STORAGE_PREFIX}streak`;
export const DAILY_REMINDER_ID = "daily-reminder";
export const DAILY_REMINDER_HOUR = 20;
export const DAILY_NOTIFICATION_TARGET = "daily";
// Matches the bounds enforced by submitDailyResult.
export const DAILY_MIN_TIME_MS = 10_000;
export const DAILY_MAX_TIME_MS = 3_600_000;
