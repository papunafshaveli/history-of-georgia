import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    gameScreenContainer: {
      flex: 1,
      alignItems: "center",

      backgroundColor: theme.colors.background,

      paddingHorizontal: 24,

      position: "relative",
    },
  });
