import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: getAdjustedWidth(16),
      paddingTop: getAdjustedHeight(16),
      paddingBottom: getAdjustedHeight(24),
      gap: theme.spacing.x5,
    },

    fixedTitleContainer: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: getAdjustedWidth(16),
      paddingTop: getAdjustedHeight(12),
      paddingBottom: getAdjustedHeight(8),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.parchmentDivider,
    },
    titleBlock: {
      alignItems: "center",
      gap: getAdjustedHeight(6),
    },
    titleText: {
      textAlign: "center",
    },
    titleDivider: {
      width: getAdjustedWidth(80),
      height: 2,
      borderRadius: 1,
      backgroundColor: theme.colors.bronze,
      opacity: 0.6,
    },

    anonGate: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.x6,
    },
    anonIconCircle: {
      width: getAdjustedWidth(64),
      height: getAdjustedWidth(64),
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.parchmentTint,
      borderWidth: 2,
      borderColor: theme.colors.bronzeDark,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.x4,
    },
    anonHeadline: {
      textAlign: "center",
      marginBottom: theme.spacing.x8,
      paddingHorizontal: theme.spacing.x4,
    },
    anonButtonsStack: {
      width: "100%",
      gap: theme.spacing.x3,
    },
    signInButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.x2,
      width: "100%",
      paddingVertical: theme.spacing.x4,
      paddingHorizontal: theme.spacing.x4,
      borderRadius: theme.borderRadius.md,
      borderWidth: 3,
      borderColor: theme.colors.bronze,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.default,
    },
    signInButtonPressed: {
      transform: [{ scale: 0.98 }],
    },
    signInButtonDisabled: {
      opacity: 0.6,
    },

    leaderboardListWrapper: {
      gap: theme.spacing.x2,
    },

    rowCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x3,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.bronzeLight,
      paddingVertical: getAdjustedHeight(10),
      paddingHorizontal: getAdjustedWidth(14),
    },
    rowCardSelf: {
      borderWidth: 2,
      borderColor: theme.colors.bronze,
    },
    rowRank: {
      width: getAdjustedWidth(36),
      textAlign: "center",
    },
    rowAvatar: {
      width: getAdjustedWidth(36),
      height: getAdjustedWidth(36),
      borderRadius: theme.borderRadius.full,
      borderWidth: 1.5,
      borderColor: theme.colors.bronzeMid,
      backgroundColor: theme.colors.parchment,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    rowAvatarImage: {
      width: "100%",
      height: "100%",
    },
    rowName: {
      flex: 1,
    },
    rowPoints: {
      fontVariant: ["tabular-nums"],
    },

    tabsRibbonWrapper: {
      width: "100%",
      height: getAdjustedHeight(48),
      borderRadius: theme.borderRadius.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.bronzeMid,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
    },
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.x2,
    },
    tabButtonActive: {
      backgroundColor: theme.colors.bronzeDark,
    },
    tabButtonPressed: {
      transform: [{ scale: 0.97 }],
    },

    loadingState: {
      paddingVertical: getAdjustedHeight(24),
      alignItems: "center",
    },
  });
