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

```
tsc upload.ts && node upload.js
```

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

<!-- increase: version, runtimeVersion, ios buildNumber, android versionCode ... Now Go on...-->

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
eas update
```
