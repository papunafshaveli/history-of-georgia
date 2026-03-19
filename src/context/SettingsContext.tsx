import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SettingsContextType } from "../types";
import {
  registerForNotifications,
  unregisterNotifications,
} from "../helpers/notifications";

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
  const [isLoaded, setIsLoaded] = useState(false);

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
        if (storedPush[1] !== null)
          setIsPushEnabledState(JSON.parse(storedPush[1]));
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  const setIsMuted = (value: boolean) => {
    setIsMutedState(value);
    AsyncStorage.setItem(STORAGE_KEYS.IS_MUTED, JSON.stringify(value));
  };

  const setIsVibrationOff = (value: boolean) => {
    setIsVibrationOffState(value);
    AsyncStorage.setItem(STORAGE_KEYS.IS_VIBRATION_OFF, JSON.stringify(value));
  };

  const setIsPushEnabled = (value: boolean) => {
    setIsPushEnabledState(value);
    AsyncStorage.setItem(STORAGE_KEYS.IS_PUSH_ENABLED, JSON.stringify(value));
    if (value) {
      registerForNotifications();
    } else {
      unregisterNotifications();
    }
  };

  if (!isLoaded) return null;

  return (
    <SettingsContext.Provider
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
    </SettingsContext.Provider>
  );
};
