import { Platform } from "react-native";

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "@/firebase";

const PUSH_TOKEN_KEY = "settings:pushToken";
const PUSH_TOKEN_TAGGED_UID_KEY = "settings:pushToken:taggedUid";
const IS_EXPO_GO = Constants.executionEnvironment === "storeClient";

export const registerForNotifications = async (): Promise<void> => {
  try {
    if (!Device.isDevice || IS_EXPO_GO) return;

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    // Tag the token with the current uid so the inactive-user cleanup
    // Cloud Function (`pruneInactiveUsers`) can drop a deleted user's
    // tokens with a `where("uid", "==", uid)` query. Older tokens written
    // before this change have no `uid` field and stay invisible to the
    // cascade — they age out naturally via Expo's `DeviceNotRegistered`
    // path inside `sendPushNotification`. The uid is kept current across
    // sign-in/sign-out transitions by `retagPushToken` below — registration
    // only captures the uid present at registration time.
    const uidAtRegistration = auth.currentUser?.uid ?? null;
    await setDoc(
      doc(db, "push_tokens", token),
      {
        token,
        uid: uidAtRegistration,
        platform: Platform.OS,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    await AsyncStorage.setItem(
      PUSH_TOKEN_TAGGED_UID_KEY,
      uidAtRegistration ?? "",
    );
  } catch {
    // Silent fail — notifications are non-critical
  }
};

export const unregisterNotifications = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) return;

    await deleteDoc(doc(db, "push_tokens", token));
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    await AsyncStorage.removeItem(PUSH_TOKEN_TAGGED_UID_KEY);
  } catch {
    // Silent fail
  }
};

/**
 * Re-tags this device's `push_tokens/{token}` doc with the current uid.
 * Called from `AuthProvider.onAuthStateChanged` so the uid binding stays
 * current across sign-in / sign-out / link transitions on the same
 * device — without this, `pruneInactiveUsers`'s `where("uid", "==", uid)`
 * cascade would miss tokens whose binding froze at registration time.
 *
 * No-op when:
 *   - The device has never registered for push (no cached token).
 *   - The token is already tagged with this uid (avoids spamming Firestore
 *     with identical writes on every auth-state change).
 *
 * Fire-and-forget; silent fail.
 */
export const retagPushToken = async (uid: string | null): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) return;

    const cachedTaggedUid = await AsyncStorage.getItem(
      PUSH_TOKEN_TAGGED_UID_KEY,
    );
    const newTaggedUid = uid ?? "";
    if (cachedTaggedUid === newTaggedUid) return;

    // Write the full doc shape — not just `{ uid, updatedAt }`. If the
    // original `registerForNotifications` Firestore write was denied
    // (e.g. auth wasn't ready) but the token was still cached locally,
    // a partial-shape merge would create a malformed doc with no
    // `token` field, and `sendPushNotification` would never deliver to
    // this device.
    await setDoc(
      doc(db, "push_tokens", token),
      {
        token,
        uid,
        platform: Platform.OS,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    await AsyncStorage.setItem(PUSH_TOKEN_TAGGED_UID_KEY, newTaggedUid);
  } catch {
    // Silent fail — retry happens on next auth-state change.
  }
};
