import type { lightColors } from "./colors";
import type { spacing } from "./spacing";
import type { borderRadius } from "./borderRadius";
import type { fonts } from "./fonts";
import type { shadows } from "./shadows";
import type { zIndex } from "./zIndex";

export type AppColors = typeof lightColors;
export type AppSpacing = typeof spacing;
export type AppBorderRadius = typeof borderRadius;
export type AppFonts = typeof fonts;
export type AppShadows = typeof shadows;
export type AppZIndex = typeof zIndex;

export type AppTheme = {
  colors: AppColors;
  spacing: AppSpacing;
  borderRadius: AppBorderRadius;
  fonts: AppFonts;
  shadows: AppShadows;
  zIndex: AppZIndex;
};
