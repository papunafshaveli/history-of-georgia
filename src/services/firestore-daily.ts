import { httpsCallable } from "firebase/functions";

import { functions } from "@/firebase";
import {
  DAILY_MAX_TIME_MS,
  DAILY_MIN_TIME_MS,
  DAILY_QUESTION_COUNT,
} from "@/src/constants/daily";
import { logger } from "@/src/helpers/logger";
import { todayTbilisi } from "@/src/utils/tbilisiDate";
import {
  markSynced,
  unsyncedDoneRecords,
} from "@/src/services/local-daily-progress";

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
