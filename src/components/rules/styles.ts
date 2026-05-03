import { StyleSheet } from "react-native";

import { AppTheme } from "@/src/theme";
import { getAdjustedWidth } from "@/src/helpers";

const RULE_DIVIDER_OPACITY = 0.2;

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "stretch",
    },

    iconCircleWrapper: {
      alignSelf: "center",
      marginBottom: theme.spacing.x2,
    },
    iconImageWrapper: {
      width: getAdjustedWidth(64),
      height: getAdjustedWidth(64),
      overflow: "hidden",
      borderRadius: theme.borderRadius.full,
    },
    iconImage: {
      width: "100%",
      height: "100%",
    },

    title: {
      textAlign: "center",
      marginBottom: theme.spacing.x3,
    },

    ruleRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.x1,
      columnGap: theme.spacing.x3,
    },
    ruleIcon: {
      width: getAdjustedWidth(28),
      textAlign: "center",
    },
    ruleText: {
      flex: 1,
    },
    ruleDivider: {
      height: 1,
      backgroundColor: theme.colors.onImage,
      opacity: RULE_DIVIDER_OPACITY,
    },

    scoringChipsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      columnGap: theme.spacing.x2,
      marginTop: theme.spacing.x3,
      marginBottom: theme.spacing.x3,
    },
    scoringChip: {
      flex: 1,
      paddingVertical: theme.spacing.x2,
      paddingHorizontal: theme.spacing.x2,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.onImage,
      backgroundColor: theme.colors.parchmentTint,
      alignItems: "center",
    },
    scoringChipLabel: {
      textAlign: "center",
    },
    scoringChipValue: {
      textAlign: "center",
      marginTop: theme.spacing.x1,
    },

    outroLine: {
      textAlign: "center",
      fontStyle: "italic",
      marginTop: theme.spacing.x1,
    },
  });
