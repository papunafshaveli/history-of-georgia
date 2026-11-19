import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

const SCORE_LIFT = 9;
const SCORE_SIDE_BALANCE = 2;

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-start",
      alignItems: "center",
      paddingHorizontal: getAdjustedWidth(20),
    },

    imageBackgroundWrapper: {
      width: getAdjustedWidth(100),
      height: getAdjustedWidth(100),

      overflow: "hidden",

      borderRadius: "50%",
      alignItems: "center",
      justifyContent: "center",
    },
    imageBackground: {
      width: "100%",
      height: "100%",
    },
    scoreText: {
      // Balances the display font's one-sided right padding so the number sits centred.
      paddingLeft: getAdjustedWidth(SCORE_SIDE_BALANCE),
      textAlign: "center",
      // The display font draws its digits low in the line box; lift them to the circle's centre.
      transform: [{ translateY: -getAdjustedWidth(SCORE_LIFT) }],
    },

    button: {
      minWidth: getAdjustedWidth(150),
      height: getAdjustedHeight(56),

      flexDirection: "row-reverse",
      gap: getAdjustedWidth(5),

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: getAdjustedWidth(16),

      borderRadius: theme.borderRadius.lg,
      borderWidth: 3,
      borderColor: theme.colors.bronze,
    },

    buttonsWrapper: {
      width: "100%",

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: getAdjustedWidth(8),

      position: "absolute",
      bottom: getAdjustedHeight(-40),
    },

    gradient: {
      borderWidth: 3,

      borderRadius: theme.borderRadius.sm,
      width: getAdjustedWidth(56),
      height: getAdjustedWidth(56),
      alignItems: "center",
      justifyContent: "center",

      borderColor: theme.colors.bronze,
    },
    resultFeedbackText: {
      marginTop: getAdjustedHeight(10),
      textAlign: "center",
    },
    highScoreText: {
      marginTop: getAdjustedHeight(10),
      textAlign: "center",
    },
  });
