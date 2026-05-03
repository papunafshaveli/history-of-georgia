# Account Deletion + Email Collision — Design

**Status:** Draft — 2026-05-03
**Spec parent:** `docs/superpowers/specs/2026-04-29-scoring-leaderboard-design.md`
**Plan parent:** `docs/superpowers/plans/2026-04-29-scoring-leaderboard-plan.md` (deferred follow-ups #4 + #3)
**Branch:** `Add-question-variations`
**Target release:** 2.0.0 native build (App Store + Play Store)

## Context

Two deferred follow-ups in the scoring + leaderboard plan are real ship blockers for the 2.0.0 store submission:

- **#4 — In-app account deletion** (Apple Guideline 5.1.1(v)). Apple has required in-app deletion since 2022-06-30 for any app supporting account creation; this rule explicitly extends to automatically-generated guest accounts.
- **#3 — Apple `auth/email-already-in-use` cross-provider collision.** Real users with matching Apple/Google emails cannot currently sign in with Apple if they previously signed in with Google.

Original plan estimate: ~2.5 days combined (1 client + 1 server `onDelete` Cloud Function + Apple JWT revoke for #4; modal-driven `linkWithCredential` merge for #3).

**Reference implementation discovered 2026-05-03:** the sister project at `~/Desktop/my personal projects/drosha` has both flows already shipping in production on the App Store with a strictly simpler approach — **no Cloud Function, no Apple token revoke, no merge modal**. Drosha passed Apple review against this simpler shape, which de-risks shipping the same pattern here.

This spec ports drosha's proven approach verbatim, layered onto our project's parchment design language and translation conventions. New estimate: ~1 day.

## Scope summary

| # | Title | Category |
| --- | --- | --- |
| 1 | `reauthenticate()` helper in `AuthProvider` | feature |
| 2 | `deleteAccount()` flow in `AuthProvider` (5 steps, client-only) | feature |
| 3 | `deleteUserData(uid)` cascade in services | feature |
| 4 | Replace `AccountSection` sign-out row with combined "Delete account & sign out" row + parchment confirm modal | UI |
| 5 | Translation keys (5 new) — EN ported from drosha; KA authored fresh in formal voice | i18n |
| 6 | Email-collision toast in `handleFirebaseCredential` | feature |
| 7 | INFRASTRUCTURE.md §17.4 update (note no Cloud Function / no revoke; reference drosha) | docs |
| 8 | Plan-doc updates: mark #4 IN PROGRESS-via-drosha-pattern, mark #3 DONE-via-toast | docs |

## Explicit non-goals

- **No Cloud Function `onDelete` trigger.** Drosha's auth-flow.md acknowledges the orphaned-data edge case ("Firestore cleanup succeeds but `user.delete()` fails") and accepts it as out of scope for v1. We adopt the same tradeoff.
- **No Apple revoke-tokens REST API call.** Drosha shipped without it and passed App Store review. If Apple rejects the 2.0.0 submission specifically on this requirement, we add the Cloud Function + JWT signing as a v2.1 hotfix — we don't preemptively build it.
- **No `linkWithCredential` merge modal for email collision.** Drosha's toast-only UX is the entire fix. Tradeoff: user must manually retry with the original provider; far less code, no Apple-nonce-already-consumed corner cases.
- **No PRIVACY_POLICY.md authoring** (separate concern; already noted as a parallel ship blocker, deferred per user direction).

---

## Design decisions

### #1 — `reauthenticate()` helper

Firebase requires a recent credential before allowing `user.delete()` (`auth/requires-recent-login`). Drosha solves this by reauthenticating with the original provider just before the cascade.

**Drosha's structure (port verbatim):**

```ts
const reauthenticate = useCallback(async () => {
  if (!user) throw new Error("No user to reauthenticate");

  const providerId = user.providerData[0]?.providerId;

  if (providerId === "google.com") {
    // Re-run the same Google credential acquisition we use for sign-in,
    // then call reauthenticateWithCredential instead of linkWithCredential.
  }

  if (providerId === "apple.com" && IS_IOS) {
    // Same for Apple — fresh nonce, fresh idToken, reauthenticateWithCredential.
  }

  throw new Error(`Unsupported provider: ${providerId}`);
}, [user]);
```

The helper is **only used by `deleteAccount`** — it's not part of the public `useAuth()` value. Anonymous users skip reauthentication entirely (they can't sign back in to an account they already lost; client just calls `user.delete()` directly).

**Refactoring opportunity (out of scope for this spec):** Google and Apple credential acquisition is now duplicated across `signInWithGoogle`, `signInWithApple`, and `reauthenticate`. A future refactor could extract `getGoogleCredential()` / `getAppleCredential()` factories. Not blocking for this work.

### #2 — `deleteAccount()` flow (client-only)

```
User taps "Delete account & sign out" → confirm modal → confirms
  ↓
1. reauthenticate()                  ← if Apple/Google. Skipped for anon.
   └ on failure (user cancels prompt, missing token) → STOP, nothing deleted.
  ↓
2. unregister push token             ← non-blocking; failure does not stop deletion.
   └ removes users/{uid}/push_tokens/{token} from Firestore (drosha lays the
     push token in a per-user subcollection; ours is in the top-level
     push_tokens collection. See deviation note below.)
  ↓
3. deleteUserData(uid)               ← chunked batched Firestore writes.
   └ on failure → STOP, auth account preserved, user can retry.
  ↓
4. user.delete()                     ← Firebase Auth account.
   └ on failure → orphaned auth account but no Firestore data; acceptable.
  ↓
5. onAuthStateChanged fires null → AuthProvider auto-creates fresh anon user.
```

**Why Firestore before Auth?** Firestore rules require `request.auth.uid == uid`. Once Auth is gone, the client loses permission to delete the user's data. So the order is mandatory.

**Why stop on Firestore failure?** If we deleted Auth first and then Firestore failed, the user would have no account but their data would remain — and be undeletable by anyone except an admin. By stopping early, we preserve the user's ability to retry.

**Deviation from drosha — push tokens:** drosha stores push tokens at `users/{uid}/push_tokens/{token}` (subcollection). We store them at `push_tokens/{token}` (top-level), per `INFRASTRUCTURE.md §14.2`. So our step 2 is `unregisterNotifications()` (already exists, deletes from top-level `push_tokens` collection) and step 3's cascade does NOT need to walk a subcollection — it deletes only `users/{uid}` + `game_results/{uid}_*`.

### #3 — `deleteUserData(uid)` cascade

```ts
export const deleteUserData = async (uid: string): Promise<void> => {
  const resultsQuery = query(
    collection(db, "game_results"),
    where("userId", "==", uid),
  );
  const resultsSnapshot = await getDocs(resultsQuery);

  // Firestore batches are limited to 500 operations — chunk if needed.
  const BATCH_LIMIT = 499; // reserve 1 for users/{uid} delete in last chunk.

  if (resultsSnapshot.docs.length === 0) {
    const batch = writeBatch(db);
    batch.delete(doc(db, "users", uid));
    await batch.commit();
    return;
  }

  for (let i = 0; i < resultsSnapshot.docs.length; i += BATCH_LIMIT) {
    const chunk = resultsSnapshot.docs.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach((docSnap) => batch.delete(docSnap.ref));

    const isLastChunk = i + BATCH_LIMIT >= resultsSnapshot.docs.length;
    if (isLastChunk) {
      batch.delete(doc(db, "users", uid));
    }

    await batch.commit();
  }
};
```

**Where it lives:** new file `src/services/firestore-account-deletion.ts` (one purpose, easier to audit). Exported via the `services` barrel.

**Firestore rule update:** the current rule allows `update` on `users/{uid}` if owner, but `delete` is forbidden. We need to flip `users/{uid}` `allow delete` from `false` to `if request.auth.uid == uid`. Same flip on `game_results/{id}` `allow delete` from `false` to `if request.auth.uid == resource.data.userId`. This is a deliberate policy change — owners can now delete their own records — and must be deployed via `firebase deploy --only firestore:rules` BEFORE the binary ships.

**Why not soft-delete (mark `deletedAt` + scheduled hard-delete)?** Apple's guidance frowns on apps that "delete" by hiding. Deletion must be immediate from the user's perspective. Soft-delete also leaves data on the leaderboard query side until a sweeper runs. Drosha hard-deletes; we adopt that.

### #4 — `AccountSection.tsx` UI replacement

Current state: anon hides the section; signed-in shows a single "Sign out" row that opens a parchment confirm modal.

New state: anon hides the section (unchanged); signed-in shows a single **"Delete account & sign out"** row that opens a parchment confirm modal — this row REPLACES the sign-out row, it's not an addition.

**Reasoning for combined button:**
- Drosha precedent (proven UX in production).
- Standalone "Sign out" is awkward on a mobile-only app where the next launch immediately makes a fresh anonymous user — sign-out without delete is functionally equivalent to deletion from the user's POV (they lose access to their leaderboard rank either way; sign-out just leaves the data orphaned in Firestore for cost while delete cleans it up).
- Single destructive primitive is clearer. "What does sign out do?" "What does delete do?" gets collapsed into "what does this red button do? — it's irreversible."

**Visual style:**
- Reuse the existing parchment confirm modal pattern from `AccountSection.tsx` (the close-icon hero, sign-out body copy block, two `GradientWrapper` buttons).
- Header copy: "ანგარიშის წაშლა" / "Delete account?".
- Body copy: warns that all stats, leaderboard rank, and account data are permanently removed — explicit, no euphemism.
- Confirm button label: drosha says "Delete & Sign Out" / "წაშლა". Use ours `t.common_delete_account_button`.
- Confirm button uses `incorrectBorder` color for label text (matches the destructive cue used by the current sign-out row).

**Loading state:** while `deleteAccount()` runs, the confirm button shows a spinner (reuse the `isSigningIn` pattern from Phase 5 polish — disable button + spinner inline). The modal cannot be dismissed while in flight (`onClose={undefined}` when running).

**Cancellation behavior:** if reauth prompt is cancelled (Google sheet dismissed, Apple sheet swiped down), nothing is deleted. The modal remains open with the button re-enabled. The user can retry or cancel the modal. No error toast for cancellation — it's a user choice, not a failure.

**Error states:** if step 2 (push token unregister) fails — silent. If step 3 (Firestore cascade) fails — show a generic toast "Could not delete account, please try again" and re-enable the button. If step 4 (Auth delete) fails — silent (data already gone, user can sign in again to refresh anon).

### #5 — Translation keys

5 new keys in `src/locales/en.json` and `src/locales/ka.json`:

| Key | EN (port from drosha) | KA (author fresh, formal/parchment voice) |
| --- | --- | --- |
| `common_delete_account_row` | Delete account & sign out | ანგარიშის წაშლა და გასვლა |
| `common_delete_account_title` | Delete account? | ანგარიშის წაშლა? |
| `common_delete_account_message` | This will permanently delete your account, all game data, and sign you out. This action cannot be undone. | ეს მოქმედება სამუდამოდ წაშლის თქვენს ანგარიშს, თამაშის ისტორიას და ლიდერბორდის ადგილს. დასაბრუნებელი არაფერი იქნება. |
| `common_delete_account_button` | Delete & sign out | წაშლა და გასვლა |
| `common_account_exists_title` | Account already exists | ანგარიში უკვე არსებობს |
| `common_account_exists_message` | This email is already linked to another sign-in method. Please use the same method you originally signed in with. | ეს ელფოსტა უკვე დაკავშირებულია სხვა მეთოდთან. გთხოვთ, შეხვიდეთ იმავე მეთოდით, რომლითაც პირველად დარეგისტრირდით. |

**Voice notes for KA:**
- Use the formal/literary register established by `t.signin_*` and `t.settings_*` (consistent with the parchment-chronicle tone).
- No Roman numerals; no English loanwords beyond `ლიდერბორდი` (already established).
- Every confirmation uses the same opening structure ("ეს მოქმედება…") to mirror the existing destructive copy.

**Cleanup:** the old `t.settings_signout_*` keys (confirm title, body, button, cancel) are still used by other places? No — `AccountSection.tsx` is the only consumer per `git grep`. Old keys can be deleted in the same commit.

### #6 — Email-collision toast

In `AuthProvider.handleFirebaseCredential`, when the linking flow throws on an anonymous user, drosha catches **both** `auth/email-already-in-use` AND `auth/account-exists-with-different-credential` and shows the same toast. Port verbatim:

```ts
if (
  code === "auth/email-already-in-use" ||
  code === "auth/account-exists-with-different-credential"
) {
  showAccountExistsToast();
  return;
}
```

**Why both codes?** Firebase emits different codes depending on which OAuth path triggers it. `auth/email-already-in-use` from `linkWithCredential`; `auth/account-exists-with-different-credential` from `signInWithCredential` when an email already exists with another provider's credential. Drosha catches both for safety; we do the same.

**Toast component:** we already use `react-native-toast-message` per `package.json`. If we don't currently render `<Toast />` at root, this work adds it. (Drosha imports `showToast` from `helpers`; we'll add an equivalent thin wrapper.)

**Why a toast and not a modal?** Drosha tried this and it worked; their auth-flow.md classifies email-collision as low-frequency edge case ("real users with matching Apple/Google emails"), not a primary flow. A toast is sufficient — the user gets told what happened and what to do, without taking over the screen. A modal would imply the app is "stuck" on a decision, which it isn't (user can just close and try the other provider).

### #7 — INFRASTRUCTURE.md §17.4 update

§17.4 currently reads: *"User-initiated deletion via Settings → Account → 'Delete account'. HARD ship blocker for App Store. Same cascade as 17.3 plus immediate Apple token revoke."*

Update to reflect actual shipped scope:

> User-initiated deletion via Settings → Account → "Delete account & sign out". Client-only cascade (no Cloud Function backstop, no Apple token revoke) — proven at App Store review by the drosha sister project shipping with this exact pattern. If Apple rejects 2.0.0 specifically on the revoke-tokens requirement, add the Cloud Function as a v2.1 hotfix. See `docs/superpowers/specs/2026-05-03-account-deletion-design.md`.

### #8 — Plan-doc updates

In `docs/superpowers/plans/2026-04-29-scoring-leaderboard-plan.md`:

- Deferred follow-up **#4** — change status to **IN PROGRESS** as of 2026-05-03; replace the multi-day Cloud Function + Apple revoke spec with a one-line link to this spec ("Implementation tracked in `docs/superpowers/specs/2026-05-03-account-deletion-design.md` and `…plans/2026-05-04-account-deletion-plan.md`. Effort revised down to ~1 day after adopting drosha's no-Cloud-Function pattern.")
- Deferred follow-up **#3** — change status to **DONE-via-toast (2026-05-03)**; describe the resolved approach (toast on both error codes, no merge modal). Include both error codes in the description so future readers don't relitigate.

---

## Edge cases & interactions

### Anonymous user
- AccountSection hides — no delete row shown. (Existing behavior, unchanged.)
- If they tap delete via some other path (e.g. accessibility tool, debugger), `reauthenticate()` would fail at the `providerId` switch — but it doesn't get called because `isAnonymous` short-circuits the modal.

### Reauth provider unavailable
- Apple-signed user attempts deletion on Android — `reauthenticate()` throws on Apple branch (`IS_IOS` guard). User sees "Could not delete account, please try again" toast.
- This shouldn't happen in practice — a user with `apple.com` provider only ever signed in on iOS — but Firebase doesn't enforce this. Drosha doesn't guard explicitly either. We accept this gap.

### Multiple providers linked
- `user.providerData[0]?.providerId` picks the first. If a user linked both Google and Apple (rare, requires explicit linking which we don't expose), reauth uses whichever is first. Drosha pattern. Acceptable.

### Pending offline results
- `usePendingResultsReplay()` watches auth state. After deletion → fresh anon user → replay tries to write pending results under the new uid. Firestore rule rejects (`game_results` rule requires `userId == request.auth.uid`, and the queued items have the OLD uid). Result: pending results stay in the queue indefinitely, occupying up to `PENDING_RESULTS_QUEUE_CAP = 20` slots forever.
  - **Mitigation:** in step 1 (or step 2) of `deleteAccount`, clear `pending-results` AsyncStorage queue. Add a one-line `await clearPendingResults()` call. Trivial; prevents zombie queue.

### MilestoneNudgeModal
- Removed in Phase 5 polish pass (commit `76465ca`). No interaction with deletion flow.

### Force-update gate
- `useForceUpdateGate()` runs at app boot, independent of auth state. Deletion does not affect it.

### Local lifetime stats / recent games
- Lives in AsyncStorage, not Firestore. Per `INFRASTRUCTURE.md §17.2`, signing out does NOT wipe these. **Decision needed:** does delete-account ALSO preserve local stats?
  - **Drosha:** their stats screen sources from Firestore, so deletion wipes their stats automatically.
  - **Ours:** stats screen sources from AsyncStorage. After deletion, the fresh anon user keeps the previous user's lifetime stats / recent games on their device — visually weird (leaderboard rank gone but stats intact).
  - **Recommendation:** also wipe `local-lifetime-stats` + `local-recent-games` AsyncStorage keys in step 2. Mirrors the user's mental model of "delete everything."
  - **Alternative:** preserve them (some users might prefer not to lose their personal stats). Less destructive but inconsistent with the modal copy ("This will permanently delete your account, all game data, and sign you out").
  - **Locking in:** wipe them. Modal copy and user expectation align with hard delete.

---

## Test plan

### Android dev-client smoke (every test runs against a fresh `pm clear`)

1. **Anon → delete attempted via debugger** — confirm AccountSection truly hides; no path to delete for anon.
2. **Anon → Google sign-in → play 1 game → delete** — modal opens; tap confirm; Google reauth prompt appears; user taps OK; cascade runs; auth state clears; new anon UID issued; AccountSection hides again; leaderboard now shows the fresh anon (no entry).
3. **Anon → Google sign-in → play 1 game → delete → cancel reauth prompt** — modal stays open, no data deleted, button re-enabled.
4. **Same as #2 but reauth prompt is bypassed (user closes Google sheet)** — confirm nothing is deleted.
5. **Email-collision toast** — sign in with Google on Android, sign out, sign in with Apple using the same email on iOS. Toast appears on iOS sign-in attempt; nothing gets linked.

### iOS dev-client smoke (deferred, blocked on follow-up #1)

- Same #2 + #3 + #5 with Apple as primary provider.
- Verify Apple's Sign In with Apple "Apps Using Apple ID" entry remains after deletion (because we don't revoke). This is the visible signal that we DIDN'T do the revoke. If Apple App Review checks this manually, this is the failure point. Live with it; revisit if rejected.

### Firestore rules

- Manual emulator test: create user, attempt to delete `users/{uid}` as a different authenticated UID — rejected. Attempt as the owner — succeeds. Same for `game_results`.

### Lint + type-check + tests

- `npm run lint`, `npx tsc --noEmit`, `npx jest --no-watchAll` — all pass before committing.
- New unit tests:
  - `deleteUserData(uid)` — mock Firestore, verify chunking with 0 / 1 / 499 / 500 / 1000 game_results entries.
  - `handleFirebaseCredential` — mock the link failure, verify toast is invoked for both error codes.

---

## Files touched (preview — full list in plan doc)

**Source:**
- `src/context/AuthProvider.tsx` (~+90 lines: `reauthenticate` + `deleteAccount` + email-collision branch)
- `src/services/firestore-account-deletion.ts` (new file, ~30 lines)
- `src/services/index.ts` (barrel export)
- `src/components/app-settings/AccountSection.tsx` (~rewrite — same skeleton, new copy + handler)
- `src/components/app-settings/styles.ts` (minor — destructive button color tweak)
- `src/helpers/showToast.ts` (new file or addition to `helpers/index.ts` — thin wrapper around `react-native-toast-message`)
- `src/services/pending-results.ts` (add `clearPendingResults()`; integrate into deletion step 2)
- `src/services/local-lifetime-stats.ts` (add `clearLifetimeStats()`)
- `src/services/local-recent-games.ts` (add `clearRecentGames()`)
- `App.tsx` (add `<Toast />` at root if not already present)
- `src/locales/en.json` + `src/locales/ka.json` (5 new keys; remove old `t.settings_signout_*`)

**Config:**
- `firestore.rules` (flip `delete: false` → `delete: if owner` on `users/{uid}` and `game_results/{id}`)

**Docs:**
- `INFRASTRUCTURE.md` §17.4 (revised scope)
- `docs/superpowers/plans/2026-04-29-scoring-leaderboard-plan.md` (status updates on #3 + #4)
- `docs/superpowers/plans/2026-05-04-account-deletion-plan.md` (new, sister to this spec)

**Tests:**
- `src/__tests__/firestore-account-deletion.test.ts` (new)
- Possibly extend an existing AuthProvider test, if one exists.

---

## Open questions

1. **`<Toast />` root mount:** is `react-native-toast-message` already mounted at root, or do we need to add it? Need to grep `App.tsx`. (Pulled from `package.json` deps but not visible in `App.tsx` import list — likely needs to be added.)
2. **Old translation keys:** confirm `t.settings_signout_*` is consumed only by `AccountSection.tsx` before deletion. Quick grep at implementation time.
3. **Local-stats wipe:** locked in as YES per the §17.2 reasoning above. If you disagree, flip the recommendation; the rest of the spec absorbs that easily.
