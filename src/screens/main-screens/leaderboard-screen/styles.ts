import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    screenBackground: {
      flex: 1,
      width: "100%",
      height: "100%",
    },
    screenBackgroundImage: {
      opacity: 0.85,
    },
    darkTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.darkTint,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.x4,
      paddingTop: theme.spacing.x2,
      paddingBottom: theme.spacing.x10,
      gap: theme.spacing.x5,
    },

    titleHeader: {
      width: "100%",
      height: getAdjustedHeight(72),
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.x4,
    },
    titleFlourishUnder: {
      width: getAdjustedWidth(140),
      height: getAdjustedHeight(8),
      tintColor: theme.colors.bronze,
      alignSelf: "center",
      marginTop: -theme.spacing.x1,
    },

    parchmentPanel: {
      width: "100%",
      minHeight: getAdjustedHeight(200),
      overflow: "hidden",
    },
    parchmentPanelInner: {
      padding: theme.spacing.x4,
      gap: theme.spacing.x3,
      flex: 1,
    },

    ctaTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.x2,
    },
    ctaCrown: {
      width: getAdjustedWidth(28),
      height: getAdjustedWidth(28),
    },
    yourCardCtaTitle: {
      textAlign: "center",
      flexShrink: 1,
    },
    yourCardCtaBody: {
      textAlign: "center",
    },

    yourCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x4,
    },
    avatarCircle: {
      width: getAdjustedWidth(72),
      height: getAdjustedWidth(72),
      borderRadius: theme.borderRadius.full,
      borderWidth: 2,
      borderColor: theme.colors.bronze,
      backgroundColor: theme.colors.parchmentAlt,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    yourCardNameBlock: {
      flex: 1,
      gap: theme.spacing.x1,
    },

    rankCaption: {
      textAlign: "center",
    },
    rankNumberHero: {
      textAlign: "center",
      fontSize: 56,
      lineHeight: 60,
    },

    miniDivider: {
      width: "100%",
      height: getAdjustedHeight(8),
      tintColor: theme.colors.bronzeMid,
      alignSelf: "center",
    },
    miniStatsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    miniStatCell: {
      flex: 1,
      alignItems: "center",
      gap: theme.spacing.x1,
    },
    miniStatDivider: {
      width: 1,
      height: getAdjustedHeight(36),
      backgroundColor: theme.colors.bronzeMid,
      opacity: 0.4,
    },

    primaryButton: {
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
    primaryButtonPressed: {
      transform: [{ scale: 0.98 }],
    },

    tabsRibbonWrapper: {
      width: "100%",
      height: getAdjustedHeight(56),
      borderRadius: theme.borderRadius.full,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: theme.colors.bronzeDark,
      ...theme.shadows.default,
    },
    tabsRibbonImage: {
      flex: 1,
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
      borderTopWidth: 4,
      borderTopColor: theme.colors.bronzeLight,
    },
    tabButtonPressed: {
      transform: [{ scale: 0.97 }],
    },

    podiumRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "center",
      gap: theme.spacing.x2,
    },
    podiumCard: {
      flex: 1,
      minHeight: getAdjustedHeight(180),
      overflow: "hidden",
      borderRadius: theme.borderRadius.md,
      borderWidth: 3,
      borderColor: theme.colors.bronze,
      ...theme.shadows.default,
    },
    podiumCardCenter: {
      minHeight: getAdjustedHeight(220),
      borderWidth: 4,
    },
    podiumCardInner: {
      flex: 1,
      paddingVertical: theme.spacing.x3,
      paddingHorizontal: theme.spacing.x2,
      alignItems: "center",
      justifyContent: "flex-end",
      gap: theme.spacing.x2,
    },
    podiumRankRibbon: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.bronze,
      paddingVertical: theme.spacing.x1,
      alignItems: "center",
    },
    podiumCrown: {
      width: getAdjustedWidth(28),
      height: getAdjustedWidth(28),
      marginTop: theme.spacing.x4,
    },
    podiumAvatar: {
      width: getAdjustedWidth(48),
      height: getAdjustedWidth(48),
      borderRadius: theme.borderRadius.full,
      borderWidth: 1.5,
      borderColor: theme.colors.bronzeMid,
      backgroundColor: theme.colors.parchmentAlt,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    podiumName: {
      textAlign: "center",
    },
    podiumPlaceholderCard: {
      flex: 1,
      minHeight: getAdjustedHeight(180),
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: theme.colors.bronzeMid,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
    },

    rowCard: {
      width: "100%",
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.bronzeMid,
      overflow: "hidden",
    },
    rowCardSelf: {
      borderWidth: 2,
      borderColor: theme.colors.bronze,
      ...theme.shadows.default,
    },
    rowCardInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x3,
      paddingVertical: theme.spacing.x3,
      paddingHorizontal: theme.spacing.x4,
    },
    rowCrownIcon: {
      width: getAdjustedWidth(20),
      height: getAdjustedWidth(20),
    },
    rowRank: {
      width: getAdjustedWidth(40),
      textAlign: "center",
    },
    rowAvatar: {
      width: getAdjustedWidth(40),
      height: getAdjustedWidth(40),
      borderRadius: theme.borderRadius.full,
      borderWidth: 1.5,
      borderColor: theme.colors.bronzeMid,
      backgroundColor: theme.colors.parchmentAlt,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    rowName: {
      flex: 1,
    },
    rowPoints: {
      fontVariant: ["tabular-nums"],
    },

    listSeparator: {
      height: theme.spacing.x2,
    },

    emptyPanel: {
      width: "100%",
      minHeight: getAdjustedHeight(160),
      overflow: "hidden",
      marginTop: theme.spacing.x2,
    },
    emptyPanelInner: {
      flex: 1,
      paddingVertical: theme.spacing.x6,
      paddingHorizontal: theme.spacing.x4,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.x2,
    },
    emptyPanelTitle: {
      textAlign: "center",
    },
    loadingState: {
      paddingVertical: theme.spacing.x10,
      alignItems: "center",
    },
  });
