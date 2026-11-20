import { StyleSheet } from "react-native";

import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";
import type { AppTheme } from "@/src/theme";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flexGrow: 1,
      alignItems: "center",
      gap: theme.spacing.x4,
      paddingHorizontal: theme.spacing.x4,
      paddingVertical: theme.spacing.x6,
    },
    scroll: {
      // A percentage width collapsed inside the scroll view's centred content; stretch fills it.
      alignSelf: "stretch",
      height: getAdjustedHeight(300),
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.x3,
      paddingHorizontal: getAdjustedWidth(50),
    },
    score: {
      fontVariant: ["tabular-nums"],
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x1,
    },
    divider: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x2,
      paddingHorizontal: theme.spacing.x5,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth * 2,
      backgroundColor: theme.colors.bronzeMid,
      opacity: 0.6,
    },
    lines: {
      alignItems: "center",
      gap: theme.spacing.x2,
    },
    spacer: {
      flexGrow: 1,
    },
    buttons: {
      width: "100%",
      gap: theme.spacing.x3,
    },
    shareButton: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.x2,
      borderRadius: theme.borderRadius.md,
      borderWidth: 3,
      borderColor: theme.colors.bronzeDark,
      backgroundColor: theme.colors.bronzeLight,
    },
    secondaryButton: {
      minHeight: 50,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.borderRadius.md,
      borderWidth: 3,
      borderColor: theme.colors.bronze,
      backgroundColor: theme.colors.surface,
    },
    closeButton: {
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.82,
    },
  });
