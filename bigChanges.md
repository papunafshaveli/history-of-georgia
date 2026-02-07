# Big Changes Plan — History of Georgia App

A prioritized plan of improvements, fixes, and new features for the project.

---

## 1. CRITICAL — Security Fixes

### ~~1.1 Move Firebase config to environment variables~~ DONE

**File:** `firebase.ts`
**Problem:** API key, project ID, app ID, and measurement ID are hardcoded in source and committed to git. Anyone with repo access (or who decompiles the app) gets full credentials.
**Action:**

- Install `react-native-dotenv` or use `expo-constants` with `app.config.ts` (dynamic config) to read from `.env`
- Create `.env` file with all Firebase values
- Add `.env` to `.gitignore`
- Replace hardcoded values in `firebase.ts` with `process.env.*` or `Constants.expoConfig.extra.*`

### ~~1.2 Remove `firebase-admin` from client dependencies~~ DONE

**File:** `package.json`
**Problem:** `firebase-admin` is a server-side SDK. It should never be in a mobile app bundle — it exposes service-account-level access patterns and bloats the bundle.
**Action:** `npm uninstall firebase-admin`

### ~~1.3 Restrict iOS network policy~~ DONE

**File:** `app.json` — `expo.ios.infoPlist.NSAppTransportSecurity`
**Problem:** `NSAllowsArbitraryLoads: true` disables all HTTPS enforcement. Apple may reject updates for this.
**Action:** Remove the blanket allow. Add exception domains only for YouTube/Firebase if needed.

---

## 2. HIGH — State & Data Management

### ~~2.1 Persist user settings with AsyncStorage~~ DONE

**File:** `src/context/SettingsContext.tsx`
**Problem:** `isMuted` and `isVibrationOff` reset to `false` every app launch. Users have to re-toggle every time.
**Action:**

- On mount, read saved values from AsyncStorage
- On every toggle, write to AsyncStorage
- Show a brief loading state until settings are read

### ~~2.2 Add offline support / question caching~~ DONE

**Files:** `src/helpers/fetchRandomQuestion.ts`, new cache layer
**Problem:** The game is 100% dependent on Firebase network calls. No internet = blank screen, no error message.
**Action:**

- Cache the last N (e.g. 50) fetched questions in AsyncStorage
- On network failure, pull a random question from the local cache
- Show a small "offline mode" indicator so the user knows

### ~~2.3 Prevent duplicate questions in a single session~~ DONE

**File:** `src/hooks/useGameScreen.tsx`
**Problem:** `fetchRandomQuestion` can return the same question multiple times in one game because it does a pure random query each time.
**Action:**

- Keep a `Set<number>` of already-seen question IDs in game state
- After fetch, check if ID is in the set; if yes, fetch again (with a max retry of 3)
- Reset the set on game restart

### ~~2.4 Handle the "null question" case gracefully~~ DONE

**File:** `src/hooks/useGameScreen.tsx:43-49`
**Problem:** If `fetchRandomQuestion` returns `null`, `isLoading` stays `true` forever — the user sees an infinite loader.
**Action:**

- Add an `else` branch that sets an error state
- Show a "Failed to load question — Retry?" UI on the game screen

---

## 3. HIGH — Error Handling & Stability

### ~~3.1 Add a global React Error Boundary~~ DONE

**New file:** `src/components/error-boundary/ErrorBoundary.tsx`
**Problem:** Any unhandled JS error crashes the entire app with a white screen.
**Action:**

- Create an ErrorBoundary class component wrapping `App.tsx` children
- Show a "Something went wrong — Restart" fallback screen
- Log errors (see 5.1 below)

### ~~3.2 Remove all `console.log` / debug statements~~ DONE

**Files:** Multiple (search for `console.log`, `console.warn`, `console.error`)
**Problem:** Developer logs like `"Papuna Counting question"` and `"Papuna you must use physical device"` leak to production.
**Action:**

- Remove all personal/debug console statements
- Keep only meaningful `console.error` calls, or better, replace with a logging utility that is silent in production

### ~~3.3 Add error UI for network-dependent screens~~ DONE

**Files:** `GameScreen.tsx`, detail screens
**Problem:** When Firebase is unreachable, users see a blank or stuck loading screen with no explanation.
**Action:**

- Use `@react-native-community/netinfo` (already installed) to detect connectivity
- Show an "You are offline" banner or modal with a retry button

---

## 4. MEDIUM — UX & Feature Improvements

### ~~4.1 Add multi-language support to the game summary screen~~ DONE

**File:** `src/components/game-summary/GameSummary.tsx:111,125`
**Problem:** Strings like `"საუკეთესო შედეგი:"` and `"თავიდან დაწყება"` are hardcoded in Georgian. The app has a LanguageContext with EN/KA but the summary screen ignores it.
**Action:**

- Use the `useTranslation` hook
- Add English equivalents to `src/locales/en.json`
- Replace all hardcoded Georgian strings with translation keys

### 4.2 Add difficulty levels

**Problem:** All questions are the same difficulty. Experienced users get bored; new users may feel overwhelmed.
**Action:**

- Add a `difficulty` field to Firestore documents (easy / medium / hard)
- Let users choose difficulty before starting a game
- Adjust crown count or hint count per difficulty

### ~~4.3 Add a "History" / "Stats" screen~~ DONE

**Problem:** Users can only see their highest score. No record of past games, improvement over time, or category-wise performance.
**Action:**

- Store each game result in AsyncStorage (score, date, questions answered)
- Create a new tab or screen showing game history, average score, streak, etc.

### ~~4.4 Improve the splash screen~~ DONE

**File:** `src/screens/main-screens/custom-splash-screen/SplashScreen.tsx`
**Problem:** Hardcoded 3-second delay before navigating away. On fast devices this feels slow; on slow devices fonts might not be loaded yet.
**Action:**

- Wait for fonts + first Firebase query to resolve instead of a fixed timer
- Show a progress indicator or animated illustration during load

### ~~4.5 Add "Share Score" functionality~~ DONE

**File:** `src/components/game-summary/GameSummary.tsx`
**Problem:** Users can visit the Facebook page or store, but can't share their score with friends.
**Action:**

- Add a "Share" button using `expo-sharing` or `react-native-share`
- Generate a text like: "I scored 12 on History of Georgia! Can you beat me?"

---

## 5. MEDIUM — Code Quality & Developer Experience

### ~~5.1 Add proper logging (replace console.\*)~~ DONE

**Action:**

- Create a `src/utils/logger.ts` that wraps `console` methods
- In production builds (`__DEV__ === false`), suppress all logs
- Optionally integrate with a crash reporting service (Sentry, Bugsnag)

### ~~5.2 Add unit tests~~ DONE

**Problem:** Jest is configured but there are zero test files. No safety net for refactors.
**Priority targets:**

- `fetchRandomQuestion` (mock Firestore)
- `useGameScreen` hook (game logic)
- `scoreFeedback` logic in `GameSummary`
- Utility functions in `src/helpers/`
  **Goal:** At least 60% coverage on hooks and helpers

### ~~5.3 Memoize expensive operations~~ DONE

**Files:** `useGameScreen.tsx`, game screen components
**Problem:** `actions` and `modalHandlers` objects are recreated on every render, causing unnecessary child re-renders.
**Action:**

- Wrap handler objects in `useMemo` / `useCallback`
- Use `React.memo` on `OptionsDisplay`, `QuestionDisplay`, `GameHeader`, `GameFooter`

### ~~5.4 Extract magic numbers to named constants~~ DONE

**Files:** Multiple
**Examples:**

- `1200` / `1700` ms delays in `useGameScreen.tsx:81`
- `1500` ms summary delay in `useGameScreen.tsx:24`
- `3000` ms splash timeout
- `90` px tab bar height
  **Action:** Move all to `src/constants/timing.ts` (or similar) with descriptive names like `CORRECT_ANSWER_DELAY_MS`, `INCORRECT_ANSWER_DELAY_MS`, etc.

### ~~5.5 Clean up unused dependencies~~ DONE

**File:** `package.json`
**Removed:**

- `firebase-admin` (server-only — removed in 1.2)
- `metro` / `metro-resolver` (internal Expo deps, not needed as direct dependencies)
- `expo-symbols` (not imported anywhere)
  **Kept:** `react-native-animatable` (used in GameSummary + SplashScreen)

### ~~5.6 Remove the unused `data.json` file~~ DONE

**File:** `data.json` (811 KB)
**Problem:** Appears to be a Firebase data export that is never imported or used. Bloats the repo.

---

## 6. LOW — Accessibility & Polish

### ~~6.1 Add accessibility labels~~ DONE

**Problem:** No `accessibilityLabel` or `accessibilityRole` on interactive elements. Screen readers can't describe the app.
**Action:**

- Add `accessibilityLabel` to all `Pressable`, `IconButton`, and navigation elements
- Add `accessibilityRole="button"` where appropriate
- Test with VoiceOver (iOS) and TalkBack (Android)

### 6.2 Add dark mode support

**Problem:** The app only has one color theme. Users who prefer dark mode see a bright cream screen.
**Action:**

- Detect system theme with `useColorScheme()`
- Create a dark variant of `globalColors.ts`
- Wrap the theme in a `ThemeContext`

### ~~6.3 Optimize image assets~~ DONE

**Problem:** Some images are large (e.g. `firstBackground.png` at 1.3 MB alongside its WebP version).
**Action:**

- Remove duplicate PNG versions where WebP exists
- Compress remaining PNGs
- Consider lazy-loading non-critical images

### ~~6.4 Add app analytics~~ DONE (dev-only logging; see src/utils/analytics.ts for production setup)

**Problem:** No visibility into how users interact with the app (which topics are popular, where users drop off, average game length).
**Action:**

- Integrate Firebase Analytics (already using Firebase)
- Track key events: game_start, game_end, topic_view, hint_used

---

## 7. FUTURE — Bigger Features to Consider

| Feature                       | Description                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| **Leaderboard**               | Firebase-backed global or friends leaderboard                                                     |
| **Daily Challenge**           | One special question per day with bonus crowns                                                    |
| **Timed Mode**                | Answer as many as possible in 60 seconds                                                          |
| **More Content**              | Expand rulers (currently 5), battles (4), public figures (4) — the data is thin                   |
| **Achievements / Badges**     | Unlock badges for milestones (first perfect game, 100 questions answered, etc.)                   |
| **Onboarding Tutorial**       | First-time user walkthrough explaining crowns, hints, and topics                                  |
| **Push Notification Content** | Daily "Did you know?" history facts via notifications (infrastructure exists, just needs content) |

---

## Implementation Priority Order

1. **Security fixes** (1.1, 1.2, 1.3) — do these before the next release
2. **Settings persistence** (2.1) — quick win, big UX improvement
3. **Error boundary + error UI** (3.1, 3.3) — prevents blank screens
4. **Remove debug logs** (3.2) — quick cleanup
5. **Offline support** (2.2) — makes the app usable without internet
6. **Translation completeness** (4.1) — finish what was started
7. **Duplicate question prevention** (2.3) — better gameplay
8. **Unit tests** (5.2) — safety net before bigger refactors
9. **Everything else** — prioritize based on user feedback
