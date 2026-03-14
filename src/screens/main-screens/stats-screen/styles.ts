import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: getAdjustedWidth(16),
    },
    title: {
      textAlign: "center",
      paddingTop: getAdjustedHeight(24),
      marginBottom: getAdjustedHeight(20),
    },

    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: getAdjustedHeight(24),
    },

    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: getAdjustedHeight(12),
    },
    scrollContent: {
      paddingBottom: getAdjustedHeight(16),
    },

    historyItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.bronzeLight,
      paddingVertical: getAdjustedHeight(12),
      paddingHorizontal: getAdjustedWidth(14),
      marginBottom: getAdjustedHeight(8),
    },
    historyLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    historyRight: {
      flexDirection: "row",
      alignItems: "baseline",
    },

    shareButton: {
      padding: 6,
      marginLeft: 8,
    },
  });
