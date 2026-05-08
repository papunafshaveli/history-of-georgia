# publishingV2.md — History of Georgia v2.0.0 Ship Plan

**Last updated:** 2026-05-08 afternoon (iOS submitted for App Store review; Android Sign-In P0 still open with two hypotheses falsified today)
**Status:** vc 17 LIVE on Play Store production. iOS v2.0.0 submitted for App Store Review on 2026-05-08 with Apple + Google sign-in buttons live on iOS via OTA `019e06ab` (residual risk noted — production sign-in not verified on real device because Gmail TestFlight delivery failed; OTA-revert to Apple-only is the contingency). Android Google Sign-In STILL BROKEN — multi-OAuth-client hypothesis (3→1 cleanup) falsified today, SHA-1 byte-mismatch hypothesis falsified today. Android production OTA replaced the "Soon" placeholder with localized "მალე" (`t.leaderboard_coming_soon`). vc 21 production rollout halted; vc 17 remains live.
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

## 3. What's left before submission (UPDATED 2026-05-07 afternoon)

### 🔴 P0 STILL OPEN: Google Sign-In broken on Android (vc 17 production)

**Production state today**: vc 17 LIVE on Play Store. Google Sign-In throws DEVELOPER_ERROR (code 10) at runtime despite all configs verified end-to-end. vc 21 build attempted with `expo-auth-session/providers/google` migration — failed with Google OAuth `Error 400: invalid_request`. vc 21 production rollout halted; vc 17 remains live. Latest production OTA `019e01d9-001a-734f-991f-7b38597315ca` replaces the entire anonymous-Leaderboard gate (icon + headline + buttons) with a single "Soon" placeholder so users no longer hit the broken Sign-In path. Anonymous play continues normally for ~3.3k installs.

**Root cause unknown after exhausting standard troubleshooting:**
- ✅ Play App Signing SHA-1 (`30:19:AA:C5:...:8E:7F`) registered in Firebase + matching Android OAuth client `394970199474-ig4qafdumg2utm0lbifdfinig6vdo7o2.apps.googleusercontent.com` visible in Cloud Console.
- ✅ Web Client ID + package + Identity Toolkit API + OAuth consent screen verified correct via diagnostic OTA + multiple Cloud Console screenshots.
- ✅ Three independent research streams (Codex agents) confirmed standard config is right.
- ✅ Sister project `drosha` works in production with same library v16.1.2, same code shape, same Firebase pattern. Only structural difference: drosha has 1 Android OAuth client in its Cloud project; this project has 3 (Play App Signing + 2 upload-key SHAs from older builds).
- ❌ Multi-SHA hypothesis was tested by deleting 2 non-Play-App-Signing SHAs from Firebase. Firebase deletion reportedly cascades to Cloud Console but Cloud Console screenshots showed the 3 OAuth clients still active afterwards. Sign-In still failed. Hypothesis inconclusive — Cloud Console deletion was never explicitly performed.
- ❌ Migration to `expo-auth-session/providers/google` (vc 21) was a guess that introduced a different failure: Google OAuth `Error 400: invalid_request` when the OAuth flow hits accounts.google.com after account selection. Both `:/oauthredirect` and `:/oauth2redirect` redirect URI paths tested via OTA — same error.

**Open avenues for next session:**
1. **Try drosha-matching cleanup**: delete the 2 non-Play-App-Signing Android OAuth clients DIRECTLY in Cloud Console (`394970199474-ns31...` May 1 + `394970199474-9ro5...` Apr 30 — both auto-created by Google Service). If empirical evidence is right and config research was wrong, this matches drosha's setup and might fix legacy GoogleSignin via the existing vc 17 binary (no rebuild needed — OTA-only re-enable). Risk: dev emulator Sign-In would break (was using one of the deleted SHAs).
2. **Buy Universal Sign-In** ($89/yr at universal-sign-in.com) for the premium `GoogleOneTapSignIn` Credentials Manager class. Requires vc 22 native rebuild. User has stated they don't want to buy.
3. **Escalate to Codex via /codex:rescue** with full session context for a fresh second-pair-of-eyes diagnostic pass.

**Bad-decision audit (for future reference):**
- The SHA-delete advice was based on a hypothesis my own research later disproved. Should have stopped after research findings instead of proceeding with deletion.
- The `expo-auth-session` migration was untested locally (no dev emulator verification before commit) and pushed to production via vc 21 → caused a different error class that surfaced to all Internal track installs. Should have validated on dev emulator first.
- Multiple OTAs pushed to production with bandwidth-of-thought changes. Should have rolled back to the stable broken state earlier and stopped iterating on production.

**Production OTA history (Android channel, runtime 2.0.0):**
- `019dfeb0` — diagnostic Alert (capturing error code; later reverted).
- `019dfebc` — revert diagnostic.
- `019e008a` — second diagnostic Alert (full error fields capture); later reverted.
- `019e0093` — revert second diagnostic.
- `019e009f` — hide Google button via `showGoogle = !IS_ANDROID`.
- `019e00a6` — re-enable Google button (test SHA cleanup; failed).
- `019e00bf` — hide Google button again.
- `019e011c` — restore button + legacy GoogleSignin (after vc 18 build failed).
- `019e01c4` — expo-auth-session with `:/oauthredirect`; failed `invalid_request`.
- `019e01cd` — expo-auth-session with `:/oauth2redirect`; same failure.
- `019e01d7` — rollback to legacy GoogleSignin (stable broken state).
- `019e01d9` — anonGate replaced with hardcoded English "Soon" placeholder.
- **`<i18n OTA 2026-05-08>` (CURRENT)** — `Soon` → `t.leaderboard_coming_soon` ("მალე" / "Soon"). Localized.

**Production OTA history (iOS channel, runtime 2.0.0):**
- All Android OTAs above also bundle for iOS where applicable (i.e. before iOS divergence on 2026-05-08).
- **`019e06ab` (CURRENT)** — iOS-only OTA. Restores the full anonGate UI (icon + headline + Google button + Apple button) for iOS, gated by `IS_IOS`. Android branch keeps the "მალე" placeholder. Update group `d899ed1e-f27b-41c9-b806-df16c553a4f7`.

**App Store Connect submission state (2026-05-08):**
- App Privacy questionnaire DONE — Name / Email / Gameplay Content / User ID / Device ID (all linked to user, App Functionality only, no tracking).
- Age Rating DONE — 4+, no category overrides, all chance-based / restrictive toggles set to NONE / NO.
- Description, Promotional Text, What's New copy filled in English (Georgian localization left to Owner).
- Build 1.0.22 attached to v2.0.0 release.
- Encryption export compliance answered "Standard encryption only — exempt".
- Submitted for Review on 2026-05-08.
- iOS Sign-In flow verified on dev build (iPhone 11 Pro) only. Production binary not verified on real device because TestFlight delivery to `papunafshaveli@gmail.com` failed (Apple → Gmail relay flaky). Residual risk accepted; OTA-revert to Apple-only is the 5-minute contingency if Apple Review surfaces an iOS Google Sign-In error.

**Android P0 investigation state (2026-05-08 afternoon):**

Two hypotheses falsified today:
1. **Multi-OAuth-client (drosha=1, history=3)** — cleaned up to 1 Android OAuth client in Cloud Console (deleted `394970199474-ns31...` and `394970199474-9ro5...` directly, leaving only the May-6 Play App Signing client `394970199474-ig4qafdumg2utm0lbifdfinig6vdo7o2`). Sign-In still fails identically. Hypothesis dead.
2. **SHA-1 byte mismatch** — verified Cloud Console + Firebase Console both store the full 20-byte SHA `30:19:AA:C5:F5:61:75:42:09:16:E7:41:45:14:1E:78:02:C5:8E:7F`. Hypothesis dead.

Remaining hypotheses (untested):
- (a) **May-6 Cloud OAuth client is in a half-broken state.** Test: delete the SHA in Firebase, re-add it; Firebase auto-creates a fresh Cloud OAuth client. If new client fixes Sign-In, original was orphaned/stale.
- (b) **Play App Signing key SHA at runtime differs from what Play Console reports.** Test: ADB pull base.apk from a Google Play emulator with the production install + `keytool -printcert -jarfile` to read the actual runtime cert SHA. If different from `30:19:AA:...`, register the actual SHA in Firebase.

Out of scope for v2.0.0 ship. Park behind iOS submission, return after iOS Review outcome.

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
