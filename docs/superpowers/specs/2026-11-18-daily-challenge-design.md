# Daily challenge, streak, reminder and Today leaderboard — design

**Date:** 2026-11-18
**Status:** owner-approved design; Georgian copy pending; implementation not started
**Mockups:** https://claude.ai/artifact/K2MAV87E1kX9N1WXYVkHKL (home = option B; screens 3–6)
**Project:** 1 of 3 in the 2026-11 History of Georgia plan (1 daily habit → 2 new players → 3 deeper content)

## Goal

Turn History of Georgia's existing players (~1,160 monthly active on Android, 10K+ downloads) into
daily players. Success is measured by how many players complete the daily on a given day and how many
hold a streak of 3+ and 7+ days, read from the `users` documents (the app has no analytics SDK).

## What the player gets

1. **Daily card** on `StartGameScreen`, **between the difficulty ring and the "other apps"
   carousel** (owner-chosen 2026-11-18, design canvas option B). It reuses the carousel's look: a
   title pill like `other_apps_title`, then one full-width card with the carousel card's gradient,
   1px `bronzeMid` border, `borderRadius.lg`, 56px bordered icon box (holds the streak number),
   serif title, muted description and the round `chromeBg` arrow. States:
   - not played today: streak in the icon box, "10 questions · the same for everyone today";
   - played today (a visibly different, quieter card): no gradient (`chromeBg` at ~78%), dim
     border, the icon box turns to the game's correct-answer colours (`correctBg` /
     `correctBorder`) with a tick, title "N/10 · m:ss · Nth place", description "Next challenge in
     hh:mm:ss", and the round button becomes a leaderboard icon that opens the Today tab;
   - today's set unavailable (offline with nothing cached, or server failure): the section is hidden.
   **Layout:** the home content becomes a vertical `ScrollView` with bounce off (`bounces={false}`,
   `overScrollMode="never"`), so short phones scroll the card and carousel up instead of squeezing
   the shield; on tall phones nothing scrolls.
2. **Daily game:** 10 questions, identical for every player that day, ordered 3 easy → 4 medium →
   3 hard. All 10 are played (no crowns), no hints, one attempt per day. Answer feedback, sounds and
   vibration behave as in the normal game. A **visible stopwatch** (`m:ss`, bronze-bordered, top
   right beside "N/10") counts only while a question is waiting for an answer; it pauses during the
   correct/incorrect feedback delays so those fixed animations never cost a player time. This
   running total is the `dailyTimeMs` the leaderboard ranks by.
3. **Daily result screen:** `N/10`, the total time, the streak and today's place as plain script
   lines in the game header's "label: value" style (no medallions), two rows of five swords in question
   order: a whole bronze sword (the MaterialCommunityIcons `sword` glyph, same family as the tab
   bar's `sword-cross`) = correct, a grey **broken sword** (the same glyph split across the blade,
   tip knocked aside; a small `react-native-svg` component) = wrong. The question screen uses the
   same swords as its 10-step progress: answered ones whole or broken, the current one light bronze,
   upcoming ones faint. Crowns are not used here — in the app they mean lives,
   today's place when the player has a nickname, and **Share**. The share text carries the result,
   the time, the ✅/❌ row, the streak and the store link; it never contains questions or answers.
4. **Streak:** consecutive days with a completed daily. A missed day resets it to 0 on the next
   completion (it becomes 1). No streak freeze.
5. **Reminder:** a local notification at 20:00 device time, only on a day the daily is not yet done,
   only when the app's notification setting (`isPushEnabled`) is on and OS permission is granted.
6. **Today leaderboard:** a third tab beside Weekly and All-time. Ranked by correct answers (desc),
   then total time (asc): with the same score, the faster player ranks higher. **Every row and the
   podium show the time** with a stopwatch icon next to the score, and a line under the list says
   so. Like the weekly board, only players with a `displayName` appear.

Daily points do **not** feed the weekly or all-time leaderboards in this version.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Day boundary | Tbilisi date (UTC+4, no DST), `YYYY-MM-DD` | One shared "today" for the same set and the Today board; matches `mondayTbilisi()` |
| Who picks the set | Scheduled Cloud Function | Same set for everyone, no-repeat window, owner can override a day by hand |
| Mix | 3 easy, 4 medium, 3 hard | Gentle start, real finish; bank has 397 / 742 / 425 |
| Repeat window | no question reused within 150 days | 1,564 questions ÷ 10 a day ≈ 156 days overall; easy (397 ÷ 3 ≈ 132 days) and hard (425 ÷ 3 ≈ 141 days) run out first, after which the fallback reuses the least recently used of that difficulty |
| Hints / crowns | none / none | ~2-minute session; results comparable |
| Reminder | local, 20:00 device time | No backend, works offline; Krossi uses the same hour |
| Leaderboard source | fields on `users/{uid}` | Same pattern as `weekStart`/`weekPoints`; one indexed query |

## Architecture

### Server

**`daily_challenges/{YYYY-MM-DD}`** (new collection):

```ts
type DailyChallenge = {
  date: string;              // same as the doc id
  ticketIds: string[];       // 10 `tickets` document ids, in play order (easy → hard)
  createdAt: Timestamp;
  source: "scheduler" | "manual";
};
```

**`ensureDailyChallenges`** (new, `functions/src/daily.ts`, exported from `index.ts`):
`onSchedule({ schedule: "5 0 * * *", timeZone: "Asia/Tbilisi" })`. It makes sure the docs for today,
tomorrow and the day after exist; it never overwrites an existing doc (manual overrides survive).
For each missing day it reads the ticket ids used by the previous 150 daily docs, then picks at random
3 easy, 4 medium, 3 hard from the remaining `tickets`. If a difficulty runs short it relaxes the
repeat window for that difficulty only, oldest-used first. Selection logic is a pure function so it
can be unit-tested without Firestore.

Its first run creates the first three days; to get them right after deploy, force-run the job in
Cloud Scheduler (README → "Daily challenge — release order").

### Firestore rules

- `daily_challenges/{date}`: `read: if true`, `write: if false`.
- **Scoring is server-side (changed 2026-11-19).** The app stores the option chosen for each
  question and calls the `submitDailyResult` callable. It re-scores the answers against `tickets`,
  computes the streak and writes `dailyDate`, `dailyCorrect`, `dailyTimeMs`, `currentStreak`,
  `longestStreak` and `isAnonymous` with the Admin SDK. The `users/{uid}` rules forbid clients from
  creating or changing those daily fields. A question whose correct answer is not one of its options
  counts as wrong instead of refusing the day, and the scheduler never picks one.
- **Known limits (accepted):** the correct answers are publicly readable, so a modified client can
  still submit 10/10, and the time is measured on the device. A player who deletes and re-creates
  their own user document can resubmit the same day. This is the same trust level as the weekly and
  all-time boards.
- `firestore.indexes.json` gains `users`: `dailyDate` ASC, `isAnonymous` ASC, `dailyCorrect` DESC,
  `dailyTimeMs` ASC. The Today query has no `displayName != null` filter (an inequality would make
  Firestore order by `displayName` first); it filters guests with `isAnonymous == false`, and the
  rare signed-in player without a name is dropped client-side.

### User document — new fields

```ts
dailyDate: string | null;      // Tbilisi date of the last completed daily
dailyCorrect: number;          // 0–10, for dailyDate
dailyTimeMs: number;           // total answer time, for dailyDate
currentStreak: number;
longestStreak: number;
```

### App

Follows the existing barrels, `useStyles`/theme tokens and `useTranslation` rules.

| Unit | Purpose |
|---|---|
| `src/utils/tbilisiDate.ts` | `todayTbilisi()`, `addDays()`, `msUntilNextTbilisiMidnight()`; pure |
| `src/services/daily-challenge.ts` | fetch today's and tomorrow's set + their 10 tickets; cache both in AsyncStorage (`dailyChallenge.{date}`); drop caches older than yesterday |
| `src/services/local-daily-progress.ts` | local record per date (answers ✅/❌, correct, time) and streak; source of truth on the device |
| `src/helpers/dailyStreak.ts` | pure streak maths: next streak from last date + today |
| `src/services/firestore-daily.ts` | send each finished day (chosen options + time), oldest first, to the `submitDailyResult` callable; retried on the next open while offline; a past day the server can't score is dropped so it never blocks newer days |
| `src/helpers/dailyReminder.ts` | cancel + reschedule the 20:00 local notification (fixed identifier) on app open, on completion and when the setting changes |
| `src/hooks/useDailyChallenge.ts` | card state for `StartGameScreen` |
| `DailyGameScreen` + `useDailyGame` | the 10-question run, no crowns/hints, records per-answer time; reuses the game's question and option components but not `useGameScreen`, whose crown/hint/endless logic would need a branch in every handler |
| `DailyResultScreen` | result, ✅/❌ row, streak, rank, Share |
| `LeaderboardTabs` / `firestore-leaderboard.ts` | add the Today tab and its query |

### Data flow

1. App open → `daily-challenge` loads today's set (cache first, then network) and prefetches tomorrow's.
2. Play → answers recorded locally per question; on the 10th answer the local record and streak are
   saved, then `firestore-daily` submits it to `submitDailyResult` (or retries later), then the reminder is moved to
   tomorrow 20:00.
3. Card and result screen read the local record; the Today tab reads Firestore.

## Error handling

- No set for today (server failed, device offline with no cache): hide the card; never fall back to a
  random set, which would break "same for everyone".
- App killed mid-daily: the attempt counts as started; reopening resumes at the next unanswered
  question with the time so far. It cannot be restarted.
- Submission fails: the local record and streak stand. Network errors and "not ready yet" are retried on the next open; a past day the server can't score is dropped.
- Device clock changed: the day comes from the device clock in Tbilisi time; the rules stop a second
  result for the same date and a backwards date. Accepted for a casual game.
- Notification permission denied or setting off: no reminder; everything else works.

## Testing

- Unit: set selection (mix, order, 150-day window, shortage fallback), Tbilisi date and midnight
  maths, streak maths (same day, next day, gap, first ever), reminder scheduling decisions, share text
  (no answers in it), local record resume.
- Rules: emulator tests for the new `users` constraints.
- Device: iOS simulator and Android emulator — card states, a full daily, resume after kill, offline
  play from cache, Share sheet, reminder delivered at a test time, Today tab with two accounts.

## Release

- App: JavaScript-only (`expo-notifications` is already installed), so it can ship as an EAS Update to
  runtime 2.1.0, as the carousel did. The owner runs the update.
- Server: `firebase deploy --only functions,firestore:rules,firestore:indexes`, then
  a Cloud Scheduler force-run. The owner runs the deploy. Deploy the server first so sets exist before the
  app looks for them.

## Georgian copy needed from the owner

English is a working draft for `en.json`; every Georgian string comes from the owner.

| Key | English draft | Georgian |
|---|---|---|
| `daily_title` | Daily challenge | — |
| `daily_play` | Play | — |
| `daily_done` | Done | — |
| `daily_streak` | {n}-day streak | — |
| `daily_next_in` | Next in {time} | — |
| `daily_result_title` | Today's result | — |
| `daily_share_message` | History of Georgia · daily {date}: {n}/10 in {time} {marks} · {streak}-day streak {link} | — |
| `daily_section_title` | Today's challenge | — |
| `daily_card_description` | 10 questions · the same for everyone today | — |
| `leaderboard_today_tiebreak` | Same score — the faster time ranks higher | — |
| `daily_reminder_title` | Today's challenge is waiting | — |
| `daily_reminder_body` | 10 questions, about 2 minutes. Keep your streak going! | — |
| `leaderboard_tab_today` | Today | — |
| `leaderboard_empty_today_title` | Nobody has played yet today | — |
| `leaderboard_empty_today_desc` | Play the daily challenge and be first | — |

## Out of scope

Daily leaderboard history, calendar, streak freeze, daily points on the weekly/all-time boards,
analytics SDK, server-side timing.
