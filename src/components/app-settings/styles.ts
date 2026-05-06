import { StyleSheet } from "react-native";

import { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
      justifyContent: "center",
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
      alignItems: "center",
      gap: theme.spacing.x4,
    },
    signOutTopIconWrapper: {
      width: getAdjustedWidth(100),
      height: getAdjustedWidth(100),
      overflow: "hidden",
      borderRadius: theme.borderRadius.full,
    },
    signOutTopIcon: {
      width: "100%",
      height: "100%",
    },
    signOutModalBody: {
      textAlign: "center",
      lineHeight: 26,
    },
    signOutModalButtons: {
      width: "100%",
      gap: getAdjustedHeight(8),
      marginTop: "auto",
    },
    signOutScrollButton: {
      width: "100%",
      height: getAdjustedHeight(56),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.borderRadius.lg,
      borderWidth: 3,
      borderColor: theme.colors.bronze,
    },
    signOutConfirmButtonDisabled: {
      opacity: 0.4,
    },
  });
