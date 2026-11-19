import { StyleSheet } from "react-native";

import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";
import type { AppTheme } from "@/src/theme";

// Mirrors other-apps-carousel/styles.ts so the daily card reads as part of the same home screen.
export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: "100%",
      paddingHorizontal: theme.spacing.x4,
      paddingBottom: getAdjustedHeight(12),
    },
    titlePill: {
      alignSelf: "flex-start",
      marginBottom: theme.spacing.x2,
      paddingHorizontal: theme.spacing.x3,
      paddingVertical: theme.spacing.x1,
      backgroundColor: theme.colors.chromeBg,
      borderRadius: theme.borderRadius.full,
    },
    card: {
      width: "100%",
      borderWidth: 1,
      borderColor: theme.colors.bronzeMid,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.default,
    },
    cardDone: {
      width: "100%",
      borderWidth: 1,
      borderColor: theme.colors.parchmentDivider,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.chromeBg,
      opacity: 0.92,
    },
    cardPressed: {
      opacity: 0.82,
    },
    cardBody: {
      minHeight: getAdjustedHeight(88),
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x3,
      padding: theme.spacing.x3,
      borderRadius: theme.borderRadius.lg,
    },
    iconFrame: {
      width: getAdjustedWidth(56),
      height: getAdjustedWidth(56),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.colors.bronzeMid,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceSunken,
    },
    streakNumber: {
      maxWidth: "100%",
      paddingHorizontal: theme.spacing.x1,
      fontVariant: ["tabular-nums"],
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    description: {
      marginTop: theme.spacing.x1,
    },
    action: {
      width: getAdjustedWidth(40),
      height: getAdjustedWidth(40),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.chromeBg,
      borderRadius: theme.borderRadius.full,
    },
  });
