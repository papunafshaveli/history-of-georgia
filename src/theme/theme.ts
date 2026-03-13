import type { AppTheme } from "./types";
import { lightColors, darkColors } from "./colors";
import { spacing } from "./spacing";
import { borderRadius } from "./borderRadius";
import { fonts } from "./fonts";
import { shadows } from "./shadows";
import { zIndex } from "./zIndex";

export const lightTheme: AppTheme = {
  colors: lightColors,
  spacing,
  borderRadius,
  fonts,
  shadows,
  zIndex,
};

export const darkTheme: AppTheme = {
  colors: darkColors,
  spacing,
  borderRadius,
  fonts,
  shadows,
  zIndex,
};
