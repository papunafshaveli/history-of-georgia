import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
// @ts-expect-error — getReactNativePersistence is exported from the RN bundle
// (resolved via @firebase/auth's "react-native" exports condition) but not typed
// in the main firebase/auth entry. Runtime-safe on React Native.
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { db, auth };
