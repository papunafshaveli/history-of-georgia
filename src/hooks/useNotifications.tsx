import { useEffect } from "react";

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

export const useNotifications = (isTestMode = true) => {
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

    const registerForPushNotificationsAsync = async () => {
      if (Device.isDevice) {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          return;
        }
      }
    };

    const notificationContent = {
      title: "გაიხსენე საქართველოს ისტორია...",
      body: "რამდენად კარგად იცი საქართველოს ისტორია?",
    };

    const scheduleNotification = async () => {
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (isTestMode) {
        // Test mode: short interval
        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: {
            type: "timeInterval",
            seconds: 20,
            repeats: false,
          } as Notifications.NotificationTriggerInput,
        });
      } else {
        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: {
            type: "timeInterval",
            seconds: 30 * 24 * 60 * 60,
            repeats: false,
          } as Notifications.NotificationTriggerInput,
        });
      }
    };

    const setupNotifications = async () => {
      try {
        await registerForPushNotificationsAsync();
        await scheduleNotification();
      } catch {
        // Notification setup failed silently
      }
    };

    setupNotifications();

    return () => {
      Notifications.cancelAllScheduledNotificationsAsync();
    };
  }, [isTestMode]);
};
