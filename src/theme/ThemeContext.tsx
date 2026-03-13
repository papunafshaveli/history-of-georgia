import React, { createContext } from "react";

import type { AppTheme } from "./types";
import { lightTheme } from "./theme";

export const ThemeContext = createContext<AppTheme>(lightTheme);

export const ThemeProvider: React.FC<{
  theme: AppTheme;
  children: React.ReactNode;
}> = ({ theme, children }) => (
  <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
);
