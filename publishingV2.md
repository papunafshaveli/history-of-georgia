# publishingV2.md — History of Georgia v2.0.0 Ship Plan

**Last updated:** 2026-05-06 late evening (vc 15 LIVE on Play Store but Google Sign-In broken; vc 17 rebuilding to fix)
**Status:** Android v2.0.0 vc 15 published to Play production today and reached ~2.4k installs, but Google Sign-In throws DEVELOPER_ERROR (code 10) because vc 15's bundled `google-services.json` had ZERO Android OAuth clients (only Web client). Diagnostic OTA confirmed the error code; fresh `google-services.json` now has 3 Android OAuth clients (Play App Signing SHA-1 added to Firebase tonight); vc 17 building with the fresh file. iOS v2.0.0 build completed + uploaded to App Store Connect — pending App Privacy + age rating + What's New + Submit for Review.
**Owner:** Papuna Fshaveli

---

## 1. Why a native build, not OTA

`runtimeVersion` was bumped `1.1.0` → `2.0.0` in `app.config.ts` commit `3de2045` during the Expo SDK upgrade. Production users are still on a `1.1.0` (or older `1.0.0`) native binary.

- **OTA `eas update` from `main` reaches zero existing users** because the runtime versions don't match.
- The next prod release **must** be a native build: `eas build --platform all --profile production` → `eas submit`.
- After users install the new `2.0.0` binary, future `eas update` calls reach them normally.
- Hotfixes for the existing `1.1.0` binary go on a separate branch (see `INFRASTRUCTURE.md` §19.2).

---

## 2. What's done since v1.1.0

Recap. Source of truth is git log + `bigChanges.md` §10. This list is the version users will install.

### Auth + account

- Anonymous sign-in on first launch → upgrade to Google / Apple → leaderboard appearance.
- `linkWithCredential` with `auth/credential-already-in-use` fallback to `signInWithCredential`.
- ConfirmNameModal on first OAuth link (one-time, gated by `wasFirstLink` return signal).
- `auth/email-already-in-use` cross-provider toast.
- Sign-out via Settings → fresh anonymous (local stats preserved, pending results queue cleared).
- **Account deletion** (Apple Guideline 5.1.1(v)): `deleteAccount` reauthenticates → `deleteUserData` (server cascade) → `unregisterNotifications` (drops device push_tokens row) → `current.delete()` → `clearPendingResults`. Apple Sign In gets `revokeAppleAuthToken`.
- Display-name editing UX deferred to v2.1.

### Scoring + leaderboard

- Difficulty-weighted scoring: +5 / +10 / +20 (easy / medium / hard).
- Atomic Firestore transaction with idempotent guard, lazy weekly reset, pending-results queue + replay on next launch.
- Leaderboard tab with weekly + all-time tabs, Olympic podium for top 3, self-rank caption.
- 0-point users filtered out client-side.
- Cache invalidation on sign-in / name save → user appears immediately without manual pull-to-refresh.
- ScoreChangeIndicator (+N float-up via Reanimated) on correct answer.

### Force-update + soft-update

- `app_config/version` Firestore doc with 6h AsyncStorage cache.
- `minSupportedVersion` triggers hard force-update modal (non-dismissible, deep-links to stores).
- `latestVersion` triggers soft-update modal (Endgame-styled, dismissible).

### Push notifications

- Per-device `push_tokens/{tokenId}` doc keyed by Expo push token; `unregisterNotifications` on sign-out / delete drops the row.
- Stale-token cleanup on `Messaging/INVALID_ARGUMENT` from FCM.
- Owner-read rule on `push_tokens` (added in this prep cycle for the deletion cascade).

### UI polish (this prep cycle)

- GameSummary footer: Stats nav → Leaderboard nav, centered layout.
- AccountSection: combined "Delete account & sign out" row, dark-mode contrast fixed via new `dangerOnParchment` color token, in-button spinner during cascade, Cancel + Confirm both disabled while loading.
- ConfirmNameModal: parchment-scroll save button (`GradientWrapper`-based), small `ActivityIndicator` while saving, validation error text uses `dangerOnParchment`. Replaces an earlier bug where the splash-screen `<Loading />` component was rendered inside the modal.
- LeaderboardScreen: empty-state during initial fetch swapped from full-screen `<Loading />` splash to small `<ActivityIndicator>`. The splash background was bleeding into the area below the tabs and looked broken.
- AuthProvider: `signInWithGoogle` / `signInWithApple` wrap `updateProviderProfile` in try/catch (warn-only). Profile-sync hiccup no longer surfaces as a "sign-in failed" toast.

### Translations

- 20 unused keys removed from `en.json` + `ka.json` (parity at 106 keys each).
- Copy refinements: informal "შენ" voice, abbreviated tab labels, tier rewrites, error rephrasings.

### Fonts (this prep cycle)

- `script` slot swapped from `aisi-bold` (italic, narrow widths, long-sentence breakage) → `irubaqidze-heavy`.
- Source: BPG Irubaqidze Regular only ships from upstream, so a Heavy variant was baked locally with FontForge `ChangeWeight(60)` after user-driven weight comparison on a localhost preview.
- Drops in at theme-token level — 22 components rendering through `fontFamily="script"` get the new font with no per-file edits.
- Aisi `GFAisiBoldItalic.ttf` retained in `src/assets/fonts/` as fallback until the binary is live in stores.

### Firestore rules (this prep cycle)

- `push_tokens` read: `if false` → owner-read (`request.auth.uid == resource.data.uid`). Required by `deleteUserData` cascade.
- `users.update`: removed `lastSeenAt` monotonic + `<= request.time` clauses. They were rejecting `serverTimestamp()` writes (placeholder-vs-Timestamp comparison quirk in production rule eval). Deferred to v2.1.

### Documentation

- `INFRASTRUCTURE.md` — codebase atlas, kept in sync with all changes above.
- `bigChanges.md` — feature log with 2026-05-04 status section.
- This file (`publishingV2.md`) — release plan.

---

## 3. What's left before submission (UPDATED 2026-05-06 LATE evening)

### 🔴 P0 in flight: Google Sign-In broken on production vc 15

vc 15 is LIVE on Play Store (~2.4k installs). Google Sign-In throws DEVELOPER_ERROR (code 10). vc 17 is rebuilding with the fix. Full diagnosis:

- **Bug**: vc 15's bundled `google-services.json` had only Web Client (`client_type=3`), zero Android OAuth clients (`client_type=1`). Without Android OAuth clients in the file, GMS Auth library can't authenticate the calling app to Google's OAuth servers → DEVELOPER_ERROR.
- **Why now and not v1.1.0**: v1.1.0 had no OAuth at all. v2.0.0 vc 15 was built before any SHA-1 fingerprint was registered in Firebase, so Firebase's `google-services.json` generator returned a file with no Android entries. Tonight added the Play App Signing SHA → Firebase regenerated the file with 3 Android OAuth clients embedded.
- **Diagnostic OTA dropped on production channel** to surface the error code: `019dfeb0-4976-77e8-b052-dfbbe6b252f0`. Confirmed `SIGNIN ERR: 10 | DEVELOPER_ERROR`. Then reverted via `019dfebc-0658-7105-a89a-b87a17412cc0`. Source code in `LeaderboardScreen.tsx` is back to clean state.
- **Fix sequence** (mostly applied):
  1. ✅ Added Play App Signing SHA-1 (`30:19:AA:C5:F5:61:75:42:09:16:E7:41:45:14:1E:78:02:C5:8E:7F`) to Firebase Project Settings → Android app fingerprints.
  2. ✅ Re-downloaded `google-services.json` (now has 3 `client_type=1` entries).
  3. ✅ Replaced local `./google-services.json` with the fresh file. Old broken file at `./google-services.json.bak-vc15`. Original download at `./google-services2.json`.
  4. ✅ `eas env:update --variable-name GOOGLE_SERVICES_JSON --variable-environment production` (file type, Secret visibility).
  5. ⏳ `eas build --platform android --profile production` — vc 17 building right now.
  6. Pending: `eas submit --platform android --profile production --latest`.
  7. Pending: Promote vc 17 from internal → production track in Play Console (Production → Create new release → Add from library → vc 17).
  8. Pending: Verify Google Sign-In works on a fresh Play Store install of vc 17.

### Already done

- ✅ `version` bumped to `"2.0.0"` in `app.config.ts` (commit `838a97b`).
- ✅ Privacy policy converted from `.docx` Drive share to native Google Doc with **Publish to web** URL (`docs.google.com/document/d/e/2PACX-1vRrQZf.../pub`). Replaces the broken Drive editor URL Play Console kept rejecting (200 response code but login-walled for reviewers).
- ✅ **Privacy policy section 4 updated** with "If you no longer have the app installed, you can request deletion of your account and associated data by emailing papunafshaveli@gmail.com. We will process your request within 30 days." (Google Play 2024+ deletion-discoverability rule).
- ✅ **`v2.0.0` vc 15 LIVE on Google Play production** (Full rollout, 177 countries, ~2,436 installs as of 21:53 local). Approved by Google review same-day.
- ✅ **vc 16 in Internal testing track** (FGS fix only). Will be SUPERSEDED by vc 17 (FGS fix + google-services.json fix). Don't promote vc 16.

- ✅ `version` bumped to `"2.0.0"` in `app.config.ts` (commit `838a97b`).
- ✅ Privacy policy converted from `.docx` Drive share to native Google Doc with **Publish to web** URL (`docs.google.com/document/d/e/2PACX-1vRrQZf.../pub`). Replaces the broken Drive editor URL Play Console kept rejecting (200 response code but login-walled for reviewers).
- ✅ **Privacy policy section 4 updated** with "If you no longer have the app installed, you can request deletion of your account and associated data by emailing papunafshaveli@gmail.com. We will process your request within 30 days." (Google Play 2024+ deletion-discoverability rule).
- ✅ Final commits + push (working tree clean on `main` apart from active doc edits).
- ✅ Lint + type-check + tests green.
- ✅ `v2.0.0` git tag pushed to origin (points at commit `0be3d2b`).
- ✅ Firestore rules anti-cheat tightening DEPLOYED (commit `4d61b76`) — closes weekPoints + game_results inflation findings from the security review.
- ✅ Cloud Function snapshot-ref delete fix DEPLOYED.
- ✅ Android FCM wired (commit `caf8480` + `2657749`): `google-services.json` in repo (gitignored), `app.config.ts` reads via `process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json"`, EAS file env var set across production/preview/development, FCM V1 service account uploaded to EAS.
- ✅ All 10 production env vars verified on EAS (9 Firebase/Google plaintext + 1 GOOGLE_SERVICES_JSON file/secret).
- ✅ Modal close icon centered via MaterialIcons swap (commit `28af663`).
- ✅ **Android production build (versionCode 13) succeeded earlier today**, AAB uploaded to Play Console internal track. **Superseded** by versionCode 16 build now in flight (FGS fix). Submission URL on the original 13: `https://expo.dev/accounts/papunafshaveli/projects/history-of-georgia/submissions/cf711a4c-39a0-407d-8e32-22cc5c0adb57`.
- ✅ Dev builds tested on iPhone 11 Pro + Android device. Apple Sign-In end-to-end on iOS to be verified once the new prov profile + build is on TestFlight.
- ✅ **Play Console Data Safety form** filled out for v2.0.0 data types: Personal info (Name, Email, User IDs, Other info → photo URL — all Optional except User IDs which is Required because every user gets a Firebase anonymous UID), App activity (Other user-generated content → game scores, Required), Device or other IDs (FCM push token, Optional). Encryption-in-transit: Yes. No third-party data sharing. Account creation methods: OAuth checked.
- ✅ **Account Deletion declaration** completed (now folded into Data Safety in 2026 Play Console layout). Web URL = the privacy policy `/pub` URL. Optional "data deletion without account deletion" question answered No.
- ✅ **Privacy policy URL in App content → Privacy policy** replaced with `/pub` URL.
- ✅ **Foreground service permissions blocker DIAGNOSED + FIXED**:
  - Pulled v2.0.0 vc 15 AAB from EAS, dumped merged manifest with `bundletool dump manifest`.
  - Found `<uses-permission FOREGROUND_SERVICE/>` + `<uses-permission FOREGROUND_SERVICE_MEDIA_PLAYBACK/>` plus `<service expo.modules.audio.service.AudioControlsService foregroundServiceType=mediaPlayback/>`.
  - Source: `expo-audio` plugin's default `enableBackgroundPlayback: true`. Our app uses SFX only (button taps, chimes), no actual background playback — declaring `mediaPlayback` to Play would be dishonest and the form requires a video demo we can't provide.
  - Fix: `app.config.ts` now passes `["expo-audio", { enableBackgroundPlayback: false }]`. This matches Drosha's working config (Drosha has the same expo-audio dep and shipped without seeing the FGS declaration). Strips both FGS uses-permissions, removes the AudioControlsService, also drops the iOS `UIBackgroundModes: ["audio"]` (acceptable — we don't background-play).
- ✅ **iOS Apple authentication restored**: Apple Developer Portal API recovered (was throttled this morning). Fresh `eas build` declined to reuse the cached 2025-02-04 prov profile, generated a new one (ID `8G68T2RT74`, valid through 2027-03-19) with Sign In with Apple + Push Notifications capabilities pulled from current entitlements.
- ✅ **Both v2.0.0 builds queued on EAS as versionCode 16** via `production` profile `autoIncrement: true`. Free-tier queue ~20 min for iOS.
- ✅ Store screenshots for Play Console uploaded (used a temporary `MOCK_LEADERBOARD_ENABLED` flag in `useLeaderboard.ts` to populate the leaderboard with believable Georgian names + scores; reverted via `git checkout` after capture).

### Active hard ship blockers

1. **vc 17 Android build (in EAS queue right now)** — Once it completes:
   - `eas submit --platform android --profile production --latest` → uploads vc 17 AAB to Play Console.
   - In Play Console: Production → Create new release → "Add from library" → pick vc 17 → release notes match vc 15 (or fresh copy) → Save → Review → **Start rollout to Production** at 100%.
   - Wait for Google review (same-day approval today on vc 15).
   - Once vc 17 is live, **install fresh from Play Store on a real device and verify Google Sign-In works**. This is the test that closes the P0.

2. **Play Console final steps** after vc 17 ships:
   - Foreground service permissions "Need attention (1)" should auto-clear on next bundle scan since vc 17 has no FGS perms (matches vc 16 in that regard).
   - Financial features + App access declarations: confirmed already correct from v1.1.0 (Save button disabled = no changes needed).

3. **iOS v2.0.0 build + upload DONE** — pending App Store Connect work:
   - **App Privacy questionnaire** for v2.0.0 (Name, Email, Gameplay Content, Other User Content, User ID, Device ID — all linked to user, not used for tracking, App Functionality only).
   - **Age rating questionnaire** — Apple's new 4/9/13/16/18 scale is in effect since 2026-01-31. Educational quiz with historical battle questions likely lands at **9+**.
   - **Privacy Manifest** verification: Expo SDK 55 auto-generates `PrivacyInfo.xcprivacy` for Expo modules. Defensive measure for v2.0.0: confirm AsyncStorage's NSUserDefaults usage (CA92.1) and Google Sign-In v16+ are covered. May need `expo.ios.privacyManifests` block in `app.config.ts` if Apple flags missing reasons after upload.
   - **What's New / Promotional Text** for v2.0.0 — needs Georgian + English copy: Apple Sign In + Google Sign In + leaderboard + difficulty-weighted scoring + account deletion + font polish.
   - **Submit for Review** on App Store Connect.
   - **Important**: iOS first install testing should also verify Google Sign-In works. Apple Sign-In on real iOS device has never been verified end-to-end (all Phase 4-5 testing was Android emulator).

### Build + submit sequence

```bash
# In flight right now:
eas build --platform android --profile production    # vc 17

# When it finishes:
eas submit --platform android --profile production --latest

# iOS already done earlier this evening:
# eas build --platform ios --profile production    ✅
# eas submit --platform ios --profile production --latest    ✅ (uploaded to App Store Connect)
```

### Soft blockers (resolved)

- ✅ Lint + type-check + tests green.
- ✅ Tag `v2.0.0` exists on `0be3d2b`.
- ✅ Font swap eyeballed on dev build — only `script` `rightBleedFix` was visibly off (centered text shifted left), reverted user-side and reverted again so styles.ts stays Aisi-era for now. v2.1 polish item.

### Post-binary-live

- Confirm both stores publish.
- Update Firestore `app_config/version` doc:
  ```
  minSupportedVersion: "2.0.0"
  latestVersion:        "2.0.0"
  ```
  **Only after** the binary is live in both stores. Doing this earlier would push the hard force-update modal at users who don't yet have a `2.0.0` binary to install.
- Remove the "Release status (as of 2026-04-28)" section from `CLAUDE.md` — it'll be obsolete.
- Delete `GFAisiBoldItalic.ttf` from `src/assets/fonts/` and remove its export from `src/assets/fonts/index.ts` once Irubaqidze Heavy looks correct on real devices in production.
- (Optional) Stop and clean up `/tmp/font-preview/` localhost preview directory.

---

## 4. Deferrals + risks

### Deferred to v2.1

1. **`pruneInactiveUsers` Cloud Function** — anonymous-user 14-day cleanup + signed-in 180-day cleanup with cascade delete (game_results, push_tokens) and Apple token revoke. Removed after 7 Codex review rounds; schema (lastSeenAt, push_tokens.uid, retagPushToken helper) and rule constraints are kept. Requirements list lives in `INFRASTRUCTURE.md` §17.3.
2. **Server-trusted `lastSeenAt` writes.** The strict rule clauses were removed because production `serverTimestamp()` writes were getting rejected. Re-enable with proper Firestore-emulator integration tests in v2.1.
3. **Display-name editing UX.** Phase 5 simplified Settings → Account to sign-out-only.
4. **`profileSyncFailed` return signal.** Codex medium finding: when `updateProviderProfile` fails after sign-in, the user gets a successful auth + warm leaderboard but no profile-sync. Currently logged as a warn. Post-2.0.0 polish: surface a subtle "couldn't update profile" toast with retry, or auto-retry once.
5. **Statement-judgment question variations.** 33-char Georgian options truncate on Android in fixed-height `OptionButton`. Translation keys + prefix logic + UI scaffolding are in place; needs an UI fix (auto-shrink or 2-line wrap) before re-activation.

### Known risks for v2.0.0

- **`push_tokens` grandfather caveat for v1.1.0 multi-device users.** Devices that registered tokens on v1.1.0 don't have `uid` field set (introduced 2026-05-02). On v2.0.0 sign-out / delete, the cascade enumerates by `uid`, missing those grandfather rows. They'll get cleaned up naturally when the device receives a new push and `INVALID_ARGUMENT` triggers stale-token deletion, OR when the user reinstalls. Documented in `INFRASTRUCTURE.md` §17.4.
- **FontForge embolden artifacts.** A small number of Irubaqidze Heavy glyphs may have minor outline issues from the `ChangeWeight(60)` operation. Eyeball check on real device before submitting; re-bake with cleaner overlap removal if any letterform looks broken.
- **iOS Apple Sign In flow has never been verified end-to-end on a real device.** All Phase 4–5 verification was Android emulator. Treat the iOS device test pass as a real bug-finding exercise, not a rubber stamp.
- **Apple App Review rejection vectors.** Account deletion flow is implemented; privacy policy is the remaining gap. Anonymous-user data retention is also covered (cascade delete on user-initiated deletion). 14-day inactive cleanup is deferred but not a Guideline 5.1.1(v) blocker — that guideline only requires a deletion mechanism, not automatic retention limits.

---

## 5. v2.1 follow-up backlog

In rough priority order:

1. **Privacy policy hosting + link in App Store Connect** — actually a v2.0.0 blocker but listed here so it doesn't get lost if v2.0.0 ships with a placeholder URL.
2. **`pruneInactiveUsers` Cloud Function** — see deferral §1 above. Includes Apple token revoke, push_tokens cascade, lastSeenAt as the activity signal.
3. **Server-trusted `lastSeenAt` writes** with emulator tests.
4. **Display-name editing UX** in Settings → Account.
5. **`profileSyncFailed` return signal + retry**.
6. **Statement-judgment variations re-activation** (after Android `OptionButton` height fix).
7. **App-wide font replacement audit.** v2.0.0 only swapped the `script` slot. `serif` (BPG Nino Elite Ultra) and `display` (DM Medea) may have similar long-sentence quirks worth surveying.

---

## 6. References

- `INFRASTRUCTURE.md` §19 — release pipeline, decision tree, pre-release checklist, hard ship blockers
- `INFRASTRUCTURE.md` §17 — data lifecycle, retention, account deletion ordering
- `INFRASTRUCTURE.md` §14 — Firestore schema, security rules, Cloud Functions
- `bigChanges.md` §10 — Scoring + Leaderboard initiative status
- `CLAUDE.md` — release status banner (delete after v2.0.0 is live in stores)
- `docs/superpowers/specs/2026-04-29-scoring-leaderboard-design.md` — scoring + leaderboard design spec
- `docs/superpowers/plans/2026-04-29-scoring-leaderboard-plan.md` — implementation plan + deferred follow-ups
