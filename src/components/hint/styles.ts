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
    },
    imageBackground: {
      width: "100%",
      height: "100%",
    },

    hint: {
      textAlign: "center",
    },

    button: {
      position: "absolute",
      bottom: getAdjustedHeight(-40),

      width: "100%",
    },
    gradient: {
      width: "100%",
      height: getAdjustedHeight(56),

      alignItems: "center",
      justifyContent: "center",

      borderRadius: theme.borderRadius.lg,
      borderWidth: 3,
      borderColor: theme.colors.coffee,

      backgroundColor: theme.colors.coffeeLight,
    },
  });
