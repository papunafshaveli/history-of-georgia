import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.background,
      marginTop: getAdjustedHeight(-18),
      paddingHorizontal: getAdjustedWidth(4),
      flex: 1,
    },

    titleWrapper: {
      alignItems: "center",
      marginTop: getAdjustedHeight(36),
      marginBottom: getAdjustedHeight(12),
    },

    scrollView: {
      flex: 1,
      padding: getAdjustedWidth(16),
      marginBottom: getAdjustedHeight(32),
    },

    videoInfoWrapper: {
      paddingVertical: getAdjustedHeight(12),
      marginVertical: getAdjustedHeight(32),
      paddingHorizontal: getAdjustedWidth(12),
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.uiMuted,
      width: "100%",
      backgroundColor: theme.colors.surfaceAlt,
    },

    text: {
      marginBottom: getAdjustedHeight(12),
    },

    horizontalScrollView: {
      gap: getAdjustedWidth(12),
    },

    videoWrapper: {
      width: getAdjustedWidth(300),
    },

    singleVideoWrapper: {
      width: "100%",
    },
    paragraph: {
      textAlign: "left",
    },
    titleParagraph: {
      paddingVertical: getAdjustedHeight(16),
      textAlign: "center",
    },
  });
