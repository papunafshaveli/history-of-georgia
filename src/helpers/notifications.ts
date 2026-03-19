import { Platform } from "react-native";

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

import { db } from "@/firebase";

const PUSH_TOKEN_KEY = "settings:pushToken";

export const registerForNotifications = async (): Promise<void> => {
  try {
    if (!Device.isDevice) return;

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

    await setDoc(
      doc(db, "push_tokens", token),
      { token, platform: Platform.OS, updatedAt: serverTimestamp() },
      { merge: true },
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
  } catch {
    // Silent fail
  }
};
