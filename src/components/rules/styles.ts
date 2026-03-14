import { StyleSheet } from "react-native";

import { AppTheme } from "@/src/theme";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "space-around",
      alignItems: "center",
    },

    imageBackgroundWrapper: {
      width: 100,
      height: 100,

      overflow: "hidden",

      borderRadius: "50%",
    },
    imageBackground: {
      width: "100%",
      height: "100%",
    },

    rulesTextWrapper: {
      marginHorizontal: 20,
      padding: 10,
      backgroundColor: theme.colors.overlayLight,
      borderRadius: 12,
    },

    ruleTextTitle: {
      textAlign: "center",
    },
    ruleTextDesc: {
      textAlign: "center",
    },
  });
