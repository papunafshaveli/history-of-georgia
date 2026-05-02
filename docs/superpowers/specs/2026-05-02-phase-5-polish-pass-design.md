# Phase 5 Polish Pass — Design

**Status:** Draft — 2026-05-02
**Spec parent:** `docs/superpowers/specs/2026-04-29-scoring-leaderboard-design.md`
**Plan parent:** `docs/superpowers/plans/2026-04-29-scoring-leaderboard-plan.md`
**Branch:** `Add-question-variations`
**Target release:** 2.0.0 native build (still pending; native build + store submission)

## Context

Phases 1 through 5 of the scoring + leaderboard feature landed behind commit `c30f2d4`. End-to-end verification on Android (2026-05-01) and iOS (2026-05-02) surfaced a coherent set of UI / UX / architecture issues across the auth surface, the Stats data source, the Leaderboard signed-in state, the shared parchment Modal, the force-update gate, and the post-game flow. The plan doc carried a deferred line item — *"Phase 5 polish pass — DEFERRED. Issues will be batched and addressed in a single follow-up commit"* — and this spec executes that batch.

Goal: ship the 2.0.0 native build with these polish decisions resolved. No new features; only refining surfaces already in flight.

## Scope summary

| # | Title | Category |
| --- | --- | --- |
| 0 | Lean Leaderboard anonymous state | 🎨 design |
| 1 | Settings auth simplification | 🎨 design |
| 2 | Leaderboard signed-in podium (top 3) | 🎨 design |
| 3 | Stats data source rewire (Firestore → local) | 🎨 design + arch |
| 4 | *(dropped — full-wipe legacy-stats migration kept as-is)* | — |
| 5 | App-wide font replacement | ⏭ deferred to its own design effort |
| 6 | Remove MilestoneNudgeModal entirely | 🪛 polish |
| 7 | GameSummary tier copy keys off score, not correct count | 🪛 polish |
| 8 / 11 / 12 | Parchment Modal redesign (content-fit + visual polish + Rules) | 🎨 design |
| 9 | Auth loading state (`isSigningIn`) | 🐛 tech bug |
| 10 | Force-update soft / hard split | 🎨 design |

Issues #5 (fonts) and #4 (kind migration of legacy stats) are explicitly out of scope and recorded under "Deferred follow-ups" in the plan doc.

---

## Design decisions

### #0 — Lean Leaderboard anonymous state

Replaces the current sparse-buttons-only branch in `LeaderboardScreen.tsx` (anon-state today is just a `<View style={styles.providersStack}>` with two `<ProviderButton>` calls inside a `ScrollView`).

**Layout — drosha-style full gate:**

```
┌────────────────────────────────────────┐
│  ლიდერბორდი                            │  ← existing <ScreenTitle>, unchanged
│  ─── bronze divider ───                │
├────────────────────────────────────────┤
│                                        │
│              [📜]                      │  ← script-text-outline icon, ~64px,
│                                        │     bronzeDark on parchmentTint circle,
│                                        │     2px bronzeDark border
│                                        │
│   შეეჯიბრე საქართველოს                 │  ← headline, type="title",
│         მცოდნეებს                      │     fontFamily="serif", bronzeDark,
│                                        │     centered, max 2 lines
│                                        │
│   ┌──────────────────────────────┐     │
│   │  G  Google-ით შესვლა         │     │  ← existing ProviderButton, full-width
│   └──────────────────────────────┘     │
│   ┌──────────────────────────────┐     │
│   │     Apple-ით შესვლა          │     │  ← iOS only (Platform.OS === "ios")
│   └──────────────────────────────┘     │
│                                        │
└────────────────────────────────────────┘
```

**Spacing:**
- icon → headline: `theme.spacing.x4` (16)
- headline → first button: `theme.spacing.x8` (32) — generous breathing room
- between buttons: `theme.spacing.x3` (12)

**Removed from the anon branch:**
- `ScrollView` wrapper — no scroll, no pull-to-refresh on the anon gate (refresh is meaningless when there's nothing fetched yet)
- The `RefreshControl`
- The fixed-position layout — anon body becomes `flex: 1` centered column

**Reused tokens (no new colours / radii):**
- `theme.colors.bronzeDark` — icon, headline, button text + border
- `theme.colors.parchmentTint` — icon circle background
- `theme.spacing.x3 / x4 / x8` — gaps
- `theme.borderRadius.full` — icon circle

**Reused components:** existing `ProviderButton` (LeaderboardScreen.tsx lines 35–80) — already styled correctly, no changes needed.

**Translation keys:**
- ADD: `leaderboard_anon_headline` — `ka`: "შეეჯიბრე საქართველოს მცოდნეებს" / `en`: "Compete with players across Georgia"
- REMOVE: `leaderboard_signin_button_top` — orphaned key, confirmed unreferenced via grep

**Decisions locked-in (from brainstorming):**
- Value prop: A (compete) — Lean tab context is "I came here for rankings"
- Tone: B (slightly elevated literary) — matches `data.json` register
- Icon: A (`script-text-outline`) — chronicle metaphor
- Density: A (Lean) — icon + headline + buttons, no thematic line, no bullets, no privacy footer
- Buttons: Google first, no Skip / "Maybe later", Apple hidden on Android (no caption)

---

### #1 — Settings auth simplification

Remove inline Google + Apple sign-in entirely from `AccountSection`. Anonymous users now sign in only through the Leaderboard tab where the value prop lives. Settings stays focused on app preferences.

**Anonymous branch (Settings):** no Account section at all. `AccountSection` returns `null`.

**Signed-in branch (Settings):** single sign-out row, repositioned **below the theme switcher** (today it sits above). Visually: `logout` MaterialCommunityIcon + label "გასვლა"; on tap → existing sign-out confirmation Modal → `auth.signOut()` → AuthProvider drops to fresh anonymous via the existing `onAuthStateChanged` listener.

**Rationale:** parchment Settings modal is currently too tall on iOS — theme switcher buttons crop off the visible scroll area. Removing the auth section reclaims ~120px of vertical space and moves the destructive action below the cosmetic options where it belongs.

**Sign-out confirmation modal copy update:** drop the *"your score will no longer appear on the leaderboard from this device"* warning that the current spec carried. The new text is brief and aligned with #3:

```
ka: "გასვლა გავა Google-ის ანგარიშიდან. შენი სტატისტიკა შენახულია Google-ზე —
    ნებისმიერ დროს დაბრუნდი."
en: "Signing out from this Google account. Your stats are saved to Google —
    sign back in any time."
```

(The "stats are saved on Google" framing is honest only because of #3 — Stats now reads from local storage. Cross-device aggregation is gone, but the user's rank-affecting Firestore data persists and re-attaches on sign-back-in.)

**Files:**
- `src/components/app-settings/AccountSection.tsx` — anonymous returns null; signed-in keeps sign-out only; reposition below theme
- `src/components/app-settings/AppSettings.tsx` — confirm `AccountSection` mount order: toggles → theme switcher → AccountSection
- Translation keys: drop `settings_signin_with_google` / `settings_signin_with_apple` if they exist solely for AccountSection (keep the leaderboard ones)

---

### #2 — Leaderboard signed-in: Olympic podium for top 3

Top-3 ranks become a podium row separate from the flat list. Layout: ranks 2 / 1 / 3 in a row, with rank 1 visibly taller and centered. Per spec section 4.3 of the parent design.

**Visual:**

```
       ┌─────────┐
       │   #1    │  ← center, taller, 88px avatar,
       │ ┌─────┐ │     bronzeDark ribbon "1",
       │ │ AV  │ │     deepest-bronze accent
       │ └─────┘ │
       │ Sandro  │
       │  180    │
   ┌───┤         ├───┐
   │#2 │         │#3 │  ← side cards, shorter, 64px avatar,
   │AV │         │AV │     medium-bronze accent
   │..N│         │..N│
   │..p│         │..p│
   └───┴─────────┴───┘
```

- All three cards are parchment-tinted (`ImageBackground` with parchment image), bronze border (3px for rank 1, 2px for ranks 2/3).
- Rank ribbon — small bronze chip at the top of each card containing the rank number in `serif` font. **No Roman numerals** (per memory rule).
- Avatar — circular, `parchmentTint` background with first-letter-of-displayName in `script` font fallback when no `photoURL`. Photo URL when available.
- Display name — `serif`, `bronzeDark`, truncates with ellipsis.
- Points — `caption`, `letter-spaced`, uppercase Georgian.

**List below podium — ranks 4 to 20:** unchanged `LeaderboardRow` components. Current-user row continues to highlight with `parchmentTint` bg (existing behaviour).

**FlatList architecture:** podium is `ListHeaderComponent`; ranks 4–20 are `data`. Single scroll container.

**New file:** `src/screens/main-screens/leaderboard-screen/LeaderboardPodium.tsx` — three `LeaderboardPodiumCard` instances internally; takes the first three entries from the leaderboard query. Renders `null` if fewer than 3 entries.

**Files modified:**
- `src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx` — wire podium as `ListHeaderComponent`; slice list to ranks 4+
- `src/screens/main-screens/leaderboard-screen/styles.ts` — add podium row styles

**No translation key adds.**

---

### #3 — Stats data source rewire (Firestore → local)

The Stats screen's 4 cards (Total Games / Best Score / Avg Score / Total Questions) currently read from Firestore via `useUserStats`. After this change, they read from a local AsyncStorage accumulator that survives sign-out.

**New service:** `src/services/local-lifetime-stats.ts`

```ts
type LifetimeStats = {
  totalGames: number;
  totalCorrect: number;
  totalQuestions: number;
  totalPoints: number;
  bestSingleGameScore: number;
  updatedAt: number; // unix ms
};

const KEY = "lifetimeStats:v1";

export const getLifetimeStats = async (): Promise<LifetimeStats> => { ... };
export const recordGame = async (game: {
  score: number;
  correctCount: number;
  totalQuestions: number;
}): Promise<void> => { ... };
```

`recordGame` reads the current value, increments fields atomically (`totalGames + 1`, `totalCorrect + correctCount`, `totalPoints + score`, `bestSingleGameScore = Math.max(...)`), writes back, returns void. AsyncStorage writes are not atomic across processes, but the React Native runtime is single-threaded so this is safe.

**New hook:** `src/hooks/useLifetimeStats.ts`

```ts
export const useLifetimeStats = (): {
  stats: LifetimeStats;
  isLoading: boolean;
  refresh: () => void;
};
```

5-minute in-memory cache + refresh on focus. No network calls.

**Modified:**
- `src/screens/main-screens/stats-screen/StatsScreen.tsx` — replace `useUserStats` with `useLifetimeStats`. The 4 cards' data sources change but visual layout stays.
- `src/hooks/useGameScreen.tsx` — at end-of-game, after `saveGameAndUpdateStats` resolves (or queues), call `recordGame` with the same payload. This is local + idempotent — even if the Firestore write later replays, local already updated.

**`useUserStats` survives** — still used by `LeaderboardScreen` for the own-rank caption (cross-device rank requires Firestore data). Two distinct purposes, two distinct hooks.

**Migration on first 2.0.0 launch:** the existing `cleanLegacyStats` migration deletes `gameHistory` + `highScore`. We keep that as-is per the parent spec Q5 — no kind migration. `lifetimeStats:v1` simply does not exist for legacy users; `getLifetimeStats` initialises to zeros on first read. No new migration step required.

**Sign-out behaviour:** Stats screen no longer "vanishes" on sign-out — local data persists. The sign-out confirmation copy from #1 reflects this.

**Files:**
- ADD: `src/services/local-lifetime-stats.ts`
- ADD: `src/hooks/useLifetimeStats.ts`
- MODIFY: `src/screens/main-screens/stats-screen/StatsScreen.tsx`
- MODIFY: `src/hooks/useGameScreen.tsx`

---

### #6 — Remove MilestoneNudgeModal entirely

**Removal scope:**
- DELETE: `src/components/sign-in/MilestoneNudgeModal.tsx`
- DELETE: corresponding barrel export from `src/components/sign-in/index.ts`
- MODIFY: `src/hooks/useGameScreen.tsx` — remove `modals.milestone: boolean` from GameState; remove the trigger condition (`score > previousBest && isAnonymous && !hasSeenSignInNudge`); end-of-game flow now always opens GameSummary
- MODIFY: `src/components/game-modals/GameModals.tsx` (or wherever the modal is rendered) — drop the `<MilestoneNudgeModal>` JSX
- DELETE translation keys: `milestone_title`, `milestone_body`, `milestone_subbody`, `milestone_skip_button`
- KEEP: `users/{uid}.hasSeenSignInNudge` field — leaving it as deprecated/unused on existing docs is cheaper than a doc-wide migration; it ages out naturally as docs are rewritten

**Why:** consolidates the "sign-in lives only on Leaderboard tab" pattern. The MilestoneNudgeModal violated the user's *no modal as one-step router for sign-in CTAs* preference (memory: feedback_no_modal_router.md).

---

### #7 — GameSummary tier copy keys off score

The GameSummary big number was already switched to `gameState.score` in commit `a2727a7`. The descriptive tier text below the number still keys off `correctCount / totalQuestions`. Update to score-based.

**Tier bands (decided in brainstorming):**
| Score range | Tier | `ka` copy | `en` copy |
| --- | --- | --- | --- |
| 0 – 50 | Beginner | `კარგი დასაწყისია — განაგრძე!` | `Solid start — keep going!` |
| 51 – 150 | Solid | `კარგად გაართვი თავი.` | `Well done.` |
| 151 – 300 | Strong | `ძლიერი შედეგი — საქართველოს ისტორიკოსი ხარ.` | `Strong result — you know your Georgian history.` |
| 301+ | Expert | `განსაკუთრებული შედეგი — ლიდერბორდის მზე ხარ.` | `Exceptional result — leaderboard royalty.` |

**Copy style:** qualitative (no embedded score number — the big circle already shows it). Approved during brainstorming.

**Files:**
- MODIFY: `src/components/game-summary/GameSummary.tsx` — replace tier-resolution function from correct-count-based to score-based
- ADD translation keys: `gamesummary_tier_beginner`, `gamesummary_tier_solid`, `gamesummary_tier_strong`, `gamesummary_tier_expert`
- DROP translation keys: `feedback_low`, `feedback_medium`, `feedback_high`, `feedback_excellent`, `feedback_outstanding` (existing accuracy-based tier copy; replaced 5-tier-by-accuracy → 4-tier-by-score). Verify no other consumer references these keys before deletion.

---

### #8 + #11 + #12 — Parchment Modal redesign (content-fit + visual polish)

Single design pass on the shared parchment `Modal` component (`src/components/modal/Modal.tsx`) propagates fixes to every consumer: Settings (`AppSettings.tsx`), Rules (`Rules.tsx`), sign-out confirm, ConfirmNameModal, ForceUpdateModal, new SoftUpdateModal.

**Two distinct problems being fixed:**

1. **Content overflow against the parchment image's curved/torn edges.** The parchment background is a JPEG/PNG with decorative curl edges; content currently sizes to the modal's outer rectangle, ignoring that the *usable inner area* is narrower (horizontally) and shorter (vertically). Settings theme buttons bleed past the right curl; Rules bullets crop below the bottom curl.

2. **Visual under-polish.** Some modals (Rules in particular) carry flat bullet lists with no iconography, no bronze accents, no per-row visual differentiation — does not match the parchment aesthetic established elsewhere.

**Resolution — Modal component changes:**

- Add `safeContentInset` props: `{ horizontal: number, vertical: number }` defaulting to constants computed from the parchment image's actual inner usable area (measured against the design source).
- Inner content `<View>` receives padding equal to the safe insets — content can never visually overflow into the curl edges.
- Add an `enableInnerScroll` prop (default `false`). When `true`, wraps content in a `ScrollView` that's clipped to the safe area. Used for tall content like Rules.

**Resolution — per-consumer changes:**

- **Settings (`AppSettings.tsx`)**: theme switcher buttons receive an explicit `maxWidth` constraint or shift to icon-only buttons (3 small bronze-ringed circles) so they fit within `safeContentInset.horizontal`.
- **Rules (`Rules.tsx`)**: enable `enableInnerScroll`; visual upgrade — each rule row gets a bronze-tinted leading icon (lives → `heart-multiple-outline`, hints → `lightbulb-outline`, scoring → `script-text-outline`); thin bronze divider rule between sections; difficulty sub-bullets become a tighter 3-column row instead of stacked bullets, freeing vertical space.
- **Sign-out confirm**: short content, no scroll needed — receives the new safe-inset padding so the two action buttons fit cleanly.
- **ConfirmNameModal**: short content, fits with safe insets; visual polish to match.
- **ForceUpdateModal**: see #10 below.
- **SoftUpdateModal (new)**: see #10 below.

**Translation key delta (Rules):** none new. Existing `rules_lives` / `rules_hints` / `rules_scoring_intro/easy/medium/hard/outro` keys still drive the content; only the rendering changes.

---

### #9 — Auth loading state (`isSigningIn`)

Add an `isSigningIn: boolean` flag to `AuthContextValue`. Tracks whether any auth operation is in flight (sign-in via Google, sign-in via Apple, sign-out).

**Implementation in `AuthProvider.tsx`:**
- `useState<boolean>` — `isSigningIn`, default `false`.
- Wrap `signInWithGoogle` / `signInWithApple` / `signOut` bodies in `try/finally`. Set `isSigningIn = true` at start; `isSigningIn = false` in `finally`.
- Memoised context value depends on `isSigningIn` so consumers re-render.

**Consumers:**
- **LeaderboardScreen anon-state (new Lean layout)**: while `isSigningIn`, render a centered `<Loading />` overlay or per-button spinner; both Google and Apple `ProviderButton`s become `disabled={true}` (visually dimmed, taps ignored).
- **AccountSection sign-out (when signed-in)**: while `isSigningIn`, show inline spinner on the sign-out row; the sign-out confirmation Modal's "Confirm" button becomes disabled.

**Tab-bar suppression:** initially leave normal navigation enabled. If we observe orphaned operations during testing, gate tab taps. (YAGNI: don't ship the gate without evidence.)

**Files:**
- MODIFY: `src/context/AuthProvider.tsx` — add state, wrap methods
- MODIFY: `src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx` — disable buttons + loader on `isSigningIn`
- MODIFY: `src/components/app-settings/AccountSection.tsx` — disable sign-out + loader on `isSigningIn`

**No translation key changes.**

---

### #10 — Force-update soft / hard split

Two distinct modals, two distinct purposes. The single non-dismissible ForceUpdateModal becomes the rare/last-resort case; routine version announcements use a new dismissible SoftUpdateModal.

**Trigger rules:**

| Modal | Trigger condition | Dismissible? | Cooldown |
| --- | --- | --- | --- |
| **SoftUpdateModal** *(new)* | `Application.nativeApplicationVersion < latestVersion` AND `softUpdate:lastDismissedAt` is null OR more than 7 days old | Yes — "Later" button records timestamp in AsyncStorage `softUpdate:lastDismissedAt` and closes | 7 days |
| **ForceUpdateModal** *(existing, refined)* | `Application.nativeApplicationVersion < minSupportedVersion` | No — single "Update now" button → store deep link | n/a |

**Priority rule:** if both fire (`current < min < latest`), only ForceUpdateModal shows. Hard supersedes soft — the user can't dismiss past the soft modal to land on a non-functional app.

**No Firestore schema change.** `app_config/version` already has both `latestVersion` and `minSupportedVersion`. We just start writing meaningfully different values to each:
- For routine releases (2.1.0, 2.2.0, …): bump `latestVersion` only. `minSupportedVersion` stays at `"2.0.0"` until a breaking change forces it forward.
- For the 2.0.0 launch itself: `minSupportedVersion: "2.0.0"` so all 1.x users are forced to update (necessary because of the schema migration).

**SoftUpdateModal copy:**

```
ka:
  Header: "ახალი ვერსია"
  Body:   "ხელმისაწვდომია აპლიკაციის უფრო ახალი ვერსია. რეკომენდირებულია განახლება."
  Primary button:   "განახლება"
  Secondary button: "მოგვიანებით"

en:
  Header: "New version available"
  Body:   "A newer version of the app is available. We recommend updating."
  Primary:   "Update"
  Secondary: "Later"
```

**ForceUpdateModal copy:** stays as already implemented (`force_update_title` / `_body` / `_button`).

**Files:**
- ADD: `src/components/sign-in/SoftUpdateModal.tsx` (or move to `src/components/update/`; folder rename out-of-scope, leave under sign-in for now)
- MODIFY: `src/hooks/useForceUpdateGate.ts` — return `{ isHardBlocked, isSoftBlocked, latestVersion, dismissSoft }`
- MODIFY: `App.tsx` — render `<SoftUpdateModal>` when `isSoftBlocked`; render `<ForceUpdateModal>` when `isHardBlocked` (existing); priority handled in the hook
- ADD translation keys: `softupdate_title`, `softupdate_body`, `softupdate_primary`, `softupdate_secondary`

**Visual treatment:** SoftUpdateModal uses the same parchment Modal component as ForceUpdateModal, with the safe-inset improvements from #8/#11/#12. Visual polish on both is part of the same parchment-Modal design pass.

---

## Cross-cutting changes

### Translation keys — full delta

**Add:**
- `leaderboard_anon_headline`
- `gamesummary_tier_beginner`
- `gamesummary_tier_solid`
- `gamesummary_tier_strong`
- `gamesummary_tier_expert`
- `softupdate_title`
- `softupdate_body`
- `softupdate_primary`
- `softupdate_secondary`

**Drop:**
- `leaderboard_signin_button_top` *(orphan, confirmed unreferenced)*
- `milestone_title`, `milestone_body`, `milestone_subbody`, `milestone_skip_button` *(modal removed)*
- `feedback_low`, `feedback_medium`, `feedback_high`, `feedback_excellent`, `feedback_outstanding` *(accuracy-based GameSummary tier copy — replaced by score-based, see #7)*

**Modify (copy only, no rename):**
- `settings_signout_confirm_body` — new wording per #1

### Files added

```
src/services/local-lifetime-stats.ts
src/hooks/useLifetimeStats.ts
src/screens/main-screens/leaderboard-screen/LeaderboardPodium.tsx
src/components/sign-in/SoftUpdateModal.tsx
```

### Files removed

```
src/components/sign-in/MilestoneNudgeModal.tsx
```

### Files modified

```
src/screens/main-screens/leaderboard-screen/LeaderboardScreen.tsx
src/screens/main-screens/leaderboard-screen/styles.ts
src/screens/main-screens/stats-screen/StatsScreen.tsx
src/hooks/useGameScreen.tsx
src/hooks/useForceUpdateGate.ts
src/context/AuthProvider.tsx
src/components/app-settings/AppSettings.tsx
src/components/app-settings/AccountSection.tsx
src/components/game-summary/GameSummary.tsx
src/components/rules/Rules.tsx
src/components/modal/Modal.tsx
App.tsx
src/locales/en.json
src/locales/ka.json
```

### Theme tokens

No new theme tokens required. All visual changes use existing `bronzeDark`, `parchmentTint`, `incorrectBorder`, the spacing scale (`x1` through `x32`), and `borderRadius.{xs|sm|md|lg|full}`.

---

## Out of scope

- **#5 — App-wide font replacement.** Captured in plan-doc deferred-follow-ups (item 2). Separate design effort with its own typography spec; touches every screen so plan a full visual review after the swap.
- **Cross-device Stats aggregation.** With #3, Stats are per-device. Re-introducing cross-device sync would require a parallel Firestore mirror (the very `users/{uid}` reads we just removed). Not worth the dual-source bookkeeping; live with per-device Stats.
- **Server-side score validation.** Out of scope of the parent v1 spec; carried forward unchanged.
- **MilestoneNudgeModal field cleanup on existing user docs.** `hasSeenSignInNudge` stays as deprecated; no migration script.
- **Apple `auth/email-already-in-use` merge handler.** Cross-provider email collision (Apple ↔ Google sharing one email) currently throws — captured in plan-doc deferred-follow-ups; we test this polish pass with Apple's "Hide My Email" feature instead. The merge handler ships in a separate small PR before 2.0.0 store submission.

---

## Testing

Pragmatic, mostly manual since this is UI polish.

**Unit:**
- `local-lifetime-stats` — `recordGame` increments correctly, `getLifetimeStats` returns zeros on first read, idempotent across multiple writes.
- `compareSemver` already covered by parent spec; soft/hard split gate logic gets a small test (current < min → hard; current < latest → soft; both → hard wins).

**Manual e2e on iOS dev-client + Android emulator:**
- Anonymous user opens Leaderboard → sees Lean layout (icon + headline + Google + Apple [iOS]).
- Tap Google → loader appears → buttons disable → ConfirmNameModal opens after first link → user appears on leaderboard.
- Tap Settings as anonymous → no Account section visible.
- Tap Settings as signed-in → sign-out below theme switcher → tap → confirmation modal → confirm → fresh anonymous → Stats values **persist** (local storage).
- Game-end flow → GameSummary opens directly (no MilestoneNudgeModal). Tier copy reflects score band.
- Top 3 leaderboard ranks render as a podium (2 / 1 / 3 with rank 1 tallest).
- Open Rules modal → all bullets visible with iconography + dividers; long content scrolls cleanly within the parchment.
- Soft update: bump `latestVersion` to `"2.1.0"` in Firestore → relaunch app → SoftUpdateModal appears → tap "Later" → modal closes → relaunch within 7 days → no re-prompt → 8 days later → re-prompts.
- Hard update: bump `minSupportedVersion` to `"3.0.0"` → relaunch → ForceUpdateModal appears (non-dismissible). Reset.
- Parchment overflow regression — Settings theme switcher fits within parchment; Rules content fits or scrolls within parchment; no curl-edge bleed anywhere.

**No new automated coverage** beyond the unit tests above. UI polish is expected to be visually verified.

---

## Implementation order (preview)

Detailed plan lives in the implementation plan doc (next step). Suggested sequence:

1. **#6 — Remove MilestoneNudgeModal** (cleanup; smallest risk; clears the path)
2. **#7 — GameSummary tier copy** (small; depends on #6's GameModals.tsx changes being final)
3. **#9 — Auth loading state** (small infrastructure; needed by #0 and #1)
4. **#0 + #1 — Lean Leaderboard anon + Settings auth simplification** (paired; together complete the "sign-in only on Leaderboard tab" model)
5. **#2 — Leaderboard signed-in podium**
6. **#3 — Stats local-storage rewire** (medium architecture)
7. **#8 + #11 + #12 — Parchment Modal redesign** (broad impact; do last to absorb final visual decisions from earlier steps)
8. **#10 — Soft / hard update modal split** (independent; can move earlier if convenient)

Each step lands as its own commit. Branch stays at `Add-question-variations` per parent plan.

---

## Open follow-ups

- Specific tier copy in Georgian — strings drafted above; user to refine wording during impl review (B-tone register).
- Exact safe-inset measurements for the parchment image — to be measured against the source asset during impl. Provisional values: horizontal 24px, vertical 32px.
- Whether to rename `src/components/sign-in/` → `src/components/auth/` or `src/components/modals/auth/` once MilestoneNudgeModal + ForceUpdateModal + SoftUpdateModal accumulate inside. Out of scope for this pass; revisit when polishing folder structure.
