import React, { createContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { refreshDailyReminder } from "@/src/helpers/dailyReminder";
import { useTranslation } from "@/src/hooks/useTranslation";
import { subscribeToDailyCompletion } from "@/src/services/local-daily-progress";
import { msUntilNextTbilisiMidnight } from "@/src/utils/tbilisiDate";
import { SettingsContextType } from "../types";

const STORAGE_KEYS = {
  IS_MUTED: "settings:isMuted",
  IS_VIBRATION_OFF: "settings:isVibrationOff",
  IS_PUSH_ENABLED: "settings:isPushEnabled",
};

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isMuted, setIsMutedState] = useState(false);
  const [isVibrationOff, setIsVibrationOffState] = useState(false);
  const [isPushEnabled, setIsPushEnabledState] = useState(true);
  const pushEnabledRef = useRef(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const { daily_reminder_title: title, daily_reminder_body: body } = useTranslation();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [storedMuted, storedVibration, storedPush] =
          await AsyncStorage.multiGet([
            STORAGE_KEYS.IS_MUTED,
            STORAGE_KEYS.IS_VIBRATION_OFF,
            STORAGE_KEYS.IS_PUSH_ENABLED,
          ]);
        if (storedMuted[1] !== null)
          setIsMutedState(JSON.parse(storedMuted[1]));
        if (storedVibration[1] !== null)
          setIsVibrationOffState(JSON.parse(storedVibration[1]));
        if (storedPush[1] !== null) {
          pushEnabledRef.current = JSON.parse(storedPush[1]);
          setIsPushEnabledState(pushEnabledRef.current);
        }
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      void refreshDailyReminder(pushEnabledRef.current, { title, body });
      timer = setTimeout(refresh, msUntilNextTbilisiMidnight() + 100);
    };
    refresh();
    const unsubscribe = subscribeToDailyCompletion(refresh);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
      subscription.remove();
    };
  }, [body, isLoaded, title]);

  const setIsMuted = (value: boolean) => {
    setIsMutedState(value);
    AsyncStorage.setItem(STORAGE_KEYS.IS_MUTED, JSON.stringify(value));
  };

  const setIsVibrationOff = (value: boolean) => {
    setIsVibrationOffState(value);
    AsyncStorage.setItem(STORAGE_KEYS.IS_VIBRATION_OFF, JSON.stringify(value));
  };

  const setIsPushEnabled = (value: boolean) => {
    pushEnabledRef.current = value;
    setIsPushEnabledState(value);
    AsyncStorage.setItem(STORAGE_KEYS.IS_PUSH_ENABLED, JSON.stringify(value));
    void refreshDailyReminder(value, { title, body });
    if (Constants.executionEnvironment === "storeClient") return;
    const { registerForNotifications, unregisterNotifications } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../helpers/notifications") as typeof import("../helpers/notifications");
    if (value) {
      registerForNotifications();
    } else {
      unregisterNotifications();
    }
  };

  if (!isLoaded) return null;

  return (
    <SettingsContext
      value={{
        isMuted,
        isVibrationOff,
        isPushEnabled,
        setIsMuted,
        setIsVibrationOff,
        setIsPushEnabled,
      }}
    >
      {children}
    </SettingsContext>
  );
};
