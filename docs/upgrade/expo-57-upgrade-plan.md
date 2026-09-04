# Expo SDK 55 → 57 upgrade plan

Status: **EXECUTED and SUBMITTED.** Upgrade landed 2026-09-03 on branch `upgrade/expo-57`;
built and submitted to both stores 2026-09-04, awaiting review. All phases 0–7 are complete.
Kept as the record of why each choice was made.

Backing research lives at `docs/upgrade/expo-57-recon-findings*.txt`, which are **gitignored** —
they exist only on the machine that ran the recon, so a fresh clone will not have them.

Outcome: `tsc` 0 errors · `jest` 40/40 · `expo lint` clean · `expo-doctor` 21/21 ·
`expo export` succeeds for ios and android · **EAS native builds pass on both platforms**
(iOS `.ipa`, Android `.aab` + preview `.apk`) · **device-verified on an Android emulator**:
launch, render, anonymous auth, Firestore question loading, full quiz loop, reanimated score
animation, and Google Sign-In reaching Firebase Auth over the new `expo/fetch` stack.

Still unverified: Apple Sign-In, iOS layout (needs a simulator/TestFlight build).

Two non-upgrade issues surfaced during device testing, both documented in INFRASTRUCTURE §19.6:
the EAS upload-key SHA-1 had to be registered in Firebase for Google Sign-In to work on
directly-installed APKs, and the local `google-services.json` is stale/corrupted.

Resolved since writing: shipped as **`2.1.0`**, not `3.0.0` — no user-facing feature change, so
the major slot stays free. TypeScript 6.0.3 accepted (Expo's pin; `"types": ["jest"]` took tsc
from 243 errors back to 0). iOS 16.4 floor accepted — it is forced by SDK 56+, and the
mitigation is leaving `minSupportedVersion` at `2.0.0` so stranded users keep a working app.
`expo/fetch` left at its default, to be gated on device auth QA rather than pre-emptively
opted out.

Corrections found during execution, against the recon:
- `@react-native/jest-preset` did **not** need adding — it resolves transitively via both
  jest-expo and react-native.
- `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` had to be **removed**
  (ERESOLVE); the `typescript-eslint` meta-package is the only one `eslint.config.mjs` uses.
- `openAppOrUrl.test.ts` needed a real fix: its total `react-native` module stub broke under
  SDK 57's lazy global `fetch`. Now spies on the real `Linking`.
- `expo install --fix` asked for `expo-status-bar` and `expo-web-browser` config plugins;
  both added to `app.config.ts` rather than removing the (unused) packages, to keep the
  upgrade faithful. The dead-dependency cleanup remains a separate follow-up.

Backing research: `expo-57-recon-findings.txt` (112 verified findings, 10 areas) and
`expo-57-recon-findings-full.txt`. Both are outputs of a 10-agent recon + adversarial
verification pass (16 confirmed / 46 adjusted / 2 refuted). Don't re-run it — read the files.

## Baseline (verified 2026-09-03, before any change)

- `tsc --noEmit` clean · `jest` 9 suites / 40 tests pass · `expo lint` 1 error (stray
  `src/types/quizQuestion.js`) · `expo-doctor` 22 patch mismatches + `expo-modules-core` flag
- installed: expo 55.0.23, RN 0.83.6, react 19.2.0, TS 5.9.3, node 24.14.1 (`.nvmrc` 20.19.4)
- local toolchain: Xcode 26.6 ✅, CocoaPods 1.16.2, **JDK 17 only — and that is fine**
  (RN 0.86.3 gradle plugin hard-codes `jvmToolchain(17)`; EAS image is `…jdk-17-…-sdk-57`)

## Decisions already made by Papuna

- Target **SDK 57**, one hop, skip 56.
- Expo's pins + safe JS majors (firebase 12, react-navigation, toast-message, google-signin).
- Verification: static + Metro bundle export. No local native builds.
- End state: verified branch + EAS **production** builds queued. Store submission stays manual.

## Decisions that were open at planning time (all now resolved — see status header)

1. **iOS floor 15.1 → 16.4.** Permanently drops iPhone 6s/7/SE1, iPad Air 2/mini 4 from
   future updates of a live app. Check App Store Connect → Analytics → Active Devices by OS
   (app id 6741484980) first. Do **not** raise `minSupportedVersion` in Firestore afterwards —
   `useForceUpdateGate` would hard-block stranded users forever. Bump only `latestVersion`.
2. **TypeScript ~6.0.3.** Not an optional tooling major — it is Expo's pin, pulled by `--fix`.
   Recommend accepting; the only fallout is TS 6's new `types: []` default (measured: 243
   errors in the 9 test files) fixed by one tsconfig line.
3. **`expo/fetch` becomes global fetch** (SDK 56). Firebase **Auth** + Expo push-token
   registration move onto it; Firestore is unaffected (WebChannel/XHR). Ship as-is and gate on
   device auth QA, or pre-set `EXPO_PUBLIC_USE_RN_FETCH=1` as an EAS env var?

## Why one hop (not 55 → 56 → 57)

Hermes v1 is default from SDK 56 and its memory regression is triggered by merely importing
`react-native-reanimated` (this app does, in `ScoreChangeIndicator.tsx`). Never backported to
0.85.x — fixed in RN 0.86.2 / `expo@57.0.9`. `expo-doctor` hard-fails on every SDK 56 install.
Stepwise also buys nothing: 55→56 already carries the whole RN 0.83→0.85 jump (Expo never
targeted 0.84); 56→57 is the free hop. **Pin `expo@^57.0.19`** (57.0.0–57.0.8 carry the memory
regression, 57.0.17+ fixes dev startup). No SDK 56 codemod applies — the only one targets
expo-router, unused here.

## Blockers to clear BEFORE the upgrade command

1. **`expo.install.exclude`** — proved by `npm install --dry-run` to cause a hard `ERESOLVE`
   (reanimated 4.5.1 peer-requires worklets `0.10.x`, yours pinned 0.7.4) and a *silent*
   duplicate `expo-modules-core` (hoisted 55.0.26 + nested 57.0.15) that poisons autolinking at
   prebuild. Delete both entries **and** the `expo-modules-core` devDependency (zero imports).
2. **`runtimeVersion: "2.0.0"` literal** on a live app. Verified against EAS: channel
   `production` → branch `production`, newest update tagged runtime `2.0.0` (iOS, 2026-05-09).
   Publishing SDK 57 JS under it pushes RN 0.86 bundles onto every SDK 55 binary in the wild.
3. **`StyleSheet.absoluteFillObject` removed in RN 0.85** — 6 call sites.
   `GradientWrapper.tsx:39` passes it as a style *value* rather than spreading, so it fails
   silently and kills every gradient. `absoluteFill` already exists in 0.83.6 — fix pre-bump.

## Version targets

| Package | Now | Target | Note |
|---|---|---|---|
| expo | 55.0.18 | `^57.0.19` | floor matters |
| react-native | 0.83.6 | 0.86.3 | |
| react / react-dom | 19.2.0 | **19.2.3 exact** | RN peer floor; 19.2.4-19.2.8 are RSC-only |
| reanimated / worklets | 4.2.1 / 0.7.4 | 4.5.1 / 0.10.1 | hard-pinned pair |
| netinfo | 11.5.2 | 12.0.1 | major, JS API identical, 3 call sites |
| webview | 13.16.0 | **13.16.1** | not 14.x — Expo pins below latest |
| async-storage | 2.2.0 | **stays 2.2.0** | v3 breaks multiGet/multiRemove + auth persistence |
| gesture-handler | ~2.30.0 | ~2.32.0 | not 3.x (2.30.1 itself calls the removed API) |
| typescript | 5.9.3 | **~6.0.3** | Expo pin. TS 7 ships no compiler API — hard no |
| jest / jest-expo | 29.7 / ~55 | 29.7 stays / ~57.0.5 | + new `@react-native/jest-preset ^0.86.3` peer |
| eslint / @eslint/js | 9.39.4 | 9.39.5 | **not 10** — plugin peers cap at ^9 |
| expo-constants | *undeclared* | `~57.0.17` | imported in 3 files, currently transitive only |
| @react-navigation native / tabs / stack | 7.2.2 / 7.15.11 / 7.14.12 | 7.3.18 / 7.18.18 / 7.18.10 | needs jest-expo 57 in same commit |
| google-signin | ^16.1.2 | ^16.1.5 | fixes an AGP Kotlin conflict RN 0.86 triggers |
| toast-message | 2.3.3 | ^2.5.0 | |
| firebase | ^11.1.0 | ^12.18.0 | **separate commit**, after SDK lands |
| firebase-admin | ^13.8.0 | **^13.10.0 — NOT 14** | 14 removes the namespace API `upload.ts` + `scripts/wipe-auth.ts` use, and needs Node ≥22 |
| all `expo-*` | 55.0.x | 57.x | via `expo install --fix` |

## Phases

**0 — Pre-flight.** Branch `upgrade/expo-57`. `git tag sdk55-runtime-2.0.0` on current main
(1f7686a) — the only way to hotfix stranded runtime-2.0.0 users later. Delete stray compiled
artifacts: `firebase.js`, `upload.js`, `src/types/quizQuestion.js` (the last is the only lint
error). Delete `.eslintrc.js` — it extends `@react-native-community`, which is not installed;
`expo lint` actually runs `eslint.config.mjs`. `npm i -g eas-cli@latest` (local is 18.4.0).

**1 — Pre-bump code fixes** (all valid on RN 0.83, so they land green): 6× `absoluteFillObject`
→ `absoluteFill`; clear `expo.install.exclude`; drop `expo-modules-core` devDep.
Gate: tsc + jest + lint clean.

**2 — The bump.** `npx expo install expo@^57.0.0 --fix` → `rm -rf node_modules && npm install`
→ `npx expo-doctor@latest`. Assert `expo >= 57.0.19` and `react-native = 0.86.3`.
Add `"types": ["jest"]` to tsconfig. Add `@react-native/jest-preset`, `expo-constants`.
Add `"rootDir": "src"` to `functions/tsconfig.json` (harmless on TS 5, required on TS 6).

**3 — Config.** `runtimeVersion` + `version` → `"2.1.0"`. `.nvmrc` → `22.23.1` (20.19.4 is EOL;
matches the EAS SDK-57 image; note `engine-strict=true`). `eas.json` cli floor → `>= 23.2.0`.
Drop `ios.buildNumber` / `android.versionCode` — `appVersionSource: "remote"` makes them dead
values (EAS is actually at buildNumber 1.0.22 / versionCode 21).

**4 — Native regen.** `rm -rf ios android && npx expo prebuild` (clean is the default in 57).

**5 — Verify.** tsc · expo lint · jest · expo-doctor · `expo export -p ios` and `-p android`
separately — **not** `--platform all`; the `react-native-youtube-iframe → react-native-web-webview`
peer gap persists on 57.

**6 — firebase 11 → 12**, separate commit. `getReactNativePersistence` is byte-identical
between versions and `experimentalAutoDetectLongPolling` survives, so `firebase.ts` needs no
edit — v12's breaking changes are all VertexAI/Imagen/AI removals. It also fixes a currently
unmet `@firebase/auth` → async-storage peer.

**7 — Build.** Confirm `eas env:list --environment production` has all nine `EXPO_PUBLIC_*`
vars plus `GOOGLE_SERVICES_JSON` (file type) — `eas update` on SDK ≥55 requires `--environment`
and that flag makes local `.env` invisible. Then production builds, both platforms.

## Release ordering (runtime-changing release)

Bump version + runtimeVersion → build → submit → **only then** publish updates, and only to the
new runtime. Never OTA this change onto 2.0.0. Publish the first post-upgrade update to
`preview` and watch it before touching `production`.

## Worth fixing while in here (found during recon, not upgrade-blocking)

- **Latent React Compiler bug:** `AuthProvider.tsx:522` has a `useMemo` with `authVersion` as a
  cache-buster the body never reads. A synthetic repro showed the compiler deletes that dep from
  the cache key, breaking post-sign-in identity propagation. Masked today only because the
  compiler bails on that file's `try/finally` — any refactor removes the shield.
- **No compiler lint coverage at all:** `eslint-plugin-react-hooks` is absent from the lockfile,
  and the Jest suite provably never runs compiler-transformed code (jest-expo's Babel caller
  skips it). Add `eslint-plugin-react-hooks@^7.1.1` + `eslint-config-expo@~57.0.2`.
- `AppNavigation.tsx` silently bails out of the compiler (PreserveManualMemo, wrong dep array).
- 6 declared-but-unreferenced native deps: `expo-blur`, `expo-web-browser`, `expo-auth-session`,
  `expo-system-ui`, `expo-status-bar`, `expo-linking` (+ `react-native-gesture-handler`, which
  nothing imports). Deleting them shrinks the upgrade surface — optional, separate commit.
- `@expo/vector-icons` is deprecated as of SDK 56 (19 files, 59 usages). Still works on 57 —
  keep it, migrate later with `npx @react-native-vector-icons/codemod`.

## Docs to update in the same commits

README (build/OTA commands, node version), INFRASTRUCTURE.md §16/§19 (runtimeVersion, remote
versioning, release order), bigChanges.md (feature status).
