import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { NavigationProp, useNavigation } from "@react-navigation/native";

import { DAILY_NOTIFICATION_TARGET } from "@/src/constants/daily";
import { ScreenName, type RootStackParamList } from "@/src/types";
import { todayTbilisi } from "@/src/utils/tbilisiDate";

// The last response survives remounts; remember which one we already acted on this session.
let handledResponseKey: string | null = null;

// Opens the daily when the player taps the 20:00 reminder (also on a cold start).
export const useDailyReminderTap = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!response) return;
    const { request, date } = response.notification;
    if (request.content.data?.target !== DAILY_NOTIFICATION_TARGET) return;
    const key = `${request.identifier}:${date}`;
    if (handledResponseKey === key) return;
    handledResponseKey = key;
    navigation.navigate(ScreenName.DAILY_GAME_SCREEN, { date: todayTbilisi() });
    // The OS can hand the same last response back on a later launch; clear it once acted on.
    Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
  }, [response, navigation]);
};
