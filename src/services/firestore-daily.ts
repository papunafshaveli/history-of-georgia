import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { db, functions } from "@/firebase";
import {
  DAILY_MAX_TIME_MS,
  DAILY_MIN_TIME_MS,
  DAILY_QUESTION_COUNT,
} from "@/src/constants/daily";
import { logger } from "@/src/helpers/logger";
import { todayTbilisi } from "@/src/utils/tbilisiDate";
import {
  adoptCloudStreak,
  markSynced,
  needsCloudStreak,
  unsyncedDoneRecords,
} from "@/src/services/local-daily-progress";
import type { DailyStreak } from "@/src/types";

type DailySubmission = {
  uid: string;
  date: string;
  answers: { ticketId: string; option: string }[];
  elapsedMs: number;
};

const submitDailyResult = httpsCallable<DailySubmission>(
  functions,
  "submitDailyResult",
);

export const syncDailyResults = async (uid: string): Promise<void> => {
  try {
    const pending = (await unsyncedDoneRecords(uid)).reverse();
    for (const { date, answers, elapsedMs } of pending) {
      const submission = answers.flatMap(({ ticketId, option }) =>
        option === undefined ? [] : [{ ticketId, option }],
      );

      // Older records still count locally but have no selections for the server to verify.
      if (submission.length === DAILY_QUESTION_COUNT) {
        try {
          await submitDailyResult({
            uid,
            date,
            answers: submission,
            elapsedMs: Math.min(
              DAILY_MAX_TIME_MS,
              Math.max(DAILY_MIN_TIME_MS, Math.round(elapsedMs)),
            ),
          });
        } catch (error) {
          const code = (error as { code?: string } | null)?.code;
          // invalid-argument (e.g. an overridden set) can never be ranked. failed-precondition on a
          // past day won't change either, so drop it rather than block every newer day. On today
          // or a "not started yet" day it is retried on the next open.
          const unrankable =
            code === "functions/invalid-argument" ||
            (code === "functions/failed-precondition" && date < todayTbilisi());
          if (!unrankable) throw error;
          logger.warn("syncDailyResults: daily submission can't be ranked", error);
        }
      }
      await markSynced(date, uid);
    }
  } catch (error) {
    logger.warn("syncDailyResults failed; retrying on next open", error);
  }
};

// After a reinstall or on a new phone, join the streak the server kept for this account.
export const restoreCloudStreak = async (
  uid: string,
  isCurrent: () => boolean = () => true,
): Promise<boolean> => {
  try {
    if (!(await needsCloudStreak(uid))) return false;
    const data = (await getDoc(doc(db, "users", uid))).data();
    // The account changed while reading; this one is checked again when it is next active.
    if (!isCurrent()) return false;
    const current = data?.currentStreak;
    const lastDate = data?.dailyDate;
    const cloud: DailyStreak | null =
      typeof current === "number" && typeof lastDate === "string"
        ? {
            current,
            longest: Math.max(Number(data?.longestStreak) || 0, current),
            lastDate,
          }
        : null;
    return await adoptCloudStreak(uid, cloud);
  } catch (error) {
    logger.warn("restoreCloudStreak failed; retrying on next open", error);
    return false;
  }
};
