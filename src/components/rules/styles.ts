import { StyleSheet } from "react-native";

import { AppTheme } from "@/src/theme";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
      marginHorizontal: theme.spacing.x5,
      padding: 10,
      borderRadius: 12,
      gap: theme.spacing.x5,
    },

    alignCenter: {
      textAlign: "center",
    },
  });
