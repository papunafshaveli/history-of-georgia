import {
  FieldValue,
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { selectDailySet, type PoolTicket } from "./dailySelection";

const DAYS_AHEAD = 3; // today, tomorrow, the day after
const REPEAT_WINDOW_DAYS = 150;
const TBILISI_OFFSET_MS = 4 * 3_600_000;
const DAY_MS = 86_400_000;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const tbilisiToday = () => isoDay(Date.now() + TBILISI_OFFSET_MS);
const plusDays = (date: string, n: number) =>
  isoDay(Date.parse(`${date}T00:00:00Z`) + n * DAY_MS);

export const ensureDays = async (
  db: Firestore,
  today: string,
): Promise<string[]> => {
  const daily = db.collection("daily_challenges");
  const created: string[] = [];
  let pool: PoolTicket[] | null = null;

  for (let n = 0; n < DAYS_AHEAD; n += 1) {
    const date = plusDays(today, n);
    const ref = daily.doc(date);
    if ((await ref.get()).exists) continue; // never overwrite a manual override

    // A question whose correct answer isn't one of its options can't be scored; never pick it.
    pool ??= (
      await db.collection("tickets").select("difficulty", "options", "correctAnswer").get()
    ).docs
      .filter((d) => {
        const options = d.get("options");
        return Array.isArray(options) && options.includes(d.get("correctAnswer"));
      })
      .map((d) => ({ id: d.id, difficulty: d.get("difficulty") }));

    const recent = await daily
      .where("date", "<", date)
      .orderBy("date", "desc")
      .limit(REPEAT_WINDOW_DAYS)
      .get();
    const recentIds = ([] as string[]).concat(
      ...recent.docs.map((d) => d.get("ticketIds") as string[]),
    );

    await ref.create({
      date,
      ticketIds: selectDailySet(pool, recentIds),
      createdAt: FieldValue.serverTimestamp(),
      source: "scheduler",
    });
    created.push(date);
  }
  return created;
};

export const ensureDailyChallenges = onSchedule(
  { schedule: "5 0 * * *", timeZone: "Asia/Tbilisi" },
  async () => {
    const created = await ensureDays(getFirestore(), tbilisiToday());
    console.log(`daily_challenges created: ${created.join(", ") || "none"}`);
  },
);

const QUESTION_COUNT = 10;
const RESULT_RETENTION_DAYS = 7;
const MIN_TIME_MS = 10_000;
const MAX_TIME_MS = 3_600_000;

type SubmittedAnswer = { ticketId: string; option: string };

const isSubmittedAnswer = (value: unknown): value is SubmittedAnswer => {
  if (!value || typeof value !== "object") return false;
  const answer = value as Partial<SubmittedAnswer>;
  return typeof answer.ticketId === "string" && typeof answer.option === "string";
};

export const submitDailyResult = onCall(async ({ auth, data }) => {
  if (!auth) throw new HttpsError("unauthenticated", "Sign in first.");
  if (data?.uid !== auth.uid) {
    throw new HttpsError("permission-denied", "The account changed.");
  }

  const today = tbilisiToday();
  const { date, answers, elapsedMs } = data;
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
    plusDays(date, 0) !== date ||
    date > plusDays(today, 1) ||
    date < plusDays(today, -RESULT_RETENTION_DAYS) ||
    !Array.isArray(answers) ||
    answers.length !== QUESTION_COUNT ||
    !answers.every(isSubmittedAnswer) ||
    !Number.isSafeInteger(elapsedMs) ||
    elapsedMs < MIN_TIME_MS ||
    elapsedMs > MAX_TIME_MS
  ) {
    throw new HttpsError("invalid-argument", "Invalid daily submission.");
  }

  // A device clock slightly ahead (around midnight) plays tomorrow's pre-created set: retry later.
  if (date > today) {
    throw new HttpsError("failed-precondition", "This day has not started yet.");
  }

  const db = getFirestore();
  const userRef = db.collection("users").doc(auth.uid);
  const challengeRef = db.collection("daily_challenges").doc(date);

  await db.runTransaction(async (transaction) => {
    const user = (await transaction.get(userRef)).data();
    // Retryable: the profile is created at sign-in and may lag a moment behind a new account.
    if (!user) throw new HttpsError("unavailable", "The user profile is not ready.");
    if (user.dailyDate >= date) return; // Replays cannot replace a recorded day.

    const challenge = await transaction.get(challengeRef);
    if (!challenge.exists) {
      throw new HttpsError("failed-precondition", "The daily challenge is not ready.");
    }

    const ticketIds: string[] = challenge.get("ticketIds");
    if (
      !Array.isArray(ticketIds) ||
      ticketIds.length !== QUESTION_COUNT ||
      new Set(ticketIds).size !== QUESTION_COUNT ||
      ticketIds.some((id, index) => id !== answers[index].ticketId)
    ) {
      throw new HttpsError("invalid-argument", "The answers do not match this daily set.");
    }

    const snapshots = await transaction.getAll(
      ...ticketIds.map((id) => db.collection("tickets").doc(id)),
    );
    const tickets = new Map(
      snapshots.map((snapshot) => [snapshot.id, snapshot.data()]),
    );
    let dailyCorrect = 0;
    for (const { ticketId, option } of answers) {
      const question = tickets.get(ticketId);
      // A deleted or broken question can't be scored; it counts as wrong for everyone instead of
      // refusing the whole day (which would also block every newer day on the device).
      if (
        !question ||
        !Array.isArray(question.options) ||
        !question.options.includes(question.correctAnswer)
      ) {
        continue;
      }
      // An option edited after the device cached the set no longer matches: it counts as wrong.
      if (option === question.correctAnswer) dailyCorrect += 1;
    }

    const currentStreak =
      user.dailyDate === plusDays(date, -1) ? (user.currentStreak ?? 0) + 1 : 1;
    transaction.update(userRef, {
      dailyDate: date,
      dailyCorrect,
      dailyTimeMs: elapsedMs,
      currentStreak,
      longestStreak: Math.max(currentStreak, user.longestStreak ?? 0),
      isAnonymous:
        user.isAnonymous ?? (auth.token.firebase.sign_in_provider === "anonymous"),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { accepted: true };
});
