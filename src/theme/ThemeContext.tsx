import React, { createContext } from "react";

import type { AppTheme } from "./types";
import { lightTheme } from "./theme";

export const ThemeContext = createContext<AppTheme>(lightTheme);

export const ThemeProvider: React.FC<{
  theme: AppTheme;
  children: React.ReactNode;
}> = ({ theme, children }) => (
  <ThemeContext value={theme}>{children}</ThemeContext>
);
