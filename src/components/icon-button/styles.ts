import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    btnContainer: {
      borderRadius: theme.borderRadius.xs,
      padding: getAdjustedWidth(6),
      marginHorizontal: theme.spacing.x2,
      marginVertical: getAdjustedHeight(2),

      gap: getAdjustedWidth(10),
      flexDirection: "row",
      alignItems: "center",
    },
    pressed: {
      opacity: 0.8,
    },
  });
