# Scoring Rework + Online Leaderboard — Design

**Status:** Draft for review
**Date:** 2026-04-29
**Target release:** 2.0.0 native build (already pending; see CLAUDE.md "Release status")

## Goal

Replace the current "count of correct answers" scoring with a difficulty-weighted point system, and add a global online leaderboard with a personal-stats panel. Both ship together in the pending 2.0.0 native release. The drosha project (`/Users/macbookpro/Desktop/my personal projects/drosha`) is the architectural reference — same Firebase Auth + Firestore stack, same `users/{uid}` + `game_results/{...}` collection pattern, same single-shot leaderboard queries — adapted to the History-of-Georgia parchment design language.

## Tech stack baseline (verified 2026-04-29)

| Component | Version (in `package.json`) |
| --- | --- |
| Expo SDK | 55 |
| React | 19.2.0 |
| React Native | 0.83.4 |
| `firebase` | 11.1.0 (already installed; supports modular Auth) |
| `@react-native-async-storage/async-storage` | 2.2.0 (already installed; required for Auth persistence) |

> **Note for tooling:** `.claude/rules/architecture.md` currently states "Expo SDK 53." That's stale — verify and update separately when convenient. Doesn't block this spec.

To install (versions resolved by `npx expo install`):

- `@react-native-google-signin/google-signin` (drosha pin: `^16.1.2`)
- `expo-apple-authentication` (drosha pin: `~55.0.12`)
- `expo-crypto` (drosha pin: `~55.0.13`)
- `expo-application` (new — for `Application.nativeApplicationVersion` in the force-update gate)

## Concurrent workstreams

The question-variations workstream (`docs/superpowers/specs/2026-04-27-question-variations-design.md`) is **orthogonal** to this design. New questions land in the `tickets` collection via `scripts/merge-drafts.js` → `upload.ts`; the new scoring reads each question's `difficulty` field, so growing the pool requires no leaderboard work. Statement-judgment remains deferred under its own spec.

## Decisions log

A condensed record of choices made during brainstorming. The full reasoning lives in this document; this table is for quick reference.

| # | Decision point | Choice |
| --- | --- | --- |
| Q1 | Architectural mirror | Mirror drosha exactly — anonymous Firebase Auth + optional Google/Apple sign-in, drosha's two-collection schema, drosha's rules pattern |
| Q2 | Wrong-answer penalty | Crown loss only; **no point deduction** |
| Q3 | Hint penalty | Hints stay free |
| Q4 | Anonymous users on leaderboard | **Hidden** — sign-in required to appear |
| Q5 | Existing local stats | **Wipe** `gameHistory` + `highScore` on first launch of 2.0.0 |
| Q6 | Leaderboard structure | **Global only**, with `This Week` + `All-Time` tabs |
| Q7 | Week boundary | Monday 00:00 Tbilisi (UTC+04:00, no DST) |
| Q8 | Sign-in nudge timing | Pull-based on Leaderboard tab + one-time milestone (first new personal best) |
| Q9 | Leaderboard placement | Replaces the third tab (was `Stats`, becomes `Leaderboard`) |
| Q10 | Display name source | OAuth-prefilled, **editable** in Settings (Georgian script supported) |
| — | Rollout shape | **Big-bang in 2.0.0** — auth, scoring, leaderboard, force-update gate all in one native build |
| — | Cost target | Stay within Firebase Spark-equivalent free quotas at typical small-app scale (≤ ~700 DAU) |

## Scoring formula

| Outcome | Easy | Medium | Hard | Crown effect |
| --- | --- | --- | --- | --- |
| Correct answer | +5 | +10 | +20 | none |
| Incorrect answer | 0 | 0 | 0 | −1 crown |
| Hint used | 0 | 0 | 0 | none |

- `score` is monotonically non-decreasing within a game (no negatives, no clamp needed).
- Game ends at `crowns === 0`.
- A perfect player plays forever; their score climbs until they make their 5th mistake.
- Score per question reads from each question's `difficulty` field — the same logic works for single-difficulty games (user picked easy/medium/hard on `StartGameScreen`) and mixed games (no difficulty picked).

### Crown ↔ score interaction

Crowns are a **gameplay mechanic only**. They live in `useGameScreen` local state, never in Firestore, never on the leaderboard. The leaderboard sees only the final point total at game-over.

### Replaces

- `stats.correctAnswers` is still computed for in-game UI but **no longer the value persisted**.
- Local `AsyncStorage["gameHistory"]` and `["highScore"]` are wiped on first launch of 2.0.0 (Q5).

## Architecture

### Authentication & identity

`AuthProvider` (top-level context, sibling to `SettingsContext` and `ThemeProvider`) owns auth state.

**`firebase.ts` extension** (auth + persistence + RN reliability flag — drosha-aligned):

```ts
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,   // RN reliability — drosha pattern
});

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
```

Calling `getAuth()` before `initializeAuth` returns an in-memory instance with no persistence and you can't upgrade it later, so all auth init stays in `firebase.ts` next to `initializeApp` — no other module is allowed to import `getAuth`/`initializeAuth` directly.

**Race-condition guard** (drosha pattern): `linkWithCredential` mutates the `firebase.User` object in place — `onAuthStateChanged` doesn't always re-fire. `AuthProvider` keeps an `authVersion: number` state alongside `user`; bump it after every link / sign-in / sign-out. Memoised context value depends on both `user` and `authVersion` so consumers re-render even when the User instance is the same reference.

**First-launch sequence:**

1. App boots; splash mounts.
2. If `firebase.auth().currentUser` is null, call `signInAnonymously()`.
3. On success (or restored anonymous user), call `ensureUserDoc(uid)` — read `users/{uid}`, create with zeroed schema if missing.
4. Expose `{ user, uid, isAnonymous, isSigningIn, signInWithGoogle, signInWithApple, signOut, updateDisplayName }` via context.

If anonymous sign-in fails (rare — usually offline): the app still runs fully against `cachedQuestions`. Game-end results are queued; we retry sign-in silently on next launch.

**OAuth upgrade flow** (Google + Apple):

- Google: `@react-native-google-signin/google-signin` (drosha's choice; native bridge baked into 2.0.0). Configured in `app.config.ts` `plugins` with the iOS URL scheme requirement (drosha pattern):

  ```ts
  plugins: [
    // ...existing plugins...
    [
      "@react-native-google-signin/google-signin",
      { iosUrlScheme: "com.googleusercontent.apps.<REVERSED_CLIENT_ID>" },
    ],
    "expo-apple-authentication",
  ],
  ```

  The reversed client ID comes from the iOS OAuth client in Firebase Console → Project settings → iOS app → `GoogleService-Info.plist`. We also need `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in `.env` for `GoogleSignin.configure()` (drosha env-var pattern). The credential build is `GoogleAuthProvider.credential(idToken)` — `idToken` alone, no `accessToken` needed.

- Apple: `expo-apple-authentication` + `expo-crypto` for nonce (Apple-required on iOS for any app offering third-party login). Android codepath is gated on `Platform.OS === "ios"` and `AppleAuthentication.isAvailableAsync()` to also catch older iOS / simulator edge cases.
- Flow: `signInWithGoogle()` / `signInWithApple()` → build credential → `currentUser.linkWithCredential(credential)`.
- On link success: UID preserved; `users/{uid}.isAnonymous` flips to `false`; `displayName` and `photoURL` populate from provider.
- On `auth/credential-already-in-use`: fall back to `signInWithCredential` (switches to existing UID; old anonymous UID's `users` doc is orphaned for later prune).
- On other errors: toast, stay anonymous.

**Sign-out:**

- Available in Settings → Account.
- Drops to fresh anonymous (new UID, zeroed stats on this device).
- Confirmation modal warns: "Your score will no longer appear on the leaderboard from this device."

**Sign-in nudge — milestone trigger:**

> First time the player beats their own `users/{uid}.bestSingleGameScore` **while still anonymous**.

`hasSeenSignInNudge: true` is written to `users/{uid}` after the modal closes (with or without sign-in), so it never repeats — even if the user later signs out and signs back in anonymously.

**Display name:**

- Sourced from OAuth provider's `displayName` (Google) or `fullName` (Apple).
- **Apple `fullName` is only returned on the *first* authorization for a given Apple ID + bundle ID combination.** Subsequent sign-ins return `null` for both `fullName` and `email`. So on Apple's first sign-in we **must** capture `fullName` synchronously, write it to `users/{uid}.displayName` immediately, and never rely on getting it again. (To re-test in development: revoke the app at `appleid.apple.com → Sign in with Apple → Apps Using Apple ID`.)
- Pre-filled in a `ConfirmNameModal` shown immediately after first OAuth success. User can edit.
- Editable in Settings → Account → Display name (same 2–24 char validation, Georgian + Latin script allowed).

### Force-update gate

A small Firestore doc + a boot-time gate. Critical for going prod cleanly: prevents 1.1.0 users from coexisting with the new schema.

**Doc** (manually edited via Firebase Console, not user-facing):

```ts
app_config/version
{
  minSupportedVersion: "2.0.0",
  latestVersion: "2.0.0",
  releaseNotes: { ka: "...", en: "..." }, // optional
  updatedAt: Timestamp,
}
```

**Boot flow** (runs in parallel with auth bootstrap):

```
1. Read cached app_config from AsyncStorage (≤6h fresh) → otherwise fall through.
2. In parallel: fetch app_config/version from Firestore.
3. Once we have a value:
   - if compareSemver(currentVersion, minSupportedVersion) < 0:
       show non-dismissible modal with deep links:
         iOS:  itms-apps://itunes.apple.com/app/id<APP_ID>
         Android: market://details?id=<PACKAGE_NAME>
   - else: proceed normally.
4. If both cache and network fail → grace mode: log warning, allow app to run, retry on next launch.
```

`compareSemver` is a tiny local util (split on `.`, compare numerically). Current version comes from `Constants.expoConfig.version` (already pulled in).

## Data model

### Collections

Two new (`tickets` and `push_tokens` already exist; both untouched).

#### `users/{uid}`

```ts
{
  displayName: string | null,        // null while anonymous; ≤ 24 chars when set
  photoURL: string | null,           // null unless OAuth provider gave one
  isAnonymous: boolean,

  // lifetime stats
  totalPoints: number,
  gamesPlayed: number,
  totalCorrect: number,
  totalQuestions: number,
  bestSingleGameScore: number,

  // weekly window
  weekPoints: number,
  weekStart: string,                 // ISO date "YYYY-MM-DD" of Monday 00:00 Tbilisi

  // UX flags
  hasSeenSignInNudge: boolean,

  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

#### `game_results/{uid}_{resultId}`

```ts
{
  userId: string,                    // duplicate of uid for queryability
  score: number,                     // total points earned this game
  correctCount: number,
  totalQuestions: number,
  selectedDifficulty: 'easy' | 'medium' | 'hard' | null,  // null = mixed
  scoreByDifficulty: { easy: number, medium: number, hard: number },
  createdAt: Timestamp,
}
```

Documents are **immutable** after creation. `resultId` is a client-generated UUID via `expo-crypto`. Doc id format `${uid}_${resultId}` makes idempotency a single `getDoc` check at the top of the transaction.

#### `app_config/version`

Single document; see "Force-update gate" above.

### Game-end atomic transaction

Triggered in `useGameScreen` when `crowns === 0`. Single Firestore transaction. Lifetime stats use Firestore's atomic `increment()` (drosha pattern) — no read-then-write race window. The weekly fields and `bestSingleGameScore` need a read first because their update depends on the existing value.

```
1.  resultId = uuid()
2.  currentWeekStart = mondayTbilisi(now)         // "YYYY-MM-DD"
3.  transaction.run():
    a.  if game_results/{uid}_{resultId} exists → abort (idempotent guard)
    b.  read users/{uid}
    c.  newWeekPoints = (users.weekStart === currentWeekStart)
          ? users.weekPoints + score
          : score                                 // lazy weekly reset
    d.  newBest = max(users.bestSingleGameScore, score)
    e.  create game_results/{uid}_{resultId} with full payload
    f.  update users/{uid}:
          totalPoints         : increment(score)
          gamesPlayed         : increment(1)
          totalCorrect        : increment(correctCount)
          totalQuestions      : increment(totalQuestions)
          bestSingleGameScore : newBest                  // computed in step (d)
          weekPoints          : newWeekPoints            // computed in step (c)
          weekStart           : currentWeekStart
          updatedAt           : serverTimestamp()
```

**Defensive profile creation** (drosha pattern): if `users/{uid}` doesn't exist when the transaction runs (auth-bootstrap race), the transaction creates a zeroed profile inside the same transaction before applying the stats update. This way a game-end never fails just because `ensureUserDoc` hadn't run yet.

If the transaction fails for offline / auth-race reasons, the result is queued in `AsyncStorage["pendingResults"]` and replayed on next launch (see "Error handling & offline").

### Leaderboard read queries

Both run from `LeaderboardScreen`, refetched per the cache rules in "Cost & quotas":

**All-time tab**

```ts
users
  .where("displayName", "!=", null)
  .orderBy("totalPoints", "desc")
  .limit(20)
```

**This-week tab**

```ts
users
  .where("displayName", "!=", null)
  .where("weekStart", "==", currentWeekStart)
  .orderBy("weekPoints", "desc")
  .limit(20)
```

Composite indexes added to `firestore.indexes.json` and deployed:

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "displayName",  "order": "ASCENDING" },
        { "fieldPath": "totalPoints",  "order": "DESCENDING" },
        { "fieldPath": "gamesPlayed",  "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "displayName",  "order": "ASCENDING" },
        { "fieldPath": "weekStart",    "order": "ASCENDING" },
        { "fieldPath": "weekPoints",   "order": "DESCENDING" }
      ]
    }
  ]
}
```

The `gamesPlayed ASC` tiebreaker on the all-time index (drosha pattern) ranks players with identical `totalPoints` by who reached it in fewer games — rewarding efficiency.

**`displayName != null` quirk:** Firestore's `!=` filter excludes documents where the field is missing entirely (not just `null`). So when `users/{uid}` is created in `ensureUserDoc`, we must explicitly write `displayName: null` rather than omit the field — otherwise anonymous users would still be excluded by their absent field, but they'd never be re-includable later when they sign in (the existing doc still has the field absent until we write to it). Always set the field explicitly at create.

### Firestore security rules (additive — existing rules untouched)

```firestore-rules
match /databases/{db}/documents {

  // Public read so leaderboard works; per-user write.
  match /users/{uid} {
    allow read: if request.auth != null;

    allow create: if request.auth.uid == uid
      && request.resource.data.totalPoints == 0
      && request.resource.data.gamesPlayed == 0
      && request.resource.data.totalCorrect == 0
      && request.resource.data.totalQuestions == 0
      && request.resource.data.bestSingleGameScore == 0
      && request.resource.data.weekPoints == 0;

    allow update: if request.auth.uid == uid
      // monotonic lifetime stats with ±5 jitter tolerance for retry resilience
      // (drosha pattern — accommodates idempotent client retries that race the server)
      && request.resource.data.totalPoints      >= resource.data.totalPoints - 5
      && request.resource.data.gamesPlayed      >= resource.data.gamesPlayed
      && request.resource.data.totalCorrect     >= resource.data.totalCorrect
      && request.resource.data.totalQuestions   >= resource.data.totalQuestions
      && request.resource.data.bestSingleGameScore >= resource.data.bestSingleGameScore
      // sane single-write growth caps (anti-cheat heuristic)
      && (request.resource.data.totalPoints - resource.data.totalPoints) <= 50000
      && (request.resource.data.gamesPlayed - resource.data.gamesPlayed) <= 1
      // createdAt is immutable
      && request.resource.data.createdAt == resource.data.createdAt
      // weekPoints can decrease only when weekStart advances
      && (request.resource.data.weekPoints >= resource.data.weekPoints
          || request.resource.data.weekStart != resource.data.weekStart);
  }

  match /game_results/{id} {
    allow read: if request.auth.uid == resource.data.userId;
    allow create: if request.auth.uid == request.resource.data.userId
      && id.matches(request.auth.uid + "_.*")
      && request.resource.data.score >= 0
      && request.resource.data.correctCount <= request.resource.data.totalQuestions
      && request.resource.data.score <= 50000;
    allow update, delete: if false;
  }

  match /app_config/{doc} {
    allow read: if true;
    allow write: if false;  // only via Firebase Console / admin SDK
  }
}
```

The 50 000-point cap per game and per write is a loose anti-cheat heuristic. Server-side per-question replay is out of scope for v1.

## Cost & quotas

Firebase Auth is free; the cost surface is Firestore reads, dominated by the leaderboard. Free quotas (Spark equivalent on Blaze): 50 000 reads/day, 20 000 writes/day, 1 GiB stored.

### Per-DAU budget (after optimisations)

| Operation | Reads / DAU / day | Writes / DAU / day |
| --- | --- | --- |
| Game-end transaction × 2 | 4 | 4 |
| Leaderboard top-20 with 30-min cache | ~50 | 0 |
| Question fetches | ~16 | 0 |
| App-config check | ~0.25 | 0 |
| **Total** | **~70** | **~4** |

Stays within free tier up to **~700 DAU**. Beyond that, ship the v1.1 leaderboard-snapshot Cloud Function (deferred).

### Optimisations applied

1. **Top 20** instead of top 50 (Q6 originally suggested 50; revised down for cost).
2. **30-minute AsyncStorage cache, per tab** (separate keys for `weekly` and `alltime`, since the queries differ). Refetch only on (a) cold cache, (b) cache age > 30 min, (c) pull-to-refresh, (d) game-end (invalidate both tab caches — the player's row may have moved on either).
3. **No real-time listeners** — single-shot `getDocs()` only.
4. **Question fetches** unchanged (already cached locally via `cachedQuestions`).

### Operational

Set a $1/month spend alert in the Firebase Console (Billing → Alerts). Independent of code.

## UX surfaces

All inherit the parchment / serif / bronze palette. No new design language. Per project convention: theme tokens only — no hardcoded colors, spacing, or border radii. Reuse `AppText`, `Modal`, `IconButton`, `OptionButton`, `GradientWrapper`, etc.

### GameHeader

Replaces the existing `correct answer X/Y` line with a single serif headline:

```
ქულა: 180   /   Score: 180
```

Crowns row above remains unchanged. Two new translation keys (`common_score`). The points value comes from `gameState.score` (a new field on `GameState`).

### StartGameScreen — no change

`DifficultyRing.tsx` stays as-is. Score breakdown information lives in the Rules screen instead (next).

### Rules screen — extended bullet list

`src/components/rules/Rules.tsx` is opened via the existing modal in `AppModals.tsx`. Currently shows two strings; we extend to a block list:

```
წესები ძალიან მარტივია:                   (rules_title — existing)

• გაქვს 5 შეცდომის დაშვების უფლება        (rules_lives — new)
• 5-ჯერ შეგიძლია დახმარების გამოყენება    (rules_hints — new)
• ქულები იცვლება სირთულის მიხედვით:       (rules_scoring_intro — new)
   – მარტივი — +5 ქულა                    (rules_scoring_easy — new)
   – საშუალო — +10 ქულა                   (rules_scoring_medium — new)
   – რთული — +20 ქულა                     (rules_scoring_hard — new)
• გახადე შენი მიზანი ლიდერბორდზე ასვლა!   (rules_scoring_outro — new)
```

Same `InfoIcon` background, same script font for the title, body in serif. The previous `rules_description` key stays defined in the locale files for one release as a deprecated shim, but the component no longer renders it.

### Leaderboard tab (replaces Stats)

`TabNavigation.tsx` swaps the third tab — route name and icon update from `Stats` → `Leaderboard`. Translation key changes from `tab_stats` (or equivalent) → `tab_leaderboard`. `src/screens/main-screens/stats-screen/` is removed; `src/screens/main-screens/leaderboard-screen/` is added.

Layout — single vertical scroll:

```
┌─ "Your card" — parchment scroll panel ─────────┐
│  avatar (photo or script-font initial)         │
│  Display name (serif headline)                 │
│  Provider chip: "Google" / "Apple"             │
│  Big rank number — "#14" — display font        │
│   (the rank in the currently-selected tab)    │
│  Mini stat row (4 columns, sans caption):     │
│    "სულ ქულა"  "თამაშები"  "რეკორდი"  "სიზუსტე"│
└─────────────────────────────────────────────────┘

┌─ Tab switcher (parchment-tinted segmented) ─────┐
│  [ ამ კვირის ]  [ ყველა დროის ]                │
│  [ This Week ]  [ All-Time ]                   │
└─────────────────────────────────────────────────┘

┌─ Top-3 podium row ──────────────────────────────┐
│  3 parchment cards side-by-side, ranked 2/1/3  │
│  Center card (rank 1) is taller                │
│  Each: rank ribbon, avatar, name, points       │
│  Color accents from existing bronze* tokens    │
│  (no generic gold/silver/bronze)               │
└─────────────────────────────────────────────────┘

┌─ Ranks 4–20 — FlatList ─────────────────────────┐
│  Each row: parchment-tinted card                │
│  [#04] [avatar] [name (serif)] [points]        │
│  User's own row in 4–20: subtle parchmentTint  │
│  highlight (no bright color — historical feel) │
└─────────────────────────────────────────────────┘
```

If user's rank > 20, "Your card" at top still shows the actual rank. If anonymous, "Your card" collapses into the sign-in CTA (same `SignInModal` component, conditional rendering); tabs and podium below remain visible. Empty states by tab:

- **Weekly empty** (Monday morning before anyone has played this week): podium hides, list shows `leaderboard_empty_week` ("Be the first to score this week").
- **All-time empty** (immediately after launch, before any signed-in user has finished a game): podium hides, list shows `leaderboard_empty_alltime` ("Be the first on the leaderboard"). Rare and short-lived but worth covering.

The user's own row, if it falls into ranks 4–20 of the FlatList, gets a `parchmentTint` background highlight. The highlight applies **only** in the FlatList rows — never on the top-3 podium (that's the "you're #1/#2/#3" reward in itself) and never on "Your card" (which is already styled distinctly as the user's own panel).

Loading states: 5 skeleton rows in parchment-tinted shimmer. Error states: reuse the existing offline banner via `useNetworkStatus`. Pull-to-refresh on the FlatList.

**Avatar fallback (no photo URL):** parchment-tinted circle with the first letter of the display name in script font (`aisi-bold`) — keeps anonymous-photo users visually consistent with the historical feel rather than dropping a generic gray silhouette.

### SignInModal

Reused in two places — the Leaderboard "Your card" CTA and the milestone nudge.

```
[ Modal — parchment scroll ]
   Header:   "შემოდი / Sign in"
   Body:     "შენი ქულა შეინახე და კონკურენცია გაუწიე სხვა მოთამაშეებს."

   [ Google ]   ← native button via @react-native-google-signin
   [ Apple  ]   ← iOS only; hidden on Android (Apple's policy)
   [ Skip for now ]   (text link)
```

On success → `ConfirmNameModal`. On failure → toast `signin_failure_toast`, modal stays open.

### ConfirmNameModal

Shown once, immediately after first successful OAuth link.

```
[ Modal — parchment scroll, non-dismissible ]
   Header:   "აირჩიე სახელი / Pick your name"
   Caption:  "ეს სახელი გამოჩნდება ლიდერბორდზე."

   [ TextInput, prefilled with OAuth displayName ]
       maxLength=24, validates on change

   Validation message line (red caption):
     "სახელი უნდა იყოს 2–24 სიმბოლო"

   [ შენახვა / Save ]   (disabled until valid)
```

`Save` writes `users/{uid}.displayName` and dismisses.

### MilestoneNudgeModal

Triggered when `score > previousBest && isAnonymous && !hasSeenSignInNudge`. **Replaces** the standard `GameSummary` modal for that one game (so we don't stack two modals).

```
[ Modal — parchment scroll ]
   Header:   "ახალი რეკორდი! / New record!"
   Body:     "შენ მოიგე {score} ქულა — შენი საუკეთესო შედეგი ჯერჯერობით."
   Sub:      "შემოდი და დაიკავე ადგილი ლიდერბორდზე."

   [ Google ]
   [ Apple  ]
   [ ნახე ჩემი შედეგი / View my result ]   (skips sign-in, opens GameSummary)
```

After dismissal, `users/{uid}.hasSeenSignInNudge = true` is written. The standard `GameSummary` opens after.

### Settings → Account section

Adds one section to `AppSettings.tsx`, between current toggles and the Facebook/store links:

```
─── Account ───
  Display name:   [ "Papuna" ]   ✏️       ← tap to edit (opens ConfirmNameModal)
  Signed in as:   "Papuna Fshaveli"
                  google.com
  [ Sign out ]                            ← red-tinted text link
```

For anonymous users, the section shows just `[ Sign in ]` instead.

`Sign out` opens a confirmation modal: "შენი ქულა აღარ გამოჩნდება ლიდერბორდზე ამ ტელეფონიდან." Confirm → `auth.signOut()` → app drops to fresh anonymous (new UID, fresh `users` doc).

### ForceUpdateModal

Non-dismissible. No close button.

```
[ Modal — non-dismissible ]
   Header:   "განახლება საჭიროა / Update required"
   Body:     "ახალი ვერსია სავალდებულოა, გთხოვთ განაახლეთ App Store-დან."

   [ App Store / Play Store ]   ← deep-link button
```

Store deep-link is the only way out.

## Migration & first-launch

### Sequence (idempotent, every boot)

```
1. Splash mounts.

2. Run migrations (each gated by its own one-time flag):
   • migrations:v2.0.0:cleanLegacyStats
       - AsyncStorage.multiRemove(["gameHistory", "highScore"])
       - set flag = "done"

3. Force-update check (in parallel):
   - read cached app_config (≤6h fresh) OR fetch app_config/version
   - if currentVersion < minSupportedVersion → block on ForceUpdateModal
   - grace mode if both cache and network fail

4. Auth bootstrap (in parallel):
   - if firebase.auth().currentUser → use it
   - else → signInAnonymously()
   - on success → ensureUserDoc(uid)
   - on failure → mark auth-degraded; app runs against cache only

5. Hide splash, navigate to Home.

6. In the background, replay queued result writes (see below).
```

### Production data inventory

| Location | Key / Collection | Plan in 2.0.0 | Risk |
| --- | --- | --- | --- |
| Firestore | `tickets` (~1,564 docs) | Read-only, untouched | none |
| Firestore | `push_tokens/{token}` | Untouched | none |
| Firestore | `users/{uid}` | NEW | new collection |
| Firestore | `game_results/{...}` | NEW | new collection |
| Firestore | `app_config/version` | NEW (manually seeded via Console) | new collection |
| AsyncStorage | `cachedQuestions` | Keep as-is | none |
| AsyncStorage | `settings:isMuted`, `settings:isVibrationOff`, `settings:isPushEnabled` | Keep as-is | none |
| AsyncStorage | `settings:pushToken` | Keep as-is | none |
| AsyncStorage | `themeMode` | Keep as-is | none |
| AsyncStorage | `gameHistory`, `highScore` | **One-time wipe** on first launch of 2.0.0 | deliberate |
| Firestore rules (existing) | tickets / push_tokens | Untouched; new rules **appended** | additive |
| Firestore indexes (existing) | — | Two new composite indexes appended | additive |

### Translation key delta (~38 new)

```
common_score
common_total_points
common_games_played
common_best_score
common_accuracy
tab_leaderboard
leaderboard_title
leaderboard_tab_week
leaderboard_tab_alltime
leaderboard_signin_cta_title
leaderboard_signin_cta_body
leaderboard_empty_week
leaderboard_empty_alltime
leaderboard_loading
leaderboard_error_offline
your_card_total_points
your_card_games
your_card_best
your_card_accuracy
signin_modal_title
signin_modal_body
signin_button_google
signin_button_apple
signin_skip
signin_failure_toast
name_modal_title
name_modal_caption
name_modal_save
name_validation_length
milestone_title
milestone_body
milestone_subbody
milestone_skip_button
settings_account_section
settings_display_name
settings_signed_in_as
settings_provider_google
settings_provider_apple
settings_signout_button
settings_signout_confirm_title
settings_signout_confirm_body
force_update_title
force_update_body
force_update_button
rules_lives
rules_hints
rules_scoring_intro
rules_scoring_easy
rules_scoring_medium
rules_scoring_hard
rules_scoring_outro
```

`rules_description` (existing) stays defined for one release as a deprecated shim.

## Error handling & offline

### Failed-write queue

Game-end transactions can fail for three reasons:

1. **Offline / no network** (`firestore/unavailable`) — queue and retry.
2. **Auth not yet resolved** — queue and retry.
3. **Rules rejection** — drop with logged analytics event (no point retrying).

**Queue model:**

```ts
AsyncStorage["pendingResults"] = [
  {
    resultId: "uuid-1",
    payload: { score, correctCount, totalQuestions, selectedDifficulty,
               scoreByDifficulty, gameEndedAt: ISO },
  },
  ...
]
```

**Replay flow** — called on app boot (after step 4 in first-launch), on `NetInfo` reconnect, and on Leaderboard pull-to-refresh:

```
for each entry in pendingResults:
   try: run the same atomic transaction with the queued resultId
   on success: remove from queue
   on offline / auth-race: leave in queue
   on rules rejection: remove + log "result_dropped_rules_violation"
```

Cap at **20 entries**; oldest gets evicted with a logged analytics event.

### Auth-failure handling

| Failure | UI | Recovery |
| --- | --- | --- |
| Anonymous sign-in fails on launch | Game still playable from cache; results queue | Retry on foreground |
| Google flow cancelled | Modal stays open, no toast | User retries |
| Google flow provider-error | Toast + modal stays open | User retries / picks Apple |
| `linkWithCredential` → `auth/credential-already-in-use` | Sign out anon → `signInWithCredential` to existing UID; old anon UID orphaned | Analytics log only |
| `linkWithCredential` → other error | Toast, stay anonymous | User retries |
| Token expires mid-session | Firebase SDK handles silently | None |

### Mid-game crash / kill

Today's app loses in-progress games on crash. We don't change that. The leaderboard sees only completed games. Saving in-flight state to AsyncStorage and resuming is a v1.1 nice-to-have.

### Uninstall / reinstall on the same device

Anonymous Firebase Auth persists through app updates and OS reboots, but **not through uninstall** — the auth keychain entry is wiped. Reinstall = new anonymous UID + zeroed `users` doc.

Signed-in players who reinstall and sign in with the same Google/Apple account land back on their original UID (`signInWithCredential` returns the existing user). All stats preserved. This is the value proposition of the sign-in nudge.

### Multi-device

Two devices, same Google account, both signed in: both operate on the same `users/{uid}` doc. Game-end transactions are atomic, so concurrent completions serialise.

### Time-source for "this week"

Player's device clock determines `mondayTbilisi(now)`. A clock-skewed player ends up writing to a `weekStart` that nobody else shares — they're effectively self-quarantined on the leaderboard. Acceptable for v1. A v1.1 server-time variant via Cloud Function is a deferred upgrade.

## File impact

### New files

```
src/context/AuthProvider.tsx
src/hooks/useAuth.ts
src/hooks/useLeaderboard.ts
src/hooks/useUserStats.ts
src/hooks/useForceUpdateGate.ts
src/hooks/usePendingResultsReplay.ts
src/services/firestore-leaderboard.ts
src/services/firestore-user.ts
src/services/firestore-game-result.ts
src/services/appConfig.ts
src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx
src/screens/main-screens/leaderboard-screen/YourCard.tsx
src/screens/main-screens/leaderboard-screen/LeaderboardTabs.tsx
src/screens/main-screens/leaderboard-screen/LeaderboardPodium.tsx
src/screens/main-screens/leaderboard-screen/LeaderboardRow.tsx
src/screens/main-screens/leaderboard-screen/styles.ts
src/components/sign-in/SignInModal.tsx
src/components/sign-in/ConfirmNameModal.tsx
src/components/sign-in/MilestoneNudgeModal.tsx
src/components/sign-in/ForceUpdateModal.tsx
src/components/sign-in/styles.ts
src/components/app-settings/AccountSection.tsx
src/utils/semver.ts
src/utils/weekStart.ts
src/utils/uuid.ts
src/migrations/v2.0.0-clean-legacy-stats.ts
src/migrations/index.ts
firestore.rules                                  ← appended (existing rules unchanged)
firestore.indexes.json                           ← appended
```

### Modified files

```
App.tsx                                          ← AuthProvider wrap; runMigrations + force-update during splash
src/navigation/TabNavigation.tsx                 ← Stats → Leaderboard tab swap
src/components/game-screen-components/GameHeader.tsx
                                                 ← Score: N replaces correct-answer X/Y
src/components/game-screen-components/styles.ts  ← typography for score line
src/hooks/useGameScreen.tsx                      ← gameState.score; saveGameAndUpdateStats on crowns=0
src/components/rules/Rules.tsx                   ← extended bullet list
src/components/app-settings/AppSettings.tsx     ← mounts AccountSection
src/helpers/fetchRandomQuestion.ts              ← include `difficulty` in returned QuizQuestion
src/types/quizQuestion.ts                       ← `difficulty` becomes required
src/locales/en.json                              ← ~38 new keys
src/locales/ka.json                              ← ~38 new keys
package.json                                     ← @react-native-google-signin/google-signin,
                                                    expo-apple-authentication, expo-crypto, expo-application
app.config.ts                                    ← Google + Apple plugin configs (runtimeVersion stays at 2.0.0)
```

### Removed

```
src/screens/main-screens/stats-screen/   ← replaced by leaderboard-screen
src/helpers/gameHistory.ts               ← legacy stats helpers no longer used
```

## Testing

Pragmatic — the project already has 60% coverage on hooks/helpers (per `bigChanges.md` 5.2).

### Unit tests (Jest + Firebase emulator)

- `compareSemver` — boundary tests
- `mondayTbilisi` — DST no-op, Sunday→Monday rollover, end-of-month rollover
- `saveGameAndUpdateStats` — happy path, idempotent re-run, week boundary crossed, rules rejection
- `usePendingResultsReplay` — order, drop on rules violation
- `useLeaderboard` — cache hit / miss / pull-to-refresh / invalidate-on-game-end
- `runMigrations` — idempotent (second run is a no-op)
- `Rules.tsx` — snapshot test for the new bullet list

### Firestore rules tests (emulator)

- Anonymous user creates own users doc with zeroed stats: ✅
- Anonymous user creates own users doc with seeded points: ❌
- User updates own users doc: monotonicity passes for normal increments, fails for arbitrary jumps > 50 000
- User reads anyone else's users doc: ✅ (leaderboard requirement)
- User writes anyone else's users doc: ❌
- User creates game_result with mismatched userId: ❌
- User updates an existing game_result: ❌

### Integration / e2e (manual prelaunch)

- Fresh install → anonymous → 5 games → milestone modal triggers exactly once
- Sign-in with Google → name modal → leaderboard appearance
- Sign out → fresh anonymous → no leaderboard entry
- Reinstall → sign in with same Google → original UID, stats preserved
- Force-update modal triggers when `minSupportedVersion` bumped
- Offline play: 3 games while offline, reconnect, all 3 land on leaderboard with idempotent IDs

## Out of scope (v1)

- Server-side score validation (Cloud Function replay of each answer).
- Profanity filter on display names.
- Per-difficulty leaderboards (Q6 chose global only).
- Leaderboard snapshot Cloud Function (deferred to v1.1 cost optimisation).
- Soft-update banner.
- Mid-game crash recovery.
- Achievements / badges; Daily Challenge; Friends-only leaderboard (`bigChanges.md` §7).
- Statement-judgment question variation (deferred under its own spec).
- Name-edit cooldown / abuse rate-limiting.
- Server-side time source for week boundary.

## App Store / Play Store implications

Adding OAuth + leaderboard touches store-review and privacy disclosures.

- **Apple Guideline 4.8 (Sign in with Apple):** When an app offers any third-party login (Google in our case), Apple Sign In must be offered with equivalent prominence on iOS. Our `SignInModal` does this — both buttons rendered side-by-side, Apple gated to iOS only.
- **Apple Privacy Nutrition Labels** (App Store Connect → App Privacy):
  - **User ID** (Firebase UID) — Linked to user, used for app functionality.
  - **Name** (`displayName` from Apple/Google) — Linked to user, used for app functionality.
  - **Other User Content** — Linked to user (leaderboard scores tied to identity).
  - **Email Address** — *omit* (we never persist Apple/Google email).
  - If Firebase Analytics gets enabled later (currently dev-only per `bigChanges.md` 6.4), we'd add **Product Interaction**, **Crash Data**, **Performance Data** under Usage Data, and **Device ID** under Identifiers.
- **Play Store Data Safety form:** mirror the Apple disclosures. No data sold; data encrypted in transit (Firestore handles).
- **Apple `fullName` test note**: to retest first-sign-in flow during development, revoke the app at `appleid.apple.com → Sign in with Apple → Apps Using Apple ID`. Otherwise Apple memoises the first-sign-in and won't return `fullName` again.

## Reusable skills available in drosha

The drosha project carries three project-local Claude skills relevant to this work, in `/Users/macbookpro/Desktop/my personal projects/drosha/.claude/skills/`:

| Skill | Why useful here |
| --- | --- |
| `firebase-auth-basics` | Generic Firebase Auth concepts (provisioning, providers, tokens, security rules). Lighter than what drosha's own `AuthProvider.tsx` already shows us, but a useful refresher. |
| `expo-deployment` | EAS build / submit / TestFlight commands and `eas.json` shape. Needed for the 2.0.0 native release. |
| `expo-dev-client` | Dev-client setup; useful for testing the new native bridges (Google/Apple) before EAS submit. |

If we want them available locally during implementation, copy them under `/Users/macbookpro/Desktop/my personal projects/history-of-georgia/.claude/skills/` (gitignored per the project's "keep Claude tooling out of the repo" convention). This is optional — the implementation can proceed without them by referencing drosha's source directly.

## Open follow-ups

- Final Georgian wording for `milestone_title` (`ახალი რეკორდი!` is a working draft).
- Whether `signed in as` shows the email or just the provider — privacy preference.
- App Store / Play Store deep-link IDs for `ForceUpdateModal`.
- Analytics event names: `leaderboard_viewed`, `signin_attempt`, `signin_success`, `result_dropped_rules_violation`, `pending_result_evicted`.
- Whether to copy `firebase-auth-basics` / `expo-deployment` / `expo-dev-client` skills locally from drosha (gitignored).
- Update `.claude/rules/architecture.md` — currently states "Expo SDK 53"; project is on SDK 55.
