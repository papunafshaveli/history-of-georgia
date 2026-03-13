import { StyleSheet } from "react-native";

import { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: theme.spacing.x4,
      gap: theme.spacing.x6,
    },

    themeSection: {
      width: "100%",
      alignItems: "center",
      gap: theme.spacing.x4,
    },
    themeLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x3,
    },
    themeOptions: {
      flexDirection: "row",
      gap: getAdjustedWidth(8),
    },
    themeOption: {
      paddingHorizontal: getAdjustedWidth(12),
      paddingVertical: getAdjustedHeight(6),
      borderRadius: theme.borderRadius.sm,
      backgroundColor: "rgba(0, 0, 0, 0.12)",
    },
    themeOptionActive: {
      backgroundColor: theme.colors.coffee,
    },
    themeOptionText: {
      opacity: 0.7,
    },
    themeOptionTextActive: {
      color: theme.colors.white,
      opacity: 1,
    },
  });
