import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: "90%",
      minHeight: getAdjustedHeight(550),
      overflow: "visible",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: getAdjustedWidth(15),
    },

    closeBtnBackground: {
      backgroundColor: theme.colors.parchmentAlt,
      borderWidth: 0.5,

      alignItems: "center",
      justifyContent: "center",

      width: getAdjustedWidth(40),
      height: getAdjustedWidth(40),

      borderRadius: theme.borderRadius.md,
      borderColor: theme.colors.onImage,
    },

    background: {
      flex: 1,
      padding: getAdjustedWidth(15),
    },

    darkTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(15, 10, 5, 0.2)",
    },
  });
