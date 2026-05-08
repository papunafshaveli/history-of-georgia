# publishingV2.md — History of Georgia v2.0.0 Ship Plan

**Last updated:** 2026-05-08 evening (Android Sign-In P0 SOLVED, iOS submitted for App Store review)
**Status:** **Android v2.0.0 vc 15 LIVE on Play Store** with Google Sign-In working end-to-end (~3.3k installs). **iOS v2.0.0 SUBMITTED for App Store review on 2026-05-08**, awaiting Apple outcome. Latest production OTAs: Android `019e0806` (UI polish on top of Sign-In re-enable), iOS `019e06ab` (anonGate restored with Apple + Google buttons). Remaining ship work: monitor Apple review, then bump Firestore `app_config/version` to `2.0.0` once iOS is approved.
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

## 3. What's left before submission (UPDATED 2026-05-08 evening)

### ✅ Android Sign-In P0 SOLVED (2026-05-08 evening)

**Production state today**: vc 15 LIVE on Play Store with Google Sign-In working end-to-end. Latest OTA `019e0806` adds tab bar safe-area + restart button padding + leaderboard refresh-on-auth-change polish on top.

**Root cause**: Play App Signing SHA-1 was never correctly registered in Firebase. The originally-registered `30:19:AA:C5:F5:61:75:42:09:16:E7:41:45:14:1E:78:02:C5:8E:7F` was a visual transcription error from documentation; the actual runtime cert is `3D:19:A4:C5:F1:61:75:42:09:16:EE:F1:A5:14:1E:78:02:C5:BE:7F`. Cloud Console therefore had no Android OAuth client matching the runtime APK, and GMS Auth threw DEVELOPER_ERROR (code 10).

**How it was diagnosed**:
1. Pulled the production APK off the emulator with `adb pull /data/app/.../base.apk`.
2. Ran `apksigner verify --print-certs ./base.apk` — printed the actual runtime Signer #1 SHA-1 `3d19a4c5f16175420916eef1a5141e7802c5be7f`.
3. Compared to Firebase Console fingerprint list — none of the registered SHAs matched.

**Fix applied**:
1. Registered `3D:19:A4:...` in Firebase Console → Project Settings → Android app → SHA fingerprints.
2. Firebase auto-synced to Cloud Console within ~30 seconds, creating a matching Android OAuth client server-side.
3. Sign-In started working immediately on vc 15 — **no native rebuild required**. Confirmed via real-device install from Play Store + emulator test post-OTA.
4. Reverted `src/context/AuthProvider.tsx` from a brief `expo-auth-session` workaround back to native `@react-native-google-signin/google-signin` (commit `ed9eadc`). Both libraries remain in `package.json` and `app.config.ts` plugins, so vc 15's APK has the native module compiled in either way.

**Two falsified hypotheses recorded for posterity** (don't repeat):
1. "Multiple Android OAuth clients in Cloud Console need cleanup (drosha works with 1)" — cleaning up to 1 client did nothing because the underlying issue was the SHA mismatch, not client count.
2. "google-services.json bundled in vc 15 is missing `client_type=1` entries" — true but not the blocker; the legacy GoogleSignin library reads `webClientId` from JS, not the bundled JSON. The Cloud Console OAuth client matched against the runtime SHA is the actual auth path.

**Bad-decision audit retained from earlier sessions**:
- The original SHA was transcribed from a documentation screenshot rather than verified against the runtime APK. Lesson now codified in INFRASTRUCTURE.md §19.6: always run `apksigner verify --print-certs` against the runtime APK before registering any SHA.
- The `expo-auth-session` migration was a guess that introduced a different failure class (`invalid_request`) and pushed to production without local verification. Lesson: test on dev emulator before any production OTA touching auth code.
- Several OTAs pushed mid-investigation. Lesson: prefer rollback to the stable-broken state once iteration starts diverging.

**Production OTA history (Android channel, runtime 2.0.0):**

Pre-fix iteration history:
- `019dfeb0` / `019dfebc` — diagnostic Alert + revert.
- `019e008a` / `019e0093` — second diagnostic + revert.
- `019e009f` / `019e00a6` / `019e00bf` — hide / re-enable / hide Google button cycle.
- `019e011c` — restore button + legacy GoogleSignin (after vc 18 build attempt).
- `019e01c4` / `019e01cd` — expo-auth-session migration (`:/oauthredirect` and `:/oauth2redirect` variants); both failed `invalid_request`.
- `019e01d7` — rollback to legacy GoogleSignin (stable broken state).
- `019e01d9` — anonGate replaced with hardcoded English "Soon" placeholder.
- `<i18n OTA 2026-05-08>` — `Soon` → `t.leaderboard_coming_soon` ("მალე" / "Soon"). Localized.

Post-fix:
- **`019e0797`** — restored the full anon-gate UI (icon + headline + Google + Apple buttons) after the SHA fix. This is the OTA that re-enabled Sign-In on Android.
- **`019e0806` (CURRENT)** — UI polish: tab bar safe-area inset, restart button `paddingHorizontal`, leaderboard `refresh()` on auth state change. Group `9866437d-2379-4a89-9da2-5cb4ddf2eb9f`.

**Production OTA history (iOS channel, runtime 2.0.0):**
- All Android OTAs above also bundled for iOS where applicable (i.e. before iOS divergence on 2026-05-08).
- **`019e06ab` (CURRENT)** — iOS-only OTA. Restores the full anonGate UI for iOS, gated by `IS_IOS`. Group `d899ed1e-f27b-41c9-b806-df16c553a4f7`. (iOS still on its own OTA channel because of a bundling quirk: Expo SDK 55 + missing `react-native-web-webview` peer-dep in `react-native-youtube-iframe` breaks the web target, so updates need explicit `--platform ios|android`.)

**App Store Connect submission state (2026-05-08):**
- App Privacy questionnaire DONE — Name / Email / Gameplay Content / User ID / Device ID (all linked to user, App Functionality only, no tracking).
- Age Rating DONE — 4+, no category overrides, all chance-based / restrictive toggles set to NONE / NO.
- Description, Promotional Text, What's New copy filled in English (Georgian localization left to Owner).
- Build 1.0.22 attached to v2.0.0 release.
- Encryption export compliance answered "Standard encryption only — exempt".
- **Submitted for Review on 2026-05-08.** Awaiting Apple outcome.
- iOS Sign-In flow verified on dev build (iPhone 11 Pro) only. Production binary not verified on real device because TestFlight delivery to `papunafshaveli@gmail.com` kept failing (Apple → Gmail relay flaky). Residual risk accepted; OTA-revert to Apple-only is the 5-minute contingency if Apple Review surfaces an iOS Google Sign-In error.

**Cosmetic Cloud Console state**: 3 Android OAuth clients exist (prod `3D:19:A4`, dev `5E:8F:16`, one orphan from the deleted wrong-SHA `30:19:AA`). Orphan is inert — kept until iOS approval to avoid mid-review changes to the OAuth client list.

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

### Active ship blockers

All hard blockers cleared. Remaining work is monitoring + a small post-approval Firestore tweak.

1. **Wait for Apple App Store review outcome** on the iOS submission (build 1.0.22). Most likely outcomes:
   - ✅ Approved → bump `app_config/version` (see "Post-binary-live" below).
   - ❓ Rejected on iOS Sign-In path → OTA-revert iOS to Apple-only via the existing `IS_IOS` gate in `LeaderboardScreen.tsx`, then resubmit. ~5 min contingency.
   - ❓ Rejected on Privacy Manifest / metadata → fix the flagged item, resubmit. No code change typically.

2. **No active Android work** — vc 15 is live, Google Sign-In works, OTA `019e0806` is the current JS bundle. Foreground service "Need attention" auto-cleared.

### Build + submit sequence (historical reference)

```bash
# DONE 2026-05-06: Android prod build + submit + Play Store rollout (vc 15 live).
# DONE 2026-05-08: iOS prod build + submit (App Store Connect submission).
# DONE 2026-05-08: Android Sign-In P0 fix (Firebase Console SHA registration, no rebuild).
# DONE 2026-05-08: Android UI polish OTA `019e0806`.
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
