# Scoring Rework + Online Leaderboard — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-04-29-scoring-leaderboard-design.md`
**Date:** 2026-04-29 (amended 2026-04-30)
**Target release:** 2.0.0 native build

---

## ⏯ Current state — start here when resuming

**Branch:** `Add-question-variations`
**Last commit:** `d7a6e4c` — "Phase 3: leaderboard tab — functional, design debt logged" (pushed)
**Working tree:** uncommitted Phase 3 work in flight; will be partially discarded for the pivot (see below)

### What is committed and working

- **Phase 1** (commit `aaaae49`): anonymous Firebase Auth, `users/{uid}` doc auto-create, persistence, `AuthProvider`, `useAuth`. **No further work needed unless real OAuth lands (Phase 4).**
- **Phase 2** (commit `aaaae49`): difficulty-weighted scoring (+5/+10/+20), atomic Firestore transaction with idempotent guard + lazy weekly reset, `pendingResults` queue + replay on auth/network resolve, legacy-stats one-time AsyncStorage wipe migration, `GameHeader` shows `Score: N`, Rules screen carries the scoring breakdown.
- **Phase 3 baseline** (commit `d7a6e4c`): the third tab was renamed `Leaderboard`; `users` collection wiring, `useLeaderboard` + `useUserStats` hooks, `firestore-leaderboard` service, parchment-imagery components — design rejected, debt logged.
- **Firestore rules** for `users` / `game_results` / `app_config` deployed to production (existing `tickets` / `push_tokens` / `notifications` rules preserved verbatim).
- **Composite indexes** for both leaderboard queries deployed.
- **Translation keys** for ~38 strings across `en.json` and `ka.json`.
- **Memory** updates pinning the user's preferences (no Co-Authored-By, prefer enums, UI polish discipline, no modal-as-router for sign-in, design-context, etc.) — auto-loaded by every new session.

### What is uncommitted (in flight at conversation pause)

The 2026-04-30 follow-up session reworked Phase 3 several times based on screenshot review. Current uncommitted work is **partially salvageable for the pivot**:

- ✅ **Salvage:** `useRecentGames` rewired to local AsyncStorage (`src/services/local-recent-games.ts` + `src/hooks/useRecentGames.ts`); `addLocalRecentGame` call on game-end; sign-in inline buttons (Google + Apple, no modal); cache invalidation on game-end success.
- 🔁 **Rework:** `LeaderboardScreen.tsx` currently does auth-conditional content with recent games inline — needs to be split (recent games move to a restored `StatsScreen.tsx`; Leaderboard becomes anonymous-buttons-only or signed-in-list-only).
- 🗑 **Discard / revert:** the parchment Crown / podium / fixed-title / divider work in current `LeaderboardScreen.tsx` and `styles.ts` — most of it doesn't fit the new structure.

### What the pivot demands (next concrete steps)

The brainstorming on 2026-04-30 reversed the original Q9. New tab structure: **4 tabs, Home → Topics → Leaderboard → Stats**. See spec section "Tab structure pivot (2026-04-30) — supersedes Q9" for full design.

Concrete coding steps:

1. **Re-add `ScreenName.STATS_SCREEN`** in `src/types/screenNames.ts` (alongside `LEADERBOARD_SCREEN`).
2. **Update `TabParamList`** in `src/types/screens.ts` to include both `stats-screen` and `leaderboard-screen`.
3. **Restore `src/screens/main-screens/stats-screen/StatsScreen.tsx`** as the 4th tab, but rewire data:
   - 4 cards via `useUserStats` (Firestore `users/{uid}` doc): Total Games, Best Score, Average Score, Total Questions — keep old MaterialCommunityIcons (`sword-cross`, `trophy`, `chart-line`, `help-circle-outline`).
   - Recent-games list via existing `useRecentGames` (local AsyncStorage). Layout: title + 4 cards + section header **fixed**, only the list scrolls.
4. **Slim down `LeaderboardScreen.tsx`** — remove the recent-games section; clean two-state branch:
   - Anonymous → just inline Google + Apple sign-in stamp buttons (no modal).
   - Signed-in → small "Your rank: #N" caption (only if user is in top 20) + Weekly/All-Time tabs + scrolling top-20 list.
5. **Update `TabNavigation.tsx`** — register both screens in this exact order: Home → Topics → Leaderboard → Stats.
6. **Update `GameSummary.tsx`** — post-game "View stats" route reverts to `STATS_SCREEN`.
7. **`screens/main-screens/index.ts`** — re-export both `StatsScreen` and `LeaderboardScreen`.
8. **Remove `RecentGamesList.tsx`** from leaderboard-screen folder; either move to `src/components/recent-games-list/` (if shared) or inline its content into the restored `StatsScreen.tsx` (single consumer).

After step 8: TS + lint clean, smoke-test on dev client (`npm start` → press `s` then `i`), commit + push as Phase 3 pivot, then resume the rest of the plan starting at Phase 4.

### Phases 4–8 are unchanged

OAuth wiring, force-update gate, milestone modal, Settings → Account, migration cleanup, test pass, EAS release — see Phase 4–8 sections below; the pivot doesn't touch those.

### Where the visual design debt stands

Logged in spec section "Design debt — Leaderboard UI is unfinished (2026-04-29)". Stats screen reuses the original `StatsScreen.tsx` design which the user explicitly liked, so that's not in design debt. Leaderboard tab visuals still need a designer pass after Phase 4+5 land.

---

This plan executes the spec in 8 phases. Each phase is small enough to land + verify independently. Between phases, we pause: run the dev client, smoke-test the changed surface, fix any regressions, then move on. This avoids landing 40 files at once.

The phases are ordered to **build the foundation first** (auth + Firestore writes), **then ship the scoring rework** (which works with anonymous users + queued writes), **then layer the leaderboard UI on top**, **then OAuth on top of that**, **then the polish** (Settings, force-update, milestone). Migration and offline are interleaved where they belong.

## Phase boundaries (TL;DR)

| Phase | What ships | Visible to user? | Dependencies |
| --- | --- | --- | --- |
| 0 | Pre-flight checks, EAS credentials, Firebase Console setup | No (config only) | none |
| 1 | Firebase Auth + persistence + `AuthProvider` (anonymous only, no UI) | No (silent) | 0 |
| 2 | New scoring formula, GameHeader rewrite, Rules content, Firestore writes (queued if needed) | Yes (gameplay feels different) | 1 |
| 3 | Leaderboard tab, Firestore queries, "Your card" + sign-in CTA stub | Yes (new tab) | 1, 2 |
| 4 | Google + Apple sign-in, ConfirmNameModal, name editing in Settings | Yes (sign-in works) | 1, 3 |
| 5 | Force-update gate, milestone modal, Settings → Account final | Yes (gates + nudges) | 1, 4 |
| 6 | Migration (legacy stats wipe), offline queue (pendingResults replay), failure modes | Mostly silent | 2, 4 |
| 7 | Test pass (unit + rules emulator + manual e2e) | Internal | all |
| 8 | EAS production build, store submission | Yes (release) | 7 |

Total expected effort: roughly 3–5 development days for one engineer, longer if testing surfaces UI fit-and-finish issues.

---

## Phase 0 — Prerequisites & verification

**Goal:** No code changes; verify environment is ready before we start.

### 0.1 Confirm Firebase project state

- Open Firebase Console for the project.
- **Authentication tab:** enable "Anonymous", "Google", and "Apple" sign-in providers. Capture the iOS / Web OAuth client IDs and the iOS reversed client ID.
- **Firestore tab:** confirm the `tickets` collection has the expected ~1,564 docs and `push_tokens` is intact.
- **Billing tab:** set a $1/month spend alert (Billing → Budgets & alerts → Create budget).

### 0.2 Confirm EAS credentials

- `npx eas-cli@latest credentials` — verify Apple credentials and Google service account are still valid.
- `cat eas.json` — confirm the `production` profile is set up.

### 0.3 Confirm `.env`

Spec env vars to add (not yet — note for later):

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=…
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=…
```

### 0.4 Pull latest, branch from `main`

```bash
git checkout main
git pull
git checkout -b feature/scoring-leaderboard
```

### 0.5 Update stale rule

`.claude/rules/architecture.md` says "Expo SDK 53"; update to 55. One-line edit.

**Phase 0 verification:** none — pure pre-flight. Move on.

---

## Phase 1 — Auth foundation

**Goal:** Anonymous Firebase Auth on every launch, `users/{uid}` doc auto-created, `AuthProvider` exposed to the tree. No UI yet.

### 1.1 Install packages

```bash
npx expo install \
  @react-native-google-signin/google-signin \
  expo-apple-authentication \
  expo-crypto \
  expo-application
```

### 1.2 Extend `firebase.ts`

Add Auth init + persistence + `experimentalForceLongPolling`. Replace the current `getFirestore(app)` with `initializeFirestore(app, { experimentalForceLongPolling: true })`. Add `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`. Export `auth` alongside `db`.

### 1.3 Add Google plugin to `app.config.ts`

```ts
plugins: [
  // …existing plugins
  [
    "@react-native-google-signin/google-signin",
    { iosUrlScheme: "com.googleusercontent.apps.<REVERSED_CLIENT_ID>" },
  ],
  "expo-apple-authentication",
],
```

Both env vars consumed at runtime; no plugin config needed for them.

### 1.4 Add `src/utils/uuid.ts`, `src/utils/semver.ts`, `src/utils/weekStart.ts`

Tiny pure functions, fully unit-testable.

### 1.5 Add `src/services/firestore-user.ts`

Functions:
- `ensureUserDoc(uid: string): Promise<void>` — `getDoc` → if missing, `setDoc` with the zeroed schema (including explicit `displayName: null`, `weekStart: mondayTbilisi(now)`, etc.)
- `getUserDoc(uid: string): Promise<UserDoc | null>`
- `updateDisplayName(uid, name)` — single-field update with `updatedAt: serverTimestamp()`

### 1.6 Add `src/context/AuthProvider.tsx`

Implements the state machine from the spec:

- `useState<User | null>` and `useState<number>("authVersion")`.
- `onAuthStateChanged` subscription — bumps `authVersion`.
- On null user: `signInAnonymously()`. On non-null: `ensureUserDoc(user.uid)`.
- Stub `signInWithGoogle`, `signInWithApple`, `signOut`, `updateDisplayName` as `() => Promise.reject(new Error("not implemented in phase 1"))` — they get filled in Phase 4.
- Memoised context value depends on both `user` and `authVersion`.
- Expose `useAuth()` hook in `src/hooks/useAuth.ts`.

### 1.7 Wire into `App.tsx`

Wrap children in `<AuthProvider>` between `<ThemeProvider>` and `<SettingsProvider>`. Order: theme outermost, then auth, then settings.

### 1.8 Phase 1 deploy

- Deploy Firestore rules **for `users` only** (the create rules — update rules can wait until Phase 2 when we actually update). For now: `allow read: if request.auth != null; allow create: if request.auth.uid == uid && totalPoints==0 && ...; allow update,delete: if false;`.
- Deploy.

### 1.9 Phase 1 verification (paused for user check)

- `npx expo start --dev-client` (after `eas build --profile development` if the dev client doesn't have the new native bridges).
- Launch app → check Firestore Console: a new `users/{some-uid}` doc should appear with all-zero stats.
- Kill + relaunch → same UID restored from persistence (no new doc).
- Verify nothing visible changed in the app UI.
- **Pause** — confirm with user before Phase 2.

---

## Phase 2 — Scoring rework

**Goal:** New scoring formula on the GameHeader, new Rules content, atomic transaction writes scores to Firestore (or queues them).

### 2.1 Fix `fetchRandomQuestion.ts`

Line 80–87 — include `difficulty` in the returned `QuizQuestion` object. Make `difficulty` required on `src/types/quizQuestion.ts`.

### 2.2 Update `useGameScreen.tsx`

- Add `score: number` to `GameState`. Initialise to 0.
- In `handleOptionPress`:
  - On correct → `score += pointsFor(currentQuestion.difficulty)` where `pointsFor("easy")=5, "medium"=10, "hard"=20`.
  - On incorrect → `crowns -= 1` (existing).
- On `crowns === 0` (existing branch):
  - Build payload `{ score, correctCount: stats.correctAnswers, totalQuestions: stats.questionsAnswered, selectedDifficulty, scoreByDifficulty }`.
  - Call `saveGameAndUpdateStats(uid, resultId: uuid(), payload)` — covered next.

### 2.3 Add `src/services/firestore-game-result.ts`

`saveGameAndUpdateStats(uid, resultId, payload)`:
- `runTransaction` with body from spec (idempotent guard, defensive profile create, atomic increments, weekly reset logic, bestSingleGameScore).
- On rules-rejection → throw a typed error.
- On offline / auth-race → throw a different typed error.

### 2.4 Add `src/migrations/v2.0.0-clean-legacy-stats.ts` and `src/migrations/index.ts`

`runMigrations()` is called once on app boot from `App.tsx` (after splash mounts). Idempotent via flag.

### 2.5 Add the failed-write queue (`AsyncStorage["pendingResults"]`)

- `enqueuePendingResult(payload)` — appends, caps at 20, evicts oldest if full.
- `replayPendingResults()` — runs through queue, retries each transaction; removes on success or rules-rejection.
- `usePendingResultsReplay` hook — subscribes to `NetInfo`, fires `replayPendingResults` on reconnect + on app foreground.

### 2.6 Update `useGameScreen.tsx` end-of-game flow

- Try `saveGameAndUpdateStats` first.
- On offline / auth-race error: `enqueuePendingResult`.
- On rules error: log analytics event `result_dropped_rules_violation`, swallow.
- Existing `GameSummary` modal flow continues regardless.

### 2.7 Update `GameHeader.tsx`

- Replace `scoreText` line with `${t.common_score}: ${gameState.score}`.
- `correctAnswersCount` and `questionsCount` props drop from the component (still in state, just not displayed).
- Update `styles.ts` for the score line.

### 2.8 Update `Rules.tsx`

Replace single-paragraph body with the bullet list from the spec. Add new translation keys to both locale files.

### 2.9 Deploy Firestore rules update + game_results rules

Add the `users` update rules (monotonicity, ±5 jitter, growth caps) and the `game_results` create rules. Deploy.

### 2.10 Add the leaderboard composite indexes to `firestore.indexes.json` and deploy

(They're required even though we don't query yet, because Phase 3 will fail without them.)

### 2.11 Phase 2 verification

- Play a game on each difficulty; check `users/{uid}` increments correctly in Firestore Console.
- Play offline → verify pendingResults grows.
- Reconnect → verify pendingResults drains.
- Open Rules modal → verify bullet list renders correctly in Georgian and English.
- **Pause** — confirm before Phase 3.

---

## Phase 3 — Leaderboard tab & UI shell

**Goal:** Third tab is now Leaderboard. "Your card" shows zeros until the user has played. Sign-in CTA stub renders for anonymous users (button does nothing yet).

### 3.1 Add `src/services/firestore-leaderboard.ts`

`getLeaderboard(tab: "weekly" | "alltime"): Promise<LeaderboardEntry[]>`:
- Build query per spec.
- Map snapshot to `LeaderboardEntry[]`.

### 3.2 Add `src/hooks/useLeaderboard.ts`

- 30-min AsyncStorage cache, per-tab keys.
- Refetch on focus (cold cache + cache>30min), pull-to-refresh, game-end (invalidate both tab caches).
- Returns `{ entries, isLoading, isRefreshing, error, refresh }`.

### 3.3 Add `src/hooks/useUserStats.ts`

- 5-min AsyncStorage cache for `users/{uid}`.
- Powers "Your card" so re-opening the tab is instant.

### 3.4 Add `src/screens/main-screens/leaderboard-screen/`

Files: `LeaderboardScreen.tsx`, `YourCard.tsx`, `LeaderboardTabs.tsx`, `LeaderboardPodium.tsx`, `LeaderboardRow.tsx`, `styles.ts`. UI per spec Section 4.3.

`LeaderboardScreen.tsx` is the root: vertical scroll, `YourCard` at top, `LeaderboardTabs`, then conditional `LeaderboardPodium` + `FlatList<LeaderboardRow>` + empty/loading/error states.

### 3.5 Update `TabNavigation.tsx`

Replace `Stats` tab with `Leaderboard` tab. New icon (parchment-themed trophy/crown — pick one consistent with existing icons). Translation key swap.

### 3.6 Add `src/components/sign-in/SignInModal.tsx` (stub)

Render the modal layout with non-functional Google/Apple buttons (they show a "Coming in next phase" toast for now). Skip button works.

### 3.7 Add the locked CTA card variant of `YourCard` for anonymous users

Renders the SignInModal trigger.

### 3.8 Phase 3 verification

- Tab swap: third tab now reads "Leaderboard" / "ლიდერბორდი".
- Anonymous user opens tab → "Your card" is the locked CTA, tabs + podium + list still render below (might be empty for week tab, has only the test player on all-time).
- Pull-to-refresh works. Cache works (re-open tab within 30min → no Firestore call in console).
- **Pause** — confirm before Phase 4.

---

## Pivot 2026-04-30 — separate Stats + Leaderboard tabs

The original Phase 3 ("Leaderboard inside Stats tab") has been reversed. New structure: 4 bottom tabs — Home, Topics, **Leaderboard** (3rd), **Stats** (4th). See spec section "Tab structure pivot (2026-04-30) — supersedes Q9" for full details.

The Phase 3 work in flight (auth-conditional Leaderboard, recent-games via local AsyncStorage, inline sign-in buttons, fixed title, etc.) is partially salvageable but needs the new shape:

- **Restore** `src/screens/main-screens/stats-screen/StatsScreen.tsx` as the 4th tab; rewire data from local `gameHistory` → `useUserStats` for the 4 cards, `useRecentGames` (AsyncStorage) for the list. Keep the old visual design exactly.
- **Slim** `LeaderboardScreen` — drop the recent-games section (moved to Stats); cleanly split into anonymous-state (sign-in buttons only) and signed-in-state (rank caption + Weekly/All-Time tabs + top-20 list).
- **Re-add** `ScreenName.STATS_SCREEN` and the `stats-screen` route in `TabParamList`.
- **TabNavigation** registers both screens; tab order Home → Topics → Leaderboard → Stats.
- **GameSummary** post-game navigation reverts to `STATS_SCREEN`.

All Phase 1+2 work (anonymous auth, scoring rework, Firestore writes, rules) and the hooks/services built on 2026-04-29 (`useUserStats`, `useLeaderboard`, `useRecentGames`, `addLocalRecentGame`, etc.) survive unchanged. The pivot is purely shell-level (tabs + screen composition), not infrastructure.

---

## Design-debt note — Leaderboard UI

**Status:** ⚠️ Functional but visually unsatisfactory.

Two redesign passes were run during Phase 3 (functional first-pass, then a parchment-imagery polish pass). Both were rejected by the user. The screen wiring works — auth, tab swap, Firestore reads, sign-in stub modal all function — but the visual fidelity needs a real designer review before this ships to users. Tracked in spec under "Design debt — Leaderboard UI is unfinished (2026-04-29)". Do not iterate further from this conversation; revisit once OAuth + force-update land, with proper designer input (Figma mockups or live designer-driven iteration).

---

## Phase 4 — OAuth + ConfirmNameModal

**Goal:** Google and Apple sign-in actually work. After sign-in, name confirmation modal appears. User then shows up on the leaderboard.

### 4.1 Configure Google Sign-In SDK

In `AuthProvider`'s `useEffect`, call `GoogleSignin.configure({ webClientId, iosClientId })` from env vars.

### 4.2 Implement `signInWithGoogle()`

- `await GoogleSignin.hasPlayServices()`
- `const { idToken } = await GoogleSignin.signIn()`
- `const cred = GoogleAuthProvider.credential(idToken)`
- `await currentUser.linkWithCredential(cred)` → on `auth/credential-already-in-use` → `signInWithCredential(auth, cred)`.
- After success: bump `authVersion`, fetch the user's Firestore doc, write `displayName + photoURL + isAnonymous: false`.

### 4.3 Implement `signInWithApple()`

- Generate nonce: `const rawNonce = bytesToHex(await Crypto.getRandomBytesAsync(16))`.
- `const hashedNonce = await Crypto.digestStringAsync(SHA256, rawNonce)`.
- `await AppleAuthentication.signInAsync({ requestedScopes: [FULL_NAME, EMAIL], nonce: hashedNonce })`.
- Build provider: `new OAuthProvider("apple.com")` → `provider.credential({ idToken: result.identityToken, rawNonce })`.
- `linkWithCredential` / fallback identical to Google flow.
- **Capture `result.fullName` synchronously**. If non-null, format as `"${firstName} ${lastName}".trim()` and write to `users/{uid}.displayName` in the same flow. If null (subsequent sign-in), don't overwrite a name the user might have edited.

### 4.4 Add `src/components/sign-in/ConfirmNameModal.tsx`

Renders after first OAuth success. Pre-fills with the OAuth-supplied name. Validates 2–24 chars. Save → `updateDisplayName`.

### 4.5 Wire `SignInModal` to actually call the auth methods

Replace the toast stubs from 3.6 with real calls. On success → close `SignInModal`, open `ConfirmNameModal`. On failure → toast.

### 4.6 Apple-on-Android gating

In `SignInModal`, gate the Apple button on `Platform.OS === "ios" && (await AppleAuthentication.isAvailableAsync())`.

### 4.7 Phase 4 verification

- Anonymous user → tap "Sign in with Google" on Leaderboard → Google flow → ConfirmNameModal → save → user now appears in `users/{uid}` with `displayName != null`.
- Reopen Leaderboard → all-time tab now shows the user.
- Sign out (manually delete the auth state for now — Settings UI ships in Phase 5) → relaunch → fresh anonymous UID.
- Reinstall app → Google sign-in with same account → original UID restored.
- iOS only: same with Apple. Verify `fullName` captured on first sign-in.
- **Pause** — confirm before Phase 5.

---

## Phase 5 — Force-update gate, milestone, Settings

**Goal:** Boot-time version check. Milestone modal triggers on first personal best. Settings → Account section finalised.

### 5.1 Add `src/services/appConfig.ts`

`getAppConfig()` — fetch `app_config/version` with 6h AsyncStorage cache.

### 5.2 Add `src/hooks/useForceUpdateGate.ts`

Boot-time gate. Returns `{ isBlocked, latestVersion }`.

### 5.3 Add `src/components/sign-in/ForceUpdateModal.tsx`

Non-dismissible. Deep-link to App Store / Play Store via `Linking.openURL`. Confirm the deep-link IDs in Phase 0 are correct.

### 5.4 Wire force-update into `App.tsx`

After splash mounts, check `useForceUpdateGate`. If blocked, render `<ForceUpdateModal>` over everything. Otherwise proceed.

### 5.5 Seed `app_config/version` doc in Firestore Console

`{ minSupportedVersion: "2.0.0", latestVersion: "2.0.0" }`.

### 5.6 Add `src/components/sign-in/MilestoneNudgeModal.tsx`

Triggered from `useGameScreen` end-of-game flow when `score > previousBest && isAnonymous && !hasSeenSignInNudge`. Replaces `GameSummary` for that one game. After dismissal: `users/{uid}.hasSeenSignInNudge = true`, then open `GameSummary`.

### 5.7 Add `src/components/app-settings/AccountSection.tsx`

- Anonymous: "Sign in" button → opens `SignInModal`.
- Signed in: display name (with edit pencil → opens `ConfirmNameModal`), provider chip, sign-out link.
- Sign-out confirmation modal → `auth.signOut()` → `signInAnonymously()` → fresh UID.

### 5.8 Mount `AccountSection` in `AppSettings.tsx`

Between current toggles and the Facebook/store links.

### 5.9 Phase 5 verification

- Bump `minSupportedVersion` to "3.0.0" in Firestore Console → relaunch app → ForceUpdateModal appears, deep-link works. Reset.
- Anonymous player → play 1 game → score 50 → milestone modal triggers → dismiss → `hasSeenSignInNudge: true`.
- Replay another game with a higher score → milestone does NOT re-trigger (we said one-time).
- Open Settings → verify Account section. Edit name → renames on leaderboard. Sign out → fresh anonymous, leaderboard entry vanishes.
- **Pause** — confirm before Phase 6.

---

## Phase 6 — Migration cleanup, edge cases

**Goal:** Verify migration runs once, AsyncStorage hygiene, edge cases covered.

### 6.1 Delete `src/screens/main-screens/stats-screen/`, `src/helpers/gameHistory.ts`

After migration runs, these are dead code. Verify nothing imports them with `grep`.

### 6.2 Verify the legacy-stats migration is idempotent

- Manually re-set `migrations:v2.0.0:cleanLegacyStats` flag = unset. Relaunch. Verify keys get wiped again. Reset flag.

### 6.3 Verify offline queue eviction

- Manually push 21 entries into `pendingResults`. Verify oldest gets evicted on the 21st enqueue. Analytics event logged.

### 6.4 Verify time-source self-quarantine

- Set device clock 2 weeks in the future. Play a game. Verify the user's weekStart is in the future and they appear nowhere on this week's leaderboard.

### 6.5 Phase 6 verification

- Walk through every row in the spec's "Production data inventory & impact" table. Confirm each on a real device.

---

## Phase 7 — Test pass

**Goal:** All unit tests, rules tests, and manual e2e tests from spec Section 6.3 pass.

### 7.1 Set up Firebase emulator suite

```bash
npm install --save-dev firebase-tools @firebase/rules-unit-testing
```

`firebase.json` `emulators` block.

### 7.2 Write unit tests per spec Section 6.3

Tests:
- `compareSemver` — boundary tests
- `mondayTbilisi` — DST no-op, Sunday→Monday, end-of-month rollover
- `saveGameAndUpdateStats` — happy path, idempotent re-run, week-boundary cross, rules rejection
- `usePendingResultsReplay` — order, drop on rules violation
- `useLeaderboard` — cache states
- `runMigrations` — idempotency
- `Rules.tsx` — snapshot

### 7.3 Write Firestore rules tests

Per spec Section 6.3 list.

### 7.4 Manual e2e checklist

Run the full list from spec Section 6.3 on at least one iOS and one Android device.

### 7.5 Performance smoke test

- Open Leaderboard tab cold → measure fetch time (should be <1s on a typical connection).
- Open Settings → confirm no stutter.
- Game-end → confirm transaction completes in <500ms typical.

---

## Phase 8 — Release

### 8.1 Sanity pass

- `npm run lint` clean.
- `npm test` clean.
- Manual smoke pass on dev client.

### 8.2 Bump version in `app.config.ts`

`version` = `"2.0.0"` (already set per CLAUDE.md). Confirm `runtimeVersion` = `"2.0.0"`.

### 8.3 Build & submit

```bash
npx eas-cli@latest build --platform all --profile production
# After build success:
npx eas-cli@latest submit --platform all --profile production
```

### 8.4 Post-release

- Monitor Firestore Console for `users` doc creation rate (anonymous + signed-in).
- Monitor Firebase Billing for first 48h to confirm we stay within free quotas.
- Watch crash dashboards (existing logging via `src/utils/logger.ts`).
- Once stable: delete the legacy section "Release status (as of 2026-04-28)" from `CLAUDE.md` per its self-deletion note.

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Apple Sign-In review delay | Medium | Start TestFlight upload early in Phase 7 to surface review feedback before final submission |
| Firestore rules block legitimate writes during edge cases | Low-Medium | ±5 jitter tolerance + emulator tests + Phase 6.3 verification |
| OAuth bridge breaks on a specific Android version | Medium | Test on at least Android 13 + 14; fallback path is "stay anonymous" — never crashes |
| Free-tier quota exceeded faster than expected | Low | $1 budget alert (Phase 0); ready to ship snapshot Cloud Function as v1.1 hot-fix |
| Existing users miss the wipe and see stale local data | Low | Migration is idempotent + flag-gated |

---

## Open follow-ups (deferred)

Same as the spec's "Open follow-ups" section.
