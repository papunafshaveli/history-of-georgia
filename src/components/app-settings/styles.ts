import { StyleSheet } from "react-native";

import { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: getAdjustedHeight(40),
      paddingHorizontal: theme.spacing.x4,
      gap: getAdjustedHeight(20),
    },

    section: {
      width: "100%",
      backgroundColor: theme.colors.parchmentTint,
      borderRadius: theme.borderRadius.md,
      paddingVertical: getAdjustedHeight(12),
      paddingHorizontal: getAdjustedWidth(14),
    },

    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.parchmentDivider,
      marginVertical: getAdjustedHeight(10),
    },

    themeSection: {
      width: "100%",
      backgroundColor: theme.colors.parchmentTint,
      borderRadius: theme.borderRadius.md,
      paddingVertical: getAdjustedHeight(14),
      paddingHorizontal: getAdjustedWidth(14),
      alignItems: "center",
      gap: getAdjustedHeight(12),
    },
    themeLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x3,
    },
    themeOptions: {
      flexDirection: "row",
      gap: getAdjustedWidth(8),
    },
    themeOption: {
      paddingHorizontal: getAdjustedWidth(12),
      paddingVertical: getAdjustedHeight(6),
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.parchmentFrost,
      borderWidth: 1,
      borderColor: theme.colors.parchmentBorderLight,
    },
    themeOptionActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    themeOptionText: {
      opacity: 0.7,
    },
    themeOptionTextActive: {
      opacity: 1,
    },

    accountRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: getAdjustedHeight(4),
    },
    accountRowLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x3,
    },
    accountRowLabel: {
      flexShrink: 1,
    },
    accountRowDisabled: {
      opacity: 0.4,
    },

    signOutModalContainer: {
      flex: 1,
      paddingVertical: theme.spacing.x2,
      gap: theme.spacing.x4,
    },
    signOutModalBody: {
      textAlign: "center",
      lineHeight: 26,
    },
    signOutModalButtons: {
      flexDirection: "row",
      gap: theme.spacing.x3,
    },
    signOutCancelButton: {
      flex: 1,
      paddingVertical: theme.spacing.x3,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: theme.colors.bronze,
      backgroundColor: theme.colors.parchment,
      alignItems: "center",
      justifyContent: "center",
    },
    signOutConfirmButton: {
      flex: 1,
      paddingVertical: theme.spacing.x3,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.incorrectBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    signOutConfirmButtonDisabled: {
      opacity: 0.4,
    },
  });
