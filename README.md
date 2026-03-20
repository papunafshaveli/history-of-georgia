# History of Georgia

## Setup

Create a `.env` file in the root with your Firebase credentials:

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

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

## Install latest node

```
nvm install --lts
nvm use node
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
