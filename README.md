# History of Georgia

## Setup

Create a `.env` file in the root with your Firebase credentials and Google OAuth client IDs:

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

The Google client IDs are needed for the in-app Google sign-in flow (Phase 4 of the scoring + leaderboard rollout). Apple sign-in needs no env var — it goes through the native `expo-apple-authentication` SDK and Apple's authorization server.

## Start app

```
npm start
```

## Run tests

```
npm test
```

## Upload data

Place your questions in `data.json` (gitignored) at the root, then run:

```
npx tsc upload.ts --esModuleInterop --resolveJsonModule --skipLibCheck && node upload.js
```

**What the script does:**

- **Existing docs** — updates `question`, `options`, `correctAnswer`, `hint`, and `difficulty` (if present). Never touches `randomField` (used for random ordering queries).
- **New docs** — inserts with all fields + a generated `randomField`.
- Safe to re-run: existing docs are updated in-place, not replaced.

## Node version

This project requires Node >= 20.19.4. If using nvm:

```
nvm install 20.19.4
nvm use
```

## Android local build

```
eas build -p android --profile preview
```

## Ios local build

<!-- Before prod build: increase version and runtimeVersion in app.config.ts (buildNumber and versionCode are auto-incremented by EAS) -->

```
eas build -p ios --profile preview
```

## Ios dev client on simulator (local)

When you change native modules (e.g. adding Google Sign-In, Apple Authentication), you need a fresh dev client. Locally:

```
RCT_USE_PREBUILT_RNCORE=0 RCT_USE_RN_DEP=0 npx expo run:ios
```

The two `RCT_USE_*` env vars disable React Native 0.83's prebuilt-pod path, which currently has a broken podspec (`Missing required attribute 'source'`). Disabling them forces a from-source compile. First build takes ~15 min; subsequent JS-only changes hot-reload in seconds.

If `pod install` succeeds but Xcode hangs for >20 min on `Pods-Hermes-engine`, kill the build (`Ctrl+C`, then `rm -rf ios`) and use the EAS dev-client path instead:

```
eas build --profile development-simulator --platform ios
```

The `development-simulator` profile (defined in `eas.json`) builds an unsigned `.app` for the iOS Simulator — no Apple device-provisioning needed. Use the plain `development` profile only when you need a signed IPA for a physical iPhone.

## Android prod build

```
eas build --platform android --profile production
```

## Ios prod build

```
eas build --platform ios --profile production
```

## Prod build (android & ios)

```
eas build --platform all --profile production
```

## After prod build for android

```
eas submit --platform android --profile production
```

## After prod build for ios

```
eas submit --platform ios --profile production
```

## OTA update

```
eas update --branch production --message "your message"
```

## Deploy Cloud Functions

Install dependencies (first time only):

```
cd functions && npm install
```

Deploy:

```
cd functions && npm run deploy

# Or if firebase CLI is not installed globally:
npx firebase-tools deploy --only functions
```

## Send a push notification

Add a document to Firestore → `notifications` collection:

```json
{
  "title": "your title",
  "body": "your message",
  "status": "pending"
}
```

The Cloud Function picks it up automatically and sends to all users. Status updates to `"sent"` when done.
