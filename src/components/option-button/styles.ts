import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    pressableBtn: {
      width: "100%",
      height: getAdjustedHeight(45),
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      borderColor: theme.colors.uiMuted,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: theme.colors.surfaceAlt,
    },
    correctOption: {
      backgroundColor: theme.colors.correctBg,
      borderColor: theme.colors.correctBorder,
    },
    incorrectOption: {
      backgroundColor: theme.colors.incorrectBg,
      borderColor: theme.colors.incorrectBorder,
    },

    optionText: {
      textAlign: "center",
    },
  });
