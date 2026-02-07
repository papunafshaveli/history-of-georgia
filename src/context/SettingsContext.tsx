import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SettingsContextType } from "../types";

const STORAGE_KEYS = {
  IS_MUTED: "settings:isMuted",
  IS_VIBRATION_OFF: "settings:isVibrationOff",
};

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isMuted, setIsMutedState] = useState(false);
  const [isVibrationOff, setIsVibrationOffState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [storedMuted, storedVibration] = await AsyncStorage.multiGet([
          STORAGE_KEYS.IS_MUTED,
          STORAGE_KEYS.IS_VIBRATION_OFF,
        ]);
        if (storedMuted[1] !== null) setIsMutedState(JSON.parse(storedMuted[1]));
        if (storedVibration[1] !== null)
          setIsVibrationOffState(JSON.parse(storedVibration[1]));
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

  if (!isLoaded) return null;

  return (
    <SettingsContext.Provider
      value={{
        isMuted,
        isVibrationOff,
        setIsMuted,
        setIsVibrationOff,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
