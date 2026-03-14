import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

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

    button: {
      width: getAdjustedWidth(150),
      height: getAdjustedHeight(56),

      flexDirection: "row-reverse",
      gap: getAdjustedWidth(5),

      alignItems: "center",
      justifyContent: "center",

      borderRadius: theme.borderRadius.lg,
      borderWidth: 3,
      borderColor: theme.colors.bronze,
    },

    buttonsWrapper: {
      width: "100%",

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      position: "absolute",
      bottom: getAdjustedHeight(-40),
    },

    gradient: {
      borderWidth: 3,

      borderRadius: 10,
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
