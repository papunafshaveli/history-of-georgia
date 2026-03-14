import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    gameScreenContainer: {
      flex: 1,
      alignItems: "center",

      backgroundColor: theme.colors.background,

      paddingHorizontal: theme.spacing.x6,

      position: "relative",
    },
  });
