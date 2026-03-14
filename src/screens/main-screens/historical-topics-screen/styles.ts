import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.background,
      marginTop: getAdjustedHeight(-18),
      flex: 1,
    },

    titleDescWrapper: {
      alignItems: "center",
      gap: 5,
      marginTop: getAdjustedHeight(45),
    },
    historicalTopicsContainer: {
      flexGrow: 1,
      paddingHorizontal: getAdjustedWidth(16),
      paddingVertical: getAdjustedHeight(36),
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    gridItem: {
      width: "48%",
      aspectRatio: 1,
      backgroundColor: theme.colors.bronze,
      marginBottom: getAdjustedHeight(16),
      justifyContent: "center",
      alignItems: "center",
      borderRadius: theme.borderRadius.md,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: theme.colors.bronze,
    },

    text: {
      textAlign: "center",
      marginBottom: 5,
    },

    imageBackgroundStyle: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "flex-end",
    },
  });
