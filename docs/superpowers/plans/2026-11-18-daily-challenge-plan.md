# Daily Challenge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the daily challenge (10 shared questions with a visible stopwatch, streak, 20:00 reminder, result + share, Today leaderboard ranked by score then time) as a JS-only update to runtime 2.1.0 plus a Firebase deploy.

**Architecture:** A scheduled Cloud Function writes `daily_challenges/{YYYY-MM-DD}` (Tbilisi date) two days ahead from the `tickets` bank. The app caches today's and tomorrow's set, keeps the attempt and streak locally (source of truth on the device), mirrors the finished result to `users/{uid}` for the Today board, and schedules a local 20:00 reminder. Pure logic (dates, streak, stopwatch, selection, share text, reminder decision) lives in small tested modules; screens stay thin.

**Tech Stack:** Expo SDK 57 / React Native 0.86 / TypeScript, Firebase JS SDK (Firestore), Cloud Functions v2 (`firebase-functions` 6, `firebase-admin` 12), `expo-notifications` (local), AsyncStorage, Jest (`jest-expo`).

**Spec:** `docs/superpowers/specs/2026-11-18-daily-challenge-design.md` · **Mockups:** https://claude.ai/artifact/K2MAV87E1kX9N1WXYVkHKL (home = option B + "after done"; screens 3–6).

**Rules that apply to every task** (from `.claude/rules/*` and the owner's global rules):
- Styles via `useStyles(getStyles)` in a sibling `styles.ts`; colours only `theme.colors.*`; sizes via `theme.spacing.*`, `theme.borderRadius.*`, `getAdjustedWidth/Height`.
- No anonymous functions or inline expressions in JSX props; no nested ternaries; no magic strings (enums/constants).
- Every user-facing string through `t` (both `ka.json` and `en.json`). Georgian comes from the owner only — until he supplies it, `ka.json` carries the English draft and the key is listed in Task 17's release gate.
- **Commits:** the owner authorises each commit separately. Each task ends with *stage + show the diff*, then waits. No `Co-Authored-By` trailer. Never push to `main`.
- No native dependency may be added (that would break the OTA release). `react-native-svg` is **not** installed; the broken sword is built from two clipped `MaterialCommunityIcons` glyphs.

---

## File structure

| File | Responsibility |
|---|---|
| `src/utils/tbilisiDate.ts` | Tbilisi calendar date maths (pure) |
| `src/helpers/dailyStreak.ts` | Next streak from last completed date (pure) |
| `src/helpers/stopwatch.ts` | Pausable elapsed-time accumulator (pure) |
| `src/helpers/dailyShare.ts` | Share text builder — never includes questions or answers (pure) |
| `src/helpers/dailyReminder.ts` | Decide + (re)schedule the 20:00 local notification |
| `src/types/daily.ts` | `DailyChallenge`, `DailyAnswer`, `DailyRecord`, `DailyStreak`, `DailyCardState` |
| `src/constants/daily.ts` | Counts, mix, storage keys, reminder hour, time bounds |
| `src/services/daily-challenge.ts` | Fetch + cache a day's set and its 10 tickets |
| `src/services/local-daily-progress.ts` | Local attempt record per date + streak |
| `src/services/firestore-daily.ts` | Mirror a finished daily to `users/{uid}`; retry unsynced |
| `src/hooks/useStopwatch.ts` | React wrapper around `stopwatch.ts` (1 s tick) |
| `src/hooks/useDailyChallenge.ts` | Home card state (not played / done / unavailable) |
| `src/hooks/useDailyGame.ts` | The 10-question run, answers, time, resume, finish |
| `src/components/daily-progress/DailyProgress.tsx` | Row of swords (whole / broken / current / upcoming) |
| `src/components/daily-progress/BrokenSword.tsx` | Two clipped `sword` glyphs, tip knocked aside |
| `src/components/daily-card/DailyCard.tsx` | Home card in the other-apps card style, both states |
| `src/screens/main-screens/daily-game-screen/DailyGameScreen.tsx` | Daily question screen |
| `src/screens/main-screens/daily-result-screen/DailyResultScreen.tsx` | Result, swords, streak, place, Share |
| `functions/src/dailySelection.ts` | Pick 3/4/3 ticket ids avoiding the last 150 days (pure) |
| `functions/src/daily.ts` | Scheduled `ensureDailyChallenges` |
| Modified | `StartGameScreen` (+ScrollView, card), leaderboard service/hook/tabs/row/podium/screen, `GameFooter` (`showHint`), navigation types + `AppNavigation`, `types/leaderboard.ts`, `firestore.rules`, `firestore.indexes.json`, `functions/src/index.ts`, `functions/tsconfig.json`, locales, `INFRASTRUCTURE.md`, `README.md` |

---

### Task 0: Branch

- [ ] **Step 1:** Create the feature branch from `main`.

```bash
cd "/Users/macbookpro/Desktop/my personal projects/history-of-georgia"
git switch -c feat/daily-challenge
```

---

### Task 1: Tbilisi date utilities

**Files:** Create `src/utils/tbilisiDate.ts`; Test `src/__tests__/tbilisiDate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {
  addDaysToDate,
  msUntilNextTbilisiMidnight,
  todayTbilisi,
} from "@/src/utils/tbilisiDate";

describe("tbilisiDate", () => {
  it("uses Tbilisi (UTC+4) for the calendar day", () => {
    expect(todayTbilisi(new Date("2026-11-18T19:59:00Z"))).toBe("2026-11-18");
    expect(todayTbilisi(new Date("2026-11-18T20:00:00Z"))).toBe("2026-11-19");
  });

  it("adds days across month and year ends", () => {
    expect(addDaysToDate("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDaysToDate("2026-12-31", 2)).toBe("2027-01-02");
    expect(addDaysToDate("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts down to the next Tbilisi midnight", () => {
    expect(msUntilNextTbilisiMidnight(new Date("2026-11-18T19:00:00Z"))).toBe(3_600_000);
    expect(msUntilNextTbilisiMidnight(new Date("2026-11-18T20:00:00Z"))).toBe(86_400_000);
  });
});
```

- [ ] **Step 2:** Run `npx jest src/__tests__/tbilisiDate.test.ts` — expect FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
// Tbilisi is UTC+4 all year (no DST), so shifting the instant is exact.
const TBILISI_OFFSET_MS = 4 * 3_600_000;
const DAY_MS = 86_400_000;

const pad = (n: number) => n.toString().padStart(2, "0");

const formatUtc = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export const todayTbilisi = (now: Date = new Date()): string =>
  formatUtc(new Date(now.getTime() + TBILISI_OFFSET_MS));

export const addDaysToDate = (date: string, days: number): string =>
  formatUtc(new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS));

export const msUntilNextTbilisiMidnight = (now: Date = new Date()): number => {
  const shifted = now.getTime() + TBILISI_OFFSET_MS;
  return DAY_MS - (shifted % DAY_MS);
};
```

- [ ] **Step 4:** Run the test — expect PASS.
- [ ] **Step 5:** `git add src/utils/tbilisiDate.ts src/__tests__/tbilisiDate.test.ts`, show `git diff --cached`, wait for the owner's commit OK. Message: `feat(daily): Tbilisi date helpers so every player shares one "today"`.

---

### Task 2: Daily constants and types

**Files:** Create `src/constants/daily.ts`, `src/types/daily.ts`; Modify `src/constants/index.ts`, `src/types/index.ts`

- [ ] **Step 1: Constants**

```ts
// src/constants/daily.ts
import type { Difficulty } from "@/src/types/quizQuestion";

export const DAILY_QUESTION_COUNT = 10;
export const DAILY_ORDER: Difficulty[] = [
  "easy", "easy", "easy",
  "medium", "medium", "medium", "medium",
  "hard", "hard", "hard",
];
export const DAILY_COLLECTION = "daily_challenges";
export const DAILY_STORAGE_PREFIX = "daily:";
export const DAILY_SET_KEY = (date: string) => `${DAILY_STORAGE_PREFIX}set:${date}`;
export const DAILY_RECORD_KEY = (date: string) => `${DAILY_STORAGE_PREFIX}record:${date}`;
export const DAILY_STREAK_KEY = `${DAILY_STORAGE_PREFIX}streak`;
export const DAILY_REMINDER_ID = "daily-reminder";
export const DAILY_REMINDER_HOUR = 20;
// Mirrors firestore.rules: a real run cannot be faster than ~1 s a question.
export const DAILY_MIN_TIME_MS = 10_000;
export const DAILY_MAX_TIME_MS = 3_600_000;
```

Add `export * from "./daily";` to `src/constants/index.ts`.

- [ ] **Step 2: Types**

```ts
// src/types/daily.ts
import type { QuizQuestion } from "./quizQuestion";

export type DailyChallenge = {
  date: string;
  ticketIds: string[];
};

export type DailySet = DailyChallenge & {
  questions: QuizQuestion[];
};

export type DailyAnswer = {
  ticketId: string;
  isCorrect: boolean;
};

export enum DailyStatus {
  IN_PROGRESS = "in_progress",
  DONE = "done",
}

export type DailyRecord = {
  date: string;
  status: DailyStatus;
  answers: DailyAnswer[];
  elapsedMs: number;
  synced: boolean;
};

export type DailyStreak = {
  current: number;
  longest: number;
  lastDate: string | null;
};

export enum DailyCardKind {
  UNAVAILABLE = "unavailable",
  NOT_PLAYED = "not_played",
  IN_PROGRESS = "in_progress",
  DONE = "done",
}
```

Add `export * from "./daily";` to `src/types/index.ts`.

- [ ] **Step 3:** `npx tsc --noEmit` — expect no errors.
- [ ] **Step 4:** Stage both new files and both barrels; show diff; wait. Message: `feat(daily): constants and types for the daily challenge`.

---

### Task 3: Streak maths

**Files:** Create `src/helpers/dailyStreak.ts`; Modify `src/helpers/index.ts`; Test `src/__tests__/dailyStreak.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { nextStreak, visibleStreak } from "@/src/helpers/dailyStreak";

const empty = { current: 0, longest: 0, lastDate: null };

describe("nextStreak", () => {
  it("starts at 1", () => {
    expect(nextStreak(empty, "2026-11-18")).toEqual({ current: 1, longest: 1, lastDate: "2026-11-18" });
  });
  it("grows on the next day", () => {
    expect(nextStreak({ current: 4, longest: 6, lastDate: "2026-11-17" }, "2026-11-18"))
      .toEqual({ current: 5, longest: 6, lastDate: "2026-11-18" });
  });
  it("resets after a missed day", () => {
    expect(nextStreak({ current: 9, longest: 9, lastDate: "2026-11-15" }, "2026-11-18"))
      .toEqual({ current: 1, longest: 9, lastDate: "2026-11-18" });
  });
  it("is unchanged when the same day is completed twice", () => {
    const s = { current: 3, longest: 3, lastDate: "2026-11-18" };
    expect(nextStreak(s, "2026-11-18")).toEqual(s);
  });
});

describe("visibleStreak", () => {
  it("shows 0 once a day was missed", () => {
    expect(visibleStreak({ current: 5, longest: 5, lastDate: "2026-11-15" }, "2026-11-18")).toBe(0);
  });
  it("keeps yesterday's streak alive until today ends", () => {
    expect(visibleStreak({ current: 5, longest: 5, lastDate: "2026-11-17" }, "2026-11-18")).toBe(5);
  });
});
```

- [ ] **Step 2:** `npx jest src/__tests__/dailyStreak.test.ts` — FAIL.
- [ ] **Step 3: Implement**

```ts
import type { DailyStreak } from "@/src/types";
import { addDaysToDate } from "@/src/utils/tbilisiDate";

export const nextStreak = (prev: DailyStreak, completedDate: string): DailyStreak => {
  if (prev.lastDate === completedDate) return prev;
  const continues = prev.lastDate === addDaysToDate(completedDate, -1);
  const current = continues ? prev.current + 1 : 1;
  return { current, longest: Math.max(prev.longest, current), lastDate: completedDate };
};

// A streak stays visible through the day after the last completion, then drops to 0.
export const visibleStreak = (streak: DailyStreak, today: string): number => {
  if (!streak.lastDate) return 0;
  const alive = streak.lastDate === today || streak.lastDate === addDaysToDate(today, -1);
  return alive ? streak.current : 0;
};
```

Add `export * from "./dailyStreak";` to `src/helpers/index.ts`.

- [ ] **Step 4:** Run — PASS.
- [ ] **Step 5:** Stage, diff, wait. Message: `feat(daily): streak maths`.

---

### Task 4: Stopwatch accumulator

**Files:** Create `src/helpers/stopwatch.ts`, `src/hooks/useStopwatch.ts`; Modify both barrels; Test `src/__tests__/stopwatch.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { elapsed, pause, resume, startStopwatch } from "@/src/helpers/stopwatch";

describe("stopwatch", () => {
  it("counts only running time", () => {
    let s = startStopwatch(0, 1_000);          // resumed from 0 ms at t=1000
    expect(elapsed(s, 4_000)).toBe(3_000);
    s = pause(s, 4_000);                       // answer tapped
    expect(elapsed(s, 6_000)).toBe(3_000);     // feedback delay not counted
    s = resume(s, 6_000);                      // next question shown
    expect(elapsed(s, 8_500)).toBe(5_500);
  });
  it("resumes from a saved total", () => {
    expect(elapsed(startStopwatch(42_000, 0), 1_000)).toBe(43_000);
  });
  it("ignores double pause and double resume", () => {
    let s = startStopwatch(0, 0);
    s = pause(pause(s, 1_000), 2_000);
    s = resume(resume(s, 3_000), 4_000);
    expect(elapsed(s, 5_000)).toBe(3_000);
  });
});
```

- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3: Implement**

```ts
// src/helpers/stopwatch.ts
export type Stopwatch = { baseMs: number; runningSince: number | null };

export const startStopwatch = (baseMs: number, now: number): Stopwatch => ({ baseMs, runningSince: now });

export const pause = (s: Stopwatch, now: number): Stopwatch =>
  s.runningSince === null ? s : { baseMs: s.baseMs + (now - s.runningSince), runningSince: null };

export const resume = (s: Stopwatch, now: number): Stopwatch =>
  s.runningSince === null ? { ...s, runningSince: now } : s;

export const elapsed = (s: Stopwatch, now: number): number =>
  s.runningSince === null ? s.baseMs : s.baseMs + (now - s.runningSince);

export const formatClock = (ms: number): string => {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
};
```

```ts
// src/hooks/useStopwatch.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { elapsed, pause, resume, startStopwatch, type Stopwatch } from "@/src/helpers/stopwatch";

const TICK_MS = 1000;

export const useStopwatch = (initialMs: number) => {
  const ref = useRef<Stopwatch>(startStopwatch(initialMs, Date.now()));
  const [displayMs, setDisplayMs] = useState(initialMs);

  useEffect(() => {
    const id = setInterval(() => setDisplayMs(elapsed(ref.current, Date.now())), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const pauseClock = useCallback(() => {
    ref.current = pause(ref.current, Date.now());
    setDisplayMs(ref.current.baseMs);
  }, []);
  const resumeClock = useCallback(() => {
    ref.current = resume(ref.current, Date.now());
  }, []);
  const readMs = useCallback(() => elapsed(ref.current, Date.now()), []);

  return { displayMs, pauseClock, resumeClock, readMs };
};
```

Barrels: `export * from "./stopwatch";` in `src/helpers/index.ts`; `export * from "./useStopwatch";` in `src/hooks/index.ts`.

- [ ] **Step 4:** Run — PASS. `npx tsc --noEmit` clean.
- [ ] **Step 5:** Stage, diff, wait. Message: `feat(daily): pausable stopwatch; feedback animations never cost time`.

---

### Task 5: Server-side set selection (pure)

**Files:** Create `functions/src/dailySelection.ts`; Test `functions/src/__tests__/dailySelection.test.ts`; Modify `functions/tsconfig.json`

- [ ] **Step 1:** Exclude tests from the functions build — in `functions/tsconfig.json` add `"exclude": ["src/__tests__"]` beside `"include"`. (The app's Jest already scans `functions/`.)

- [ ] **Step 2: Failing test**

```ts
import { selectDailySet, type PoolTicket } from "../dailySelection";

const pool = (prefix: string, difficulty: PoolTicket["difficulty"], n: number): PoolTicket[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, difficulty }));

const seq = () => { let i = 0; return () => ((i++ * 0.37) % 1); };

describe("selectDailySet", () => {
  const all = [...pool("e", "easy", 10), ...pool("m", "medium", 10), ...pool("h", "hard", 10)];

  it("returns 3 easy, 4 medium, 3 hard in that order", () => {
    const ids = selectDailySet(all, [], seq());
    expect(ids).toHaveLength(10);
    expect(ids.slice(0, 3).every((id) => id.startsWith("e"))).toBe(true);
    expect(ids.slice(3, 7).every((id) => id.startsWith("m"))).toBe(true);
    expect(ids.slice(7).every((id) => id.startsWith("h"))).toBe(true);
    expect(new Set(ids).size).toBe(10);
  });

  it("avoids recently used ids", () => {
    const recent = ["e0", "e1", "e2", "e3", "e4", "e5", "e6"];
    const ids = selectDailySet(all, recent, seq());
    expect(ids.filter((id) => recent.includes(id))).toEqual([]);
  });

  it("falls back to the oldest-used ids when a difficulty runs short", () => {
    // recent is newest first: e9 used yesterday, e0 longest ago.
    const recent = ["e9", "e8", "e7", "e6", "e5", "e4", "e3", "e2", "e1", "e0"];
    const ids = selectDailySet(all, recent, seq());
    expect(ids.slice(0, 3).sort()).toEqual(["e0", "e1", "e2"]);
  });
});
```

- [ ] **Step 3:** `npx jest functions/src/__tests__/dailySelection.test.ts` — FAIL.
- [ ] **Step 4: Implement**

```ts
// functions/src/dailySelection.ts
export type Difficulty = "easy" | "medium" | "hard";
export type PoolTicket = { id: string; difficulty: Difficulty };

const MIX: [Difficulty, number][] = [["easy", 3], ["medium", 4], ["hard", 3]];

const shuffle = <T>(items: T[], rng: () => number): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// recentNewestFirst: ticket ids from earlier daily sets, most recent day first.
export const selectDailySet = (
  pool: PoolTicket[],
  recentNewestFirst: string[],
  rng: () => number = Math.random,
): string[] => {
  const recent = new Set(recentNewestFirst);
  const picked: string[] = [];
  for (const [difficulty, count] of MIX) {
    const ofLevel = pool.filter((t) => t.difficulty === difficulty);
    const fresh = shuffle(ofLevel.filter((t) => !recent.has(t.id)), rng).map((t) => t.id);
    const oldestFirst = [...recentNewestFirst].reverse()
      .filter((id) => ofLevel.some((t) => t.id === id));
    const chosen = [...fresh, ...oldestFirst].slice(0, count);
    if (chosen.length < count) throw new Error(`only ${chosen.length} ${difficulty} tickets`);
    picked.push(...chosen);
  }
  return picked;
};
```

- [ ] **Step 5:** Run — PASS. `cd functions && npx tsc --noEmit` — clean.
- [ ] **Step 6:** Stage, diff, wait. Message: `feat(daily): pick 3/4/3 tickets avoiding the last 150 days`.

---

### Task 6: Scheduled function

**Files:** Create `functions/src/daily.ts`; Modify `functions/src/index.ts`

- [ ] **Step 1: Implement**

```ts
// functions/src/daily.ts
import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { selectDailySet, type PoolTicket } from "./dailySelection";

const DAYS_AHEAD = 3;          // today, tomorrow, the day after
const REPEAT_WINDOW_DAYS = 150;
const TBILISI_OFFSET_MS = 4 * 3_600_000;
const DAY_MS = 86_400_000;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const tbilisiToday = () => isoDay(Date.now() + TBILISI_OFFSET_MS);
const plusDays = (date: string, n: number) => isoDay(Date.parse(`${date}T00:00:00Z`) + n * DAY_MS);

export const ensureDays = async (db: admin.firestore.Firestore, today: string): Promise<string[]> => {
  const daily = db.collection("daily_challenges");
  const created: string[] = [];
  let pool: PoolTicket[] | null = null;

  for (let n = 0; n < DAYS_AHEAD; n += 1) {
    const date = plusDays(today, n);
    const ref = daily.doc(date);
    if ((await ref.get()).exists) continue; // never overwrite a manual override

    pool ??= (await db.collection("tickets").select("difficulty").get()).docs
      .map((d) => ({ id: d.id, difficulty: d.get("difficulty") }));

    const recent = await daily.where("date", "<", date).orderBy("date", "desc")
      .limit(REPEAT_WINDOW_DAYS).get();
    const recentIds = recent.docs.flatMap((d) => d.get("ticketIds") as string[]);

    await ref.create({
      date,
      ticketIds: selectDailySet(pool, recentIds),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: "scheduler",
    });
    created.push(date);
  }
  return created;
};

export const ensureDailyChallenges = onSchedule(
  { schedule: "5 0 * * *", timeZone: "Asia/Tbilisi" },
  async () => {
    const created = await ensureDays(admin.firestore(), tbilisiToday());
    console.log(`daily_challenges created: ${created.join(", ") || "none"}`);
  },
);
```

- [ ] **Step 2:** In `functions/src/index.ts`, after `admin.initializeApp();`, add `export { ensureDailyChallenges } from "./daily";`.
- [ ] **Step 3:** `cd functions && npm run build` — compiles with no errors.
- [ ] **Step 4:** Stage, diff, wait. Message: `feat(daily): scheduled function keeps three days of sets ready`.

> After deploy, the first sets exist only after the first run. Run it once immediately from Google Cloud Console → Cloud Scheduler → `firebase-schedule-ensureDailyChallenges-…` → **Force run** (owner action, documented in README in Task 16).

---

### Task 7: Firestore rules and index

**Files:** Modify `firestore.rules`, `firestore.indexes.json`

- [ ] **Step 1: Rules** — add beside `match /tickets/...`:

```
    // daily_challenges/{date}: written only by the scheduled function.
    match /daily_challenges/{date} {
      allow read: if true;
      allow write: if false;
    }
```

and append to the `users/{uid}` `allow update` condition (inside the existing `&&` chain):

```
        && dailyFieldsValid(request.resource.data, resource.data)
```

with this function at the top of `match /databases/{database}/documents {`:

```
    // One daily result per Tbilisi date; dates only move forward; values bounded.
    function dailyFieldsValid(next, prev) {
      let nextDate = next.get('dailyDate', '');
      let prevDate = prev.get('dailyDate', '');
      let same = nextDate == prevDate;
      return (nextDate == '' || (
               next.dailyCorrect is int && next.dailyCorrect >= 0 && next.dailyCorrect <= 10
               && next.dailyTimeMs is int && next.dailyTimeMs >= 10000 && next.dailyTimeMs <= 3600000))
        && (same
              ? (next.get('dailyCorrect', -1) == prev.get('dailyCorrect', -1)
                 && next.get('dailyTimeMs', -1) == prev.get('dailyTimeMs', -1))
              : nextDate > prevDate)
        && next.get('currentStreak', 0) <= prev.get('currentStreak', 0) + 1
        && next.get('longestStreak', 0) >= prev.get('longestStreak', 0);
    }
```

- [ ] **Step 2: Index** — append to `"indexes"`:

```json
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "displayName", "order": "ASCENDING" },
        { "fieldPath": "dailyDate", "order": "ASCENDING" },
        { "fieldPath": "dailyCorrect", "order": "DESCENDING" },
        { "fieldPath": "dailyTimeMs", "order": "ASCENDING" }
      ]
    }
```

- [ ] **Step 3: Emulator check** (Java 17 + firebase-tools 13 are what this Mac supports):

```bash
npx -y firebase-tools@13 emulators:exec --only firestore --project demo-hog \
  "node scripts/check-daily-rules.mjs"
```

Create `scripts/check-daily-rules.mjs` that uses `@firebase/rules-unit-testing` (install as a devDependency: `npm i -D @firebase/rules-unit-testing@3`) and asserts, as user `u1` on a seeded `users/u1` doc:
1. first daily write `{dailyDate:"2026-11-18", dailyCorrect:8, dailyTimeMs:108000, currentStreak:1, longestStreak:1}` → succeeds;
2. same date with `dailyCorrect:9` → fails;
3. earlier date `2026-11-17` → fails;
4. `dailyTimeMs:5000` → fails;
5. `currentStreak` jumping from 1 to 3 → fails;
6. an ordinary game-result style update that leaves the daily fields alone → succeeds.

Expected output: six `ok` lines, exit 0.

- [ ] **Step 4:** Stage rules, index, script and `package.json`/lockfile; show diff; wait. Message: `feat(daily): rules allow one bounded result per day; index for the Today board`.

---

### Task 8: Fetch and cache the day's set

**Files:** Create `src/services/daily-challenge.ts`; Test `src/services/__tests__/daily-challenge.test.ts`

- [ ] **Step 1: Failing test**

```ts
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("@/firebase", () => ({ db: {} }));

const getDoc = jest.fn();
const getDocs = jest.fn();
jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db, col, id) => ({ col, id })),
  collection: jest.fn(),
  documentId: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDoc: (...a: unknown[]) => getDoc(...a),
  getDocs: (...a: unknown[]) => getDocs(...a),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadDailySet } from "@/src/services/daily-challenge";

const ids = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
const ticket = (id: string) => ({ id, data: () => ({ id: 1, question: `q-${id}`, options: [], correctAnswer: "", hint: "", randomField: 0, difficulty: "easy" }) });

beforeEach(async () => { await AsyncStorage.clear(); getDoc.mockReset(); getDocs.mockReset(); });

it("fetches the set and keeps the play order", async () => {
  getDoc.mockResolvedValue({ exists: () => true, data: () => ({ date: "2026-11-18", ticketIds: ids }) });
  getDocs.mockResolvedValue({ docs: [...ids].reverse().map(ticket) });
  const set = await loadDailySet("2026-11-18");
  expect(set?.questions.map((q) => q.question)).toEqual(ids.map((id) => `q-${id}`));
});

it("serves the cache without network", async () => {
  getDoc.mockResolvedValue({ exists: () => true, data: () => ({ date: "2026-11-18", ticketIds: ids }) });
  getDocs.mockResolvedValue({ docs: ids.map(ticket) });
  await loadDailySet("2026-11-18");
  getDoc.mockRejectedValue(new Error("offline"));
  expect((await loadDailySet("2026-11-18"))?.ticketIds).toEqual(ids);
});

it("returns null when the day has no set and nothing is cached", async () => {
  getDoc.mockResolvedValue({ exists: () => false });
  expect(await loadDailySet("2026-11-18")).toBeNull();
});
```

- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3: Implement**

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, documentId, getDoc, getDocs, query, where } from "firebase/firestore";

import { db } from "@/firebase";
import { DAILY_COLLECTION, DAILY_QUESTION_COUNT, DAILY_SET_KEY, DAILY_STORAGE_PREFIX } from "@/src/constants";
import { logger } from "@/src/helpers/logger";
import type { DailyChallenge, DailySet, QuizQuestion } from "@/src/types";
import { addDaysToDate } from "@/src/utils/tbilisiDate";

const TICKETS_COLLECTION = "tickets";

const readCached = async (date: string): Promise<DailySet | null> => {
  try {
    const raw = await AsyncStorage.getItem(DAILY_SET_KEY(date));
    return raw ? (JSON.parse(raw) as DailySet) : null;
  } catch {
    return null;
  }
};

const fetchSet = async (date: string): Promise<DailySet | null> => {
  const snap = await getDoc(doc(db, DAILY_COLLECTION, date));
  if (!snap.exists()) return null;
  const { ticketIds } = snap.data() as DailyChallenge;
  const tickets = await getDocs(query(collection(db, TICKETS_COLLECTION), where(documentId(), "in", ticketIds)));
  const byId = new Map(tickets.docs.map((d) => [d.id, d.data() as QuizQuestion]));
  const questions = ticketIds.map((id) => byId.get(id)).filter((q): q is QuizQuestion => !!q);
  if (questions.length !== DAILY_QUESTION_COUNT) return null;
  return { date, ticketIds, questions };
};

// Cache first so an offline player still gets today's set once it was prefetched.
export const loadDailySet = async (date: string): Promise<DailySet | null> => {
  const cached = await readCached(date);
  if (cached) return cached;
  try {
    const set = await fetchSet(date);
    if (set) await AsyncStorage.setItem(DAILY_SET_KEY(date), JSON.stringify(set));
    return set;
  } catch (error) {
    logger.warn("loadDailySet failed", error);
    return null;
  }
};

export const prefetchTomorrow = (today: string) => loadDailySet(addDaysToDate(today, 1));

export const pruneOldDailySets = async (today: string): Promise<void> => {
  const keys = await AsyncStorage.getAllKeys();
  const keep = new Set([DAILY_SET_KEY(today), DAILY_SET_KEY(addDaysToDate(today, 1))]);
  const stale = keys.filter((k) => k.startsWith(`${DAILY_STORAGE_PREFIX}set:`) && !keep.has(k));
  if (stale.length) await AsyncStorage.multiRemove(stale);
};
```

> Check `src/helpers/logger.ts` exposes `warn`; if it only has `error`/`log`, use that name instead.

- [ ] **Step 4:** Run — PASS.
- [ ] **Step 5:** Stage, diff, wait. Message: `feat(daily): load today's set cache-first, prefetch tomorrow`.

---

### Task 9: Local attempt record and streak

**Files:** Create `src/services/local-daily-progress.ts`; Test `src/services/__tests__/local-daily-progress.test.ts`

- [ ] **Step 1: Failing test**

```ts
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyStatus } from "@/src/types";
import { finishDaily, readRecord, readStreak, saveAnswer, startDaily } from "@/src/services/local-daily-progress";

beforeEach(() => AsyncStorage.clear());

it("records answers and time, then finishes once", async () => {
  await startDaily("2026-11-18");
  await saveAnswer("2026-11-18", { ticketId: "a", isCorrect: true }, 4_000);
  await saveAnswer("2026-11-18", { ticketId: "b", isCorrect: false }, 9_000);
  const done = await finishDaily("2026-11-18", 9_000);
  expect(done.status).toBe(DailyStatus.DONE);
  expect(done.answers).toHaveLength(2);
  expect(done.elapsedMs).toBe(9_000);
  expect((await readStreak()).current).toBe(1);
  await finishDaily("2026-11-18", 9_000);
  expect((await readStreak()).current).toBe(1);
});

it("startDaily never resets an attempt already begun", async () => {
  await startDaily("2026-11-18");
  await saveAnswer("2026-11-18", { ticketId: "a", isCorrect: true }, 3_000);
  await startDaily("2026-11-18");
  expect((await readRecord("2026-11-18"))?.answers).toHaveLength(1);
});
```

- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3: Implement**

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";

import { DAILY_RECORD_KEY, DAILY_STREAK_KEY } from "@/src/constants";
import { nextStreak } from "@/src/helpers/dailyStreak";
import { DailyStatus, type DailyAnswer, type DailyRecord, type DailyStreak } from "@/src/types";

const EMPTY_STREAK: DailyStreak = { current: 0, longest: 0, lastDate: null };

const write = (record: DailyRecord) =>
  AsyncStorage.setItem(DAILY_RECORD_KEY(record.date), JSON.stringify(record));

export const readRecord = async (date: string): Promise<DailyRecord | null> => {
  const raw = await AsyncStorage.getItem(DAILY_RECORD_KEY(date));
  return raw ? (JSON.parse(raw) as DailyRecord) : null;
};

export const readStreak = async (): Promise<DailyStreak> => {
  const raw = await AsyncStorage.getItem(DAILY_STREAK_KEY);
  return raw ? (JSON.parse(raw) as DailyStreak) : EMPTY_STREAK;
};

// Starting counts as the day's one attempt; a second call resumes it.
export const startDaily = async (date: string): Promise<DailyRecord> => {
  const existing = await readRecord(date);
  if (existing) return existing;
  const record: DailyRecord = { date, status: DailyStatus.IN_PROGRESS, answers: [], elapsedMs: 0, synced: false };
  await write(record);
  return record;
};

export const saveAnswer = async (date: string, answer: DailyAnswer, elapsedMs: number): Promise<DailyRecord> => {
  const record = (await readRecord(date)) ?? (await startDaily(date));
  const next = { ...record, answers: [...record.answers, answer], elapsedMs };
  await write(next);
  return next;
};

export const finishDaily = async (date: string, elapsedMs: number): Promise<DailyRecord> => {
  const record = (await readRecord(date)) ?? (await startDaily(date));
  if (record.status === DailyStatus.DONE) return record;
  const done = { ...record, status: DailyStatus.DONE, elapsedMs };
  await write(done);
  await AsyncStorage.setItem(DAILY_STREAK_KEY, JSON.stringify(nextStreak(await readStreak(), date)));
  return done;
};

export const markSynced = async (date: string): Promise<void> => {
  const record = await readRecord(date);
  if (record) await write({ ...record, synced: true });
};

export const correctCount = (record: DailyRecord) => record.answers.filter((a) => a.isCorrect).length;
```

- [ ] **Step 4:** Run — PASS.
- [ ] **Step 5:** Stage, diff, wait. Message: `feat(daily): local attempt record is the source of truth on the device`.

---

### Task 10: Mirror the result to Firestore

**Files:** Create `src/services/firestore-daily.ts`; Modify `src/types/leaderboard.ts` (`UserDoc` gains optional daily fields)

- [ ] **Step 1:** Extend `UserDoc`:

```ts
  dailyDate?: string;
  dailyCorrect?: number;
  dailyTimeMs?: number;
  currentStreak?: number;
  longestStreak?: number;
```

- [ ] **Step 2: Implement**

```ts
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { db } from "@/firebase";
import { DAILY_MAX_TIME_MS, DAILY_MIN_TIME_MS } from "@/src/constants";
import { logger } from "@/src/helpers/logger";
import { correctCount, markSynced, readRecord, readStreak } from "@/src/services/local-daily-progress";
import { DailyStatus } from "@/src/types";

const clampTime = (ms: number) => Math.min(DAILY_MAX_TIME_MS, Math.max(DAILY_MIN_TIME_MS, Math.round(ms)));

// Only updates an existing user doc: the auth flow creates it, and a create here would fail the rules.
export const syncDailyResult = async (uid: string, date: string): Promise<boolean> => {
  const record = await readRecord(date);
  if (!record || record.status !== DailyStatus.DONE || record.synced) return false;
  const ref = doc(db, "users", uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const streak = await readStreak();
    await updateDoc(ref, {
      dailyDate: date,
      dailyCorrect: correctCount(record),
      dailyTimeMs: clampTime(record.elapsedMs),
      currentStreak: streak.current,
      longestStreak: streak.longest,
      updatedAt: serverTimestamp(),
    });
    await markSynced(date);
    return true;
  } catch (error) {
    logger.warn("syncDailyResult failed; will retry on next open", error);
    return false;
  }
};
```

- [ ] **Step 3:** `npx tsc --noEmit` — clean.
- [ ] **Step 4:** Stage, diff, wait. Message: `feat(daily): mirror the finished daily to the user doc for the Today board`.

> If the cloud streak can be ahead of the local one (reinstall + sign-in), the rules' `currentStreak <= prev + 1` still holds because the write only ever sends the local value; a lower value is allowed.

---

### Task 11: 20:00 reminder

**Files:** Create `src/helpers/dailyReminder.ts`; Test `src/__tests__/dailyReminder.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { nextReminderAt } from "@/src/helpers/dailyReminder";

// Device clock in the tests runs in UTC; times below are device-local.
describe("nextReminderAt", () => {
  it("today at 20:00 when not played and before 20:00", () => {
    expect(nextReminderAt(new Date(2026, 10, 18, 9, 0), false)).toEqual(new Date(2026, 10, 18, 20, 0));
  });
  it("tomorrow at 20:00 once played", () => {
    expect(nextReminderAt(new Date(2026, 10, 18, 9, 0), true)).toEqual(new Date(2026, 10, 19, 20, 0));
  });
  it("tomorrow at 20:00 when it is already past 20:00", () => {
    expect(nextReminderAt(new Date(2026, 10, 18, 21, 0), false)).toEqual(new Date(2026, 10, 19, 20, 0));
  });
});
```

- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3: Implement**

```ts
import * as Notifications from "expo-notifications";

import { DAILY_REMINDER_HOUR, DAILY_REMINDER_ID } from "@/src/constants";

export const nextReminderAt = (now: Date, playedToday: boolean): Date => {
  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), DAILY_REMINDER_HOUR, 0);
  if (playedToday || now >= at) at.setDate(at.getDate() + 1);
  return at;
};

type Texts = { title: string; body: string };

// One pending reminder at a time, under a fixed id, so rescheduling never stacks.
export const scheduleDailyReminder = async (enabled: boolean, playedToday: boolean, texts: Texts) => {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => undefined);
  if (!enabled) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: { title: texts.title, body: texts.body, data: { target: "daily" } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nextReminderAt(new Date(), playedToday) },
  });
};
```

- [ ] **Step 4:** Run — PASS. Add `export * from "./dailyReminder";` to `src/helpers/index.ts`.
- [ ] **Step 5:** Stage, diff, wait. Message: `feat(daily): 20:00 local reminder only on days not yet played`.

---

### Task 12: Share text

**Files:** Create `src/helpers/dailyShare.ts`; Test `src/__tests__/dailyShare.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { buildDailyShare } from "@/src/helpers/dailyShare";

it("fills the template and never leaks questions or answers", () => {
  const text = buildDailyShare("{date}: {n}/10 · {time} {marks} · {streak} {link}", {
    date: "2026-11-18",
    answers: [true, false, true],
    elapsedMs: 108_000,
    streak: 13,
    link: "https://example/app",
  });
  expect(text).toBe("18.11: 2/10 · 1:48 ✅❌✅ · 13 https://example/app");
});
```

- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3: Implement**

```ts
import { formatClock } from "./stopwatch";

type ShareInput = { date: string; answers: boolean[]; elapsedMs: number; streak: number; link: string };

export const buildDailyShare = (template: string, input: ShareInput): string => {
  const [, month, day] = input.date.split("-");
  return template
    .replace("{date}", `${day}.${month}`)
    .replace("{n}", String(input.answers.filter(Boolean).length))
    .replace("{time}", formatClock(input.elapsedMs))
    .replace("{marks}", input.answers.map((ok) => (ok ? "✅" : "❌")).join(""))
    .replace("{streak}", String(input.streak))
    .replace("{link}", input.link);
};
```

Add to the helpers barrel.

- [ ] **Step 4:** Run — PASS.
- [ ] **Step 5:** Stage, diff, wait. Message: `feat(daily): share text with score, time and marks only`.

---

### Task 13: Swords progress component

**Files:** Create `src/components/daily-progress/BrokenSword.tsx`, `DailyProgress.tsx`, `styles.ts`; Modify `src/components/index.ts`

- [ ] **Step 1: BrokenSword** — the MDI `sword` glyph points from top-left (tip) to bottom-right (hilt). Rotating its box 45° makes the blade vertical; two `overflow: hidden` halves then split it, and the tip half is nudged and tilted.

```tsx
// src/components/daily-progress/BrokenSword.tsx
import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useStyles } from "@/src/hooks";
import { getBrokenSwordStyles } from "./styles";

type BrokenSwordProps = { size: number; color: string };

const BrokenSword: React.FC<BrokenSwordProps> = ({ size, color }) => {
  const styles = useStyles(getBrokenSwordStyles, { size });
  return (
    <View style={styles.box} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.upright}>
        <View style={styles.tipHalf}>
          <MaterialCommunityIcons name="sword" size={size} color={color} style={styles.glyphRotated} />
        </View>
        <View style={styles.hiltHalf}>
          <MaterialCommunityIcons name="sword" size={size} color={color} style={styles.glyphRotatedShifted} />
        </View>
      </View>
    </View>
  );
};

export default React.memo(BrokenSword);
```

- [ ] **Step 2: DailyProgress**

```tsx
// src/components/daily-progress/DailyProgress.tsx
import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";
import BrokenSword from "./BrokenSword";
import { getStyles } from "./styles";

export enum SwordState { WHOLE = "whole", BROKEN = "broken", CURRENT = "current", UPCOMING = "upcoming" }

type DailyProgressProps = { states: SwordState[]; size: number; columns?: number };

const DailyProgress: React.FC<DailyProgressProps> = ({ states, size, columns }) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles, { size, columns });
  const t = useTranslation();
  const correct = states.filter((s) => s === SwordState.WHOLE).length;
  const label = t.daily_progress_a11y.replace("{correct}", String(correct)).replace("{total}", String(states.length));
  const colorFor: Record<SwordState, string> = {
    [SwordState.WHOLE]: colors.bronzeDark,
    [SwordState.BROKEN]: colors.uiMuted,
    [SwordState.CURRENT]: colors.bronze,
    [SwordState.UPCOMING]: colors.disabledBorder,
  };
  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel={label}>
      {states.map((state, index) => (
        <View key={index} style={styles.cell}>
          {state === SwordState.BROKEN
            ? <BrokenSword size={size} color={colorFor[state]} />
            : <MaterialCommunityIcons name="sword" size={size} color={colorFor[state]} />}
        </View>
      ))}
    </View>
  );
};

export default React.memo(DailyProgress);
```

> The `.map` child is a list render, not a JSX prop, so it follows the house rules; if lint flags the ternary, lift it into a `renderSword(state)` function above `return`.

- [ ] **Step 3: styles.ts**

```ts
import { StyleSheet } from "react-native";
import type { AppTheme } from "@/src/theme";

export const getStyles = (theme: AppTheme, props: { size: number; columns?: number }) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      columnGap: theme.spacing.x2,
      rowGap: theme.spacing.x1,
      maxWidth: props.columns ? props.columns * (props.size + theme.spacing.x2) : undefined,
    },
    cell: { width: props.size, height: props.size, alignItems: "center", justifyContent: "center" },
  });

const BREAK_AT = 0.46; // fraction of the upright blade kept on the tip side
const TIP_TILT = "-18deg";

export const getBrokenSwordStyles = (_theme: AppTheme, props: { size: number }) =>
  StyleSheet.create({
    box: { width: props.size, height: props.size },
    upright: { width: props.size, height: props.size, transform: [{ rotate: "-45deg" }] },
    tipHalf: {
      position: "absolute", top: 0, left: 0, width: props.size, height: props.size * BREAK_AT,
      overflow: "hidden",
      transform: [{ translateX: -props.size * 0.08 }, { translateY: -props.size * 0.04 }, { rotate: TIP_TILT }],
    },
    hiltHalf: {
      position: "absolute", top: props.size * (BREAK_AT + 0.04), left: 0, width: props.size,
      height: props.size * (1 - BREAK_AT - 0.04), overflow: "hidden",
    },
    glyphRotated: { transform: [{ rotate: "45deg" }] },
    glyphRotatedShifted: { marginTop: -props.size * (BREAK_AT + 0.04), transform: [{ rotate: "45deg" }] },
  });
```

- [ ] **Step 4:** Export both from `src/components/index.ts`: `export { default as DailyProgress, SwordState } from "./daily-progress/DailyProgress";`.
- [ ] **Step 5:** `npx tsc --noEmit && npm run lint` — clean. Visual check happens in Task 18.
- [ ] **Step 6:** Stage, diff, wait. Message: `feat(daily): whole and broken swords for daily progress`.

---

### Task 14: Daily game screen

**Files:** Create `src/hooks/useDailyGame.ts`, `src/screens/main-screens/daily-game-screen/DailyGameScreen.tsx`, `styles.ts`; Modify `src/components/game-screen-components/GameFooter.tsx` (optional `showHint`), `src/types/screenNames.ts`, `src/types/screens.ts`, `src/screens/main-screens/index.ts`, `src/navigation/AppNavigation.tsx`, hooks barrel

- [ ] **Step 1: Navigation.** `ScreenName` gains `DAILY_GAME_SCREEN = "daily-game-screen"` and `DAILY_RESULT_SCREEN = "daily-result-screen"`. `RootStackParamList` gains `"daily-game-screen": { date: string }; "daily-result-screen": { date: string };`. Register both in `AppNavigation` with `options={{ headerShown: false }}` after the game screen (result screen registered in Task 15).

- [ ] **Step 2: `GameFooter`** — add `showHint?: boolean` (default `true`) and wrap the hint button in `{showHint ? (...) : <View style={styles.hintPlaceholder} />}` where `hintPlaceholder` has the hint button's width so the back/settings buttons keep their places. Normal game behaviour is unchanged.

- [ ] **Step 3: `useDailyGame`**

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavigationProp, useNavigation } from "@react-navigation/native";

import { CorrectSound, IncorrectSound } from "@/src/assets";
import { CORRECT_ANSWER_DELAY_MS, INCORRECT_ANSWER_DELAY_MS } from "@/src/constants/timing";
import { vibrateImpact } from "@/src/helpers";
import { usePlaySound, useSettings, useStopwatch } from "@/src/hooks";
import { loadDailySet } from "@/src/services/daily-challenge";
import { finishDaily, readRecord, saveAnswer, startDaily } from "@/src/services/local-daily-progress";
import { DailyStatus, RootStackParamList, ScreenName, type DailyAnswer, type DailySet } from "@/src/types";
import { SwordState } from "@/src/components";

export const useDailyGame = (date: string) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { isMuted, isVibrationOff } = useSettings();
  const { playSound } = usePlaySound();
  const [set, setSet] = useState<DailySet | null>(null);
  const [answers, setAnswers] = useState<DailyAnswer[]>([]);
  const [locked, setLocked] = useState(false);
  const [initialMs, setInitialMs] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    (async () => {
      const [loaded, record] = await Promise.all([loadDailySet(date), startDaily(date).then(() => readRecord(date))]);
      if (record?.status === DailyStatus.DONE) {
        navigation.reset({ index: 0, routes: [{ name: ScreenName.DAILY_RESULT_SCREEN, params: { date } }] });
        return;
      }
      setSet(loaded);
      setAnswers(record?.answers ?? []);
      setInitialMs(record?.elapsedMs ?? 0);
    })();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [date, navigation]);

  return { set, answers, locked, initialMs, setAnswers, setLocked, timer, navigation, isMuted, isVibrationOff, playSound };
};
```

Then a second hook in the same file that needs `initialMs` to exist before the stopwatch starts:

```ts
export const useDailyRun = (date: string) => {
  const base = useDailyGame(date);
  const { displayMs, pauseClock, resumeClock, readMs } = useStopwatch(base.initialMs ?? 0);
  const index = base.answers.length;
  const question = base.set?.questions[index];

  const handleOptionPress = useCallback(async (option: string) => {
    if (!question || base.locked || !base.set) return;
    pauseClock();
    base.setLocked(true);
    const isCorrect = option === question.correctAnswer;
    if (!base.isVibrationOff) vibrateImpact();
    base.playSound(isCorrect ? CorrectSound : IncorrectSound, base.isMuted);
    const answer = { ticketId: base.set.ticketIds[index], isCorrect };
    const ms = readMs();
    await saveAnswer(date, answer, ms);
    const isLast = index + 1 === base.set.questions.length;
    base.timer.current = setTimeout(async () => {
      if (isLast) {
        await finishDaily(date, ms);
        base.navigation.reset({ index: 0, routes: [{ name: ScreenName.DAILY_RESULT_SCREEN, params: { date } }] });
        return;
      }
      base.setAnswers((prev) => [...prev, answer]);
      base.setLocked(false);
      resumeClock();
    }, isCorrect ? CORRECT_ANSWER_DELAY_MS : INCORRECT_ANSWER_DELAY_MS);
  }, [question, base, index, date, pauseClock, resumeClock, readMs]);

  const swordStates = useMemo(() => {
    const total = base.set?.questions.length ?? 10;
    return Array.from({ length: total }, (_, i) => {
      if (i < base.answers.length) return base.answers[i].isCorrect ? SwordState.WHOLE : SwordState.BROKEN;
      return i === base.answers.length ? SwordState.CURRENT : SwordState.UPCOMING;
    });
  }, [base.set, base.answers]);

  return { question, index, total: base.set?.questions.length ?? 10, displayMs, swordStates,
           isLoading: !base.set || base.initialMs === null, locked: base.locked, handleOptionPress };
};
```

> `useStopwatch` captures `initialMs` once; render `DailyGameScreen`'s body only after `initialMs !== null` (screen shows the loader until then) by keying the inner component on `initialMs`, so a resumed attempt starts the clock at the saved total.

- [ ] **Step 4: Screen** — `DailyGameScreen` mirrors `GameScreen`'s layout: a header row with `t.daily_question_progress` (`"{n}/10"`) in `fontFamily="script"` and the stopwatch chip (`MaterialCommunityIcons name="timer-outline"` + `formatClock(displayMs)`, `bronze` 2px border, `surface` fill, tabular digits), then `<DailyProgress states={swordStates} size={getAdjustedWidth(26)} />`, then the existing `QuestionDisplay` and `OptionsDisplay`, then `<GameFooter showHint={false} … />`. Exit asks for confirmation with the existing exit modal; leaving keeps the attempt (it resumes later) — the copy says so (`daily_exit_body`). Styles in `styles.ts` with theme tokens only.

- [ ] **Step 5:** `npx tsc --noEmit && npm run lint && npx jest` — all clean.
- [ ] **Step 6:** Stage, diff, wait. Message: `feat(daily): ten-question run with visible stopwatch and resume`.

---

### Task 15: Result screen

**Files:** Create `src/screens/main-screens/daily-result-screen/DailyResultScreen.tsx`, `styles.ts`; Modify `src/screens/main-screens/index.ts`, `AppNavigation.tsx`

- [ ] **Step 1: Behaviour** — on mount: read the record and streak; call `syncDailyResult(uid, date)` when signed in; then `scheduleDailyReminder(isPushEnabled, true, {title: t.daily_reminder_title, body: t.daily_reminder_body})`; then `invalidateLeaderboardCache()`; fetch the player's rank from `getLeaderboard(LeaderboardTab.TODAY)` (Task 16) when they have a nickname.
- [ ] **Step 2: Layout** (matches mockup screen 4): date line in script → `QuestionBackground` scroll with `N/10` (`display` type, `primary`) and the time (`timer-outline` + `formatClock`) → `<DailyProgress states={…} size={getAdjustedWidth(30)} columns={5} />` → ornament divider (two `bronzeMid` hairlines around `❖` in `bronzeMid`) → two script lines `t.daily_streak_line` ("In a row: {n} days") and `t.daily_place_line` ("Today's place: {n}"), numbers in `correctBorder` → Share button (parchment `bronzeLight` fill, 3px `bronzeDark` border, script) → Today's leaderboard button (surface fill, 3px `bronze` border) navigating with `navigation.reset` to `tabs` → `LEADERBOARD_SCREEN` and `initialTab: TODAY` (add `{ initialTab?: LeaderboardTab }` to the leaderboard route params).
- [ ] **Step 3: Share** — `Share.share({ message: buildDailyShare(t.daily_share_message, {...}) })` with the store link chosen exactly as `GameSummary.handleVisitStore` does (move that link choice into a tiny `storeLink()` helper in `src/helpers/storeLink.ts` and use it in both places).
- [ ] **Step 4:** `npx tsc --noEmit && npm run lint` — clean.
- [ ] **Step 5:** Stage, diff, wait. Message: `feat(daily): result screen with swords, time, streak, place and share`.

---

### Task 16: Today leaderboard tab

**Files:** Modify `src/types/leaderboard.ts`, `src/services/firestore-leaderboard.ts`, `src/hooks/useLeaderboard.ts`, `LeaderboardTabs.tsx`, `LeaderboardRow.tsx`, `LeaderboardPodium.tsx`, `LeaderboardScreen.tsx`, `styles.ts`

- [ ] **Step 1: Types** — `LeaderboardTab.TODAY = "today"` (first in the enum); `LeaderboardEntry` gains `timeMs?: number`.
- [ ] **Step 2: Query** — in `getLeaderboard`, a `TODAY` branch:

```ts
query(
  usersRef,
  where("displayName", "!=", null),
  where("dailyDate", "==", todayTbilisi()),
  orderBy("dailyCorrect", "desc"),
  orderBy("dailyTimeMs", "asc"),
  limit(LEADERBOARD_LIMIT),
)
```

`buildEntry` for `TODAY`: `points: data.dailyCorrect ?? 0`, `timeMs: data.dailyTimeMs`. The zero-points filter must **not** drop `TODAY` entries (0/10 is a real result): apply it only to `WEEKLY`/`ALLTIME`.
- [ ] **Step 3: Cache** — `invalidateLeaderboardCache` also removes the `TODAY` key; the `TODAY` cache TTL is 2 minutes (a constant `TODAY_CACHE_TTL_MS`), since it changes all day.
- [ ] **Step 4: Tabs** — prepend `{ key: LeaderboardTab.TODAY, label: t.leaderboard_tab_today }`; the screen's initial tab is `route.params?.initialTab ?? LeaderboardTab.WEEKLY`; empty-state copy for `TODAY` uses `leaderboard_empty_today_title/desc`.
- [ ] **Step 5: Row + podium** — when `entry.timeMs !== undefined`, render `"{points}/10"` and, beside it, a `timer-outline` icon + `formatClock(entry.timeMs)` in `serif`, `colors.text`. Precompute `scoreLabel` and `timeLabel` above `return`. Under the list for `TODAY`, one centred caption `t.leaderboard_today_tiebreak`.
- [ ] **Step 6:** `npx tsc --noEmit && npm run lint && npx jest` — clean.
- [ ] **Step 7:** Stage, diff, wait. Message: `feat(daily): Today tab ranked by score then time, with times shown`.

---

### Task 17: Home card, scroll, reminder wiring, locales

**Files:** Create `src/hooks/useDailyChallenge.ts`, `src/components/daily-card/DailyCard.tsx`, `styles.ts`; Modify `StartGameScreen.tsx` + `styles.ts`, `src/locales/en.json`, `src/locales/ka.json`, component/hook barrels, the notification-response handler in `useNotifications.tsx`

- [ ] **Step 1: `useDailyChallenge`** — on focus (`useFocusEffect`): `today = todayTbilisi()`; `loadDailySet(today)`; `prefetchTomorrow(today)`; `pruneOldDailySets(today)`; `readRecord(today)`; `readStreak()`; retry `syncDailyResult(uid, today)` if a done record is unsynced; `scheduleDailyReminder(isPushEnabled, record?.status === DONE, texts)`. Returns `{ kind: DailyCardKind, streak: visibleStreak(...), correct, elapsedMs, rank?: number, msToNext }` and refreshes `msToNext` every second only while `kind === DONE`.
- [ ] **Step 2: `DailyCard`** — two looks, both built from `OtherAppsCarousel`'s styles (same `GradientWrapper` gradient, 1px `bronzeMid`, `borderRadius.lg`, 56px bordered icon box, serif title, muted body, 40px `chromeBg` round action):
  - `NOT_PLAYED` / `IN_PROGRESS`: icon box shows the streak number + `t.daily_days` caption; title `t.daily_card_title` (IN_PROGRESS: `t.daily_card_resume`); body `t.daily_card_description`; arrow → `DAILY_GAME_SCREEN`.
  - `DONE`: no gradient (`chromeBg` at 78% opacity), `parchmentDivider`-dim border, icon box in `correctBg`/`correctBorder` with a `check` icon; title `"{n}/10 · m:ss · {place}"`; body `t.daily_next_in` with the countdown; round action shows `podium` → leaderboard with `initialTab: TODAY`.
  - Above the card, a title pill identical to the carousel's (`chromeBg`, serif bold, `bronzeLight`) with `t.daily_section_title`.
  - `UNAVAILABLE`: render nothing.
- [ ] **Step 3: StartGameScreen** — wrap `homeContent` in a `ScrollView` with `bounces={false}`, `overScrollMode="never"`, `showsVerticalScrollIndicator={false}`, `contentContainerStyle={styles.scrollContent}` (`flexGrow: 1`), so tall phones look unchanged and short phones scroll. Order inside: `gameControl` (ring + shield) → `<DailyCard … />` → `<OtherAppsCarousel />`.
- [ ] **Step 4: Notification tap** — in the existing response listener, when `response.notification.request.content.data?.target === "daily"`, navigate via the existing navigation ref to `DAILY_GAME_SCREEN` with `{ date: todayTbilisi() }`.
- [ ] **Step 5: Locales** — add to **both** `en.json` and `ka.json` (KA = English draft until the owner supplies Georgian):

| Key | English draft |
|---|---|
| `daily_section_title` | Today's challenge |
| `daily_card_title` | 10 questions |
| `daily_card_resume` | Continue today's challenge |
| `daily_card_description` | the same for everyone today |
| `daily_days` | days |
| `daily_next_in` | Next challenge in {time} |
| `daily_question_progress` | Daily challenge · {n}/10 |
| `daily_progress_a11y` | {correct} of {total} correct |
| `daily_exit_body` | Your answers so far are saved. You can finish later today. |
| `daily_result_title` | Today's challenge · {date} |
| `daily_streak_line` | In a row: {n} days |
| `daily_place_line` | Today's place: {n} |
| `daily_share` | Share |
| `daily_open_leaderboard` | Today's leaderboard |
| `daily_share_message` | History of Georgia · {date}: {n}/10 · {time} {marks} · {streak}-day streak {link} |
| `daily_reminder_title` | Today's challenge is waiting |
| `daily_reminder_body` | 10 questions, about 2 minutes. Keep your streak going! |
| `leaderboard_tab_today` | Today |
| `leaderboard_empty_today_title` | Nobody has played yet today |
| `leaderboard_empty_today_desc` | Play the daily challenge and be first |
| `leaderboard_today_tiebreak` | Same score — the faster time ranks higher |

**Release gate:** every key above must have owner-supplied Georgian in `ka.json` before the EAS update is published.
- [ ] **Step 6:** `npx tsc --noEmit && npm run lint && npx jest` — clean.
- [ ] **Step 7:** Stage, diff, wait. Message: `feat(daily): home card above the other-apps carousel; scrollable home; reminder tap opens the daily`.

---

### Task 18: Docs and device verification

**Files:** Modify `INFRASTRUCTURE.md` (§5 components, §6 hooks, §7 helpers, §8 services, §10 constants, §14 collection + rules + index + function), `README.md` (deploy order + Force-run step)

- [ ] **Step 1: README deploy section**, in this order (all owner-run):
  1. `cd functions && npm run build && cd .. && npx firebase-tools deploy --only functions:ensureDailyChallenges,firestore:rules,firestore:indexes`
  2. Cloud Console → Cloud Scheduler → force-run the daily job; confirm three `daily_challenges` docs exist.
  3. Wait for the index to finish building (Firebase Console → Indexes).
  4. `eas update --branch production --message "daily challenge"` — only after Georgian copy is in.
- [ ] **Step 2: Device run (iOS simulator + Android emulator, dev client against the real project only for reads; use a test account):**
  1. Home on iPhone SE size: ring + card + carousel scroll, no bounce; on iPhone 17 Pro nothing scrolls.
  2. Card not played → full daily → stopwatch visibly pauses during green/red feedback → result shows swords, time, streak 1, place.
  3. Kill the app at question 5 → reopen → card says Continue → resumes at 5 with the saved time.
  4. Card after done shows the quiet state + countdown; podium button opens Today tab with the time column.
  5. Two accounts with equal scores → faster one ranks higher.
  6. Airplane mode after a prefetch → tomorrow's set plays offline (change the simulator date to test).
  7. Set the reminder hour temporarily via a dev-only override to now+1 min → notification arrives → tap opens the daily; after finishing, no reminder that evening.
  8. Share sheet text contains no question or answer.
- [ ] **Step 3:** Stage docs; diff; wait. Message: `docs(daily): atlas and deploy steps for the daily challenge`.
- [ ] **Step 4:** Open the PR from `feat/daily-challenge` only when the owner asks.

---

## Self-review notes

- Spec coverage: card + states (T17), ScrollView bounce off (T17), 10 shared questions + mix (T5/T6/T8), no crowns/hints (T14), stopwatch paused during feedback (T4/T14), resume (T9/T14), result with swords/time/streak/place/share (T12/T13/T15), Today tab score-then-time with times shown (T16), reminder 20:00 only when unplayed (T11/T17), rules + index (T7), offline cache (T8), docs + release order (T18).
- Found while reading, **not changed by this plan:** `src/utils/weekStart.ts` adds the device's timezone offset before adding +4 h, so on a phone in Tbilisi the weekly board flips at 04:00 Monday instead of 00:00. Raise with the owner separately; `tbilisiDate.ts` does not reuse it.

## Execution notes (2026-11-18, built overnight)

A Codex review of this plan found eight defects; the build fixes all of them, so the code differs
from the snippets above in these places:

1. Today query: no `displayName != null` inequality (it would order by name first); index is
   `dailyDate, dailyCorrect DESC, dailyTimeMs ASC`; nameless players filtered client-side.
2. Sync: `syncDailyResults(uid)` uploads the newest unsynced finished daily, marks older ones synced,
   never overwrites a newer cloud date, and sends `currentStreak = min(local, cloud + 1)` /
   `longestStreak = max(local, cloud)` so the rules never reject it forever.
3. Stopwatch on resume: `useDailyLoad` loads the attempt first; `DailyRun` mounts afterwards, so
   `useStopwatch` starts from the saved time.
4. Killing the app mid-question: `DailyRecord.questionShownAt` is saved when a question appears;
   `resumeElapsed` adds the open time on resume (verified on the simulator: 1:10 → 1:3x).
5. Reminder tap: `useDailyReminderTap` (`useLastNotificationResponse`, cold start included) on the
   home screen instead of a navigation ref.
6. Selection fallback de-duplicates by latest use (test added).
7. Place: shown only when the player is in the Today list; otherwise the line is omitted.
8. Set cache: network first, cache offline; a started attempt keeps its cached set (`preferCache`).

Also: `SwordState` lives in `src/types/daily.ts` (avoids a hooks ↔ components import cycle);
`firebase.ts` gained a dev-only emulator switch used for the simulator run.
