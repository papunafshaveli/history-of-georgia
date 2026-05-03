# Account Deletion + Email Collision — Implementation Plan

**Status:** Draft — 2026-05-03
**Spec:** [`docs/superpowers/specs/2026-05-03-account-deletion-design.md`](../specs/2026-05-03-account-deletion-design.md)
**Parent plan:** [`docs/superpowers/plans/2026-04-29-scoring-leaderboard-plan.md`](2026-04-29-scoring-leaderboard-plan.md) — deferred follow-ups #4 + #3
**Branch:** `Add-question-variations`
**Target release:** 2.0.0 native build

**Goal:** ship the smallest viable account-deletion + email-collision implementation that satisfies the App Store submission, mirroring drosha's production-shipped pattern. Total effort: ~1 day, **5 commits**.

**Tech stack:** React Native 0.83.6, Expo SDK 55, TypeScript, Firebase 11.1.0 (Auth + Firestore), AsyncStorage, `react-native-toast-message`. Test: Jest. Lint: `expo lint`. Type-check: `npx tsc --noEmit`.

## Phase boundaries (TL;DR)

| # | Commit | Files | Verifies |
| --- | --- | --- | --- |
| 1 | Email-collision toast | AuthProvider, helpers/showToast, App.tsx, en.json, ka.json | Toast plumbing works end-to-end before harder work depends on it |
| 2 | Firestore data layer + rules | firestore-account-deletion.ts, firestore.rules, jest test, services barrel | Cascade works against emulator + rules permit delete |
| 3 | AuthProvider reauthenticate + deleteAccount | AuthProvider, AuthContext type | Auth flow works in isolation (no UI yet — call from RN debugger) |
| 4 | AccountSection UI + local-storage wipe | AccountSection.tsx, styles.ts, en.json, ka.json, pending-results, local-lifetime-stats, local-recent-games | End-to-end: tap row → modal → confirm → cascade → fresh anon |
| 5 | Doc updates | INFRASTRUCTURE.md §17.4, parent plan #3 + #4 | Docs in sync with shipped scope per `.claude/rules/documentation.md` |

**Pre-flight (not a commit):** deploy the Firestore rule change before testing locally, otherwise step 4's cascade will fail with permission denied. Run `firebase deploy --only firestore:rules` after committing phase 2.

Phases are ordered to land **lowest-risk first** (toast plumbing) and **highest-blast-radius last** (UI replacement). Each phase is independently verifiable; if any one breaks, the others still ship.

---

## Phase 1 — Email-collision toast

**Goal:** show a toast on `auth/email-already-in-use` and `auth/account-exists-with-different-credential` during anonymous → OAuth linking. Verify `react-native-toast-message` is wired correctly before deletion work depends on it.

**Why first:** smallest scope, lowest risk, isolates the toast plumbing question (open question #1 from the spec). If `<Toast />` isn't currently mounted at root, this phase adds it once and the rest of the work assumes it's there.

### Steps

- [ ] Grep `App.tsx` for existing `<Toast />` mount. If absent, add `<Toast />` as a sibling of `AppNavigation` (outside `NavigationContainer`, inside `SafeAreaProvider`). If already present, skip this step.
- [ ] Create `src/helpers/showToast.ts` — thin wrapper around `Toast.show({ type, text1, text2 })`. Export a single `showToast({ type: 'error' | 'success', text1, text2 })` function. Add to `src/helpers/index.ts` barrel.
- [ ] In `src/context/AuthProvider.tsx`, inside the existing anonymous-link try/catch (already handles `auth/credential-already-in-use`), add a branch BEFORE the existing fallback:

  ```ts
  if (
    code === "auth/email-already-in-use" ||
    code === "auth/account-exists-with-different-credential"
  ) {
    const t = await loadTranslations();
    showToast({
      type: "error",
      text1: t.common_account_exists_title,
      text2: t.common_account_exists_message,
    });
    return;
  }
  ```

  Mirror drosha's `loadTranslations()` pattern (read AsyncStorage `LANGUAGE` key, fall back to default). If we already have a similar helper, reuse it; otherwise inline 5 lines.
- [ ] Add the same branch to the `signInWithCredential` path further down (drosha catches `auth/account-exists-with-different-credential` in two places).
- [ ] Add 2 translation keys to `src/locales/en.json` AND `src/locales/ka.json`:
  - `common_account_exists_title`
  - `common_account_exists_message`
  - Copy from spec §5.
- [ ] Run lint + type-check + tests.
- [ ] Manual smoke test on Android dev-client: sign in with one Google account, sign out, attempt to sign in with a different Google account that uses the same email as a fictitious Apple account in your dev project (or simulate by manually triggering the error in `AuthProvider`). Verify toast appears, no link happens, app stays on Leaderboard.
- [ ] Commit: `Email-collision toast on linkWithCredential failure (auth/email-already-in-use + auth/account-exists-with-different-credential).`

**Phase 1 verification:** toast appears, app does not crash, no spurious link. Lint + tsc + jest clean. ~1.5 hours.

---

## Phase 2 — Firestore data layer + rules

**Goal:** create the `deleteUserData(uid)` cascade and update Firestore rules to permit owner-initiated deletes. Land + deploy rules before any UI consumes the cascade.

**Why second:** unblocks phase 3 + 4. Pure data layer with isolated unit tests; no auth state, no UI dependency.

### Steps

- [ ] Create `src/services/firestore-account-deletion.ts` with `deleteUserData(uid: string): Promise<void>` per the spec §3 implementation. Use `writeBatch` + `BATCH_LIMIT = 499` chunking; reserve last slot for `users/{uid}` delete; handle the "no game results" case in a single-op batch.
- [ ] Add to `src/services/index.ts` barrel.
- [ ] Update `firestore.rules`:
  - `match /users/{uid}` — change `allow delete: if false;` to `allow delete: if request.auth.uid == uid;`.
  - `match /game_results/{id}` — change `allow update, delete: if false;` to `allow update: if false; allow delete: if request.auth != null && request.auth.uid == resource.data.userId;` (keep update forbidden, allow delete by owner).
- [ ] Add unit test `src/__tests__/firestore-account-deletion.test.ts`:
  - Mock Firestore (`writeBatch`, `getDocs`, `query`, `doc`, `where`).
  - Test cases: 0 game results, 1 result, 499 results, 500 results (chunk boundary), 1000 results (multi-chunk).
  - Assert correct number of `batch.commit()` calls and that `users/{uid}` is included only in the last batch.
- [ ] Run lint + type-check + tests.
- [ ] Pre-deploy validate: `firebase deploy --only firestore:rules --dry-run`.
- [ ] Commit: `Account-deletion cascade — deleteUserData service + chunked batched writes; flip Firestore rules to allow owner deletes on users + game_results.`
- [ ] **After commit:** deploy rules → `firebase deploy --only firestore:rules`. Then verify in Firebase Console → Rules tab that the new rules are live. (Rule deploy is a separate step from the commit; the commit captures the rule source, the deploy makes them effective.)

**Phase 2 verification:** unit tests pass; rules deployed; Firestore Console shows the new rules. ~2 hours including rule deploy + console verification.

---

## Phase 3 — `reauthenticate()` + `deleteAccount()` in AuthProvider

**Goal:** wire the auth-side flow. Exposed through `useAuth()` so phase 4's UI can consume it. No UI changes yet.

### Steps

- [ ] In `src/context/AuthProvider.tsx`, add `reauthenticate()` per spec §1. Provider switch: `google.com` → reuse existing Google credential acquisition + `reauthenticateWithCredential`; `apple.com` (gated by `IS_IOS`) → reuse existing Apple credential acquisition + `reauthenticateWithCredential`. Throw on unsupported provider.
- [ ] Add `deleteAccount()` per spec §2:
  - Step 1: if not anon, `await reauthenticate()` (rethrow on failure → toast).
  - Step 2: clear local AsyncStorage — call new wipe helpers from `pending-results`, `local-lifetime-stats`, `local-recent-games` (added in this phase, see below). Call existing `unregisterNotifications()` if it exists.
  - Step 3: `await deleteUserData(user.uid)` — rethrow on failure → toast, do not proceed.
  - Step 4: `await user.delete()` — best-effort.
  - Step 5: nothing — `onAuthStateChanged` handles fresh anon creation automatically.
- [ ] Add `clearPendingResults()` to `src/services/pending-results.ts` (delete the `PENDING_RESULTS_KEY` AsyncStorage key).
- [ ] Add `clearLifetimeStats()` to `src/services/local-lifetime-stats.ts` (delete the relevant AsyncStorage key).
- [ ] Add `clearRecentGames()` to `src/services/local-recent-games.ts` (delete the relevant AsyncStorage key).
- [ ] Expose `deleteAccount` through the `useAuth()` value object. Update `AuthContext.ts` type to include `deleteAccount: () => Promise<void>`. Default-context fallback returns a no-op promise.
- [ ] Run lint + type-check + tests.
- [ ] Manual smoke test: in dev-client React Native debugger, after signing in with Google, call `useAuth().deleteAccount()` from a console hook (or a temp dev button). Verify Google reauth prompt appears; on confirm, Firestore data is gone (check Firestore Console), Auth user is gone (check Auth tab), app boots into a fresh anon UID.
- [ ] Commit: `AuthProvider reauthenticate + deleteAccount; expose through useAuth; clear local AsyncStorage on delete.`

**Phase 3 verification:** can delete a Google-signed account end-to-end via debugger; new anon UID issued automatically. ~3 hours.

---

## Phase 4 — `AccountSection` UI replacement + final integration

**Goal:** replace the current sign-out row with the combined "Delete account & sign out" row. End-to-end user-facing flow.

### Steps

- [ ] Rewrite `src/components/app-settings/AccountSection.tsx`:
  - Keep the `AccountRow` subcomponent skeleton.
  - Replace the single sign-out row with a single delete-account row (`iconName="delete-outline"`, `labelColor={colors.incorrectBorder}`).
  - Replace the sign-out confirm modal with a delete confirm modal (same parchment style: close-icon hero, body copy, two `GradientWrapper` buttons — Cancel + "წაშლა და გასვლა" / "Delete & sign out").
  - State: `isDeleting` (true while `deleteAccount()` runs); confirm button shows spinner inline; modal `onClose` is `undefined` while `isDeleting` to prevent dismissal mid-flight.
  - Handler: `await deleteAccount()`; on `try` failure, show error toast + re-enable button; on success, modal naturally closes when AuthProvider state resets.
- [ ] Update `src/components/app-settings/styles.ts` if needed (likely just renames; reuse existing `signOut*` style keys or rename them to `deleteAccount*`).
- [ ] Add 4 translation keys to `src/locales/en.json` AND `src/locales/ka.json`:
  - `common_delete_account_row`
  - `common_delete_account_title`
  - `common_delete_account_message`
  - `common_delete_account_button`
  - Copy from spec §5.
- [ ] Remove the old `t.settings_signout_*` keys from both JSON files (after grepping `src/` to confirm `AccountSection.tsx` was the only consumer — if any other file uses them, keep them or migrate that consumer in this phase).
- [ ] Run lint + type-check + tests.
- [ ] **Android dev-client smoke** per spec test plan §1–4:
  - Anon → no row visible.
  - Google sign-in → play 1 game → delete → reauth prompt → confirm → cascade → fresh anon, no leaderboard entry.
  - Same flow but cancel reauth prompt → modal stays open, button re-enables.
  - Verify after deletion: Firestore Console shows no `users/{uid}` doc, no `game_results/{uid}_*` docs; AsyncStorage cleared (lifetime + recent + pending queue).
- [ ] Commit: `AccountSection — replace sign-out row with combined "Delete account & sign out" + parchment confirm modal; wipe local stats / recent / pending queue on delete.`

**Phase 4 verification:** Android end-to-end works; user can delete from Settings without dev tools; visible in Firestore + Auth Console that data is gone. ~3 hours.

---

## Phase 5 — Doc updates

**Goal:** keep `INFRASTRUCTURE.md` and the parent plan in sync with shipped scope, per `.claude/rules/documentation.md`.

### Steps

- [ ] `INFRASTRUCTURE.md` §17.4 — replace the existing paragraph with the revised version from spec §7 (no Cloud Function, no Apple revoke; reference drosha precedent + this spec's path).
- [ ] `docs/superpowers/plans/2026-04-29-scoring-leaderboard-plan.md`:
  - Deferred follow-up #4 — change leading marker to **IN PROGRESS (2026-05-03)**, replace the Cloud Function spec body with a one-paragraph summary + link to this plan + spec. Note "scope downgraded after adopting drosha's no-Cloud-Function pattern; effort revised to ~1 day."
  - Deferred follow-up #3 — change leading marker to **DONE-via-toast (2026-05-03)**, describe the resolved approach (toast on both error codes, no merge modal). Reference the `Add-question-variations` commit hash for the toast change.
- [ ] Confirm `bigChanges.md` does NOT need a change — these are deferred items inside an in-progress feature, not a new tracked section. Per `.claude/rules/documentation.md`, bigChanges.md only updates on section-level DONE markers.
- [ ] Run lint (no source changes; should still be clean).
- [ ] Commit: `Sync INFRASTRUCTURE.md + parent plan to drosha-pattern account-deletion scope (no Cloud Function, no Apple revoke).`

**Phase 5 verification:** docs and code agree. ~30 minutes.

---

## Total effort

| Phase | Estimate |
| --- | --- |
| 1. Email-collision toast | ~1.5 h |
| 2. Firestore data layer + rules | ~2 h |
| 3. AuthProvider reauthenticate + deleteAccount | ~3 h |
| 4. AccountSection UI | ~3 h |
| 5. Doc updates | ~0.5 h |
| **Total** | **~10 h (1 day)** |

Buffer for surprise, dev-client rebuild time, manual testing: add ~2 h. **Realistic: 1.5 days.**

---

## Deferred follow-ups from this work (must not be lost)

1. **iOS verification.** Phases 1–4 will be smoke-tested on Android only. iOS verification (Apple sign-in reauth + Apple Apps Using Apple ID list) is blocked by the existing iOS dev-client install issue (parent plan deferred #1). Until that resolves, iOS-side delete-account is covered only by code review, not behavior.
2. **App Store submission risk.** Apple's Guideline 5.1.1(v) explicitly requires Sign in with Apple token revoke on deletion. We are shipping without it on the basis that drosha shipped without it and was approved. If our 2.0.0 review rejects on this point specifically, the v2.1 hotfix is: (a) write the Cloud Function `onDelete` trigger, (b) implement Apple JWT signing with the existing `AuthKey_3C2L469ZH5.p8`, (c) call `https://appleid.apple.com/auth/revoke` per [Apple's REST API docs](https://developer.apple.com/documentation/sign_in_with_apple/revoke_tokens/). Effort: ~1 day for the Cloud Function alone.
3. **Refactor the duplicated Google + Apple credential acquisition.** After phase 3 lands, `signInWithGoogle`, `signInWithApple`, and `reauthenticate` each duplicate ~30 lines of credential acquisition. Worth extracting `getGoogleCredential()` + `getAppleCredential()` factories at some point. Out of scope here.
4. **PRIVACY_POLICY.md authoring.** Separate ship blocker for App Store submission (privacy policy URL is required on App Store Connect). Deferred per user direction; tracked separately.
