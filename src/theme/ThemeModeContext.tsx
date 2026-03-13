import { createContext } from "react";

export enum ThemeMode {
  LIGHT = "light",
  DARK = "dark",
  SYSTEM = "system",
}

type ThemeModeContextProps = {
  themeMode: ThemeMode;
  isThemeDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
};

export const ThemeModeContext = createContext<ThemeModeContextProps>({
  themeMode: ThemeMode.SYSTEM,
  isThemeDark: false,
  setThemeMode: () => {},
});
