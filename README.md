# History of Georgia

## Setup

Create a `.env` file in the root (gitignored) with your Firebase credentials and Google OAuth client IDs:

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...        # Firebase Console → Auth → Google provider → Web client ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...        # GoogleService-Info.plist → CLIENT_ID
```

Apple Sign In needs no env var — uses the native `expo-apple-authentication` SDK and Apple's authorization server.

## Install latest node

```
nvm install 20.19.4
nvm use
```

This project requires Node >= 20.19.4.

## Install dependencies

```
npm install
```

## Start dev server

```
npx expo start --dev-client --clear
```

## Run on Android emulator

```
npx expo start --dev-client --android
```

## Run on iOS simulator

```
npx expo start --dev-client --ios
```

## Type checking

```
npx tsc --noEmit
```

## Lint

```
npm run lint
```

## Run tests

```
npm test
```

## Android development build

```
eas build --profile development --platform android
```

## iOS development build

```
eas build --profile development --platform ios
```

## iOS simulator build

```
eas build --profile development-simulator --platform ios
```

The `development-simulator` profile (defined in `eas.json`) builds an unsigned `.app` for the iOS Simulator — no Apple device-provisioning needed. Use the plain `development` profile only when you need a signed IPA for a physical iPhone.

After the build completes, install it on the simulator:

```
eas build:run -p ios
```

## iOS dev client on simulator (local — no EAS credits)

When you change native modules (e.g. adding Google Sign-In, Apple Authentication), you need a fresh dev client. Build locally:

```
RCT_USE_PREBUILT_RNCORE=0 RCT_USE_RN_DEP=0 npx expo run:ios
```

The two `RCT_USE_*` env vars disable React Native 0.83's prebuilt-pod path, which currently has a broken podspec (`Missing required attribute 'source'`). Disabling them forces a from-source compile. First build takes ~15 min; subsequent JS-only changes hot-reload in seconds.

If `pod install` succeeds but Xcode hangs for >20 min on `Pods-Hermes-engine`, kill the build (`Ctrl+C`, then `rm -rf ios`) and use the EAS dev-client path above.

## Build both platforms at once

```
eas build --profile development --platform all
```

## Clear app data on Android device/emulator

```
adb shell pm clear com.papunafshaveli.historyofgeorgia
```

To clear via device UI: Settings > Apps > History of Georgia > Storage > Clear Data

## Install APK on Android emulator

```
adb install path/to/historyofgeorgia-dev.apk
```

## Android preview build

```
eas build --profile preview --platform android
```

## iOS preview build

```
eas build --profile preview --platform ios
```

## Android production build

```
eas build --profile production --platform android
```

## Android local production build (no EAS credits needed)

```bash
# Build locally
eas build -p android --profile production --local

# Submit the generated .aab to Play Store
eas submit -p android --path ./build-*.aab
```

## iOS production build

```
eas build --profile production --platform ios
```

## iOS local production build (no EAS credits needed)

When you've run out of free EAS iOS builds, build locally on your Mac instead:

```bash
# Requires Fastlane (one-time install)
brew install fastlane

# Build locally
eas build -p ios --profile production --local

# Submit the generated .ipa to App Store Connect
eas submit -p ios --path ./build-*.ipa
```

## Production build (both platforms)

```
eas build --profile production --platform all
```

## Production build + submit (both platforms)

```
eas build --profile production --platform all --auto-submit
```

## Production build + submit (single platform)

```
eas build --profile production --platform ios --submit
eas build --profile production --platform android --submit
```

## Submit existing build

```
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

## Before prod build

In `app.config.ts`:

- Bump `version` (e.g. `"1.1.0"` → `"2.0.0"`).
- Bump `runtimeVersion` if there are native module changes — that forces a native build for the next prod release rather than an OTA.
- `ios.buildNumber` and `android.versionCode` are auto-incremented by EAS.

## OTA update

```
eas update --branch production --message "your message"
```

OTA updates only reach users whose installed binary's `runtimeVersion` matches `main`. If you bump `runtimeVersion`, the next prod release must be a native build (not an OTA), and existing users won't see the JS bundle until they install the new binary from the store.

## Firebase — Deploy Security Rules & Indexes

```bash
# One-time setup
npm install -g firebase-tools
firebase login

# Deploy rules + indexes
firebase deploy --only firestore

# Deploy only rules
firebase deploy --only firestore:rules

# Deploy only indexes
firebase deploy --only firestore:indexes

# Dry run (validate without publishing)
firebase deploy --only firestore --dry-run
```

Config files: `firestore.rules`, `firestore.indexes.json`, `firebase.json`.

## Firebase — Deploy Cloud Functions

```bash
# Install dependencies (first time only)
cd functions && npm install

# Deploy Cloud Functions
cd functions && npm run deploy

# Or via npx if firebase CLI is not installed globally
cd functions && npx firebase-tools deploy --only functions
```

Requires the Blaze (pay-as-you-go) plan.

## Firebase — Send Push Notification

Add a document to Firestore `notifications` collection (via Firebase Console):

```json
{
  "title": "Your notification title",
  "body": "Your notification body",
  "status": "pending"
}
```

The Cloud Function will automatically send it to all registered devices. The `status` field updates to `"sent"` when done.

## Firebase — Clear Firestore Data

```bash
# Delete all user profiles
firebase firestore:delete --recursive users

# Delete all game results
firebase firestore:delete --recursive game_results

# Delete all notification logs
firebase firestore:delete --recursive notifications

# Delete everything at once
firebase firestore:delete --recursive users && firebase firestore:delete --recursive game_results && firebase firestore:delete --recursive notifications
```

Note: the `tickets` collection (questions) is intentionally NOT in this list — it's the canonical question pool, not user-generated content. Firebase Auth accounts are a separate concern — see the next section.

## Firebase — Wipe all Auth users (dev reset)

For end-to-end smoke testing of the account-deletion flow, you sometimes need to wipe every Firebase Auth user back to zero. Two paths:

**Manual (Firebase Console):** open <https://console.firebase.google.com/project/history-of-georgia-43551/authentication/users>, select all on the page, click "Delete account", repeat per page.

**Scripted (`scripts/wipe-auth.ts`):**

```bash
# One-time TypeScript compile, then run with --confirm.
npx tsc scripts/wipe-auth.ts --esModuleInterop --resolveJsonModule --skipLibCheck \
  && node scripts/wipe-auth.js --confirm
```

The script paginates `admin.auth().listUsers()` and batches `admin.auth().deleteUsers()` 1000 at a time. It refuses to run without `--confirm` and prints the resolved project ID before deleting anything. Reads credentials from `android-service-account-key/history-of-georgia-43551-firebase-adminsdk-*.json` (gitignored).

## Firebase — Full reset for end-to-end testing

When testing account deletion, sign-in flows, or anything that needs a clean baseline, run a complete reset in this order. **Firestore data and Firebase Auth are separate stores — both must be wiped for a true reset.**

1. **Stop the dev-client first.** If the app is running, the moment the wipe finishes, `onAuthStateChanged` fires with `null` and immediately re-creates a fresh anonymous user, leaving you with one residual entry in the Auth tab.

2. **Wipe Firestore data:**

   ```bash
   firebase firestore:delete --recursive users
   firebase firestore:delete --recursive game_results
   ```

   Skip `push_tokens` unless you're specifically testing push registration — those rows are device-bound (keyed by Expo push token, not by uid) and don't orphan when users are deleted. Never delete `tickets` — that's the canonical question pool.

3. **Wipe Firebase Auth users:**

   ```bash
   npx tsc scripts/wipe-auth.ts --esModuleInterop --resolveJsonModule --skipLibCheck \
     && node scripts/wipe-auth.js --confirm
   ```

4. **Clear AsyncStorage on the device:**

   ```bash
   adb shell pm clear com.papunafshaveli.historyofgeorgia
   ```

5. **Verify in Firebase Console:**

   - <https://console.firebase.google.com/project/history-of-georgia-43551/authentication/users> — Auth tab should be empty
   - <https://console.firebase.google.com/project/history-of-georgia-43551/firestore/data> — `users`, `game_results` are gone or empty; `tickets`, `app_config`, `notifications`, `push_tokens` should still exist

6. **Re-launch the dev-client.** A fresh anonymous user is created automatically; you're now testing against a clean slate.

## Force-update gate — Firestore values

Production force-update gate reads `app_config/version`. Recommended values for the 2.0.0 launch:

```
minSupportedVersion: "2.0.0"
latestVersion:        "2.0.0"
```

Update Firestore AFTER the new build is live in stores. Future routine releases bump only `latestVersion`; bump `minSupportedVersion` only on breaking schema changes.

## Upload questions to Firestore

Place your questions in `data.json` (gitignored) at the root, then run:

```
npx tsc upload.ts --esModuleInterop --resolveJsonModule --skipLibCheck && node upload.js
```

**What the script does:**

- **Existing docs** — updates `question`, `options`, `correctAnswer`, `hint`, and `difficulty` (if present). Never touches `randomField` (used for random ordering queries).
- **New docs** — inserts with all fields + a generated `randomField`.
- Safe to re-run: existing docs are updated in-place, not replaced.
