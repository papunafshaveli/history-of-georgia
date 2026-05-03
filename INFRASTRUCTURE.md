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
| Runtime | React Native | 0.83.6 |
| Framework | Expo SDK | 55 |
| Language | TypeScript | 5.8.x |
| Navigation | React Navigation (native-stack + bottom-tabs) | 7.x |
| Backend | Firebase (Auth + Firestore + Cloud Functions) | client 11.1.0 / admin 13.6.1 |
| Local storage | `@react-native-async-storage/async-storage` | 2.2.0 |
| Auth providers | Firebase Anonymous + Google Sign-In + Apple Authentication | — |
| Push | Expo Notifications + `expo-server-sdk` (functions side) | 55.x / 3.x |
| Build & OTA | EAS Build + EAS Update | CLI ≥ 14.4.0 |
| Test runner | Jest (`jest-expo` preset) | 29.x |
| Linter | `expo lint` (ESLint 9) | — |
| Node | required `>= 20.19.4` | (see `.nvmrc`) |

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
| `SearchInput` | Text input with search icon (`placeholder`, `value`, `onChangeText`) |

### Game-screen sub-components (`src/components/game-screen-components/`)

| Component | Purpose |
| --- | --- |
| `GameHeader` | Crowns (lives) + score |
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
| `pending-results.ts` | AsyncStorage queue (cap = `PENDING_RESULTS_QUEUE_CAP` = 20) | `enqueuePendingResult(...)`, `replayPendingResults(uid)` — offline queue, replayed when online + authed |
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
| Fonts | `fonts.ts` | `sans: "helvetica-main"` (body/UI), `serif: "nino-elite"` (titles), `script: "aisi-bold"` (ornament), `display: "dm-medea"` (hero) |
| Shadows | `shadows.ts` | `default: { shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation }` — single preset |
| Z-index | `zIndex.ts` | `{ header: 1000 }` |

**Composition:** `theme.ts` exports `buildAppTheme(isDark)` which combines all tokens into an `AppTheme` object. `useAppTheme()` reads from `ThemeContext`; `useStyles(getStyles)` memoizes `StyleSheet.create` keyed by theme.

**Mode switching:** `useThemeMode()` toggles light/dark; `useModifyThemeMode()` sets directly. System mode follows `Appearance` API.

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
| `users/{uid}` | Per-user stats. Fields: `displayName`, `photoURL`, `isAnonymous`, `totalPoints`, `gamesPlayed`, `totalCorrect`, `totalQuestions`, `bestSingleGameScore`, `weekPoints`, `weekStart`, `hasSeenSignInNudge`, `createdAt`, `updatedAt` | Read: any authed user (leaderboard query). Create: owner only, all stats zeroed. Update: owner only, lifetime stats can only grow with anti-cheat caps (≤ +50 000 totalPoints / +1 game per write, ±5 jitter for retries); `weekPoints` may decrease only when `weekStart` advances; `createdAt` immutable. Delete: forbidden. |
| `game_results/{uid}_{resultId}` | Immutable per-game result. Fields: `userId`, `score`, `correctCount`, `totalQuestions`, `selectedDifficulty`, `scoreByDifficulty`, `createdAt` | Read: owner only (allows the idempotency check inside the save transaction to read non-existent docs). Create: owner only, doc id matches `{uid}_*`, `score >= 0 && <= 50 000`, `correctCount <= totalQuestions`. Update / delete: forbidden. |
| `app_config/version` | Force-update gate. Fields: `minSupportedVersion`, `latestVersion` | Read: public (gate runs before auth resolves). Write: forbidden via clients; Firebase Console / Admin SDK only. |
| `notifications/{id}` | Push-notification triggers. Fields: `title`, `body`, `status` (`pending` / `processing` / `sent` / `failed`) | Read + write: forbidden via clients; Firebase Console manual entry only. |
| `push_tokens/{token}` | Expo push tokens registered per device | Write: public. Read: forbidden via clients (Cloud Function reads via Admin SDK). |

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
| **Firebase** | Auth, Firestore, Cloud Functions, Analytics | API key + project ID in `.env` | `firebase.ts` (client), `functions/` (server) |
| **Google Sign-In** | OAuth provider | Web + iOS client IDs | `app.config.ts` plugin block + `.env` |
| **Apple Sign-In** | OAuth provider | Native (Apple ID) + `.p8` key registered with Firebase | `app.config.ts` plugin entry, Firebase Console |
| **Expo Push (FCM/APNs)** | Push notifications | Expo manages credentials via EAS | `useNotifications` hook + `sendPushNotification` Cloud Function |
| **EAS Build** | iOS + Android binaries | Apple Team ID, App Store Connect, Play Store service account | `eas.json`, `android-service-account-key/` |
| **EAS Update** | OTA JS bundle delivery | Bound by `runtimeVersion` match | `app.config.ts` `updates.url` |
| **Firebase Analytics** | Event logging | Firebase project | `helpers/analytics.ts` |
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
- `extra.eas.projectId` — `27042bfa-ef74-4c27-89e1-395a3eef60df`
- `updates.url` — EAS Update URL
- `plugins[]` — `expo-splash-screen`, `expo-font`, `expo-notifications`, `expo-audio`, `expo-asset`, `@react-native-google-signin/google-signin` (with iOS reversed client ID), `expo-apple-authentication`

### `eas.json` — build/submit profiles

Profiles: `development`, `development-simulator` (extends `development` with `ios.simulator: true`), `preview`, `production`. Submit profile pinned to App Store Connect ID `6741484980` and Apple Team `M39YBKH9L5`. Android submit uses `android-service-account-key/history-of-georgia-43551-f5aff86366af.json`.

### Sensitive assets — gitignored, NEVER commit

- `.env`
- `*.p8` Apple keys (e.g. `AuthKey_3C2L469ZH5.p8`)
- `*.mobileprovision`, `*.p12`, `*.jks`, `*.key`, `*.pem`
- `firebase-admin-key.json` (Admin SDK credentials, used by `upload.ts`)
- `android-service-account-key/`
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

### 17.3 Inactive-user cleanup — 180-day rule

**Goal:** keep Firestore document count and Firebase Auth MAU low to control cost.

**Policy:**
- A user is **inactive** if both `users/{uid}.updatedAt` and the Firebase Auth `lastSignInTime` are older than **180 days**.
- Inactive users are deleted via a scheduled Cloud Function (weekly).
- Cascade delete: `users/{uid}` Firestore doc + every `game_results/{uid}_*` doc + the Firebase Auth user record.
- For Apple-Sign-In users, the cleanup also calls Apple's revoke-tokens REST API (same JWT-signed pattern as in-app account deletion) so the app no longer appears under the user's Apple ID → Apps Using Apple ID list.
- Anonymous users follow the same rule but with a tighter threshold of **14 days with zero games played** (carry-over of the orphaned-anon cleanup case).

**Why two thresholds?** Anonymous users are auto-created on every fresh install; if they never play a game in 14 days, they're almost certainly an abandoned install or a `pm clear` orphan. Real signed-in users invest time and may return seasonally; 180 days mirrors industry-default retention windows.

**Implementation status:** scheduled. See deferred follow-up #5 in [`docs/superpowers/plans/2026-04-29-scoring-leaderboard-plan.md`](./docs/superpowers/plans/2026-04-29-scoring-leaderboard-plan.md) for the Cloud Function spec.

### 17.4 In-app account deletion (Apple Guideline 5.1.1(v))

User-initiated deletion via Settings → Account → "Delete account & sign out". Client-only cascade — **no Cloud Function backstop**, **no Apple token revoke** — proven through App Store review by the drosha sister project shipping with this exact pattern. Order:

1. `reauthenticate()` (Google or Apple) — satisfies Firebase's `auth/requires-recent-login`. Skipped for anon (button is hidden anyway).
2. Drop the `pending-results` AsyncStorage queue — queued rows carry the old uid and would fail Firestore rules under the new anon user. Lifetime stats + recent games are intentionally **kept** (per §17.2: stats are device-local, not account-bound; same physical user on the same device retains their gameplay history across sign-in / sign-out / delete).
3. `deleteUserData(uid)` cascade — chunked 499-op `writeBatch` over `game_results` where `userId == uid`, with `users/{uid}` packed into the last batch.
4. `auth.currentUser.delete()` — Firebase Auth account.
5. `onAuthStateChanged` fires null → `AuthProvider` issues a fresh anon user automatically.

**Firestore rule shape:** `users/{uid}` and `game_results/{id}` permit `delete` only by the owner.

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
| **Firestore storage** | `users`, `game_results`, `push_tokens`, `tickets`, `notifications` collections | Inactive-user cleanup (§17.3) keeps `users` + `game_results` bounded |
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

- `app.config.ts` has `version: "1.1.0"`, `runtimeVersion: "2.0.0"`. These don't match because `runtimeVersion` was bumped in commit `3de2045` during the Expo SDK upgrade.
- Existing prod users are on a `1.1.0` (or older `1.0.0`) native binary.
- The next prod release **must be a native build** — `eas build --platform all --profile production` then submit to the stores.
- After users install the new `2.0.0` binary, future `eas update` calls reach them normally.
- For urgent JS-only hotfixes that need to reach the existing `1.1.0` binary, branch from the last published commit (e.g. `09dd471`), cherry-pick fixes, run `npm ci` to match the pre-upgrade lockfile, then `eas update --branch production`. Reference: `hotfix/ui-fixes-1.1.x`.

### 19.3 Pre-release checklist (before the 2.0.0 native build)

1. Bump `version` to `"2.0.0"` in `app.config.ts`.
2. Confirm `runtimeVersion` is `"2.0.0"`.
3. `ios.buildNumber` and `android.versionCode` auto-increment via EAS.
4. Update Firestore `app_config/version`:
   ```
   minSupportedVersion: "2.0.0"
   latestVersion:        "2.0.0"
   ```
   **After** the binary is live in stores, not before — otherwise pre-2.0.0 users see the hard force-update modal.
5. Run lint + type-check + tests: `npm run lint && npx tsc --noEmit && npx jest --no-watchAll`.
6. Tag the release commit.
7. `eas build --platform all --profile production`.
8. `eas submit --platform ios --profile production` and `eas submit --platform android --profile production` (or `--auto-submit` on the build).

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
