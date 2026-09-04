# INFRASTRUCTURE.md

A complete reference for everything that runs the **History of Georgia** app — code structure, data layer, Firebase setup, external services, environment, costs, release flow. Read this first when returning to the project after time away.

For commands (build, deploy, lint, run), see [`README.md`](./README.md). This document is the **map**, not the **how-to**.

---

## Table of contents

1. [Tech stack](#1-tech-stack)
2. [Project structure](#2-project-structure)
3. [Navigation](#3-navigation)
4. [Screens](#4-screens)
5. [Components](#5-components)
6. [Hooks](#6-hooks)
7. [Helpers](#7-helpers)
8. [Services (data layer)](#8-services-data-layer)
9. [Contexts](#9-contexts)
10. [Constants](#10-constants)
11. [Theme](#11-theme)
12. [Translations](#12-translations)
13. [Types](#13-types)
14. [Firebase](#14-firebase)
15. [External services](#15-external-services)
16. [Environment & secrets](#16-environment--secrets)
17. [Data lifecycle & retention](#17-data-lifecycle--retention)
18. [Cost surfaces](#18-cost-surfaces)
19. [Release pipeline](#19-release-pipeline)

---

## 1. Tech stack

| Layer | Choice | Version |
| --- | --- | --- |
| Runtime | React Native | 0.86.3 |
| Framework | Expo SDK | 57 |
| Language | TypeScript | 6.0.x |
| Navigation | React Navigation (native-stack + bottom-tabs) | 7.x |
| Backend | Firebase (Auth + Firestore + Cloud Functions) | client 12.18.0 / admin 13.10.0 |
| Local storage | `@react-native-async-storage/async-storage` | 2.2.0 |
| Auth providers | Firebase Anonymous + Google Sign-In + Apple Authentication | — |
| Push | Expo Notifications + `expo-server-sdk` (functions side) | 57.x / 3.x |
| Build & OTA | EAS Build + EAS Update | CLI ≥ 23.2.0 |
| Test runner | Jest (`jest-expo` preset) | 29.x |
| Linter | `expo lint` (ESLint 9) | — |
| Node | required `>= 22.23.1` | (see `.nvmrc`) |

**Other notable packages:** `expo-apple-authentication`, `@react-native-google-signin/google-signin`, `expo-audio`, `expo-haptics`, `expo-linear-gradient`, `expo-notifications`, `expo-store-review`, `expo-updates`, `dayjs`, `react-native-reanimated`, `react-native-webview`, `react-native-youtube-iframe`, `react-native-toast-message`, `firebase-admin` (dev only — used by `upload.ts`).

**Experimental flags** (`app.config.ts`): `experiments.reactCompiler: true`.

---

## 2. Project structure

```
history-of-georgia/
├── App.tsx                     # Root component — providers, modals, navigation
├── app.config.ts               # Expo config (name, version, runtimeVersion, plugins)
├── eas.json                    # EAS build/submit profiles
├── firebase.ts                 # Firebase client init (Auth + Firestore)
├── firebase.json               # Firebase CLI config (rules + indexes + functions paths)
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Firestore composite indexes (in repo, deployed via CLI)
├── .firebaserc                 # Firebase project alias → "history-of-georgia-43551"
├── upload.ts                   # Question uploader (Firestore tickets collection)
├── package.json                # Dependencies + scripts
├── README.md                   # Developer commands
├── INFRASTRUCTURE.md           # This document
├── android-service-account-key/  # GITIGNORED — Play Store submission key
├── functions/                  # Cloud Functions source (Node 20 + TS)
│   ├── src/index.ts            # All Cloud Function definitions
│   └── package.json            # Functions deps (firebase-admin, firebase-functions, expo-server-sdk)
├── scripts/
│   └── merge-drafts.js         # Merge data-draft.json into data.json
├── docs/
│   └── superpowers/
│       ├── specs/              # Design specs (per-feature)
│       └── plans/              # Implementation plans (per-feature)
├── src/
│   ├── App.tsx                 # (root component lives at repo root, not here)
│   ├── assets/                 # Fonts, images, sounds, history-topics-data
│   ├── components/             # Reusable UI components (see §5)
│   ├── constants/              # Enums, config tables (see §10)
│   ├── context/                # React Context providers (see §9)
│   ├── helpers/                # Pure utility functions (see §7)
│   ├── hooks/                  # Custom hooks (see §6)
│   ├── locales/                # i18n JSON (en.json, ka.json) (see §12)
│   ├── migrations/             # AsyncStorage one-shot migrations
│   ├── navigation/             # AppNavigation, TabNavigation (see §3)
│   ├── screens/                # Feature screens (see §4)
│   ├── services/               # Firestore + AsyncStorage data layer (see §8)
│   ├── theme/                  # Design tokens + theme hooks (see §11)
│   └── types/                  # TypeScript types (see §13)
├── data.json                   # GITIGNORED — canonical question dataset (uploaded via upload.ts)
├── data-draft.json             # GITIGNORED — work-in-progress questions
├── bigChanges.md               # GITIGNORED — informal change log
├── CLAUDE.md                   # GITIGNORED — Claude Code instructions
├── .claude/                    # GITIGNORED — Claude rules + skills
└── .superpowers/               # GITIGNORED — agent tooling output
```

### Files that exist at runtime but are gitignored

`firebase.js` (compiled output of `firebase.ts` for `upload.ts`), `upload.js` (compiled `upload.ts`), `data.json` / `data_old.json` / `.data.json`, `.env`, `*.p8` Apple keys, `*.mobileprovision` profiles, `android-service-account-key/`, `bigChanges.md`, `CLAUDE.md`, `.claude/`, `.superpowers/`.

---

## 3. Navigation

```
AppNavigation (native-stack)
├── SPLASH_SCREEN          → CustomSplashScreen        (initial; no header)
├── tabs                   → TabNavigation             (nested bottom tabs)
│   ├── START_GAME_SCREEN       → StartGameScreen        (Home, sword-cross icon)
│   ├── HISTORICAL_TOPICS_SCREEN → HistoricalTopicsScreen (book-open icon)
│   ├── LEADERBOARD_SCREEN      → LeaderboardScreen      (trophy-variant icon)
│   └── STATS_SCREEN            → StatsScreen            (chart-line icon)
├── GAME_SCREEN            → GameScreen                (params: { difficulty })
├── RULERS_SCREEN          → RulersScreen
├── BATTLES_SCREENS        → BattlesScreen
├── PUBLIC_FIGURES         → PublicFiguresScreen
├── RULER_DETAILS          → RulerDetailsScreen        (params: { rulerId })
├── BATTLE_DETAILS         → BattleDetailsScreen       (params: { battleId })
└── PUBLIC_FIGURES_DETAILS → PublicFiguresDetailsScreen (params: { publicFigureId })
```

**Route names:** all in `ScreenName` enum (`src/types/screenNames.ts`) — no string literals at call sites.
**Param types:** `RootStackParamList` and `TabParamList` (`src/types/screens.ts`).
**Headers:** every non-splash, non-game screen renders `CustomHeader` with left=settings, right=rules. `GameScreen` and `CustomSplashScreen` are full-bleed, no header.

---

## 4. Screens

### Main (`src/screens/main-screens/`)

| Screen | Purpose | Key state | Key handlers | In ← / Out → |
| --- | --- | --- | --- | --- |
| `CustomSplashScreen` | Splash + version-gate check | `fontsLoaded`, `updateGate` | dismiss soft modal, navigate forward | initial → tabs |
| `StartGameScreen` | Pick difficulty + start game | `selectedDifficulty` | `handlePressStart` | tabs default → `GAME_SCREEN` |
| `GameScreen` | Quiz loop | from `useGameScreen()` | from `useGameScreen.actions` | `START_GAME_SCREEN` → back to start (or summary modal) |
| `HistoricalTopicsScreen` | Cards: rulers / battles / figures | none | `handleTopicPress(screenName)` | tabs → `RULERS_SCREEN` / `BATTLES_SCREENS` / `PUBLIC_FIGURES` |
| `LeaderboardScreen` | Weekly + alltime leaderboard, podium top 3, sign-in CTA | `currentTab`, `showSignInNudge`, `isConfirmNameVisible` | tab toggle, refresh on focus, Google/Apple sign-in, confirm-name | tabs → none (sign-in / confirm-name modals only) |
| `StatsScreen` | Lifetime + recent games, sourced from AsyncStorage | from `useLifetimeStats` + `useRecentGames` | refresh on focus | tabs → none |

### Topic lists (`src/screens/historical-topic-screens/`)

| Screen | Source data | Out → |
| --- | --- | --- |
| `RulersScreen` | `src/constants/rulers.ts` | `RULER_DETAILS` |
| `BattlesScreen` | `src/constants/battles.ts` | `BATTLE_DETAILS` |
| `PublicFiguresScreen` | `src/constants/publicFigures.ts` | `PUBLIC_FIGURES_DETAILS` |

All three use `SearchInput` to filter by name. Common pattern: pass entity `id` via route params, lookup in detail screen.

### Topic details (`src/screens/historical-topic-details-screens/`)

| Screen | Route param | Renders |
| --- | --- | --- |
| `RulerDetailsScreen` | `rulerId` | `TopicDetailsContent` (title, description, era, optional `YoutubePlayer`) |
| `BattleDetailsScreen` | `battleId` | same |
| `PublicFiguresDetailsScreen` | `publicFigureId` | same |

---

## 5. Components

All components live in `src/components/<folder>/<File>.tsx` and are barrel-exported from `src/components/index.ts`. **Do not** add per-folder `index.ts`. Follow the styling rules in `.claude/rules/styling.md` (theme tokens only, no inline styles, no hardcoded hex / rgba / numeric spacing or radius).

### Text & layout

| Component | Purpose | Notable props |
| --- | --- | --- |
| `AppText` | Replacement for RN `Text`. **Always use this** instead of `Text` (a few documented exceptions in components rules). | `type` (caption/body/subHeadline/headline/title/display), `fontFamily` (sans/serif/script/display), `color`, `fontSize`, `fontWeight`, `lineHeight` |
| `Modal` | Parchment scroll modal wrapper | `isVisible`, `headerTitle`, `onClose?`, `renderComponent`, `safeContentInset?`, `enableInnerScroll?` |
| `GradientWrapper` | Wraps `expo-linear-gradient` — never import the lib directly | `colors?`, `locations?`, `start?`, `end?`, `style`, `children` |

### Interactive

| Component | Purpose |
| --- | --- |
| `IconButton` | MaterialIcons button + optional text label (`iconName`, `size`, `color`, `text?`, `onPress`) |
| `OptionButton` | Quiz answer button with correct/incorrect visual states (`option`, `isCorrect?`, `shouldShowCorrect?`, `isOptionDisabled?`, `isLoading?`, `onPress`) |
| `NavigationPressable` | Image + title + arrow row for list navigation (`img`, `title`, `onBtnPress`) |
| `SettingToggle` | Icon + label + switch row (`iconName`, `label`, `value`, `onValueChange`) |
| `StatisticsCard` | Card with icon + numeric title + description (`iconName`, `title`, `description`) |
| `DifficultyRing` | Animated ring selector for easy/medium/hard (`selectedDifficulty`, `onDifficultyChange`) |
| `ScoreChangeIndicator` | Reanimated "+N" floater that overlays the score on correct answers; props `value` (points earned, null when idle) + `changeKey` (incrementing trigger) |
| `SearchInput` | Text input with search icon (`placeholder`, `value`, `onChangeText`) |

### Game-screen sub-components (`src/components/game-screen-components/`)

| Component | Purpose |
| --- | --- |
| `GameHeader` | Crowns (lives) + score (renders `ScoreChangeIndicator` overlay) |
| `QuestionDisplay` | Quiz question text |
| `OptionsDisplay` | FlatList of `OptionButton`; tracks `selectedOption` |
| `GameFooter` | Hint button + exit button |
| `GameModals` | Modal host inside `GameScreen` (exit / settings / hint / summary) |

### Modal / dialog

| Component | Purpose |
| --- | --- |
| `AppModals` | App-root modal host (rules / settings / ethernet / sign-in / updates) |
| `Hint` | Hint modal (`hint` string) |
| `Rules` | Rules modal content |
| `GameSummary` | Post-game summary: score, correct count, score-tier copy keyed off `ScoreThreshold` enum |
| `EndGame` | End-game state UI (exit / restart) |
| `SignInModal` | Google + Apple buttons; anon prompt (`isVisible`, `onClose`, `onSignInSuccess`) |
| `ConfirmNameModal` | Display-name confirmation/edit text input |
| `ForceUpdateModal` | Hard-block update modal (Endgame style) |
| `SoftUpdateModal` | Dismissible "new version available" modal |

### Misc

| Component | Purpose |
| --- | --- |
| `EmptyState` | Empty list state (`title`, `description`, `icon?`) |
| `Loading` | Activity spinner with optional label |
| `CustomHeader` | App header with left/right icon buttons |
| `TopicDetailsContent` | Detail-screen body (title, description, era, optional YouTube embed) |
| `YoutubePlayer` | Wraps `react-native-youtube-iframe` |
| `ErrorBoundary` | Class component, catches render errors at App root |

---

## 6. Hooks

All in `src/hooks/`, exported via `src/hooks/index.ts`.

| Hook | Returns | Used by |
| --- | --- | --- |
| `useAuth()` | `{ user, uid, isAnonymous, isAuthenticating, isSigningIn, signInWithGoogle, signInWithApple, signOut, updateDisplayName, bumpAuthVersion }` | `LeaderboardScreen`, `useGameScreen`, `useUserStats`, `useRecentGames` |
| `useSettings()` | `{ isMuted, isVibrationOff, isPushEnabled, setIsMuted, setIsVibrationOff, setIsPushEnabled }` | `GameScreen`, `StartGameScreen`, audio/haptic helpers |
| `useTranslation()` | Current-language strings object (en or ka JSON) | every screen / component with text |
| `useGameScreen()` | `{ gameState, actions, modalHandlers }` | `GameScreen` only |
| `useLeaderboard({ tab })` | `{ entries, isLoading, isRefreshing, error, refresh }` | `LeaderboardScreen` |
| `useUserStats({ uid? })` | `{ stats, isLoading, error, refresh }` | `StatsScreen`, `LeaderboardScreen` |
| `useLifetimeStats()` | `{ stats, isLoading, refresh }` (local, AsyncStorage-backed) | `StatsScreen` |
| `useRecentGames()` | `{ games, isLoading }` | `StatsScreen` |
| `useModalState()` | `{ isRulesModalVisible, toggleRulesModal, isSettingsModalVisible, toggleSettingsModal, isExitModalVisible, toggleExitModal, isEthernetModalVisible }` | `App.tsx` |
| `useForceUpdateGate()` | `{ isHardBlocked, isSoftBlocked, latestVersion, dismissSoft }` | `App.tsx` (`ForceUpdateGate`) |
| `usePlaySound()` | `{ playSound(sound, isMuted), cleanup() }` | `GameScreen`, `StartGameScreen` |
| `useCustomFonts(map)` | `boolean` (fontsLoaded) | `App.tsx` |
| `useNotifications()` | `void` (registers handlers + Expo push token) | `App.tsx` |
| `usePendingResultsReplay()` | `void` (watches auth + net state, replays queued results) | `App.tsx` (via `BootEffects`) |
| `useBackHandler(onBackPress)` | `void` (Android hardware back) | `App.tsx`, `LeaderboardScreen`, others |

---

## 7. Helpers

All in `src/helpers/`, pure functions or thin wrappers.

| Helper | Exports | Purpose |
| --- | --- | --- |
| `fetchRandomQuestion.ts` | `fetchRandomQuestion(difficulty?)` | Firestore `tickets` random query (uses `randomField`); local cache fallback on network error |
| `getAdjustedHeight.ts` | `getAdjustedHeight(h)` | Scale to screen vs design baseline (812pt) |
| `getAdjustedWidth.ts` | `getAdjustedWidth(w)` | Scale to screen vs design baseline (375pt) |
| `vibration.ts` | `vibrateImpact(impact?)` | `expo-haptics` wrapper (heavy / medium / light) |
| `analytics.ts` | `logEvent(name, params?)`, `AnalyticsEvent` enum, `TopicCategory` enum | Console in DEV, Firebase Analytics in prod |
| `gameHistory.ts` | `saveGameResult`, `getGameHistory`, `getStats` | AsyncStorage game-history accumulator |
| `openAppOrUrl.ts` | `openAppOrUrl(appUrl, websiteUrl)` | Try opening native app URL, fallback to website |
| `logger.ts` | `logger.log/warn/error(tag, msg, data?)` | DEV-gated console logger |
| `date.ts` | date-formatting helpers (locale-aware via dayjs) | leaderboard week boundary, formatted timestamps |

---

## 8. Services (data layer)

`src/services/` contains all Firestore + AsyncStorage I/O. UI code never talks to Firebase or AsyncStorage directly — it goes through these.

| Service | Backed by | Public functions |
| --- | --- | --- |
| `firestore-user.ts` | Firestore `users/{uid}` | `ensureUserDoc(uid, isAnon)` (creates with zeroed stats), `updateDisplayName(uid, name)`, `updateProviderProfile(uid, { displayName, photoURL })` |
| `firestore-game-result.ts` | Firestore `game_results/{uid}_{resultId}` + `users/{uid}` (transactional) | `saveGameAndUpdateStats(uid, resultId, payload)` — idempotent transaction (upserts user stats, creates result doc); error classes `GameResultRulesError` (permission denied / rule rejection) and `GameResultTransientError` (retryable network) |
| `firestore-leaderboard.ts` | Firestore `users` (filtered by `displayName != null`) | `getLeaderboard(tab: LeaderboardTab)` — sorts by `weekPoints` (WEEKLY) or `totalPoints` (ALLTIME), top 50 |
| `local-recent-games.ts` | AsyncStorage | `addLocalRecentGame(game)`, `getRecentGames()` — independent of auth, always written |
| `local-lifetime-stats.ts` | AsyncStorage | `recordGame({ score, correctCount, totalQuestions })`, `getLifetimeStats()` — independent of Firestore, fires on every game |
| `pending-results.ts` | AsyncStorage queue (cap = `PENDING_RESULTS_QUEUE_CAP` = 20) | `enqueuePendingResult(...)`, `replayPendingResults(uid)` — offline queue, replayed when online + authed. Each entry stores the `uid` it was played under; replay refuses to attribute a queued result to any other uid (sign-out / sign-in / auto-prune transitions silently drop mismatched entries rather than re-credit them). |
| `appConfig.ts` | Firestore `app_config/version` (public read) | `getAppConfig()` → `{ minSupportedVersion, latestVersion }` — drives force-update gate |

**Why dual write to Firestore + AsyncStorage?** The local services (`local-recent-games`, `local-lifetime-stats`) are the source of truth for `StatsScreen` so signing out doesn't wipe the user's view. Firestore writes are the source of truth for the leaderboard and survive device reset.

---

## 9. Contexts

All in `src/context/`. Tree order in `App.tsx`: `LanguageProvider` → `AuthProvider` → `SettingsProvider` → `ThemeModeContext` → `ThemeProvider`.

### `AuthProvider.tsx`

Owns Firebase Auth state. Every app launch ends with a signed-in user (anonymous if no OAuth).

**Exposes:** `useAuth()` → `{ user, uid, isAnonymous, isAuthenticating, isSigningIn, signInWithGoogle, signInWithApple, signOut, updateDisplayName, bumpAuthVersion }`.

**Flow:**
1. App boots → `onAuthStateChanged` fires.
2. If no user, `signInAnonymously()` → `ensureUserDoc(uid, true)`.
3. User taps Google or Apple on `LeaderboardScreen` → `linkWithCredential` upgrades the anonymous account.
4. On `auth/credential-already-in-use` (returning user) → sign in with credential, drop the just-issued anon doc.
5. Display name comes from provider OR `ConfirmNameModal`. Apple's `result.fullName` is captured **only on first sign-in** (Apple never returns it again).

### `LanguageContext.tsx`

**Exposes:** `useLanguage()` → `{ language, setLanguage }`, plus `useTranslation()` → current strings (en or ka). Default = KA. Persisted to AsyncStorage.

### `SettingsContext.tsx`

**Exposes:** `useSettings()` → `{ isMuted, isVibrationOff, isPushEnabled, setIsMuted, setIsVibrationOff, setIsPushEnabled }`. All persisted to AsyncStorage. `setIsPushEnabled` registers / unregisters Expo push tokens via `firestore` `push_tokens` collection.

### `ThemeProvider` / `ThemeModeContext` (`src/theme/`)

`ThemeModeContext` holds `{ themeMode, isThemeDark, setThemeMode }`. `ThemeProvider` exposes the theme object built by `buildAppTheme(isDark)`.

---

## 10. Constants

All in `src/constants/`. Use enums, never magic numbers or magic strings.

| File | Exports |
| --- | --- |
| `scoring.ts` | `POINTS_PER_DIFFICULTY = { easy: 5, medium: 10, hard: 20 }`, `pointsFor(difficulty)`, `PENDING_RESULTS_QUEUE_CAP = 20`, `PENDING_RESULTS_KEY` (AsyncStorage key) |
| `gameInitialState.ts` | `INITIAL_STATE: GameState` (5 crowns, 0 score, full hints, modals closed) |
| `timing.ts` | `CORRECT_ANSWER_DELAY_MS = 1200`, `INCORRECT_ANSWER_DELAY_MS = 1700`, `GAME_OVER_SUMMARY_DELAY_MS = 1500`, `SPLASH_SCREEN_MIN_DURATION_MS = 2000`, `SOUND_CLEANUP_DELAY_MS = 3000`, `STORE_REVIEW_PULSE_DURATION_MS = 2000` |
| `hint.ts` | `HINT_LIMIT = 3`, `HINT_COST_CROWNS = 0` |
| `language.ts` | `enum AppLangCode { EN, KA }`, `DEFAULT_LANGUAGE` |
| `keyboard.ts` | `KEYBOARD_HEIGHT_ADJUSTMENT` |
| `platform.ts` | `IS_IOS`, `IS_ANDROID`, `IS_WEB` — **always use these**, never `Platform.OS === "ios"` |
| `dimensions.ts` | `SCREEN_HEIGHT`, `SCREEN_WIDTH`, `DESIGN_SCREEN_HEIGHT`, `DESIGN_SCREEN_WIDTH` |
| `resultFeedback.ts` | Score-tier message lookup (used in `GameSummary` via `ScoreThreshold` enum) |
| `rulers.ts` | Array of `{ id, name, era, description, ... }` for `RulersScreen` |
| `battles.ts` | Array of battles |
| `publicFigures.ts` | Array of figures |
| `questionPrefixes.ts` | Prefix strings for question variations |

**Convention:** when a numeric threshold or string matters in more than one place, promote it to an enum or constant here. Don't duplicate, don't inline.

---

## 11. Theme

All design tokens live in `src/theme/`. Components access via `useStyles(getStyles)` (memoized StyleSheet) and `useAppTheme()` (runtime values for JSX props).

| Token | File | Values |
| --- | --- | --- |
| Colors | `colors.ts` | `lightColors`, `darkColors` schemes; primary, parchment, bronze, feedback, surface, text, border, gradient, shadow, chrome, ring tokens. Add new colors here with both light + dark variants — never hardcode hex / rgb / rgba in component files. |
| Spacing | `spacing.ts` | `{ x1: 4, x2: 8, x3: 12, ... x32: 128 }` — 4px base unit, 17 steps |
| Border radius | `borderRadius.ts` | `{ xs: 4, sm: 8, md: 12, lg: 16, full: 9999 }` |
| Fonts | `fonts.ts` | `sans: "helvetica-main"` (body/UI), `serif: "nino-elite"` (titles), `script: "irubaqidze-heavy"` (ornament), `display: "dm-medea"` (hero). Aisi Bold (`GFAisiBoldItalic.ttf`) is retained in `src/assets/fonts/` as fallback after the v2.0.0 swap (see note below). |
| Shadows | `shadows.ts` | `default: { shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation }` — single preset |
| Z-index | `zIndex.ts` | `{ header: 1000 }` |

**Composition:** `theme.ts` exports `buildAppTheme(isDark)` which combines all tokens into an `AppTheme` object. `useAppTheme()` reads from `ThemeContext`; `useStyles(getStyles)` memoizes `StyleSheet.create` keyed by theme.

**Mode switching:** `useThemeMode()` toggles light/dark; `useModifyThemeMode()` sets directly. System mode follows `Appearance` API.

**Script-font swap (v2.0.0):** `script` was changed from `"aisi-bold"` (italic, hard to read on long sentences, narrow widths) to `"irubaqidze-heavy"` (upright BPG Irubaqidze, FontForge-baked Heavy weight via `ChangeWeight(60)`). Source font (`BPG Irubaqidze.ttf`, Regular only) was pulled from [thecotne/georgian-webfonts](https://github.com/thecotne/georgian-webfonts) and emboldened locally with FontForge to produce `BPGIrubaqidzeHeavy.ttf`. The two `script`-specific layout workarounds in `src/components/text/styles.ts` (`lineHeightBoost = fontSize * 0.25`, `rightBleedFix = fontSize * 0.08`) were originally added for Aisi's italic slant + tall ascenders — they remain in place for Irubaqidze and are tunable post-device-test if text feels too airy or left-shifted. `GFAisiBoldItalic.ttf` is kept in `src/assets/fonts/` as fallback until v2.0.0 is live in stores.

---

## 12. Translations

Two JSON files: `src/locales/en.json` and `src/locales/ka.json`. Default = KA.

**Top-level key categories:**

- `common_*` — shared UI text (start, close, score, ok, cancel)
- `game_*` — gameplay (end, restart, share message, correct/incorrect feedback)
- `difficulty_*` — easy / medium / hard labels + selector title
- `leaderboard_*` — tabs, headers, empty state, podium copy
- `stats_*` — stats screen labels (total games, avg score, etc.)
- `settings_*` — settings toggles + section titles
- `tab_*` — bottom tab bar labels
- `rules_*` — rules modal content
- `error_*` — error messages
- `ethernet_*` — offline / no-network messages
- `force_update_*`, `soft_update_*` — version-gate messages
- `signin_*` — sign-in modal text
- `name_*` — display name input + confirm-name modal
- `notifications_*` — push notification copy
- `sound_*`, `vibration_*` — settings descriptions

**Adding strings:** add the key to **both** `en.json` and `ka.json`. Reference at usage sites as `t.common_start`. Never hardcode display text in components.

---

## 13. Types

`src/types/` defines TypeScript types (and a few enums consumed across modules).

| File | Defines |
| --- | --- |
| `screenNames.ts` | `enum ScreenName` — every route name |
| `screens.ts` | `RootStackParamList`, `TabParamList` (React Navigation) |
| `quizQuestion.ts` | `Difficulty: 'easy' \| 'medium' \| 'hard'`, `QuizQuestion`, `GameState` |
| `leaderboard.ts` | `UserDoc`, `GameResultDoc`, `LeaderboardEntry`, `enum LeaderboardTab { WEEKLY, ALLTIME }` |
| `settingsContextType.ts` | `SettingsContextType` |

---

## 14. Firebase

**Project ID:** `history-of-georgia-43551` (see `.firebaserc`).
**Plan:** Blaze (pay-as-you-go) — required for Cloud Functions and outbound network calls.

### 14.1 Auth

Configured in Firebase Console → Authentication. Providers enabled:
- **Anonymous** — every launch starts here.
- **Google** — OAuth client IDs in `.env` (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`).
- **Apple** — uses native `expo-apple-authentication`; no env var. Apple Service ID + key (`AuthKey_3C2L469ZH5.p8`) registered in Firebase Console.

Persistence: `getReactNativePersistence(AsyncStorage)` (see `firebase.ts`).

### 14.2 Firestore collections

| Collection | Purpose | Rules summary |
| --- | --- | --- |
| `tickets/{id}` | Quiz question pool (~1,564 docs). Fields: `question`, `options[]`, `correctAnswer`, `hint`, `difficulty`, `randomField` | Read: public. Write: forbidden via rules; only via `upload.ts` (Admin SDK). |
| `users/{uid}` | Per-user stats. Fields: `displayName`, `photoURL`, `isAnonymous`, `totalPoints`, `gamesPlayed`, `totalCorrect`, `totalQuestions`, `bestSingleGameScore`, `weekPoints`, `weekStart`, `hasSeenSignInNudge`, `lastSeenAt` (refreshed by `touchLastSeen`, drives §17.3), `createdAt`, `updatedAt` | Read: any authed user (leaderboard query). Create: owner only, all stats zeroed. Update: owner only, lifetime stats can only grow with anti-cheat caps per write (≤ +50 000 `totalPoints`, ≤ +1 `gamesPlayed`, ≤ +50 000 `weekPoints` while `weekStart` is unchanged or `≤ 50 000` absolute on rollover, ±5 jitter on `totalPoints` for retries); `(totalCorrect Δ) <= (totalQuestions Δ)` so claimed correctness can't outpace claimed questions; `createdAt` immutable. Delete: owner only (Apple Guideline 5.1.1(v) — see §17.4). |
| `game_results/{uid}_{resultId}` | Immutable per-game result. Fields: `userId`, `score`, `correctCount`, `totalQuestions`, `selectedDifficulty`, `scoreByDifficulty`, `createdAt` | Read: owner only (allows the idempotency check inside the save transaction to read non-existent docs). Create: owner only, doc id matches `{uid}_*`, `score >= 0 && <= 50 000`, `correctCount >= 0`, `totalQuestions >= 0`, `correctCount <= totalQuestions`, and `score == 0 || correctCount > 0` (couples claimed score to actual correctness, blocks the "0 correct, 50k score" inflation pattern). Update / delete: forbidden. |
| `app_config/version` | Force-update gate. Fields: `minSupportedVersion`, `latestVersion` | Read: public (gate runs before auth resolves). Write: forbidden via clients; Firebase Console / Admin SDK only. |
| `notifications/{id}` | Push-notification triggers. Fields: `title`, `body`, `status` (`pending` / `processing` / `sent` / `failed`) | Read + write: forbidden via clients; Firebase Console manual entry only. |
| `push_tokens/{token}` | Expo push tokens registered per device. Fields: `token`, `uid` (added 2026-05-03 — null for anon, owner uid otherwise; lets `pruneInactiveUsers` cascade clean up tokens of pruned users), `platform`, `updatedAt` | Read: authenticated owner only (`resource.data.uid == request.auth.uid`) — required by `deleteUserData`'s multi-device cascade per §17.4; pre-uid grandfather docs (`uid == null`) remain client-unreadable. Cloud Functions use Admin SDK and bypass rules. Write: authenticated users may write only when tagging the token with their own uid (or leaving uid blank, for compatibility with v1.1.0 binaries) AND the body's `token` field equals the document id (closes the token-squatting / fan-out attribution vector — `sendPushNotification` deletes by snapshot ref, but the rule binding eliminates the class). Delete: authenticated owner only (or pre-uid grandfather case). |

Rules file: `firestore.rules`. Deploy via `firebase deploy --only firestore:rules`.

### 14.3 Composite indexes

Defined in `firestore.indexes.json` (in repo, deployed via `firebase deploy --only firestore:indexes`):

1. `users` collection — `(displayName ASC, totalPoints DESC, gamesPlayed ASC)` — alltime leaderboard.
2. `users` collection — `(displayName ASC, weekStart ASC, weekPoints DESC)` — weekly leaderboard.

The `displayName` filter in both indexes is what excludes anonymous accounts (they have `displayName == null`) from the leaderboard.

### 14.4 Cloud Functions

`functions/src/index.ts` — Node 20 runtime, deploy via `cd functions && npm run deploy`.

| Function | Trigger | Purpose |
| --- | --- | --- |
| `sendPushNotification` | `onDocumentCreated("notifications/{notificationId}")` | Reads `push_tokens` collection, chunks via `expo-server-sdk`, sends to all valid tokens, prunes `DeviceNotRegistered` tokens, updates `notifications/{id}.status` to `sent` / `failed`. |

### 14.5 Admin tooling

`upload.ts` (root) — uploads questions from `data.json` to `tickets`. Uses Firebase Admin SDK with credentials from `firebase-admin-key.json` (NOT in repo). Compile with `npx tsc upload.ts ...` then `node upload.js`. Idempotent: updates existing docs, preserves `randomField`.

---

## 15. External services

| Service | Purpose | Auth / credentials | Where configured |
| --- | --- | --- | --- |
| **Firebase** | Auth, Firestore, Cloud Functions | API key + project ID in `.env` | `firebase.ts` (client), `functions/` (server) |
| **Google Sign-In** | OAuth provider | Web + iOS client IDs | `app.config.ts` plugin block + `.env` |
| **Apple Sign-In** | OAuth provider | Native (Apple ID) + `.p8` key registered with Firebase | `app.config.ts` plugin entry, Firebase Console |
| **Expo Push (FCM/APNs)** | Push notifications | iOS: Apple APNs key managed by EAS. Android: requires `google-services.json` at the repo root (referenced by `app.config.ts` `android.googleServicesFile`) so the client gets a token, AND an FCM V1 service account JSON uploaded via `eas credentials` so Expo's relay can deliver to the token. Both halves are required — without the file the client can't register; without the EAS service account Expo can't deliver. | `useNotifications` hook + `sendPushNotification` Cloud Function |
| **EAS Build** | iOS + Android binaries | Apple Team ID, App Store Connect, Play Store service account | `eas.json`, `android-service-account-key/` |
| **EAS Update** | OTA JS bundle delivery | Bound by `runtimeVersion` match | `app.config.ts` `updates.url` |
| **YouTube embed** | Video on detail screens | none (public) | `YoutubePlayer` (`react-native-youtube-iframe`) |

---

## 16. Environment & secrets

### `.env` (gitignored) — read by Expo at build time

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
```

`EXPO_PUBLIC_*` vars are bundled into the JS at build time and available client-side.

### `app.config.ts` — non-secret runtime config

- `name`, `slug`, `version`, `runtimeVersion`
- `ios.bundleIdentifier`, `android.package` — both `com.papunafshaveli.historyofgeorgia`
- `android.googleServicesFile` — `./google-services.json` (gitignored; embeds FCM credentials at Android build time)
- `extra.eas.projectId` — `27042bfa-ef74-4c27-89e1-395a3eef60df`
- `updates.url` — EAS Update URL
- `plugins[]` — `expo-splash-screen`, `expo-font`, `expo-notifications`, `["expo-audio", { enableBackgroundPlayback: false }]`, `expo-asset`, `@react-native-google-signin/google-signin` (with iOS reversed client ID), `expo-apple-authentication`. The `expo-audio` config-form is required: the bare-string default would inject `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permissions plus an `AudioControlsService` that we don't use (SFX only, no background playback). With `enableBackgroundPlayback: false` the manifest stays clean and Play Console doesn't demand a Foreground service declaration.

### `eas.json` — build/submit profiles

Profiles: `development`, `development-simulator` (extends `development` with `ios.simulator: true`), `preview`, `production`. Submit profile pinned to App Store Connect ID `6741484980` and Apple Team `M39YBKH9L5`. Android submit uses `android-service-account-key/history-of-georgia-43551-f5aff86366af.json`.

### Sensitive assets — gitignored, NEVER commit

- `.env`
- `*.p8` Apple keys (e.g. `AuthKey_3C2L469ZH5.p8`)
- `*.mobileprovision`, `*.p12`, `*.jks`, `*.key`, `*.pem`
- `firebase-admin-key.json` (Admin SDK credentials, used by `upload.ts`)
- `android-service-account-key/`
- `google-services.json` (Android Firebase config, embedded at build time via `app.config.ts` `android.googleServicesFile`)
- `GoogleService-Info.plist` (iOS Firebase config; not currently referenced but kept gitignored as defense)
- `data.json`, `data-draft.json`, `data_old.json`

---

## 17. Data lifecycle & retention

### 17.1 What writes when

| Write | Trigger | Storage |
| --- | --- | --- |
| `users/{uid}` create | App boot, after anonymous sign-in | Firestore |
| `users/{uid}` update | Game ends with a uid | Firestore (transactional w/ game result) |
| `game_results/{uid}_{resultId}` create | Game ends with a uid (online or replayed from queue) | Firestore |
| Local recent games | Every game ends | AsyncStorage |
| Local lifetime stats | Every game ends | AsyncStorage |
| Pending-results queue | Game ends while offline / unauthed (cap 20) | AsyncStorage |
| `push_tokens/{token}` | User enables push in Settings | Firestore |
| `notifications/{id}` | Manual entry in Firebase Console | Firestore |

### 17.2 Stats divergence — local vs Firestore

Stats screen reads from **AsyncStorage** (`local-lifetime-stats`, `local-recent-games`), not Firestore. This means:
- Signing out does NOT wipe the stats view.
- Stats survive offline play.
- Leaderboard rank depends on Firestore (only signed-in users with a `displayName`).

### 17.3 Inactive-user cleanup — 180-day rule (deferred to v2.1)

**Status: deferred to v2.1.** The schema is in place (see "What ships in v2.0.0" below); the scheduled `pruneInactiveUsers` Cloud Function does **not** ship with v2.0.0.

**Why deferred:** seven adversarial-review rounds against `pruneInactiveUsers` surfaced a sequence of cross-cutting failure modes (race conditions, clock skew, multi-uid throttle state, push-token bindings, offline replay, migration paths, bootstrap edge cases, trust boundaries). The findings stopped converging — by round 7, fixes for one round were creating regressions caught by the next. The function entangles five subsystems (heartbeat semantics, throttle state, push-token binding, offline queue replay, scheduled-job retry semantics) and needs proper Firestore-emulator integration tests + server-trusted `lastSeenAt` writes before it can ship. Out of scope for v2.0.0.

**What ships in v2.0.0 (telemetry + future-safe schema):**
- `users/{uid}.lastSeenAt` field, written by `touchLastSeen()` from `AuthProvider.onAuthStateChanged`. Throttled to once per 7 days per uid via the AsyncStorage cache key `lastSeen:syncedAt:v2:${uid}`. Future-timestamp guard (`elapsed >= 0`) prevents clock-skew freezes.
- `lastSeenAt` is also advanced inside `saveGameAndUpdateStats`'s transaction so game-end (live or offline-replay) refreshes it server-side. Without this, an offline player whose throttled `touchLastSeen` heartbeats never reach the server could be classified as inactive purely because best-effort writes failed silently.
- `push_tokens/{token}.uid` field, set by `registerForNotifications()` and refreshed across auth transitions by `retagPushToken()` (called from `onAuthStateChanged`).
- Firestore rule constraints on `lastSeenAt` (monotonic-or-equal AND `<= request.time`) were attempted in v2.0.0 but **deferred to v2.1** — the `<= request.time` clause rejected legitimate `serverTimestamp()` writes in production rule evaluation (placeholder-vs-Timestamp comparison quirk), blocking `touchLastSeen`, `updateProviderProfile`, and `updateDisplayName`. The field is still written client-side as v2.0.0 telemetry; rule enforcement ships alongside the prune Cloud Function in v2.1 with proper Firestore-emulator integration tests.
- Firestore rule on `push_tokens` — write requires authenticated uid match (or null for v1.1.0 grandfather). Closes the cascade-poisoning attack at the trust boundary.

`lastSeenAt` was chosen as the recency signal over `updatedAt` and Firebase Auth's `lastSignInTime`:
- `updatedAt` only advances on profile edits, milestone nudges, and game completions — a user who reopens the app daily for 180 days without playing is still classified as inactive.
- `lastSignInTime` only advances on explicit sign-in events, not on token-refresh restored sessions — so OAuth users could have a frozen `lastSignInTime` while being daily-active.

Only `lastSeenAt` reliably tracks "the user opened the app."

**v2.1 requirements list (distilled from the adversarial reviews):**
1. Firestore-emulator integration tests covering: cascade reorder, partial-failure retry, race between candidate-list query and per-candidate delete, clock skew, multi-uid throttle, multi-device push tokens.
2. Server-trusted `lastSeenAt` writes — most likely a HTTPS Callable Cloud Function the client invokes instead of the direct write path. Removes the trust-boundary concern entirely.
3. Migration plan for legacy `pending-results` queue entries (without `uid`).
4. Bootstrap edge case handling — game-end before anonymous sign-in resolves needs a defined path that doesn't risk cross-account corruption.
5. Push-token ownership re-binding strategy under multi-uid flows that doesn't depend on a one-time snapshot at registration.
6. Decision on offline-replay ownership: drop mismatches (data loss) vs preserve forever keyed by owner uid (storage growth) vs explicit recovery UX. Pick one with product input rather than code.

**Manual cleanup in the dev / early-adopter phase:** `scripts/wipe-auth.ts` plus `firebase firestore:delete --recursive users` / `game_results` from the README "Full reset for end-to-end testing" section is sufficient for the foreseeable future. Inactive-user accumulation at our current scale (mostly dev testing + early adopters) is cosmetic, not a cost driver.

**Source (v2.0.0 telemetry-only):**
- Client write: `src/services/firestore-user.ts` — `touchLastSeen` + `LAST_SEEN_THROTTLE_MS = 7 days`. Wired in `src/context/AuthProvider.tsx` after `ensureUserDoc`.
- Game-end transaction `lastSeenAt` advance: `src/services/firestore-game-result.ts`.
- Push-token uid tagging: `src/helpers/notifications.ts` (`registerForNotifications`, `retagPushToken`).
- Server prune function: **not implemented in v2.0.0**, lives in deferred follow-up #5 in `docs/superpowers/plans/2026-04-29-scoring-leaderboard-plan.md`.

### 17.4 In-app account deletion (Apple Guideline 5.1.1(v))

User-initiated deletion via Settings → Account → "Delete account & sign out". Client-only cascade — **no Cloud Function backstop**, **no Apple token revoke** — proven through App Store review by the drosha sister project shipping with this exact pattern. Order (irreversible local cleanup runs LAST so a partial failure is retry-safe):

1. `reauthenticate()` (Google or Apple) — satisfies Firebase's `auth/requires-recent-login`. Skipped for anon (button is hidden anyway).
2. `deleteUserData(uid)` cascade — three steps, each chunked 500-op `writeBatch`: (a) every `push_tokens` doc with `uid == <deleted uid>` (covers other-device tokens registered under v2.0.0+ — see caveat below); (b) every `game_results` doc where `userId == <deleted uid>`; (c) `users/{uid}` last (its presence is the retry handle for any earlier step that crashed). Idempotent — safe to retry against an already-deleted doc.
3. `unregisterNotifications()` — delete this device's `push_tokens/{token}` Firestore doc (needs auth, so must run before step 4 invalidates credentials) and clear the cached token from AsyncStorage so the user stops receiving notifications.
4. `auth.currentUser.delete()` — Firebase Auth account. `onAuthStateChanged` fires null → `AuthProvider` issues a fresh anon user automatically.
5. `clearPendingResults()` — drop the `pending-results` AsyncStorage queue. Runs **after** the server-side delete succeeds so a failure in steps 2–4 leaves the offline queue intact for retry; on success the new anon user can't replay these entries anyway (uid mismatch → silently dropped by the replay path). Lifetime stats + recent games are intentionally **kept** (per §17.2: stats are device-local, not account-bound; same physical user on the same device retains their gameplay history across sign-in / sign-out / delete).

**Multi-device push-token cleanup caveat.** The cascade in step 2(a) only catches `push_tokens` docs that have a `uid` field — i.e. tokens registered under v2.0.0 or later. Pre-2026-05-03 (v1.1.0) tokens have `uid: null` and are unreadable by clients via the current rule (`resource.data.uid == request.auth.uid`). They remain in Firestore until either: (a) the next push to that device returns `DeviceNotRegistered` and `sendPushNotification` prunes the row, or (b) v2.1's `pruneInactiveUsers` Cloud Function handles them server-side via Admin SDK. For a launch-time backstop, an Admin-SDK script that purges all `uid == null` token docs can be run once the v2.0.0 binary has propagated.

**Firestore rule shape:** `users/{uid}` and `game_results/{id}` permit `delete` only by the owner. `push_tokens/{token}` permits `delete` by the owner uid (or any authenticated client for pre-uid grandfather docs).

**If Apple rejects 2.0.0 specifically on the revoke-tokens requirement** (Guideline 5.1.1(v) explicitly requires server-side Apple token revoke), the v2.1 hotfix is: add a `functions.auth.user().onDelete()` Cloud Function that signs a JWT with the existing `AuthKey_3C2L469ZH5.p8` and calls `https://appleid.apple.com/auth/revoke`. ~1 day of work.

Source files: `src/context/AuthProvider.tsx` (`reauthenticate`, `deleteAccount`), `src/services/firestore-account-deletion.ts` (`deleteUserData`), `src/components/app-settings/AccountSection.tsx` (UI). Spec: `docs/superpowers/specs/2026-05-03-account-deletion-design.md`. Plan: `docs/superpowers/plans/2026-05-04-account-deletion-plan.md`.

### 17.5 Other retention

- `tickets` collection — **never** auto-deleted; canonical question pool, managed via `upload.ts`.
- `notifications` collection — manual cleanup; small enough to ignore for now.
- `push_tokens` — `sendPushNotification` deletes tokens that return `DeviceNotRegistered`.

---

## 18. Cost surfaces

| Surface | What costs money | How it's controlled |
| --- | --- | --- |
| **Firestore reads** | Every leaderboard fetch (top 50 users), every `tickets` fetch, every user stats read | 30-min in-memory cache on `useLeaderboard`; question caching in `fetchRandomQuestion`; budgets +1 read per game write transaction |
| **Firestore writes** | One transactional write per game result (creates `game_results` doc + updates `users` doc); push token register/unregister | Capped per game; queue cap = 20 prevents unbounded offline write replay |
| **Firestore storage** | `users`, `game_results`, `push_tokens`, `tickets`, `notifications` collections | Auto-cleanup deferred to v2.1 (§17.3); manual `scripts/wipe-auth.ts` + `firebase firestore:delete` from the README "Full reset" section is the dev/early-adopter path. User-initiated deletion (§17.4) cascades all three of `push_tokens`, `game_results`, `users/{uid}`. |
| **Cloud Functions invocations** | `sendPushNotification` per `notifications` doc create | Manual trigger only (no auto-flooding) |
| **Cloud Functions network** | Outbound Expo Push API calls (chunked) | Blaze plan required; expected: a few hundred sends per push campaign |
| **Firebase Auth MAU** | Every distinct user counts toward the free tier (50k MAU) and beyond | Inactive-user cleanup deletes Auth records too |
| **EAS Build credits** | iOS + Android build minutes | Free tier covers occasional builds; local builds (`--local` flag) bypass credits |
| **EAS Update bandwidth** | OTA bundle downloads | Negligible at current scale; capped by `runtimeVersion` matching |
| **Apple Developer Program** | $99/year | Recurring |
| **Google Play Developer** | $25 one-time | Paid |
| **App Store / Play Store revenue share** | 15–30% of any future paid feature | n/a until monetization |

**Set a $1/month spend alert** in Firebase Billing → Budgets & alerts as a smoke alarm — if usage spikes unexpectedly, this catches it before the bill grows.

---

## 19. Release pipeline

### 19.1 Decision tree — native build vs OTA

```
Did `runtimeVersion` change in app.config.ts since the last published binary?
├── YES → next release MUST be a native build (eas build → store submission).
│         OTA `eas update` will publish but reach zero existing users.
└── NO  → JS-only changes? `eas update --branch production` is safe.
          (Hooks don't change, native modules don't change, only TS/JSX/JSON.)
```

`runtimeVersion` is bumped when native code changes: new native module, Expo SDK upgrade, native permission change.

### 19.2 Current release status (snapshot — keep updated)

**As of 2026-09-03 — v2.1.0 (Expo SDK 57) upgraded on branch `upgrade/expo-57`, NOT yet built or shipped.**

- Expo SDK 55 → 57 in one hop (SDK 56 skipped: Hermes v1 memory regression, fixed only in RN 0.86.2 / `expo@57.0.9`). RN 0.83.6 → 0.86.3, React 19.2.0 → 19.2.3, TypeScript 5.9 → 6.0.3, firebase 11 → 12.18.0.
- `app.config.ts` now has `version: "2.1.0"`, `runtimeVersion: "2.1.0"`. **The live installed base is still on runtime `2.0.0` — never publish an SDK 57 OTA to that runtime.** Tag `sdk55-runtime-2.0.0` (commit `1f7686a`) is the hotfix point for those users.
- Verification run: `tsc` 0 errors · `jest` 40/40 · `expo lint` clean · `expo-doctor` 21/21 · `expo export` succeeds for ios and android.
- **Native builds pass on both platforms** (EAS, production profile): iOS `.ipa` and Android `.aab` + preview `.apk`.
- **Device-verified on an Android emulator** (preview APK, release build, `versionCode 22`): launches with no fatal exceptions, home/leaderboard/game screens render, anonymous auth + Firestore question loading work, the full quiz loop and the `react-native-reanimated` score animation work, and **Google Sign-In reaches Firebase Auth over SDK 56's new `expo/fetch` HTTP stack** — the single biggest risk of this upgrade, now cleared.
- Still unverified: Apple Sign-In and iOS layout (needs a simulator or TestFlight build).
- **Android builds can fail spuriously with `EAS_BUILD_UNKNOWN_GRADLE_ERROR`.** Root cause: SDK 57 resolves Expo's Android modules as precompiled AARs from a local Maven repo inside `node_modules`, but `mavenCentral()` is consulted first and legitimately 404s for those coordinates. If Maven Central returns **429 Too Many Requests** instead of 404, Gradle disables the repository build-wide and aborts resolution rather than falling through. Triggered by running two Android builds concurrently. **Fix: retry, one Android build at a time.**
- **iOS minimum rises 15.1 → 16.4** (forced by SDK 56). iPhone 6s/7/SE-1st-gen and iPad Air 2/mini 4 stop receiving updates and are stranded on 2.0.0 permanently. Do **not** raise `minSupportedVersion` past 2.0.0 in Firestore `app_config/version` or those users hit the hard force-update modal with no way out — bump only `latestVersion`.
- Full plan and the research behind it: [`docs/upgrade/expo-57-upgrade-plan.md`](./docs/upgrade/expo-57-upgrade-plan.md).

**As of 2026-05-09 — v2.0.0 fully shipped, both platforms LIVE.**

- `app.config.ts` has `version: "2.0.0"`, `runtimeVersion: "2.0.0"`.
- **Android v2.0.0 vc 15 LIVE on Play Store production** (~3.3k installs). Google Sign-In + Anonymous play both working.
- **iOS v2.0.0 LIVE on App Store** (Apple approved 2026-05-09). Apple Sign-In + sign-out verified on real iPhone. Both auth providers reachable on both platforms.
- **Firestore `app_config/version` flipped 2026-05-09**: `latestVersion: "2.0.0"`, `minSupportedVersion: "2.0.0"`. Any remaining v1.x holdouts now hit the hard force-update modal on cold launch.
- **Latest production OTAs (runtime 2.0.0):**
  - **iOS** `019e0c25-8247-77cb-8424-8ccda2363961` (group `1dc9ead2-177b-4cc2-8a30-10ba1356d333`)
  - **Android** `019e0c24-05d1-773a-899d-c9f5847b4bc5` (group `abb6b082-c07d-4a41-b472-83de509a3d1b`)
  - Both ship: i18n typo fix in `ka.json` — `game_restart` "თავიდან დაწყებაი" → "თავიდან დაწყება".
- **Earlier OTAs (chronological, oldest first):**
  - Android `019e0797-...` — initial post-SHA-fix re-enable of Sign-In on vc 15.
  - Android `019e0806-9e70-74f8-8d6b-094718119ca1` — UI polish: tab bar safe-area inset, restart button `paddingHorizontal`, leaderboard `refresh()` on auth state change.
  - iOS `019e06ab-5579-7434-b6c3-4c5b5281b8f2` — restored Apple + Google sign-in buttons in the anon-gate via `IS_IOS` (Android keeps the same buttons post-Sign-In-fix).
  - Android `019e08e8-d366-7879-8ded-ba846842e9f7` + iOS `019e0b30-728c-77d0-9764-3dca6f215161` (commit `e5afddc`) — leaderboard podium polish: crown icon for self in rank ribbon (replaces bottom "შენ" text), `adjustsFontSizeToFit` on display name, bottom tab `tabBarLabel` fontSize 14→11 so "სტატისტიკა" fits.
  - Android `019e0b46-96c4-7b72-bb52-85ae44407d84` + iOS `019e0b44-30cd-7da3-868f-1a460f6d4755` (commit `c19b113`) — leaderboard podium card heights bumped (170→190 side, 200→220 center) so points have breathing room above bottom border; iOS-only tab bar base height 80→55 gated by `IS_IOS` constant.
- **Web bundling caveat**: explicit `--platform ios` / `--platform android` is required for `eas update`; `--platform all` fails because web bundling is broken (peer-dep gap: `react-native-youtube-iframe → react-native-web-webview`). Diagnosed on SDK 55 and **not re-tested on SDK 57** — the upgrade's bundle verification deliberately exported ios and android separately. Re-test `--platform all` once before relaxing this rule.
- **Parallel-update gotcha**: do NOT run two `eas update --platform <p>` invocations in parallel from the same checkout. Both processes share the local `dist/` directory; whichever finishes its export second wins, and the loser's upload step will fail with `--platform="X" not found in metadata.json`. Run sequentially (iOS, then Android, or vice versa).
- **Google Sign-In SHA-1 lesson**: the runtime APK's SHA-1 — extracted via `adb pull` + `apksigner verify --print-certs ./base.apk` — must be registered in Firebase Console for Android OAuth to work. Full diagnostic procedure in §19.6 below.
- **Cloud Console Android OAuth clients**: prod (`3D:19:A4`, Play App Signing) and dev (`5E:8F:16`, project owner's debug keystore). One orphan from a deleted wrong-SHA `30:19:AA` entry remains inert — safe to delete when convenient.
- Play Console policy declarations all DONE: Data Safety form, Account Deletion, Privacy Policy URL, Privacy Policy section 4 (email-deletion + 30-day SLA).
- Full v2.0.0 plan + what's done + what's left: see [`publishingV2.md`](./publishingV2.md).
- For urgent JS-only hotfixes targeting v1.x holdouts (now force-updated, so this should rarely be needed): branch from the last v1.1.0 commit `09dd471`, cherry-pick fixes, `npm ci`, then `eas update --branch production`.

### 19.6 Google Sign-In SHA-1 maintenance lesson (post-vc15 P0)

**The lesson, in one line:** the runtime APK's SHA-1 must be registered in Firebase Console BEFORE any user attempts Google Sign-In. The Cloud Console Android OAuth client that Firebase auto-creates from that SHA is what GMS Auth checks at runtime — not the bundled `google-services.json`.

The vc 15 P0 had two compounding failures: (a) a wrong SHA was originally registered (visual transcription error from a screenshot — the documented `30:19:AA:...` was actually `3D:19:A4:...` for a similar-looking byte pattern), and (b) we initially blamed the bundled `google-services.json` rather than the auto-created Cloud Console OAuth client. Diagnosis only converged after pulling the runtime APK with `adb pull` and reading the actual cert SHA via `apksigner verify --print-certs`.

**Before building a production binary that exercises Google Sign-In:**

1. **Get the runtime SHA-1 from the APK itself, not from documentation or screenshots.** For Play-distributed builds: download the AAB → install on a Google Play emulator → `adb pull /data/app/.../base.apk ./base.apk` → `apksigner verify --print-certs ./base.apk`. The "Signer #1 certificate SHA-1 digest" is the value to register. (For local dev clients built by `npx expo run:android`, the keystore is at `android/app/debug.keystore`; SHA via `keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android`.)
2. **Register that SHA in Firebase Console** → Project Settings → Android app → SHA certificate fingerprints. Firebase auto-syncs to Cloud Console within ~30s and creates a matching Android OAuth client. This is the runtime auth path.
3. (Optional) Re-download `google-services.json` after step 2 so it picks up the new `client_type=1` entries — useful for local Firebase SDK debugging, but not required for OAuth to work since the OAuth client lookup is server-side.
4. (Optional) Update the EAS env var `GOOGLE_SERVICES_JSON` (file type, Secret) for `production`, `preview`, and `development` environments if you re-downloaded the file in step 3.
5. Verify by running Sign-In on a build signed with that SHA. If it still throws DEVELOPER_ERROR, double-check that the SHA in Firebase exactly matches the apksigner output — not what Play Console "App signing key" displays (which can be stale or differ from the actual runtime cert in some account states).

**For dev workflow:** every developer who runs `npx expo run:android` produces a debug-keystore-signed APK with their own unique SHA. Each dev's SHA needs to be registered in Firebase (or use a shared keystore checked into a private team store). Currently the only registered debug-keystore SHA is `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` (the project owner's local).

**For EAS preview/internal APKs (added 2026-09-04):** an APK installed *directly* (not via Play) keeps the **EAS upload key** signature, not the Play App Signing one — so Google Sign-In fails with `DEVELOPER_ERROR` / "This android application is not registered to use OAuth2.0" until that SHA is registered too. The EAS upload key SHA-1 is
`78:CF:C5:76:7C:E9:64:82:DC:5D:58:B0:B7:8C:B2:37:BF:75:BA:A4` and is now registered in Firebase.
Three fingerprints are therefore expected in the console: Play App Signing (`3D:19:A4…`), the owner's debug keystore (`5E:8F:16…`), and the EAS upload key (`78:CF:C5…`).

**⚠️ The local `google-services.json` is stale and does not match the Firebase console.** It contains three fingerprints — `70cfc576…`, `3019aac5…` (the inert orphan noted above), `78cfc576…` — and *none* of the two that were actually registered before 2026-09-04. Two of them look like hand-typed corruptions of real values (`3019aac5f56175420916e74145141e7802c58e7f` vs the real `3d19a4c5f16175420916eef1a5141e7802c5be7f`). EAS builds are unaffected because they inject the `GOOGLE_SERVICES_JSON` secret, but local `expo run:android` builds use this file. **Re-download it from Firebase Console → Project settings → Android app, and prune the stray `google-services2.json` / `google-services.json.bak-vc15` copies.**

**Known pre-existing auth gap:** `signInWithGoogle` recovers from `auth/credential-already-in-use` by falling back to `signInWithCredential`, but an email collision (`auth/email-already-in-use` / `auth/account-exists-with-different-credential`) only shows the "account already exists" toast with no path forward. A user who first signed up with Apple can therefore never sign in with Google on the same email. Unrelated to the SDK 57 upgrade.

### 19.3 Pre-release checklist (runtime-changing release, e.g. the 2.1.0 / SDK 57 build)

Ordering matters: a release that changes `runtimeVersion` must reach the stores as a binary
**before** any OTA is published on the new runtime.

1. Bump `version` in `app.config.ts` (e.g. `"2.1.0"`).
2. Bump `runtimeVersion` to the identical string, then **prove it resolves**:
   `npx expo config --type public | grep runtimeVersion` must print the new value, not the old one.
3. Build numbers auto-increment via EAS (`appVersionSource: "remote"`). Do not add
   `ios.buildNumber` / `android.versionCode` back to `app.config.ts`.
4. Run the gates: `npm run lint && npx tsc --noEmit && npx jest --ci && npx expo-doctor@latest`.
5. Confirm EAS has the env vars the build needs:
   `eas env:list --environment production` — all nine `EXPO_PUBLIC_*` plus file-type
   `GOOGLE_SERVICES_JSON`. `eas update` on SDK ≥ 55 requires `--environment`, and passing it
   makes the local `.env` invisible, so a missing var ships an unconfigured Firebase client.
6. Tag the release commit, and tag the **previous** runtime too (e.g. `sdk55-runtime-2.0.0`) —
   that tag is the only way to hotfix users stranded on the old runtime.
7. `eas build --platform all --profile production`.
8. `eas submit --platform ios --profile production` and
   `eas submit --platform android --profile production` (or `--auto-submit` on the build).
9. **Only after the binary is live in both stores**, update Firestore `app_config/version`:
   ```
   latestVersion:        "2.1.0"
   minSupportedVersion:  (leave at "2.0.0")
   ```
   Raising `minSupportedVersion` to a release whose OS floor climbed (SDK 57 → iOS 16.4) hard-blocks
   every user who *cannot* install it. Bump `latestVersion` for the soft nudge; leave the hard gate alone.
10. Publish OTAs on the new runtime only, `preview` channel first, then `production`.

### 19.4 OTA cadence (post-2.0.0)

- JS-only fix on `main` → `eas update --branch production --message "..."`.
- Bumping `latestVersion` (in `app_config/version`) lets you nudge users with the soft-update modal without forcing them.
- Bumping `minSupportedVersion` triggers the hard force-update modal — only do this on breaking schema changes.

### 19.5 Hard ship blockers before 2.0.0 store submission

Tracked in [`docs/superpowers/plans/2026-04-29-scoring-leaderboard-plan.md`](./docs/superpowers/plans/2026-04-29-scoring-leaderboard-plan.md) → "Deferred follow-ups":

1. iOS dev-client install + Apple Sign In verification.
2. App-wide font replacement (deferred, not a blocker).
3. Apple `auth/email-already-in-use` cross-provider merge handler (real users with matching Apple/Google emails cannot currently sign in with Apple if Google was used first).
4. **In-app account deletion (Apple Guideline 5.1.1(v))** — Apple will reject the App Store submission without it.
5. Inactive-user cleanup Cloud Function (180-day rule per §17.3) — not a hard blocker but should ship at the same time as #4 to share the Apple token-revoke plumbing.

---

## Maintaining this document

When you change anything that affects a section above, update this file in the same commit. Specifically:

- Add a component → update §5.
- Add a hook / helper / service → update §6 / §7 / §8.
- Add a Firestore collection or change rules → update §14.
- Bump `runtimeVersion` or change build profile → update §19.
- Change retention thresholds → update §17.

If a section grows past one screenful, consider splitting it into a sub-doc and linking from here.
