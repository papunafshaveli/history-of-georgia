import { StyleSheet } from "react-native";

import { AppTheme } from "@/src/theme";
import { getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
    },

    imageBackgroundWrapper: {
      width: getAdjustedWidth(100),
      height: getAdjustedWidth(100),

      overflow: "hidden",

      borderRadius: "50%",
    },
    imageBackground: {
      width: "100%",
      height: "100%",
    },

    rulesTextWrapper: {
      marginHorizontal: theme.spacing.x5,
      padding: getAdjustedWidth(10),
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.x5,
    },

    alignCenter: {
      textAlign: "center",
    },
  });
