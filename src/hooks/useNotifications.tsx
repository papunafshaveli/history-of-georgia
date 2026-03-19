import { useEffect } from "react";

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { registerForNotifications } from "@/src/helpers/notifications";

const PUSH_ENABLED_KEY = "settings:isPushEnabled";

export const useNotifications = () => {
  useEffect(() => {
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
