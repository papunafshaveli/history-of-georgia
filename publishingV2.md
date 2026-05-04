# publishingV2.md — History of Georgia v2.0.0 Ship Plan

**Last updated:** 2026-05-04
**Status:** Ship-prep in flight. Native build + store submission pending.
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

## 3. What's left before submission

### Hard ship blockers
1. **iOS device test pass.** EAS build is complete; install + verification on iPhone 11 Pro pending. Test golden path: anon → Apple sign-in → ConfirmNameModal → leaderboard appearance → sign out → fresh anon → back in. Then golden path for delete: sign in → play 1 game → delete account → confirm leaderboard row gone → confirm push_tokens row gone (Firestore console).
2. **Apple Sign In end-to-end verification.** Android-only verification was done in Phase 4; Apple flow has not been confirmed on a real iPhone.
3. **Bump `version` to `"2.0.0"` in `app.config.ts`.** `runtimeVersion` is already `2.0.0`. iOS `buildNumber` and Android `versionCode` auto-increment via EAS.
4. **Privacy Policy.** Apple App Review requires a hosted privacy policy URL in App Store Connect. Not yet authored. Suggested location: simple static page or Markdown rendered via GitHub Pages. Must cover: anonymous Firebase Auth, Google/Apple Sign In, Firestore data (game results, display name, push tokens, lastSeenAt), Expo push notifications, Firebase Crashlytics if enabled, account deletion mechanism (the in-app one ships in v2.0.0).
5. **Final commit + push** of pending working-tree changes (`LeaderboardScreen.tsx` Loading fix is the only one left; documentation updates from this cycle land in the same or adjacent commit).

### Soft blockers (preferred but not strictly required)
- Lint + type-check + test: `npm run lint && npx tsc --noEmit && npx jest --no-watchAll`. These are also enforced by pre-commit hook.
- Tag the release commit (e.g. `v2.0.0`) for traceability.
- Eyeball font swap on a few screens for embolden artifacts (FontForge threw "overlap" warnings on a few glyphs while expanding strokes — files generated successfully but a handful of letterforms might have minor outline issues).

### Build + submit sequence
```bash
# from clean main, version bumped, lint/type-check/tests green:
eas build --platform all --profile production
# wait for both builds; confirm download links land in dashboard
eas submit --platform ios     --profile production --latest
eas submit --platform android --profile production --latest
```

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
