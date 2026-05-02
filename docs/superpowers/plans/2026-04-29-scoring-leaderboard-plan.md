# Scoring Rework + Online Leaderboard — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-04-29-scoring-leaderboard-design.md`
**Date:** 2026-04-29 (amended 2026-04-30)
**Target release:** 2.0.0 native build

---

## ⏯ Current state — start here when resuming

**Branch:** `Add-question-variations`
**Last commit:** `c30f2d4` — "Phase 5 (Android): Account section + MilestoneNudgeModal + force-update gate" (pushed)
**Working tree:** clean (besides this plan-doc update). Phase 5 code-complete and verified end-to-end on Android (2026-05-01); iOS verification (Phase 5D + Apple Sign In) blocked on a dev-client install error and a deferred polish pass.

### What is committed and working

- **Phase 1** (commit `aaaae49`): anonymous Firebase Auth, `users/{uid}` doc auto-create, persistence, `AuthProvider`, `useAuth`. Anonymous provider enabled in Firebase Console 2026-04-30.
- **Phase 2** (commit `aaaae49`): difficulty-weighted scoring (+5/+10/+20), atomic Firestore transaction with idempotent guard + lazy weekly reset, `pendingResults` queue + replay on auth/network resolve, legacy-stats one-time AsyncStorage wipe migration, `GameHeader` shows `Score: N`, Rules screen carries the scoring breakdown.
- **Phase 3 baseline** (commit `d7a6e4c`): the third tab was renamed `Leaderboard`; `users` collection wiring, `useLeaderboard` + `useUserStats` hooks, `firestore-leaderboard` service, parchment-imagery components — design rejected, debt logged.
- **Phase 3 pivot** (commit `9924a2b`): 4-tab structure landed (Home → Topics → Leaderboard → Stats); `StatsScreen.tsx` restored with `useUserStats` + `useRecentGames` data sources; `LeaderboardScreen.tsx` slimmed (anonymous → inline Google + Apple buttons; signed-in → tabs + top-20 list); `RecentGamesList.tsx` deleted; `getRecentGames` Firestore helper deleted; `tab_stats` + `leaderboard_your_rank` translation keys added.
- **Firestore rules** for `users` / `game_results` / `app_config` deployed to production (existing `tickets` / `push_tokens` / `notifications` rules preserved verbatim).
- **Composite indexes** for both leaderboard queries deployed.

### Phase 4 progress (2026-04-30)

- ✅ **Step 1 — Firebase Console** (committed in 3a7025d): Anonymous + Google + Apple providers enabled in `history-of-georgia-43551`. Apple provider configured with Service ID + Team ID + Key ID + private key. Android app registered with EAS dev keystore SHA-1 `70:CF:C5:76:7C:E9:64:82:DC:5D:5F:88:B7:6C:B2:37:8F:75:B4:A4`.
- ✅ **Step 2 — Google client IDs captured:**
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` = `394970199474-kpvjiq9ts0ldm2sbdvh57nn0i2m668hu.apps.googleusercontent.com`
  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` = `394970199474-rsfg2j50nef71sjirltumcb9j7tvtmej.apps.googleusercontent.com`
  - Reversed iOS client ID (in `app.config.ts` Google plugin `iosUrlScheme`) = `com.googleusercontent.apps.394970199474-rsfg2j50nef71sjirltumcb9j7tvtmej`
- ✅ **Step 3 — Apple Developer artifacts created:**
  - App ID `com.papunafshaveli.historyofgeorgia` has "Sign In with Apple" capability enabled
  - Services ID `com.papunafshaveli.historyofgeorgia.signin` registered with Firebase domain `history-of-georgia-43551.firebaseapp.com` + return URL `https://history-of-georgia-43551.firebaseapp.com/__/auth/handler`
  - Apple Team ID: `M39YBKH9L5`
  - Apple Key ID: `3C2L469ZH5`
  - Private Key file: `~/Desktop/hofge-2024/auth/AuthKey_3C2L469ZH5.p8` (one-time download; do not lose)
- ✅ **Step 4 — env vars + plugin config wired** (committed in 3a7025d): `.env` updated with both Google client IDs; `app.config.ts` Google plugin switched to array form with `iosUrlScheme`; `eas.json` gets a `development-simulator` profile.
- ✅ **Step 5 — `signInWithGoogle` implemented in `AuthProvider.tsx`** (committed in 3a7025d, refined in 8cd145e): `GoogleSignin.configure` in useEffect; `hasPlayServices` → `signIn` → `GoogleAuthProvider.credential` → `linkWithCredential` (anon → Google) with `signInWithCredential` fallback on `auth/credential-already-in-use`; `bumpAuthVersion` after success; `updateProviderProfile(uid, { displayName, photoURL })` syncs to `users/{uid}`. Now returns `{ wasFirstLink, displayName }`.
- ✅ **Step 6 — `signInWithApple` implemented** (committed in 3a7025d, refined in 8cd145e): `expo-crypto` raw-nonce + SHA256 hash; `AppleAuthentication.signInAsync({ requestedScopes: [FULL_NAME, EMAIL], nonce: hashedNonce })`; `OAuthProvider("apple.com").credential({ idToken, rawNonce })`; same `linkWithCredential` flow as Google. `fullName` captured synchronously on first sign-in (Apple never returns it again). Now returns `{ wasFirstLink, displayName }`.
- ✅ **Step 7 — `ConfirmNameModal`** (committed in 8cd145e): non-dismissible parchment-scroll modal with pre-filled `TextInput`, 2–24 char validation, Save calls `updateDisplayName`. Mounts in `LeaderboardScreen`; opens only when sign-in returned `wasFirstLink: true` (returning users via `signInWithCredential` fallback skip it).
- ✅ **Step 8 — dev-client verification (build artifact)**: Android dev client built via `eas build --profile development --platform android` and installed on the Android emulator (2026-04-30 ~23:30). Lockfile regeneration (commit `6476527`) was the unblocker — EAS's `npm ci` was failing with "Missing @react-native-async-storage/async-storage@2.1.0 from lock file" because the previous lockfile didn't enumerate the nested 1.24.0 copies that npm pulls in to satisfy `@firebase/auth`'s `^1.18.1` peer.
- ✅ **Step 8 — end-to-end sign-in verification (Android, 2026-05-01)**: walked through every required path. Three issues surfaced and were fixed (commit `a2727a7`):
  1. Emulator network was missing DNS (`net.dns1` / `net.dns2` empty). Fixed by relaunching the AVD with `-dns-server 8.8.8.8,1.1.1.1` flag — `adb reboot` and Wi-Fi toggles didn't help; only the relaunch with explicit DNS did.
  2. EAS dev keystore SHA-1 (`78:CF:C5:76:7C:E9:64:82:DC:5D:58:B0:B7:8C:B2:37:BF:75:BA:A4`) was different from the "default" keystore SHA-1 we registered yesterday. Both now registered in Firebase Android app config.
  3. Firestore rule `match /game_results/{id} { allow read: ... }` couldn't evaluate against non-existent docs because `resource.data.userId` is null when the doc doesn't exist. Updated to `(resource == null || request.auth.uid == resource.data.userId)` so transactions can do their idempotency `transaction.get(resultRef)` check. Rule deployed via Firebase Console.

  Verification matrix (Android only):
  - ✅ Anonymous sign-in on first launch
  - ✅ Tapping Google → OAuth flow → `linkWithCredential` succeeds → `wasFirstLink: true`
  - ✅ ConfirmNameModal opens, pre-fills with Google name, saves displayName to `users/{uid}`
  - ✅ User appears on All-Time + Weekly leaderboard with rank caption
  - ✅ Stats screen reads live `users/{uid}` data after game-end transaction succeeds
  - ✅ GameSummary best-score displays from Firestore (`bestSingleGameScore`), not legacy AsyncStorage
  - ✅ GameSummary big-circle headline shows points (after `score`-prop fix), not the legacy `correctAnswers` count
  - ✅ Sign-out via `adb shell pm clear` + sign back in with same Google account → `signInWithCredential` fallback runs → `wasFirstLink: false` → ConfirmNameModal does NOT re-open. Original UID restored with all stats intact.
  - 🟡 Apple Sign In on iOS dev client → DEFERRED. Bundled with Phase 5 verification on the iOS build to save an EAS credit.

  Side observation: every `pm clear` (or fresh anonymous sign-in followed by Google upgrade where the Google account is already linked elsewhere) creates an orphaned anonymous `users/{uid}` doc. Acceptable for v1; pruning is a v1.1 cleanup script (see "Deferred follow-ups" below).

### Phase 5 progress (2026-05-01 → 2026-05-02, all committed in `c30f2d4`)

- ✅ **Step 5A — Settings → Account section** (verified Android 2026-05-01): new `AccountSection.tsx` mounted in `AppSettings.tsx` between toggles and theme. Anonymous → 2 compact rows (Sign in with Google / Apple iOS-only) styled like SettingToggle. Signed-in → single Sign out row (`logout` icon + warm-red `colors.incorrectBorder`) → tap opens confirmation Modal with Cancel + Sign out buttons. Confirm calls `auth.signOut()` → AuthProvider drops to fresh anonymous via the existing onAuthStateChanged listener. **Display-name editing UX deferred** (initial implementation made the Settings modal too tall — theme switcher cropped; user preferred sign-out-only). Future name-edit flow can attach to a profile screen or long-press on the leaderboard. Translation keys: `settings_signout_button`, `settings_signout_confirm_title`, `settings_signout_confirm_body`, `settings_signout_confirm_cancel`.

- ✅ **Step 5B — `MilestoneNudgeModal`** (verified Android 2026-05-01): new `src/components/sign-in/MilestoneNudgeModal.tsx`. Triggered from `useGameScreen` end-of-game flow when `score > previousBest && isAnonymous && !hasSeenSignInNudge`. Modal replaces GameSummary for that one game; on dismiss (sign-in OR skip) it writes `users/{uid}.hasSeenSignInNudge = true` and opens GameSummary. **Snapshot-before-transaction** pattern: useGameScreen reads cached `users/{uid}` via `useUserStats` *before* `saveGameAndUpdateStats` bumps `bestSingleGameScore`, otherwise the comparison would always be false (new best vs new best). New `modals.milestone: boolean` field on GameState; INITIAL_STATE initialises to false; GameModals renders `<MilestoneNudgeModal>` when true. **ConfirmNameModal does NOT cascade from the milestone path** — the user keeps whatever provider name Google/Apple supplied. Translation keys: `milestone_title`, `milestone_body` (with `{score}` placeholder), `milestone_subbody`, `milestone_skip_button`.

- ✅ **Step 5C — Force-update gate** (verified Android 2026-05-02 by bumping `minSupportedVersion` to "3.0.0" and back): three new files plus an App.tsx wire-in.
  - `src/services/appConfig.ts` — `getAppConfig()` reads `app_config/version` from Firestore with a 6-hour AsyncStorage cache (`appConfig:cache:v1`). Returns null on missing doc / network failure → callers treat null as **grace mode** (don't block; retry on next launch).
  - `src/hooks/useForceUpdateGate.ts` — runs once on mount, compares `Application.nativeApplicationVersion` against `config.minSupportedVersion` via `compareSemver`. Returns `{ isBlocked, latestVersion }`.
  - `src/components/sign-in/ForceUpdateModal.tsx` — non-dismissible parchment Modal (no `onClose` prop → no X button) with body text + a single "Update now" button that opens the App Store (iOS) or Play Store (Android) deep link via `Linking.openURL`.
  - `App.tsx` — new `ForceUpdateGate` component placed alongside `AppModals` inside the SafeAreaProvider. Renders nothing when not blocked; renders `<ForceUpdateModal>` when blocked.
  - Translation keys: `force_update_title`, `force_update_body`, `force_update_button`.
  - **Firestore Console action done:** `app_config/version` doc seeded with `{ minSupportedVersion: "2.0.0", latestVersion: "2.0.0" }`. The two fields are strings.

- 🟡 **Step 5D — iOS dev-client build + Apple Sign In + Phase 5 UI verification on iPhone 11 Pro:** **BLOCKED**. Build succeeded on EAS. Install on iPhone fails with `"Unable to Install. This app cannot be installed because its integrity could not be verified."` even after enabling iOS Developer Mode. Working theory: yesterday's "Sign In with Apple" capability addition invalidated all `com.papunafshaveli.historyofgeorgia` provisioning profiles; EAS regenerated on this build but the profile may not have included the iPhone 11 Pro UDID (user uncertain whether MacBook Pro was selected at the device prompt again). Mitigations to try, in order:
  1. Verify Developer Mode is on; verify EAS build's "Provisioned devices" list includes iPhone 11 Pro (not just MacBook).
  2. AirDrop the IPA from Mac → iPhone (bypasses Safari install path).
  3. Rebuild for **simulator** (`eas build --profile development-simulator --platform ios`) — this verifies Phase 5 UI on iOS but Apple Sign In may not work cleanly on simulator and that's acceptable for v1 staging.
  4. Worst case: defer all iOS Apple-Sign-In verification until a future build cycle; ship the v2.0.0 store binary against TestFlight where install signing is handled by App Store Connect.

- ✅ **Phase 5 polish pass — DONE (2026-05-03).** All 8 implementation tasks landed across 12 commits on `Add-question-variations`. Spec: [`docs/superpowers/specs/2026-05-02-phase-5-polish-pass-design.md`](../specs/2026-05-02-phase-5-polish-pass-design.md). Plan: [`docs/superpowers/plans/2026-05-02-phase-5-polish-pass-plan.md`](2026-05-02-phase-5-polish-pass-plan.md).

  **Polish-pass commits (chronological):**
  - `3a67a59` — Ignore .superpowers/ brainstorm-tooling output
  - `e186d1c` — Design spec
  - `ef09df4` — Implementation plan
  - `76465ca` — Task 1: Remove MilestoneNudgeModal entirely
  - `f865f6e` — Task 2: GameSummary tier copy by score (via ScoreThreshold enum refresh)
  - `bf69e18` — Task 3: Auth loading state isSigningIn (in-button spinner pattern)
  - `54a2c0e` — Track Firestore composite indexes in repo (firestore.indexes.json)
  - `a719474` — Task 4: Sign-in lives only on the Leaderboard tab — Lean anon + Settings cleanup
  - `8448620` — Task 5: Olympic podium for top-3 leaderboard ranks
  - `1a78b3b` — Task 6: Stats reads from local AsyncStorage; sign-out no longer wipes view
  - `e319070` — Task 7: Parchment Modal redesign — content fit, Rules visual upgrade, sign-out modal in Endgame style
  - `e715ad5` — Task 8: Force-update soft / hard split + Endgame-style update modals

  Branch is **12 commits ahead** of origin/Add-question-variations. Not pushed yet.

  **Remaining before 2.0.0 store submission:** see "Deferred follow-ups" below — items #3 (Apple email-collision merge handler) and #4 (Apple in-app account deletion, HARD ship blocker per Guideline 5.1.1(v)) are both required before submitting to the App Store. App-wide font replacement (#2) and orphaned anonymous user cleanup (#5) are nice-to-have but not blockers.

  **Issue summary** (full detail in the spec):
  - 🎨 Design-grade: Lean Leaderboard anon (#0), Settings auth simplification (#1), Leaderboard signed-in podium (#2), Stats local-storage rewire (#3), Parchment Modal redesign (#8 + #11 + #12), Force-update soft/hard split (#10)
  - 🪛 Simple polish: remove MilestoneNudgeModal (#6), GameSummary tier copy by score (#7)
  - 🐛 Tech bug: Auth loading state `isSigningIn` (#9)
  - ⏭ Deferred: app-wide font replacement (#5 — see deferred follow-ups item 2)
  - Dropped: kind migration of legacy stats (#4 — full-wipe kept)

Logged in spec section "Design debt — Leaderboard UI is unfinished (2026-04-29)". Stats screen reuses the original `StatsScreen.tsx` design which the user explicitly liked, so that's not in design debt. Leaderboard tab visuals still need a designer pass after Phase 4+5 land.

### Deferred follow-ups (must not be lost)

These items are intentionally deferred but **must** ship before 2.0.0 goes to production:

1. **iOS dev-client install + Apple Sign In verification + Phase 5 UI on iOS.** Build attempted 2026-05-02 — succeeded on EAS but **install on iPhone 11 Pro fails with "integrity could not be verified"** even after enabling iOS Developer Mode. Likely cause: provisioning profile from this build doesn't include the iPhone 11 Pro UDID (provisioning was invalidated by the 2026-04-30 Sign In with Apple capability change; EAS regenerated but possibly with the wrong device). Path forward when user has time:
   - Verify on the EAS build page that "Provisioned devices" lists iPhone 11 Pro, not just MacBook Pro.
   - If yes → try AirDropping the IPA from Mac → iPhone (skips the Safari install flow).
   - If no, or AirDrop also fails → rebuild with iPhone 11 Pro explicitly selected at the device prompt (1 EAS credit), OR fall back to `eas build --profile development-simulator --platform ios` to at least verify Phase 5 UI on iOS (Apple Sign In would stay unverified on simulator).
   - Verification surface once installed:
     - Anonymous → Apple sign-in upgrade via `linkWithCredential`
     - Apple's `result.fullName` arrives synchronously on the **first** sign-in for that Apple ID + bundle ID; verify it lands in `users/{uid}.displayName` (Apple never returns it again on subsequent sign-ins, and we depend on capturing it once).
     - ConfirmNameModal opens, pre-filled with the Apple-formatted name.
     - Sign out → sign back in with same Apple ID → no modal (returning user).
     - Phase 5A Account section (sign-out flow) renders correctly.
     - Phase 5B MilestoneNudgeModal triggers as expected.
     - Phase 5C ForceUpdateModal renders if `minSupportedVersion` is bumped above the installed binary version.

2. **App-wide font replacement.** User flagged 2026-05-02: wants to swap all four font families currently in use (`sans: helvetica-main`, `serif: nino-elite`, `script: aisi-bold`, `display: dm-medea`) for new typefaces. Constraints: must keep Georgian + Latin script coverage; must preserve legibility on parchment in both light and dark themes; should match the historical-chronicle feel. Out of scope for the Phase 5 polish pass — capture only; schedule as its own design effort once typeface candidates are chosen. Touches `src/assets/fonts/` and the font registration block; visual impact is global so plan a full screen review after the swap.

3. **Apple `auth/email-already-in-use` merge handler.** Cross-provider email collision discovered 2026-05-02: signing in with Apple on iOS when the same email is already linked to a Google account on Android throws `auth/email-already-in-use` because Firebase's "One account per email" default blocks the link. Current code in `AuthProvider.signInWithApple` only handles `auth/credential-already-in-use`, not the email collision. **Path forward:** when `auth/email-already-in-use` fires, call `fetchSignInMethodsForEmail(auth, email)` to find which provider owns the existing UID, surface a modal asking the user to sign in with that provider first, then `linkWithCredential` the new (Apple) credential onto the now-signed-in account. Tested workaround during 2026-05-02 iOS verification: choose Apple "Hide My Email" on the OAuth sheet, which generates a relay email and bypasses the collision. Must ship before 2.0.0 store submission since most real users have matching Apple/Google emails.

4. **In-app account deletion (Apple Guideline 5.1.1(v) — HARD ship blocker).** Apple has required in-app account deletion since 2022-06-30 for any app that supports account creation, and explicitly extends the rule to automatically-generated guest accounts. Without this, the 2.0.0 App Store submission gets rejected on review. References: [Apple support article](https://developer.apple.com/support/offering-account-deletion-in-your-app/), [News announcement](https://developer.apple.com/news/?id=12m75xbj). Scope:
   - **New UI:** Settings → Account → "Delete account" row (signed-in only, below sign-out, more aggressive destructive treatment). Confirmation modal explains: stats, leaderboard rank, and all account data will be permanently removed.
   - **Client flow:** delete `users/{uid}` Firestore doc, delete all `game_results/{uid}_*` docs (cascade), call `auth.currentUser.delete()`. Existing `onAuthStateChanged` in AuthProvider then signs in fresh anonymous.
   - **Cloud Function (lives in `functions/`, already deployed for push notifications):** `functions.auth.user().onDelete()` trigger that batched-deletes any remaining Firestore docs (idempotent backstop) AND, when the user signed in with Apple, calls Apple's [revoke-tokens REST API](https://developer.apple.com/documentation/sign_in_with_apple/revoke_tokens/) with a JWT signed by the `.p8` key (`AuthKey_3C2L469ZH5.p8`, already in the project per the Phase 4 plan).
   - **Testing:** verify on iOS dev-client + verify Apple token actually revoked via Apple Developer portal (`appleid.apple.com → Sign in with Apple → Apps Using Apple ID` should no longer list this app for the test Apple ID).
   - **Specific Apple gotchas to avoid:** offering only deactivation (rejected); requiring email support contact (rejected); linking out to a web page (rejected); making deletion "unnecessarily difficult" with excessive confirmation hoops (rejected); not revoking Sign in with Apple tokens server-side (rejected).
   - **Effort:** ~2 days (1 client + 1 server + half-day testing).

5. **Inactive-user cleanup — 180-day rule (broader version of original orphaned-anon cleanup).**

   **Why this exists:** keep Firestore document count and Firebase Auth MAU bounded so the project stays inside the free tier on Firebase. See [`INFRASTRUCTURE.md` §17.3](../../../INFRASTRUCTURE.md) for the policy summary.

   **Two thresholds:**

   - **Anonymous + zero games:** delete after **14 days** (preserves freshly-launched-app users who haven't played yet; covers the orphaned-anon case from `auth/credential-already-in-use` retries).
   - **Everyone else (signed-in OR anon with games played):** delete after **180 days** of inactivity — both Firebase Auth `lastSignInTime` AND `users/{uid}.updatedAt` older than 180 days.

   **Cascade per deleted user:**
   - Delete `users/{uid}` Firestore doc.
   - Delete every `game_results/{uid}_*` Firestore doc.
   - Delete the Firebase Auth user record (so MAU drops too — Firestore-only delete is not enough).
   - If the user signed in with Apple, call Apple's [revoke-tokens REST API](https://developer.apple.com/documentation/sign_in_with_apple/revoke_tokens/) with a JWT signed by `AuthKey_3C2L469ZH5.p8` (same plumbing as deferred follow-up #4 — write the helper once, share it). This removes the app from the user's `appleid.apple.com → Apps Using Apple ID` list.

   **Implementation sketch (lives in `functions/src/` alongside `sendPushNotification`):**

   ```ts
   import { onSchedule } from "firebase-functions/v2/scheduler";
   import * as admin from "firebase-admin";

   const db = admin.firestore();

   const DAY = 24 * 60 * 60 * 1000;
   const ANON_NO_GAMES_TTL_MS = 14 * DAY;
   const INACTIVE_TTL_MS = 180 * DAY;

   export const pruneInactiveUsers = onSchedule("every 168 hours", async () => {
     const now = Date.now();
     const anonCutoff = admin.firestore.Timestamp.fromMillis(now - ANON_NO_GAMES_TTL_MS);
     const inactiveCutoff = admin.firestore.Timestamp.fromMillis(now - INACTIVE_TTL_MS);

     // 1. Orphaned anon (no displayName, no games, > 14 days old).
     const orphanSnap = await db.collection("users")
       .where("displayName", "==", null)
       .where("gamesPlayed", "==", 0)
       .where("createdAt", "<", anonCutoff)
       .limit(500)
       .get();

     // 2. Inactive everyone else (updatedAt older than 180 days).
     const inactiveSnap = await db.collection("users")
       .where("updatedAt", "<", inactiveCutoff)
       .limit(500)
       .get();

     for (const doc of [...orphanSnap.docs, ...inactiveSnap.docs]) {
       await deleteUserCascade(doc.id, doc.data());
     }
   });

   async function deleteUserCascade(uid: string, userData: FirebaseFirestore.DocumentData) {
     // Cross-check Auth lastSignInTime for the 180-day case
     // (don't delete a real user who didn't trigger updatedAt for some reason).
     const authUser = await admin.auth().getUser(uid).catch(() => null);
     if (authUser?.metadata.lastSignInTime) {
       const lastSignIn = new Date(authUser.metadata.lastSignInTime).getTime();
       if (Date.now() - lastSignIn < INACTIVE_TTL_MS && userData.gamesPlayed > 0) return;
     }

     // Delete game_results in batches (collection group filter on userId field
     // would be O(games), so prefer the doc-id prefix scan if results are small).
     const results = await db.collection("game_results")
       .where("userId", "==", uid)
       .limit(500)
       .get();
     const batch = db.batch();
     results.docs.forEach((d) => batch.delete(d.ref));
     batch.delete(db.collection("users").doc(uid));
     await batch.commit();

     // Apple token revoke if applicable.
     if (authUser?.providerData.some((p) => p.providerId === "apple.com")) {
       await revokeAppleTokens(uid).catch((e) => console.warn("apple revoke failed", uid, e));
     }

     // Finally delete the Auth user.
     if (authUser) await admin.auth().deleteUser(uid);
   }
   ```

   Helper `revokeAppleTokens(uid)` is the same one used by the in-app account-deletion `onDelete` trigger (deferred follow-up #4) — implement it once, call from both places.

   **Required Firestore index:** add a single-field descending index on `users.updatedAt` (or rely on default automatic indexing — single-field queries work without a composite index). Re-deploy `firestore.indexes.json` if needed.

   **Testing plan:**
   - Seed fixtures: one anon with no games (15 days old), one anon with games (200 days old), one Google user (200 days old), one Google user (5 days old).
   - Run the function locally via `firebase emulators:start --only functions,firestore` and a manual trigger.
   - Verify only the first three are deleted; the fresh Google user is untouched.
   - Verify `auth.getUser(uid)` throws `auth/user-not-found` for the deleted ones.

   **Effort:** ~1.5 days (function + Apple revoke helper if not already extracted from #4 + emulator tests + deploy + production smoke).

   **Sequencing:** ship after deferred follow-up #4 lands so the Apple revoke helper already exists. Not a hard ship blocker on its own, but should be deployed at the same time as the 2.0.0 native build to start cleaning up early adopters before the user base grows.

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
