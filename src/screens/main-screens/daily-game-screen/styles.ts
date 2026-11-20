import { StyleSheet } from "react-native";

import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";
import type { AppTheme } from "@/src/theme";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      alignItems: "center",
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.x6,
    },
    header: {
      width: "100%",
      alignItems: "center",
      gap: theme.spacing.x2,
      paddingTop: getAdjustedHeight(8),
      paddingBottom: getAdjustedHeight(4),
    },
    headerRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    clockChip: {
      width: getAdjustedWidth(112),
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x1,
      paddingHorizontal: theme.spacing.x3,
      paddingVertical: theme.spacing.x1,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 2,
      borderColor: theme.colors.bronze,
      backgroundColor: theme.colors.surface,
    },
    clockText: {
      flex: 1,
      fontVariant: ["tabular-nums"],
      textAlign: "right",
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.x4,
      paddingHorizontal: theme.spacing.x6,
    },
    centeredText: {
      textAlign: "center",
    },
    backButton: {
      minHeight: 48,
      justifyContent: "center",
      backgroundColor: theme.colors.bronze,
      paddingHorizontal: theme.spacing.x6,
      borderRadius: theme.borderRadius.md,
    },
    loadingClose: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.x6,
    },
    saveError: {
      alignItems: "center",
      gap: theme.spacing.x1,
    },
  });
