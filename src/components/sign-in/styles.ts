import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: theme.spacing.x2,
      gap: theme.spacing.x4,
      justifyContent: "space-between",
    },
    topGroup: {
      gap: theme.spacing.x3,
      alignItems: "center",
    },
    flourish: {
      width: getAdjustedWidth(80),
      height: getAdjustedHeight(8),
      tintColor: theme.colors.bronzeDark,
    },
    body: {
      textAlign: "center",
      lineHeight: 26,
    },
    buttonsGroup: {
      gap: theme.spacing.x3,
    },
    providerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.x2,
      width: "100%",
      paddingVertical: theme.spacing.x3,
      paddingHorizontal: theme.spacing.x4,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 3,
      borderColor: theme.colors.bronze,
      backgroundColor: theme.colors.parchment,
      ...theme.shadows.default,
    },
    providerButtonPressed: {
      transform: [{ scale: 0.98 }],
    },
    skipPressable: {
      paddingVertical: theme.spacing.x3,
      alignItems: "center",
      justifyContent: "center",
      minHeight: getAdjustedHeight(44),
    },
    skipText: {
      textAlign: "center",
    },
    googleMark: {
      width: getAdjustedWidth(20),
      height: getAdjustedWidth(20),
      borderRadius: theme.borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
    },
  });
