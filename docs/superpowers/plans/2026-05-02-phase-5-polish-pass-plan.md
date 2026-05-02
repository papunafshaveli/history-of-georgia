# Phase 5 Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the 12 polish-pass issues identified during 2026-05-02 iOS verification and triaged into design / polish / tech-bug categories — sign-in surface simplification, Stats local-storage rewire, Leaderboard podium, parchment Modal redesign, force-update soft/hard split, GameSummary score-tier copy, MilestoneNudgeModal removal, and `isSigningIn` loading state.

**Architecture:** Sequence of **8 commits** on `Add-question-variations`. Steps ordered to land cleanup + small fixes first (low risk, fast feedback), then paired UI changes that complete the "sign-in only on Leaderboard tab" model, then the broader Modal-component refactor last (highest blast radius). Each step is one logical scope per commit, explicit user permission per commit, never push to main. No code shipped beyond what's in the spec.

**Tech Stack:** React Native 0.83.4, Expo SDK 55, TypeScript, Firebase 11.1.0 (Auth + Firestore), AsyncStorage, React Navigation 7. Test runner: Jest (`jest-expo` preset). Lint: `expo lint`. Type-check: `npx tsc --noEmit`.

**Spec:** `docs/superpowers/specs/2026-05-02-phase-5-polish-pass-design.md`

---

## File Structure

### New files

- `src/services/local-lifetime-stats.ts` — local lifetime-stats accumulator (read/write AsyncStorage). One responsibility: persist + read aggregate game stats locally.
- `src/hooks/useLifetimeStats.ts` — React hook wrapping the service with focus-based refetch + 5-min in-memory cache. Stats screen consumer.
- `src/screens/main-screens/leaderboard-screen/LeaderboardPodium.tsx` — top-3 podium component for the signed-in Leaderboard. Self-contained: takes `{ entries, currentUid }`, renders nothing if entries < 3.
- `src/components/sign-in/SoftUpdateModal.tsx` — dismissible "new version available" modal. Mirrors `ForceUpdateModal` shape with secondary "Later" button.
- `src/services/__tests__/local-lifetime-stats.test.ts` — Jest unit tests for the new service.
- `src/utils/__tests__/semver.test.ts` *(if not already covered)* — boundary tests added incidentally for the soft/hard gate logic.

### Removed files

- `src/components/sign-in/MilestoneNudgeModal.tsx` — design decision to remove sign-in-as-router modal entirely.

### Modified files (by step)

| Step | Files |
| --- | --- |
| 1 — Remove MilestoneNudgeModal | `src/components/sign-in/index.ts` (or wherever the barrel is), `src/hooks/useGameScreen.tsx`, `src/components/game-modals/GameModals.tsx` (or wherever the modal renders), `src/locales/en.json`, `src/locales/ka.json` |
| 2 — GameSummary tier copy | `src/components/game-summary/GameSummary.tsx`, `src/locales/en.json`, `src/locales/ka.json` |
| 3 — Auth `isSigningIn` | `src/context/AuthProvider.tsx`, `src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx`, `src/components/app-settings/AccountSection.tsx` |
| 4 — Lean anon + Settings simplification | `src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx`, `src/screens/main-screens/leaderboard-screen/styles.ts`, `src/components/app-settings/AccountSection.tsx`, `src/components/app-settings/AppSettings.tsx`, `src/locales/en.json`, `src/locales/ka.json` |
| 5 — Top-3 podium | `src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx`, `src/screens/main-screens/leaderboard-screen/styles.ts` |
| 6 — Stats local rewire | `src/screens/main-screens/stats-screen/StatsScreen.tsx`, `src/hooks/useGameScreen.tsx`, `src/hooks/index.ts` |
| 7 — Parchment Modal redesign | `src/components/modal/Modal.tsx`, `src/components/app-settings/AppSettings.tsx`, `src/components/rules/Rules.tsx`, `src/components/sign-in/ConfirmNameModal.tsx`, `src/components/sign-in/ForceUpdateModal.tsx` |
| 8 — Soft/hard update split | `src/hooks/useForceUpdateGate.ts`, `App.tsx`, `src/components/sign-in/index.ts`, `src/locales/en.json`, `src/locales/ka.json` |

### Files to verify (read but not modify)

- `src/services/firestore-game-result.ts` — referenced by `useGameScreen.tsx` end-of-game flow; we add a `recordGame` call alongside the existing `saveGameAndUpdateStats`, no edit
- `src/services/firestore-user.ts` — `useUserStats` consumer survives in Leaderboard own-rank caption; not touched

---

## Verification commands (used throughout)

```bash
# Lint
npm run lint

# Type-check
npx tsc --noEmit

# Run a specific test file
npx jest <path> --no-watchAll

# Run all tests one-shot
npx jest --no-watchAll

# Confirm no orphaned references
grep -rn "<symbol>" src/ --include="*.ts" --include="*.tsx"

# Working tree status
git status
```

Every commit step assumes lint, type-check, and relevant tests pass first. Hooks are not skipped (no `--no-verify`).

---

## Task 1: Remove MilestoneNudgeModal (Issue #6)

**Why:** The MilestoneNudgeModal violates the user's "no modal as one-step router for sign-in CTAs" preference. Sign-in now lives only on the Leaderboard tab anonymous state. Deleting it first reduces blast radius for later steps.

**Files:**
- Delete: `src/components/sign-in/MilestoneNudgeModal.tsx`
- Modify: `src/components/sign-in/index.ts` *(or `src/components/index.ts` — the barrel that re-exports `MilestoneNudgeModal`)*
- Modify: `src/hooks/useGameScreen.tsx`
- Modify: `src/components/game-modals/GameModals.tsx` *(or wherever `<MilestoneNudgeModal>` is rendered — locate via grep first)*
- Modify: `src/locales/en.json`
- Modify: `src/locales/ka.json`

### Steps

- [ ] **Step 1.1: Locate every reference to MilestoneNudgeModal**

```bash
grep -rn "MilestoneNudgeModal\|milestone" src/ --include="*.ts" --include="*.tsx" --include="*.json"
```

Expected: hits in `src/components/sign-in/MilestoneNudgeModal.tsx`, the barrel export, `useGameScreen.tsx`, the parent that renders it, and four keys in each locales file (`milestone_title`, `milestone_body`, `milestone_subbody`, `milestone_skip_button`). Note exact file paths returned.

- [ ] **Step 1.2: Delete the component file**

```bash
git rm src/components/sign-in/MilestoneNudgeModal.tsx
```

- [ ] **Step 1.3: Remove the barrel export line**

In the barrel file located in step 1.1 (likely `src/components/sign-in/index.ts` or `src/components/index.ts`):

Remove the line:
```ts
export { default as MilestoneNudgeModal } from "./MilestoneNudgeModal";
```

- [ ] **Step 1.4: Remove the modal render JSX**

In whichever file renders `<MilestoneNudgeModal>` (likely `src/components/game-modals/GameModals.tsx`):

Remove the JSX block:
```tsx
<MilestoneNudgeModal
  isVisible={modals.milestone}
  ...
/>
```

And remove the `MilestoneNudgeModal` import line.

- [ ] **Step 1.5: Strip the trigger logic from useGameScreen**

In `src/hooks/useGameScreen.tsx`:

Find the `GameState` type and remove the `milestone: boolean` field from `modals`. In the initial state object, remove `milestone: false`.

Find the end-of-game flow (where `crowns === 0` triggers GameSummary). Remove:
- Any code that reads `useUserStats` to snapshot `bestSingleGameScore` *before* the game-end transaction (this was specifically there to feed the milestone comparison)
- The condition `score > previousBest && isAnonymous && !hasSeenSignInNudge`
- The dispatch that sets `modals.milestone = true`
- Any post-dismiss handler that writes `users/{uid}.hasSeenSignInNudge = true`

The simplified end-of-game flow now: when `crowns === 0`, dispatch GameSummary open directly.

- [ ] **Step 1.6: Drop translation keys**

In `src/locales/en.json` and `src/locales/ka.json`, delete these four keys from each file:

```json
"milestone_title": "...",
"milestone_body": "...",
"milestone_subbody": "...",
"milestone_skip_button": "..."
```

- [ ] **Step 1.7: Verify zero references remain**

```bash
grep -rn "milestone" src/ --include="*.ts" --include="*.tsx" --include="*.json"
```

Expected: empty output. If any matches remain (other than the dropped JSON keys), they must be cleaned up.

- [ ] **Step 1.8: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero errors. If `useUserStats` is now an unused import in `useGameScreen.tsx`, remove the import line.

- [ ] **Step 1.9: Smoke test on dev-client**

Manual:
1. Launch app on Android emulator or iOS dev-client.
2. Play a game as anonymous, score above your previous best.
3. Trigger crowns = 0.

Expected: GameSummary modal opens directly. No MilestoneNudgeModal interrupts.

- [ ] **Step 1.10: Ask user permission to commit**

Pause. Display the diff summary:
```bash
git status
git diff --stat
```

Wait for user confirmation before next step.

- [ ] **Step 1.11: Commit**

```bash
git add -A  # only if user has confirmed file list above is correct
# Otherwise list explicit paths:
git add src/components/sign-in/index.ts \
        src/hooks/useGameScreen.tsx \
        src/components/game-modals/GameModals.tsx \
        src/locales/en.json src/locales/ka.json
git rm src/components/sign-in/MilestoneNudgeModal.tsx

git commit -m "$(cat <<'EOF'
Remove MilestoneNudgeModal — sign-in lives on Leaderboard tab only.

Per polish-pass design (2026-05-02). Drops the post-game sign-in nudge
that violated the no-modal-as-router preference. Sign-in CTAs now
consolidate on the Leaderboard tab anonymous state and Settings sign-out
only. The users/{uid}.hasSeenSignInNudge field stays as deprecated and
ages out without a migration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: GameSummary tier copy keys off score (Issue #7)

**Why:** The big-circle score number was switched to points in commit `a2727a7`, but the descriptive tier text below it still keys off `correctCount / totalQuestions` accuracy. With score now the canonical achievement metric, tier copy should follow.

**Files:**
- Modify: `src/components/game-summary/GameSummary.tsx`
- Modify: `src/locales/en.json`
- Modify: `src/locales/ka.json`

### Steps

- [ ] **Step 2.1: Locate the existing tier-resolution function**

```bash
grep -n "feedback_low\|feedback_medium\|feedback_high\|feedback_excellent\|feedback_outstanding" src/components/game-summary/GameSummary.tsx
```

Expected: 5 matches, all inside one helper function (call it `resolveTierKey` for reference).

- [ ] **Step 2.2: Add new translation keys**

In `src/locales/en.json` add (replacing the dropped keys' lines with the new ones, alphabetical or near the existing `feedback_*` block):

```json
"gamesummary_tier_beginner": "Solid start — keep going!",
"gamesummary_tier_solid": "Well done.",
"gamesummary_tier_strong": "Strong result — you know your Georgian history.",
"gamesummary_tier_expert": "Exceptional result — leaderboard royalty.",
```

In `src/locales/ka.json`:

```json
"gamesummary_tier_beginner": "კარგი დასაწყისია — განაგრძე!",
"gamesummary_tier_solid": "კარგად გაართვი თავი.",
"gamesummary_tier_strong": "ძლიერი შედეგი — საქართველოს ისტორიკოსი ხარ.",
"gamesummary_tier_expert": "განსაკუთრებული შედეგი — ლიდერბორდის მზე ხარ.",
```

(Wording is a draft — user refines during impl review.)

- [ ] **Step 2.3: Remove dropped translation keys**

Delete from both `en.json` and `ka.json`:
- `feedback_low`
- `feedback_medium`
- `feedback_high`
- `feedback_excellent`
- `feedback_outstanding`

Verify they aren't referenced anywhere else first:

```bash
grep -rn "feedback_low\|feedback_medium\|feedback_high\|feedback_excellent\|feedback_outstanding" src/ --include="*.ts" --include="*.tsx"
```

Expected: only `GameSummary.tsx` matches. After we update GameSummary, this grep should return empty.

- [ ] **Step 2.4: Replace tier-resolution logic**

In `src/components/game-summary/GameSummary.tsx`, find the helper function from step 2.1 and replace its body. Before:

```ts
// Old (accuracy-based, illustrative — exact form may vary):
const resolveTierKey = (correctCount: number, totalQuestions: number) => {
  const ratio = correctCount / totalQuestions;
  if (ratio >= 0.95) return "feedback_outstanding";
  if (ratio >= 0.8) return "feedback_excellent";
  if (ratio >= 0.6) return "feedback_high";
  if (ratio >= 0.4) return "feedback_medium";
  return "feedback_low";
};
```

After (score-based, 4 bands per spec):

```ts
const resolveTierKey = (score: number) => {
  if (score >= 301) return "gamesummary_tier_expert";
  if (score >= 151) return "gamesummary_tier_strong";
  if (score >= 51) return "gamesummary_tier_solid";
  return "gamesummary_tier_beginner";
};
```

Update the call site to pass `score` instead of `correctCount, totalQuestions`. Likely:

```tsx
// Before:
<AppText>{t[resolveTierKey(correctCount, totalQuestions)]}</AppText>
// After:
<AppText>{t[resolveTierKey(score)]}</AppText>
```

- [ ] **Step 2.5: Confirm no other consumer of dropped keys**

```bash
grep -rn "feedback_low\|feedback_medium\|feedback_high\|feedback_excellent\|feedback_outstanding" src/ --include="*.ts" --include="*.tsx"
```

Expected: empty output.

- [ ] **Step 2.6: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero errors.

- [ ] **Step 2.7: Smoke test on dev-client**

Manual: play 4 games hitting different score bands.

| Target band | Aim for ~score | Expected tier copy |
| --- | --- | --- |
| Beginner | 30 | "Solid start — keep going!" |
| Solid | 100 | "Well done." |
| Strong | 200 | "Strong result — you know your Georgian history." |
| Expert | 350 | "Exceptional result — leaderboard royalty." |

For each game, end with crowns = 0 and verify GameSummary's tier text matches the expected band.

- [ ] **Step 2.8: Ask user permission to commit + refine Georgian wording**

Pause. Show the diff. Ask user to refine the Georgian tier strings if desired (per spec follow-up #1) before committing.

- [ ] **Step 2.9: Commit**

```bash
git add src/components/game-summary/GameSummary.tsx \
        src/locales/en.json src/locales/ka.json
git commit -m "$(cat <<'EOF'
GameSummary tier copy now keys off score, not accuracy.

Per polish-pass design (2026-05-02). Replaces the 5-tier feedback_*
strings (low/medium/high/excellent/outstanding) keyed off
correctCount/totalQuestions accuracy with 4-tier gamesummary_tier_*
strings keyed off the score band:

  0–50    → beginner
  51–150  → solid
  151–300 → strong
  301+    → expert

The big-circle score number is unchanged (already wired to score in
a2727a7). Only the descriptive line below shifts from accuracy- to
score-based.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Auth loading state — `isSigningIn` (Issue #9)

**Why:** During in-flight OAuth or sign-out, no loader shows and other actions stay tappable. Risks: double-taps trigger duplicate calls, tapping the other provider mid-flow races, navigation orphans the operation. Add a centralised flag to AuthContextValue; consumers gate UI on it.

**Files:**
- Modify: `src/context/AuthProvider.tsx`
- Modify: `src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx` (small disable-state plumbing on the *current* layout — full Lean redesign is Task 4)
- Modify: `src/components/app-settings/AccountSection.tsx`

### Steps

- [ ] **Step 3.1: Add isSigningIn to AuthContextValue type**

In `src/context/AuthProvider.tsx`, find the `AuthContextValue` type and add the field:

```ts
type AuthContextValue = {
  user: User | null;
  uid: string | null;
  isAnonymous: boolean;
  isAuthenticating: boolean;
  isSigningIn: boolean;            // NEW
  signInWithGoogle: () => Promise<SignInResult>;
  signInWithApple: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  bumpAuthVersion: () => void;
};
```

In the `defaultContext` literal further down, add:

```ts
const defaultContext: AuthContextValue = {
  // ...existing fields...
  isSigningIn: false,
  // ...
};
```

- [ ] **Step 3.2: Add the useState hook**

Inside the `AuthProvider` component, near the existing `useState<User | null>` line:

```ts
const [isSigningIn, setIsSigningIn] = useState(false);
```

- [ ] **Step 3.3: Wrap signInWithGoogle in try/finally**

In the `signInWithGoogle` `useCallback`, wrap the entire body:

```ts
const signInWithGoogle = useCallback(async (): Promise<SignInResult> => {
  setIsSigningIn(true);
  try {
    // ...all existing body...
  } finally {
    setIsSigningIn(false);
  }
}, [bumpAuthVersion]);
```

Important: keep all existing catch-and-rethrow logic inside the try. The `finally` only resets `isSigningIn`.

- [ ] **Step 3.4: Wrap signInWithApple identically**

Same pattern — `setIsSigningIn(true)` at top, `finally { setIsSigningIn(false) }` wrapping the whole body.

- [ ] **Step 3.5: Wrap signOut**

In the `signOut` `useCallback`:

```ts
const signOut = useCallback(async () => {
  setIsSigningIn(true);
  try {
    try {
      await GoogleSignin.signOut();
    } catch {
      // Best-effort — Google session may already be cleared
    }
    await firebaseSignOut(auth);
  } finally {
    setIsSigningIn(false);
  }
}, []);
```

- [ ] **Step 3.6: Expose isSigningIn in memoised context value**

Find the `useMemo` that builds the context value. Add `isSigningIn` to the payload AND to the dependency array:

```ts
const value = useMemo<AuthContextValue>(
  () => ({
    user,
    uid: user?.uid ?? null,
    isAnonymous: user?.isAnonymous ?? true,
    isAuthenticating,
    isSigningIn,                          // NEW
    signInWithGoogle,
    signInWithApple,
    signOut,
    updateDisplayName,
    bumpAuthVersion,
  }),
  [
    user,
    authVersion,
    isAuthenticating,
    isSigningIn,                          // NEW
    signInWithGoogle,
    signInWithApple,
    signOut,
    updateDisplayName,
    bumpAuthVersion,
  ],
);
```

- [ ] **Step 3.7: Add `disabled` prop to ProviderButton**

In `src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx`, find the inline `ProviderButton` component (lines 35–80 today) and extend its props:

```tsx
type ProviderButtonProps = {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap | "logo-apple";
  onPress: () => void;
  disabled?: boolean;                     // NEW
};

const ProviderButton: React.FC<ProviderButtonProps> = ({
  label,
  iconName,
  onPress,
  disabled,                                // NEW
}) => {
  // ...

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}    // NEW
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}                              // NEW
    >
      {/* ...existing children... */}
    </Pressable>
  );
};
```

Note: the existing `buttonStyle` callback returns dimmed-on-pressed style. Extend the callback to also dim when disabled (visual cue):

```ts
const buttonStyle = useCallback(
  ({ pressed }: { pressed: boolean }) => {
    const base = pressed
      ? [styles.signInButton, styles.signInButtonPressed]
      : styles.signInButton;
    return disabled ? [base, { opacity: 0.4 }] : base;
  },
  [styles, disabled],
);
```

- [ ] **Step 3.8: Wire isSigningIn into LeaderboardScreen anonymous branch**

In `LeaderboardScreen.tsx`, pull `isSigningIn` from `useAuth`:

```tsx
const { isAnonymous, uid, isSigningIn, signInWithGoogle, signInWithApple } =
  useAuth();
```

Pass `disabled` to both `ProviderButton` instances:

```tsx
<ProviderButton
  label={t.signin_button_google}
  iconName="google"
  onPress={handleGooglePress}
  disabled={isSigningIn}                  // NEW
/>
{showApple ? (
  <ProviderButton
    label={t.signin_button_apple}
    iconName="logo-apple"
    onPress={handleApplePress}
    disabled={isSigningIn}                // NEW
  />
) : null}
```

Add a centered `<Loading />` overlay above the providers stack while signing in. If `<Loading />` is the existing `src/components/loading/Loading.tsx`, use it; otherwise import `ActivityIndicator` from RN:

```tsx
{isSigningIn ? (
  <View style={styles.signingInOverlay}>
    <Loading />
  </View>
) : null}
```

Add the corresponding style in `styles.ts`:

```ts
signingInOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0, 0, 0, 0.05)",  // theme.colors.parchmentTint? — pick existing token, do not hardcode
  zIndex: theme.zIndex.overlay,
},
```

(Use a real theme token; the literal above is illustrative — adapt to what's defined in `src/theme/colors.ts` and `src/theme/zIndex.ts`. Per styling rules: never hardcode colours.)

- [ ] **Step 3.9: Wire isSigningIn into AccountSection sign-out**

In `src/components/app-settings/AccountSection.tsx`, pull `isSigningIn`:

```tsx
const { isSigningIn, signOut } = useAuth();
```

Disable the sign-out row when signing in. If the row is a Pressable, set `disabled={isSigningIn}` on it. Show an inline spinner via `ActivityIndicator`:

```tsx
{isSigningIn ? (
  <ActivityIndicator size="small" color={colors.bronzeDark} />
) : null}
```

For the sign-out confirmation Modal's "Confirm" button, also set `disabled={isSigningIn}`. Adapt to whatever Pressable / button pattern is in use.

- [ ] **Step 3.10: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero errors.

- [ ] **Step 3.11: Smoke test on dev-client**

Manual:

1. Anonymous user opens Leaderboard → tap Google → expect: spinner overlay appears, both Google and Apple buttons greyed (40% opacity), taps are no-ops. After OAuth resolves, spinner gone, buttons normal.
2. Tap Google twice in quick succession → only one OAuth window opens.
3. Sign-in successful → go to Settings → tap Sign out → confirmation modal → tap Confirm → expect: Confirm button disables, spinner shows in row, after auth state resolves to fresh anonymous, modal dismisses normally.

- [ ] **Step 3.12: Ask user permission to commit**

Pause. Show diff. Wait for confirmation.

- [ ] **Step 3.13: Commit**

```bash
git add src/context/AuthProvider.tsx \
        src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx \
        src/screens/main-screens/leaderboard-screen/styles.ts \
        src/components/app-settings/AccountSection.tsx
git commit -m "$(cat <<'EOF'
Add isSigningIn flag to AuthProvider; gate UI on it.

Per polish-pass design (2026-05-02). Wraps signInWithGoogle,
signInWithApple, and signOut bodies in try/finally that toggles a
new isSigningIn boolean on AuthContextValue. Consumers (Leaderboard
anon-state buttons, AccountSection sign-out row) disable when the
flag is true and surface a spinner. Prevents double-tap duplicate
OAuth calls and cross-provider race conditions.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Lean Leaderboard anonymous state + Settings auth simplification (Issues #0 + #1)

**Why:** Together these two changes complete the "sign-in lives only on Leaderboard tab" model. Splitting them creates a transient state where Settings still has sign-in but Leaderboard already shows the new value-prop layout — incoherent for any user reviewing the branch mid-step.

**Files:**
- Modify: `src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx`
- Modify: `src/screens/main-screens/leaderboard-screen/styles.ts`
- Modify: `src/components/app-settings/AccountSection.tsx`
- Modify: `src/components/app-settings/AppSettings.tsx`
- Modify: `src/locales/en.json`
- Modify: `src/locales/ka.json`

### Steps

- [ ] **Step 4.1: Add new translation key, drop dead key**

In `src/locales/en.json`:

```json
"leaderboard_anon_headline": "Compete with players across Georgia",
```

In `src/locales/ka.json`:

```json
"leaderboard_anon_headline": "შეეჯიბრე საქართველოს მცოდნეებს",
```

Delete from both files:

```json
"leaderboard_signin_button_top": "..."
```

(Confirmed unreferenced via grep on 2026-05-02.)

- [ ] **Step 4.2: Update sign-out confirmation copy**

In both `en.json` and `ka.json`, replace the value of `settings_signout_confirm_body`:

```json
// en.json
"settings_signout_confirm_body": "Signing out from this Google account. Your stats are saved to Google — sign back in any time."

// ka.json
"settings_signout_confirm_body": "გასვლა გავა Google-ის ანგარიშიდან. შენი სტატისტიკა შენახულია Google-ზე — ნებისმიერ დროს დაბრუნდი."
```

(User refines wording during impl review.)

- [ ] **Step 4.3: Replace anonymous branch JSX in LeaderboardScreen**

In `src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx`, find the `{isAnonymous ? ( ... ) : ( ... )}` ternary in the return. Replace the anonymous branch (currently a `<ScrollView>` wrapping a `<View style={styles.providersStack}>`) with:

```tsx
<View style={styles.anonGate}>
  <View style={styles.anonIconCircle}>
    <MaterialCommunityIcons
      name="script-text-outline"
      size={getAdjustedWidth(36)}
      color={colors.bronzeDark}
    />
  </View>
  <AppText
    type="title"
    fontFamily="serif"
    color={colors.bronzeDark}
    style={styles.anonHeadline}
  >
    {t.leaderboard_anon_headline}
  </AppText>
  <View style={styles.anonButtonsStack}>
    <ProviderButton
      label={t.signin_button_google}
      iconName="google"
      onPress={handleGooglePress}
      disabled={isSigningIn}
    />
    {showApple ? (
      <ProviderButton
        label={t.signin_button_apple}
        iconName="logo-apple"
        onPress={handleApplePress}
        disabled={isSigningIn}
      />
    ) : null}
  </View>
  {isSigningIn ? (
    <View style={styles.signingInOverlay}>
      <Loading />
    </View>
  ) : null}
</View>
```

Remove the `<ScrollView>` and `<RefreshControl>` from the anonymous branch — the new gate has no scroll. The signed-in branch keeps its own `ScrollView` + `RefreshControl`.

Ensure `getAdjustedWidth` is imported from `@/src/helpers` if not already.

- [ ] **Step 4.4: Update styles.ts with anon-gate styles**

In `src/screens/main-screens/leaderboard-screen/styles.ts`, inside the existing `getStyles` function, add to the StyleSheet:

```ts
anonGate: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: theme.spacing.x6,
},
anonIconCircle: {
  width: getAdjustedWidth(64),
  height: getAdjustedWidth(64),
  borderRadius: theme.borderRadius.full,
  backgroundColor: theme.colors.parchmentTint,
  borderWidth: 2,
  borderColor: theme.colors.bronzeDark,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: theme.spacing.x4,
},
anonHeadline: {
  textAlign: "center",
  marginBottom: theme.spacing.x8,
  paddingHorizontal: theme.spacing.x4,
},
anonButtonsStack: {
  width: "100%",
  rowGap: theme.spacing.x3,
},
```

`signingInOverlay` already added in Task 3 — confirm it exists in `styles.ts`. If you used inline approach there, lift to `styles.ts` now.

Remove the no-longer-used `providersStack` style from `getStyles` if it's not referenced anywhere else (the old anonymous branch was its sole consumer). Verify with grep:

```bash
grep -rn "providersStack" src/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 4.5: Simplify AccountSection — anonymous returns null**

In `src/components/app-settings/AccountSection.tsx`, at the top of the JSX:

```tsx
const AccountSection: React.FC = () => {
  const t = useTranslation();
  const { isAnonymous, isSigningIn, signOut } = useAuth();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  // ...other hooks...

  if (isAnonymous) {
    return null;                          // NEW: anonymous users see no Account section
  }

  // ...remaining signed-in branch...
};
```

In the signed-in branch: keep ONLY the sign-out row. Remove any inline Google / Apple sign-in rendering, any Display name row (deferred per spec parent), and any provider chip rendering. The signed-in body becomes:

```tsx
<View style={styles.section}>
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={t.settings_signout_button}
    onPress={handleSignOutPress}
    disabled={isSigningIn}
    style={signOutRowStyle}
  >
    <MaterialCommunityIcons
      name="logout"
      size={getAdjustedWidth(22)}
      color={colors.incorrectBorder}
    />
    <AppText fontFamily="serif" color={colors.incorrectBorder}>
      {t.settings_signout_button}
    </AppText>
    {isSigningIn ? (
      <ActivityIndicator size="small" color={colors.incorrectBorder} />
    ) : null}
  </Pressable>

  <Modal
    isVisible={isConfirmOpen}
    headerTitle={t.settings_signout_confirm_title}
    onClose={handleConfirmClose}
    renderComponent={
      <SignOutConfirmBody
        onCancel={handleConfirmClose}
        onConfirm={handleConfirm}
        isLoading={isSigningIn}
      />
    }
  />
</View>
```

(Adapt to the existing component shape — these are illustrative; use whatever Pressable, Modal, and confirm-body components are in the file today.)

- [ ] **Step 4.6: Reorder AccountSection in AppSettings**

In `src/components/app-settings/AppSettings.tsx`, ensure the JSX order is:

```tsx
{/* Vibration toggle */}
{/* Sound toggle */}
{/* Push notifications toggle (if present) */}
{/* Theme switcher */}
<AccountSection />
```

`AccountSection` must mount AFTER the theme switcher. If it's currently above, move it to the bottom.

- [ ] **Step 4.7: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero errors. If `Loading` import is unused anywhere, remove. If `MaterialCommunityIcons` is now needed in `LeaderboardScreen.tsx` for the new icon, ensure import is present.

- [ ] **Step 4.8: Smoke test on dev-client (anonymous)**

1. Open as anonymous (delete + reinstall app, or use `adb shell pm clear com.papunafshaveli.historyofgeorgia` on Android).
2. Tap Leaderboard tab → expect: Lean layout — script-text-outline icon in bronze-bordered parchment circle, headline "შეეჯიბრე საქართველოს მცოდნეებს" centered, two full-width sign-in buttons (Apple iOS-only).
3. Tap Settings → open the gear → expect: NO Account section visible at all. Modal contains only toggles + theme switcher; theme switcher is fully on-paper (no overflow at bottom).

- [ ] **Step 4.9: Smoke test on dev-client (signed-in)**

1. Sign in with Google from the Lean layout → ConfirmNameModal appears → save → user shown on leaderboard.
2. Open Settings → expect: toggles → theme switcher → sign-out row at the bottom (below theme).
3. Tap Sign out → confirmation Modal opens → body text shows the new wording ("Your stats are saved to Google — sign back in any time").
4. Confirm → sign-out completes → fresh anonymous → relaunch Leaderboard → Lean layout again.

- [ ] **Step 4.10: Ask user permission to commit + refine Georgian wording**

Pause. Diff. Allow user to refine `leaderboard_anon_headline` Georgian if desired before commit.

- [ ] **Step 4.11: Commit**

```bash
git add src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx \
        src/screens/main-screens/leaderboard-screen/styles.ts \
        src/components/app-settings/AccountSection.tsx \
        src/components/app-settings/AppSettings.tsx \
        src/locales/en.json src/locales/ka.json
git commit -m "$(cat <<'EOF'
Sign-in lives only on Leaderboard tab — Lean anon layout + Settings cleanup.

Per polish-pass design (2026-05-02). Two paired changes:

1. Leaderboard anonymous state — replace sparse-buttons-only branch with
   drosha-style full-screen gate: script-text-outline icon, bold headline
   ("შეეჯიბრე საქართველოს მცოდნეებს"), full-width Google + Apple buttons.
   Removes ScrollView + RefreshControl (refresh is meaningless without
   data). Adds leaderboard_anon_headline translation key. Drops dead
   leaderboard_signin_button_top key.

2. Settings AccountSection — anonymous branch now returns null entirely.
   Signed-in branch keeps only the sign-out row, repositioned below the
   theme switcher. Reclaims vertical space so the Settings parchment
   modal fits theme buttons without cropping. Sign-out confirmation copy
   updated to reflect that stats are saved to the account, not lost on
   this device.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Top-3 podium for Leaderboard signed-in (Issue #2)

**Why:** Top-3 ranks currently render as flat `LeaderboardRow` cards identical to ranks 4+. Spec calls for an Olympic-style podium (2 / 1 / 3 with rank 1 taller and centered) to visually celebrate the leaders.

**Files:**
- Create: `src/screens/main-screens/leaderboard-screen/LeaderboardPodium.tsx`
- Modify: `src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx`
- Modify: `src/screens/main-screens/leaderboard-screen/styles.ts`

### Steps

- [ ] **Step 5.1: Create the podium component file**

```bash
touch src/screens/main-screens/leaderboard-screen/LeaderboardPodium.tsx
```

- [ ] **Step 5.2: Implement LeaderboardPodium**

Write the full component to `src/screens/main-screens/leaderboard-screen/LeaderboardPodium.tsx`:

```tsx
import React from "react";
import { ImageBackground, View } from "react-native";

import { AppText } from "@/src/components";
import { useAppTheme, useStyles } from "@/src/hooks";
import type { LeaderboardEntry } from "@/src/types";

import { getStyles } from "./styles";

type LeaderboardPodiumProps = {
  entries: LeaderboardEntry[];
  currentUid: string | null;
};

type Rank = 1 | 2 | 3;

const LeaderboardPodiumCard: React.FC<{
  rank: Rank;
  entry: LeaderboardEntry;
  isSelf: boolean;
}> = ({ rank, entry, isSelf }) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const cardStyle =
    rank === 1
      ? [styles.podiumCard, styles.podiumCardCenter]
      : [styles.podiumCard, styles.podiumCardSide];
  const avatarSize = rank === 1 ? styles.podiumAvatarLarge : styles.podiumAvatarSmall;

  const initial = entry.displayName?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <ImageBackground
      source={require("@/src/assets/images/parchment-card.png")}
      resizeMode="cover"
      imageStyle={styles.podiumCardImage}
      style={cardStyle}
    >
      <View style={styles.podiumRankRibbon}>
        <AppText
          type="caption"
          fontFamily="serif"
          color={colors.parchment}
        >
          {String(rank)}
        </AppText>
      </View>

      <View style={[styles.podiumAvatar, avatarSize]}>
        <AppText
          fontFamily="script"
          color={colors.bronzeDark}
          fontSize={rank === 1 ? 36 : 28}
        >
          {initial}
        </AppText>
      </View>

      <AppText
        type="subHeadline"
        fontFamily="serif"
        color={colors.bronzeDark}
        numberOfLines={1}
        style={styles.podiumName}
      >
        {entry.displayName ?? "—"}
      </AppText>

      <AppText
        type="caption"
        fontFamily="sans"
        color={colors.bronzeDark}
        style={styles.podiumPoints}
      >
        {String(entry.points)}
      </AppText>

      {isSelf ? (
        <AppText
          type="caption"
          fontFamily="sans"
          color={colors.bronzeDark}
          style={styles.podiumSelfTag}
        >
          შენ
        </AppText>
      ) : null}
    </ImageBackground>
  );
};

const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  entries,
  currentUid,
}) => {
  const styles = useStyles(getStyles);

  if (entries.length < 3) return null;

  const [first, second, third] = entries;

  return (
    <View style={styles.podiumRow}>
      <LeaderboardPodiumCard
        rank={2}
        entry={second}
        isSelf={second.uid === currentUid}
      />
      <LeaderboardPodiumCard
        rank={1}
        entry={first}
        isSelf={first.uid === currentUid}
      />
      <LeaderboardPodiumCard
        rank={3}
        entry={third}
        isSelf={third.uid === currentUid}
      />
    </View>
  );
};

export default LeaderboardPodium;
```

If `parchment-card.png` (or whatever asset name is used elsewhere for parchment cards) doesn't exist, locate the actual parchment image asset path used by `Modal.tsx` and reuse the same one. Adjust the require accordingly.

If `LeaderboardEntry` doesn't expose `points`, check the actual field name (`weekPoints`, `totalPoints`, `score`, etc.) and adapt — the value should be whichever the leaderboard query returns for the current tab.

- [ ] **Step 5.3: Add podium styles**

In `src/screens/main-screens/leaderboard-screen/styles.ts`, append to `getStyles`:

```ts
podiumRow: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "flex-end",
  columnGap: theme.spacing.x2,
  paddingHorizontal: theme.spacing.x4,
  marginBottom: theme.spacing.x4,
},
podiumCard: {
  flex: 1,
  alignItems: "center",
  paddingVertical: theme.spacing.x4,
  paddingHorizontal: theme.spacing.x2,
  position: "relative",
  borderRadius: theme.borderRadius.md,
  overflow: "hidden",
},
podiumCardCenter: {
  height: getAdjustedHeight(180),
  borderWidth: 3,
  borderColor: theme.colors.bronzeDark,
},
podiumCardSide: {
  height: getAdjustedHeight(150),
  borderWidth: 2,
  borderColor: theme.colors.bronzeDark,
},
podiumCardImage: {
  borderRadius: theme.borderRadius.md,
},
podiumRankRibbon: {
  position: "absolute",
  top: theme.spacing.x1,
  alignSelf: "center",
  backgroundColor: theme.colors.bronzeDark,
  paddingHorizontal: theme.spacing.x3,
  paddingVertical: theme.spacing.x1,
  borderRadius: theme.borderRadius.sm,
},
podiumAvatar: {
  borderRadius: theme.borderRadius.full,
  backgroundColor: theme.colors.parchmentTint,
  borderWidth: 2,
  borderColor: theme.colors.bronzeDark,
  alignItems: "center",
  justifyContent: "center",
  marginTop: theme.spacing.x6,
  marginBottom: theme.spacing.x2,
},
podiumAvatarLarge: {
  width: getAdjustedWidth(72),
  height: getAdjustedWidth(72),
},
podiumAvatarSmall: {
  width: getAdjustedWidth(56),
  height: getAdjustedWidth(56),
},
podiumName: {
  textAlign: "center",
  paddingHorizontal: theme.spacing.x1,
},
podiumPoints: {
  marginTop: theme.spacing.x1,
  letterSpacing: 1,
},
podiumSelfTag: {
  position: "absolute",
  bottom: theme.spacing.x2,
  letterSpacing: 1,
  textTransform: "uppercase",
},
```

(Sizing values are illustrative — the design pass at this step's smoke-test confirms what looks right; tune values during impl.)

- [ ] **Step 5.4: Wire LeaderboardPodium into LeaderboardScreen**

In `src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx`:

Add the import:
```tsx
import LeaderboardPodium from "./LeaderboardPodium";
```

In the signed-in branch's render, switch from `.map()` (current) to a `FlatList`. Replace the existing list rendering with:

```tsx
<FlatList
  data={entries.slice(3)}
  keyExtractor={(entry) => entry.uid}
  renderItem={({ item }) => (
    <LeaderboardRow entry={item} isSelf={item.uid === uid} />
  )}
  ListHeaderComponent={
    <>
      {ownRankCaption ? (
        <AppText
          type="subHeadline"
          fontFamily="serif"
          color={colors.bronzeDark}
          style={styles.titleText}
        >
          {ownRankCaption}
        </AppText>
      ) : null}
      <LeaderboardTabs activeTab={activeTab} onChangeTab={setActiveTab} />
      <LeaderboardPodium entries={entries} currentUid={uid} />
    </>
  }
  ListEmptyComponent={
    isLoading ? (
      <View style={styles.loadingState}>
        <Loading />
      </View>
    ) : (
      <EmptyState title={emptyTitle} description={emptyDesc} />
    )
  }
  refreshControl={
    <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
  }
  contentContainerStyle={styles.scrollContent}
/>
```

Important: when there are 0–2 entries total, `entries.slice(3)` returns `[]` → FlatList shows the empty component. The podium itself renders null (it gates on `entries.length < 3`) so no half-podium ever shows.

Remove the `<ScrollView>` and `.map()` rendering that this replaces.

- [ ] **Step 5.5: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero errors.

- [ ] **Step 5.6: Smoke test on dev-client**

Manual:
1. Sign in. Make sure the leaderboard has at least 3 entries (sign in on a second device or a separate Apple ID; or seed via Firebase Console).
2. Open Leaderboard signed-in → expect: own-rank caption (if applicable) → tab switcher → podium row with rank 1 taller and centered, ranks 2 & 3 on the sides → flat list starting at rank 4.
3. Verify podium card heights, avatar sizes, and bronze borders look right. Tune values in styles.ts if needed.
4. With < 3 entries on the active tab → expect: podium hidden; empty state or whatever rows exist render in the FlatList.
5. Pull-to-refresh on the FlatList still works.
6. If the current user is in top 3, "შენ" tag appears on their podium card.

- [ ] **Step 5.7: Ask user permission to commit + tune**

Pause. Show diff and screenshots. Allow visual tuning of dimensions before committing.

- [ ] **Step 5.8: Commit**

```bash
git add src/screens/main-screens/leaderboard-screen/LeaderboardPodium.tsx \
        src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx \
        src/screens/main-screens/leaderboard-screen/styles.ts
git commit -m "$(cat <<'EOF'
Olympic podium for top-3 leaderboard ranks.

Per polish-pass design (2026-05-02). New LeaderboardPodium component
renders ranks 2 / 1 / 3 in a row with rank 1 taller and centered, each
on a parchment-tinted card with a bronze ribbon and bronze border (3px
for rank 1, 2px for ranks 2/3). Avatar fallback uses the displayName's
first letter in script font on parchmentTint. LeaderboardScreen switches
from .map() to FlatList with the podium as ListHeaderComponent and ranks
4+ as data — single scroll container, pull-to-refresh preserved.
Renders nothing if fewer than 3 entries on the active tab.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Stats data source rewire (Issue #3)

**Why:** Stats currently reads from Firestore `users/{uid}` via `useUserStats`. Sign-out drops to a fresh anonymous UID and Stats appears to wipe to zero. Rewire to a local AsyncStorage accumulator so Stats reflects "this device's history" — survives sign-out trivially.

**Files:**
- Create: `src/services/local-lifetime-stats.ts`
- Create: `src/services/__tests__/local-lifetime-stats.test.ts`
- Create: `src/hooks/useLifetimeStats.ts`
- Modify: `src/screens/main-screens/stats-screen/StatsScreen.tsx`
- Modify: `src/hooks/useGameScreen.tsx`
- Modify: `src/hooks/index.ts`

### Steps

- [ ] **Step 6.1: Write the failing test for the service**

Create `src/services/__tests__/local-lifetime-stats.test.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getLifetimeStats,
  recordGame,
  KEY,
} from "@/src/services/local-lifetime-stats";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("local-lifetime-stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns zeros when no entry exists", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const stats = await getLifetimeStats();
    expect(stats).toEqual({
      totalGames: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      totalPoints: 0,
      bestSingleGameScore: 0,
      updatedAt: 0,
    });
  });

  it("increments fields and updates best score on recordGame", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        totalGames: 1,
        totalCorrect: 5,
        totalQuestions: 7,
        totalPoints: 50,
        bestSingleGameScore: 50,
        updatedAt: 100,
      }),
    );
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    await recordGame({ score: 80, correctCount: 8, totalQuestions: 10 });

    const written = JSON.parse(
      (AsyncStorage.setItem as jest.Mock).mock.calls[0][1],
    );
    expect(written).toMatchObject({
      totalGames: 2,
      totalCorrect: 13,
      totalQuestions: 17,
      totalPoints: 130,
      bestSingleGameScore: 80,
    });
    expect(written.updatedAt).toBeGreaterThan(100);
  });

  it("does not overwrite bestSingleGameScore with a lower value", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        totalGames: 1,
        totalCorrect: 9,
        totalQuestions: 10,
        totalPoints: 200,
        bestSingleGameScore: 200,
        updatedAt: 100,
      }),
    );

    await recordGame({ score: 50, correctCount: 5, totalQuestions: 10 });

    const written = JSON.parse(
      (AsyncStorage.setItem as jest.Mock).mock.calls[0][1],
    );
    expect(written.bestSingleGameScore).toBe(200);
  });
});
```

- [ ] **Step 6.2: Run the test — confirm it fails**

```bash
npx jest src/services/__tests__/local-lifetime-stats.test.ts --no-watchAll
```

Expected: FAIL — `Cannot find module '@/src/services/local-lifetime-stats'`.

- [ ] **Step 6.3: Implement the service**

Create `src/services/local-lifetime-stats.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const KEY = "lifetimeStats:v1";

export type LifetimeStats = {
  totalGames: number;
  totalCorrect: number;
  totalQuestions: number;
  totalPoints: number;
  bestSingleGameScore: number;
  updatedAt: number;
};

const ZERO: LifetimeStats = {
  totalGames: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  totalPoints: 0,
  bestSingleGameScore: 0,
  updatedAt: 0,
};

export const getLifetimeStats = async (): Promise<LifetimeStats> => {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...ZERO };
  try {
    const parsed = JSON.parse(raw) as LifetimeStats;
    return { ...ZERO, ...parsed };
  } catch {
    return { ...ZERO };
  }
};

export const recordGame = async (game: {
  score: number;
  correctCount: number;
  totalQuestions: number;
}): Promise<void> => {
  const current = await getLifetimeStats();
  const next: LifetimeStats = {
    totalGames: current.totalGames + 1,
    totalCorrect: current.totalCorrect + game.correctCount,
    totalQuestions: current.totalQuestions + game.totalQuestions,
    totalPoints: current.totalPoints + game.score,
    bestSingleGameScore: Math.max(current.bestSingleGameScore, game.score),
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
};
```

- [ ] **Step 6.4: Run the test — confirm it passes**

```bash
npx jest src/services/__tests__/local-lifetime-stats.test.ts --no-watchAll
```

Expected: PASS — all 3 tests green.

- [ ] **Step 6.5: Implement useLifetimeStats hook**

Create `src/hooks/useLifetimeStats.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import {
  type LifetimeStats,
  getLifetimeStats,
} from "@/src/services/local-lifetime-stats";

const ZERO: LifetimeStats = {
  totalGames: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  totalPoints: 0,
  bestSingleGameScore: 0,
  updatedAt: 0,
};

export const useLifetimeStats = () => {
  const [stats, setStats] = useState<LifetimeStats>(ZERO);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await getLifetimeStats();
      setStats(next);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { stats, isLoading, refresh };
};
```

- [ ] **Step 6.6: Export from hooks barrel**

In `src/hooks/index.ts`, add:

```ts
export { useLifetimeStats } from "./useLifetimeStats";
```

- [ ] **Step 6.7: Wire StatsScreen to the new hook**

In `src/screens/main-screens/stats-screen/StatsScreen.tsx`:

Replace the `useUserStats` usage with `useLifetimeStats`:

```tsx
// Before:
const { userStats, isLoading } = useUserStats();
// After:
const { stats, isLoading } = useLifetimeStats();
```

Update card data sources. Existing call sites (illustrative — adapt to actual prop names on the StatisticsCard component):

```tsx
// Total Games
<StatisticsCard ... value={stats.totalGames} />

// Best Score
<StatisticsCard ... value={stats.bestSingleGameScore} />

// Average Score
<StatisticsCard
  ...
  value={
    stats.totalGames > 0
      ? Math.round(stats.totalPoints / stats.totalGames)
      : 0
  }
/>

// Total Questions
<StatisticsCard ... value={stats.totalQuestions} />
```

Remove the `useUserStats` import from this file ONLY. It still ships and is still used by `LeaderboardScreen` for the own-rank caption — a different consumer with different requirements.

- [ ] **Step 6.8: Wire game-end accumulator update**

In `src/hooks/useGameScreen.tsx`, find the end-of-game flow (where `crowns === 0` and `saveGameAndUpdateStats` is called).

Add `recordGame` import:

```ts
import { recordGame } from "@/src/services/local-lifetime-stats";
```

After (or alongside) the Firestore transaction call, fire the local update:

```ts
// after building the game-end payload
try {
  await recordGame({
    score: gameState.score,
    correctCount: gameState.stats.correctAnswers,
    totalQuestions: gameState.stats.questionsAnswered,
  });
} catch (err) {
  logger.warn("[useGameScreen] recordGame failed:", err);
  // do not block GameSummary; local accumulator is best-effort
}
```

Important: do NOT add `recordGame` to the `usePendingResultsReplay` flow. The local accumulator updates immediately at end-of-game (success or fail). Replay is a Firestore-only retry; double-firing recordGame on replay would over-count.

- [ ] **Step 6.9: Type-check + lint + tests**

```bash
npx tsc --noEmit
npm run lint
npx jest src/services/__tests__/local-lifetime-stats.test.ts --no-watchAll
```

Expected: zero errors, 3 tests pass.

- [ ] **Step 6.10: Smoke test on dev-client**

Manual:
1. Sign in; play 5 games scoring various points → expect: Stats cards reflect the lifetime data accurately (Total Games = 5, Best Score = highest, Avg = total/5, Total Questions = sum).
2. Sign out → expect: Stats cards stay at the SAME values (no reset). This is the key change.
3. Sign back in with same Google → expect: Stats unchanged (still local). Leaderboard own-rank caption MAY change (Firestore-driven via `useUserStats` — different consumer).
4. Cold-launch on a fresh install (delete app + reinstall, or `adb pm clear`) → expect: Stats reads zeros without crashing.
5. Play one more game on the fresh install → expect: Stats cards now show 1 game; subsequent values reflect that one game only.

- [ ] **Step 6.11: Ask user permission to commit**

Pause. Diff. Wait for confirmation.

- [ ] **Step 6.12: Commit**

```bash
git add src/services/local-lifetime-stats.ts \
        src/services/__tests__/local-lifetime-stats.test.ts \
        src/hooks/useLifetimeStats.ts \
        src/hooks/index.ts \
        src/screens/main-screens/stats-screen/StatsScreen.tsx \
        src/hooks/useGameScreen.tsx
git commit -m "$(cat <<'EOF'
Stats reads from local AsyncStorage; sign-out no longer wipes view.

Per polish-pass design (2026-05-02). Adds a new local-lifetime-stats
service backed by AsyncStorage["lifetimeStats:v1"] tracking totalGames,
totalCorrect, totalQuestions, totalPoints, and bestSingleGameScore.
useGameScreen.tsx fires recordGame on every end-of-game alongside the
existing Firestore transaction (best-effort; failures don't block
GameSummary). useLifetimeStats hook wraps the service with focus-based
refetch.

StatsScreen.tsx switches its 4 cards from useUserStats (Firestore) to
useLifetimeStats (local). useUserStats stays in the LeaderboardScreen
own-rank caption — different consumer, different purpose.

Effect: Stats now reflects "this device's history" instead of "this
account's history". Sign-out drops to fresh anonymous but Stats values
persist on-device. Cross-device aggregation is intentionally lost; the
leaderboard still combines all devices via Firestore.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Parchment Modal redesign — content fit + visual polish (Issues #8, #11, #12)

**Why:** The parchment Modal component sizes content to its outer rectangle, ignoring the curved/torn inner edges of the parchment image. Settings theme buttons bleed past the right curl; Rules content crops below the bottom curl. Affects every consumer (Settings, Rules, sign-out confirm, ConfirmNameModal, ForceUpdateModal).

This is the highest-blast-radius step. If scope grows during impl, split into two commits: (a) Modal-component change + Rules-only consumer migration, (b) remaining consumers.

**Files:**
- Modify: `src/components/modal/Modal.tsx`
- Modify: `src/components/app-settings/AppSettings.tsx`
- Modify: `src/components/rules/Rules.tsx`
- Modify: `src/components/sign-in/ConfirmNameModal.tsx`
- Modify: `src/components/sign-in/ForceUpdateModal.tsx`

### Steps

- [ ] **Step 7.1: Measure parchment image safe-inset**

Open the parchment background asset (locate via `grep "parchment" src/components/modal/Modal.tsx`). Measure visually how far the curl edges intrude on each side. Provisional defaults:

- horizontal inset: 24
- vertical inset: 32

Tune during step 7.7 smoke test.

- [ ] **Step 7.2: Add safeContentInset and enableInnerScroll props to Modal**

In `src/components/modal/Modal.tsx`:

Add to the props type:

```ts
type ModalProps = {
  isVisible: boolean;
  headerTitle: string;
  onClose?: () => void;
  renderComponent: React.ReactNode;
  safeContentInset?: { horizontal?: number; vertical?: number };
  enableInnerScroll?: boolean;
};
```

In the component body, compute the effective insets with provisional defaults:

```tsx
const SAFE_INSET_DEFAULTS = { horizontal: 24, vertical: 32 };

const Modal: React.FC<ModalProps> = ({
  isVisible,
  headerTitle,
  onClose,
  renderComponent,
  safeContentInset,
  enableInnerScroll,
}) => {
  const horizontal =
    safeContentInset?.horizontal ?? SAFE_INSET_DEFAULTS.horizontal;
  const vertical = safeContentInset?.vertical ?? SAFE_INSET_DEFAULTS.vertical;

  const innerPadding = {
    paddingHorizontal: horizontal,
    paddingVertical: vertical,
  };

  // ...rest of existing layout, but the content View now receives innerPadding...

  const content = enableInnerScroll ? (
    <ScrollView
      contentContainerStyle={[styles.contentContainer, innerPadding]}
      showsVerticalScrollIndicator={false}
    >
      {renderComponent}
    </ScrollView>
  ) : (
    <View style={[styles.contentContainer, innerPadding]}>
      {renderComponent}
    </View>
  );

  // ...integrate `content` where the previous content View lived...
};
```

Important: the new padding is on the INNER content area, not the outer modal frame. The parchment background remains sized to the outer rectangle — only the children get pulled in to fit the curl edges.

- [ ] **Step 7.3: Update Settings consumer (AppSettings)**

In `src/components/app-settings/AppSettings.tsx`, the existing usage of `<Modal>` doesn't change props — Modal now applies safe insets by default. But we still need to address the theme switcher's horizontal width:

Find the theme switcher row. Either constrain max width:

```ts
themeSwitcherRow: {
  width: "100%",
  flexDirection: "row",
  columnGap: theme.spacing.x2,
  justifyContent: "center",
},
themeButton: {
  flex: 1,
  maxWidth: getAdjustedWidth(96),  // prevents stretching past parchment inner edge
  // ... existing button styles ...
},
```

Or — preferred per spec — switch to icon-only buttons:

```tsx
<View style={styles.themeSwitcherRow}>
  <ThemeIconButton mode="dark" icon="moon-waning-crescent" />
  <ThemeIconButton mode="light" icon="weather-sunny" />
  <ThemeIconButton mode="system" icon="theme-light-dark" />
</View>
```

Choice depends on what looks right at smoke-test. Plan for max-width first; only switch to icon-only if max-width still feels cramped.

- [ ] **Step 7.4: Update Rules consumer**

In `src/components/rules/Rules.tsx`:

Pass `enableInnerScroll`:

```tsx
<Modal
  isVisible={isVisible}
  headerTitle={t.rules_title}
  onClose={onClose}
  enableInnerScroll                          // NEW
  renderComponent={<RulesBody />}
/>
```

Refactor `RulesBody` from the current flat list to:

```tsx
const RulesBody: React.FC = () => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  return (
    <View>
      <RuleRow
        icon="heart-multiple-outline"
        text={t.rules_lives}
      />
      <RuleDivider />
      <RuleRow
        icon="lightbulb-outline"
        text={t.rules_hints}
      />
      <RuleDivider />
      <RuleRow
        icon="script-text-outline"
        text={t.rules_scoring_intro}
      />
      <View style={styles.scoringChipsRow}>
        <ScoringChip label={t.rules_scoring_easy} />
        <ScoringChip label={t.rules_scoring_medium} />
        <ScoringChip label={t.rules_scoring_hard} />
      </View>
      <AppText
        type="body"
        fontFamily="serif"
        color={colors.bronzeDark}
        style={styles.outroLine}
      >
        {t.rules_scoring_outro}
      </AppText>
    </View>
  );
};

const RuleRow: React.FC<{
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
}> = ({ icon, text }) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  return (
    <View style={styles.ruleRow}>
      <MaterialCommunityIcons
        name={icon}
        size={getAdjustedWidth(20)}
        color={colors.bronzeDark}
        style={styles.ruleIcon}
      />
      <AppText
        type="body"
        fontFamily="serif"
        color={colors.bronzeDark}
        style={styles.ruleText}
      >
        {text}
      </AppText>
    </View>
  );
};

const RuleDivider: React.FC = () => {
  const styles = useStyles(getStyles);
  return <View style={styles.ruleDivider} />;
};

const ScoringChip: React.FC<{ label: string }> = ({ label }) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  return (
    <View style={styles.scoringChip}>
      <AppText
        type="caption"
        fontFamily="sans"
        color={colors.bronzeDark}
      >
        {label}
      </AppText>
    </View>
  );
};
```

Add corresponding styles in the Rules `getStyles`:

```ts
ruleRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: theme.spacing.x2,
  columnGap: theme.spacing.x3,
},
ruleIcon: {
  width: getAdjustedWidth(24),
  textAlign: "center",
},
ruleText: {
  flex: 1,
},
ruleDivider: {
  height: 1,
  backgroundColor: theme.colors.bronzeDark,
  opacity: 0.2,
  marginVertical: theme.spacing.x2,
},
scoringChipsRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: theme.spacing.x2,
  marginBottom: theme.spacing.x3,
  columnGap: theme.spacing.x2,
},
scoringChip: {
  flex: 1,
  paddingVertical: theme.spacing.x2,
  paddingHorizontal: theme.spacing.x3,
  borderRadius: theme.borderRadius.sm,
  borderWidth: 1,
  borderColor: theme.colors.bronzeDark,
  backgroundColor: theme.colors.parchmentTint,
  alignItems: "center",
},
outroLine: {
  marginTop: theme.spacing.x4,
  textAlign: "center",
  fontStyle: "italic",
},
```

(Tune sizes during smoke test.)

The translation values for `rules_scoring_easy / medium / hard` may need to be more compact for the chip layout. They currently read like "მარტივი — +5 ქულა". The chip variant could just be "+5 ქულა" with the difficulty implied by chip order. Decide during smoke test; if you change the strings, update both `en.json` and `ka.json`.

- [ ] **Step 7.5: Verify ConfirmNameModal + ForceUpdateModal fit**

In `src/components/sign-in/ConfirmNameModal.tsx`: open and confirm the body content fits within the new safe-inset. No code change needed unless content overflows — if it does, either tighten internal padding or pass an explicit `safeContentInset` override.

In `src/components/sign-in/ForceUpdateModal.tsx`: same check. The single "Update now" button + body text typically fits without changes. If not, adjust internal layout (not the Modal itself).

- [ ] **Step 7.6: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero errors.

- [ ] **Step 7.7: Smoke test on dev-client (visual sweep)**

Manual on iOS dev-client AND Android emulator (visual regressions can differ):

| Surface | Expected |
| --- | --- |
| Settings (signed-in) | Theme switcher fits within parchment; sign-out row at bottom; no horizontal bleed |
| Settings (anonymous) | No Account section — theme switcher is the last row; no overflow |
| Rules | All bullets visible (Hard +20 + outro line); icons render in bronze; section dividers thin and tasteful; difficulty chips in a 3-column row |
| Sign-out confirmation | Title + body + Cancel/Confirm buttons all fit; no edge bleed |
| ConfirmNameModal | Header + caption + TextInput + Save button fit |
| ForceUpdateModal | Title + body + Update button fit |

If any surface regresses, tune the safe-inset constants OR the consumer's internal layout. Iterate until all surfaces look right.

- [ ] **Step 7.8: Ask user permission to commit + scope decision**

Pause. Show diff and screenshots of each surface. If the change ended up large, propose splitting into two commits (Modal change + Rules) and (other consumers) — easier to review and revert.

- [ ] **Step 7.9: Commit**

```bash
git add src/components/modal/Modal.tsx \
        src/components/app-settings/AppSettings.tsx \
        src/components/rules/Rules.tsx \
        src/components/sign-in/ConfirmNameModal.tsx \
        src/components/sign-in/ForceUpdateModal.tsx
git commit -m "$(cat <<'EOF'
Parchment Modal — content fit + visual polish.

Per polish-pass design (2026-05-02). Modal component now applies a
safeContentInset (default horizontal 24, vertical 32 — measured against
the parchment image's curled inner edge) and supports enableInnerScroll
for tall content. Propagates to every consumer:

- Settings: theme switcher constrained to fit horizontally; no curl-edge
  bleed
- Rules: enables inner scroll; bullets get bronze leading icons (lives,
  hints, scoring); thin bronze dividers between sections; difficulty
  sub-bullets become 3-column chips for compactness
- Sign-out confirm / ConfirmNameModal / ForceUpdateModal: receive new
  safe-inset padding; verified fit on iOS + Android

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Force-update soft / hard split (Issue #10)

**Why:** Default behaviour today is non-dismissible blocking, used for every version bump. Routine releases shouldn't force users out. Add a dismissible SoftUpdateModal for normal version announcements; reserve ForceUpdateModal for genuine breaking changes (schema migrations, removed endpoints).

**Files:**
- Create: `src/components/sign-in/SoftUpdateModal.tsx`
- Modify: `src/hooks/useForceUpdateGate.ts`
- Modify: `App.tsx`
- Modify: `src/components/sign-in/index.ts`
- Modify: `src/locales/en.json`
- Modify: `src/locales/ka.json`

### Steps

- [ ] **Step 8.1: Add new translation keys**

In `src/locales/en.json`:

```json
"softupdate_title": "New version available",
"softupdate_body": "A newer version of the app is available. We recommend updating.",
"softupdate_primary": "Update",
"softupdate_secondary": "Later",
```

In `src/locales/ka.json`:

```json
"softupdate_title": "ახალი ვერსია",
"softupdate_body": "ხელმისაწვდომია აპლიკაციის უფრო ახალი ვერსია. რეკომენდირებულია განახლება.",
"softupdate_primary": "განახლება",
"softupdate_secondary": "მოგვიანებით",
```

- [ ] **Step 8.2: Create SoftUpdateModal**

Create `src/components/sign-in/SoftUpdateModal.tsx`:

```tsx
import React from "react";
import { Linking, Platform, Pressable, View } from "react-native";

import { AppText, Modal } from "@/src/components";
import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";
import type { AppTheme } from "@/src/theme";

const APP_STORE_URL =
  Platform.OS === "ios"
    ? "itms-apps://itunes.apple.com/app/id<APP_ID>"
    : "market://details?id=com.papunafshaveli.historyofgeorgia";

type SoftUpdateModalProps = {
  isVisible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
};

const SoftUpdateModal: React.FC<SoftUpdateModalProps> = ({
  isVisible,
  onUpdate,
  onDismiss,
}) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const handleUpdate = () => {
    Linking.openURL(APP_STORE_URL).catch(() => undefined);
    onUpdate();
  };

  return (
    <Modal
      isVisible={isVisible}
      headerTitle={t.softupdate_title}
      onClose={onDismiss}
      renderComponent={
        <View style={styles.body}>
          <AppText
            type="body"
            fontFamily="serif"
            color={colors.bronzeDark}
            style={styles.copy}
          >
            {t.softupdate_body}
          </AppText>
          <View style={styles.buttonsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.softupdate_secondary}
              onPress={onDismiss}
              style={styles.secondaryButton}
            >
              <AppText fontFamily="serif" color={colors.bronzeDark}>
                {t.softupdate_secondary}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.softupdate_primary}
              onPress={handleUpdate}
              style={styles.primaryButton}
            >
              <AppText fontFamily="serif" color={colors.parchment}>
                {t.softupdate_primary}
              </AppText>
            </Pressable>
          </View>
        </View>
      }
    />
  );
};

export default SoftUpdateModal;

const getStyles = (theme: AppTheme) =>
  ({
    body: {
      alignItems: "center",
      rowGap: theme.spacing.x4,
    },
    copy: {
      textAlign: "center",
    },
    buttonsRow: {
      flexDirection: "row",
      columnGap: theme.spacing.x3,
      width: "100%",
    },
    secondaryButton: {
      flex: 1,
      paddingVertical: theme.spacing.x3,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.bronzeDark,
      alignItems: "center",
      backgroundColor: theme.colors.parchmentTint,
    },
    primaryButton: {
      flex: 1,
      paddingVertical: theme.spacing.x3,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.bronzeDark,
      alignItems: "center",
    },
  }) as const;
```

(Wrap with `StyleSheet.create` per project convention if `getStyles` returns a plain object today — match the existing pattern from other components.)

Replace `<APP_ID>` with the real App Store ID once we have it. Until then leave as a TODO that the impl session resolves before merging.

- [ ] **Step 8.3: Export SoftUpdateModal from barrel**

In `src/components/sign-in/index.ts` (or wherever the sign-in barrel lives):

```ts
export { default as SoftUpdateModal } from "./SoftUpdateModal";
```

- [ ] **Step 8.4: Extend useForceUpdateGate**

In `src/hooks/useForceUpdateGate.ts`, change the return shape:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { useCallback, useEffect, useState } from "react";

import { compareSemver } from "@/src/utils/semver";
import { getAppConfig } from "@/src/services/appConfig";

const SOFT_DISMISS_KEY = "softUpdate:lastDismissedAt";
const SOFT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type GateState = {
  isHardBlocked: boolean;
  isSoftBlocked: boolean;
  latestVersion: string | null;
};

export const useForceUpdateGate = () => {
  const [state, setState] = useState<GateState>({
    isHardBlocked: false,
    isSoftBlocked: false,
    latestVersion: null,
  });

  const evaluate = useCallback(async () => {
    const config = await getAppConfig();
    if (!config) return; // grace mode

    const current = Application.nativeApplicationVersion ?? "0.0.0";

    const isHardBlocked =
      compareSemver(current, config.minSupportedVersion) < 0;

    let isSoftBlocked = false;
    if (
      !isHardBlocked &&
      compareSemver(current, config.latestVersion) < 0
    ) {
      const dismissedAtRaw = await AsyncStorage.getItem(SOFT_DISMISS_KEY);
      const dismissedAt = dismissedAtRaw ? Number(dismissedAtRaw) : 0;
      const cooldownActive = Date.now() - dismissedAt < SOFT_COOLDOWN_MS;
      isSoftBlocked = !cooldownActive;
    }

    setState({
      isHardBlocked,
      isSoftBlocked,
      latestVersion: config.latestVersion,
    });
  }, []);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  const dismissSoft = useCallback(async () => {
    await AsyncStorage.setItem(SOFT_DISMISS_KEY, String(Date.now()));
    setState((prev) => ({ ...prev, isSoftBlocked: false }));
  }, []);

  return {
    isHardBlocked: state.isHardBlocked,
    isSoftBlocked: state.isSoftBlocked,
    latestVersion: state.latestVersion,
    dismissSoft,
  };
};
```

This replaces the existing implementation. The priority rule (hard supersedes soft) is baked in: `isSoftBlocked` is only set when `isHardBlocked` is false.

- [ ] **Step 8.5: Update App.tsx integration**

In `App.tsx`, find the existing ForceUpdateGate component (or wherever the gate is wired). Replace the existing single-modal render with both modals, gated by their respective flags:

```tsx
import { ForceUpdateModal, SoftUpdateModal } from "@/src/components";
import { useForceUpdateGate } from "@/src/hooks/useForceUpdateGate";

// inside the gate component:
const { isHardBlocked, isSoftBlocked, latestVersion, dismissSoft } =
  useForceUpdateGate();

return (
  <>
    <ForceUpdateModal isVisible={isHardBlocked} />
    <SoftUpdateModal
      isVisible={isSoftBlocked}
      onUpdate={dismissSoft}
      onDismiss={dismissSoft}
    />
  </>
);
```

(If the existing `ForceUpdateModal` isVisible prop name differs, match it. The hook ensures both modals are never simultaneously visible — `isSoftBlocked` is always false when `isHardBlocked` is true.)

- [ ] **Step 8.6: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero errors.

- [ ] **Step 8.7: Smoke test on dev-client (soft path)**

1. In Firebase Console → `app_config/version` doc:
   - Set `latestVersion: "2.1.0"` (above current 1.1.0)
   - Set `minSupportedVersion: "1.0.0"` (below current 1.1.0)
2. Delete app + reinstall (clears cached app_config + softUpdate dismiss timestamp).
3. Launch → expect: SoftUpdateModal appears (not blocking).
4. Tap "Later" → modal dismisses.
5. Force-quit and relaunch → expect: NO modal (cooldown active in AsyncStorage).
6. Reset `softUpdate:lastDismissedAt` to a value > 7 days old (or delete the key via debug):
   - Easiest: delete app + reinstall again, but bump the cooldown to 1 second in `SOFT_COOLDOWN_MS` for testing
   - Restore to 7 days before committing
7. Relaunch → expect: SoftUpdateModal appears again.

- [ ] **Step 8.8: Smoke test on dev-client (hard path)**

1. In Firebase Console:
   - Set `minSupportedVersion: "3.0.0"` (above current 1.1.0)
2. Force-quit and relaunch → expect: ForceUpdateModal appears (non-dismissible). SoftUpdateModal does NOT appear despite `latestVersion` also being above current.
3. Reset both fields back: `minSupportedVersion: "2.0.0"`, `latestVersion: "2.0.0"`.

- [ ] **Step 8.9: Ask user permission to commit**

Pause. Diff. Wait for confirmation.

- [ ] **Step 8.10: Commit**

```bash
git add src/components/sign-in/SoftUpdateModal.tsx \
        src/components/sign-in/index.ts \
        src/hooks/useForceUpdateGate.ts \
        App.tsx \
        src/locales/en.json src/locales/ka.json
git commit -m "$(cat <<'EOF'
Force-update soft/hard split — SoftUpdateModal for routine releases.

Per polish-pass design (2026-05-02). Splits the single non-dismissible
ForceUpdateModal into two modals with distinct purposes:

- SoftUpdateModal (NEW): dismissible "new version available" notice
  shown when nativeApplicationVersion < latestVersion. "Later" records
  AsyncStorage["softUpdate:lastDismissedAt"]; 7-day cooldown before re-prompt.
- ForceUpdateModal (existing): non-dismissible, shown only when
  nativeApplicationVersion < minSupportedVersion. Reserved for genuine
  breaking changes.

Priority: hard supersedes soft. The hook surfaces only one of the two
flags at a time so the modals never collide.

Future routine releases bump latestVersion only; minSupportedVersion
stays at "2.0.0" until another breaking change forces it forward.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 9 — Final cross-step regression sweep

**Goal:** Confirm no surface regressed during a later step now that all 8 commits have landed.

- [ ] **Step 9.1: Full visual sweep on iOS dev-client**

Tap through every screen / modal:

| Surface | Confirm |
| --- | --- |
| Home (StartGameScreen) | unchanged |
| Topics (HistoricalTopicsScreen) | unchanged |
| Leaderboard anonymous | Lean layout: icon + headline + Google + Apple |
| Leaderboard signed-in | Title → tabs → top-3 podium → flat list 4+ |
| Stats | 4 cards from local lifetime stats; sign out → values persist |
| Game in-progress | unchanged |
| GameSummary | Score-tier copy by band |
| Settings (anonymous) | Toggles + theme switcher only; no Account section |
| Settings (signed-in) | Toggles + theme switcher + sign-out row at bottom |
| Sign-out confirmation | New copy; Cancel + Confirm fit |
| ConfirmNameModal | Pre-fills + saves correctly |
| ForceUpdateModal | Renders only on minSupportedVersion bump |
| SoftUpdateModal | Renders on latestVersion bump; 7-day cooldown works |
| Rules | All bullets visible (no crop); icons + dividers + chips |
| Sub-screens (Rulers/Battles/Public Figures lists + details) | unchanged |

- [ ] **Step 9.2: Full visual sweep on Android emulator**

Same surfaces. Pay particular attention to:
- iOS-only surfaces hidden on Android (Apple sign-in button)
- Different parchment-image rendering between platforms

- [ ] **Step 9.3: Update plan-doc resume marker**

In `docs/superpowers/plans/2026-04-29-scoring-leaderboard-plan.md`, update the Phase 5 polish pass entry:

```
- ✅ Phase 5 polish pass — DONE (2026-05-XX). All 8 commits landed.
  See spec at docs/superpowers/specs/2026-05-02-phase-5-polish-pass-design.md.
```

- [ ] **Step 9.4: Ask user about pushing to origin**

```bash
git log --oneline origin/Add-question-variations..HEAD
```

Expected: 10 commits ahead (2 spec commits + 8 polish commits). Pause; ask user whether to push now or hold.

If push approved:

```bash
git push origin Add-question-variations
```

This is the only push during the polish pass — never push to main; never force-push.

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Task 7 (Modal redesign) regresses a consumer not in the smoke-test list | Medium | Step 9.1/9.2 final sweep; if regression caught, file as separate fix commit |
| Task 6 local accumulator goes out of sync with Firestore | Low | Stats are intentionally local-only; leaderboard reads Firestore separately. Drift is by design. |
| Task 4 user gets confused why Settings has no auth | Low | The Leaderboard tab anon state has a clear value prop — discoverable |
| Task 8 cooldown feels too aggressive (7 days) | Low | Constant tunable; revisit post-launch |
| `<APP_ID>` placeholder in SoftUpdateModal not replaced | Medium | Step 8.2 has explicit TODO; pre-merge gate before commit |
| Apple email-collision merge handler still unaddressed | Medium | Already in plan-doc deferred-follow-ups item 3; ship before 2.0.0 store submission (separate small PR) |
| Translation key drift between en.json and ka.json | Low | After every JSON edit, sort keys + diff; project already has this convention |

---

## Open follow-ups (not part of this plan)

1. **Final Georgian wording for the 4 score-tier strings** — refine in step 2.8 impl review.
2. **Exact safe-inset measurements for the parchment image** — measure during step 7.1.
3. **Apple `auth/email-already-in-use` merge handler** — deferred-follow-up item 3 in parent plan; ships in a separate PR before 2.0.0 store submission.
4. **App-wide font replacement (#5)** — deferred-follow-up item 2; separate design effort with its own typography spec.
5. **Folder rename `src/components/sign-in/` → `src/components/auth/`** — out of scope; revisit in folder-structure cleanup later.

---

## Self-review pass

After writing the plan above, fresh-eye check:

**Spec coverage** — every issue in the spec maps to a task:
- Issue #0 (Lean Leaderboard anon) → Task 4 ✅
- Issue #1 (Settings auth simplification) → Task 4 ✅
- Issue #2 (Top-3 podium) → Task 5 ✅
- Issue #3 (Stats local rewire) → Task 6 ✅
- Issue #5 (Fonts) → out of scope (deferred follow-up #4) ✅
- Issue #6 (Remove MilestoneNudgeModal) → Task 1 ✅
- Issue #7 (GameSummary tier by score) → Task 2 ✅
- Issue #8 (Parchment overflow) → Task 7 ✅
- Issue #9 (Auth `isSigningIn`) → Task 3 ✅
- Issue #10 (Force-update split) → Task 8 ✅
- Issue #11 (Confirmation + ForceUpdate visuals) → Task 7 ✅
- Issue #12 (Rules screen) → Task 7 ✅

All 12 issues accounted for.

**Placeholder scan** — only one explicit placeholder remaining:
- `<APP_ID>` in `SoftUpdateModal.tsx` step 8.2 — flagged as a pre-commit TODO in the risks table.

**Type consistency** — `getLifetimeStats`, `recordGame`, `useLifetimeStats` signatures match across Tasks 6.1 / 6.3 / 6.5 / 6.7 / 6.8. `isSigningIn` is added to `AuthContextValue` in Task 3 and consumed in Task 4 with the same name.

No issues found beyond the deliberate `<APP_ID>` TODO.
