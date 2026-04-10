import { useEffect } from "react";

import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PUSH_ENABLED_KEY = "settings:isPushEnabled";
const IS_EXPO_GO = Constants.executionEnvironment === "storeClient";

export const useNotifications = () => {
  useEffect(() => {
    if (IS_EXPO_GO) return;

    const Notifications =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("expo-notifications") as typeof import("expo-notifications");
    const { registerForNotifications } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/src/helpers/notifications") as typeof import("@/src/helpers/notifications");

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: false,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const setup = async () => {
      const stored = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
      const isEnabled = stored === null ? true : JSON.parse(stored);
      if (isEnabled) {
        await registerForNotifications();
      }
    };

    setup();
  }, []);
};
