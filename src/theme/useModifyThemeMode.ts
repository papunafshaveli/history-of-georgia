import { useState, useEffect, useCallback, useMemo } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemeMode } from "./ThemeModeContext";
import { lightTheme, darkTheme } from "./theme";

const THEME_MODE_KEY = "settings:themeMode";

export const useModifyThemeMode = () => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(ThemeMode.SYSTEM);

  useEffect(() => {
    AsyncStorage.getItem(THEME_MODE_KEY).then((saved) => {
      if (saved && Object.values(ThemeMode).includes(saved as ThemeMode)) {
        setThemeModeState(saved as ThemeMode);
      }
    });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_MODE_KEY, mode);
  }, []);

  const isThemeDark = useMemo(() => {
    if (themeMode === ThemeMode.SYSTEM) {
      return systemScheme === "dark";
    }
    return themeMode === ThemeMode.DARK;
  }, [themeMode, systemScheme]);

  const theme = isThemeDark ? darkTheme : lightTheme;

  return { themeMode, isThemeDark, setThemeMode, theme };
};
