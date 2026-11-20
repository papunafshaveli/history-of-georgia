import * as Notifications from "expo-notifications";

import {
  DAILY_NOTIFICATION_TARGET,
  DAILY_QUESTION_COUNT,
  DAILY_REMINDER_HOUR,
  DAILY_REMINDER_ID,
} from "@/src/constants/daily";
import { readRecord } from "@/src/services/local-daily-progress";
import { DailyStatus } from "@/src/types/daily";
import { todayTbilisi } from "@/src/utils/tbilisiDate";
import { logger } from "./logger";

export const nextReminderAt = (now: Date, playedToday: boolean): Date => {
  const at = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    DAILY_REMINDER_HOUR,
    0,
  );
  if (playedToday || now >= at) at.setDate(at.getDate() + 1);
  return at;
};

type ReminderTexts = { title: string; body: string };
let reminderQueue = Promise.resolve();
let latestRequest = 0;

// Serialize native operations so a just-disabled reminder cannot be recreated
// by a permission check or native schedule call that was already in flight.
const updateReminder = (
  enabled: boolean,
  texts: ReminderTexts,
  getDate: () => Date | Promise<Date>,
) => {
  const request = ++latestRequest;
  reminderQueue = reminderQueue.then(async () => {
    if (request !== latestRequest) return;
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    if (!enabled || request !== latestRequest) return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted" || request !== latestRequest) return;

    const date = await getDate();
    if (request !== latestRequest) return;
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        ...texts,
        data: { target: DAILY_NOTIFICATION_TARGET },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
    });
  }).catch((error) => logger.warn("scheduleDailyReminder failed", error));
  return reminderQueue;
};

export const refreshDailyReminder = (enabled: boolean, texts: ReminderTexts) =>
  updateReminder(enabled, texts, async () => {
    const now = new Date();
    const next = nextReminderAt(now, false);
    // The trigger is local time; the challenge it refers to uses Tbilisi time.
    const record = await readRecord(todayTbilisi(next));
    const played = record?.status === DailyStatus.DONE ||
      record?.answers.length === DAILY_QUESTION_COUNT;
    if (played) next.setDate(next.getDate() + 1);
    return next;
  });
