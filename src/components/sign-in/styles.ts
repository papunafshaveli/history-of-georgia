import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: theme.spacing.x2,
      gap: theme.spacing.x4,
      justifyContent: "space-between",
    },
    topGroup: {
      gap: theme.spacing.x3,
      alignItems: "center",
    },
    flourish: {
      width: getAdjustedWidth(80),
      height: getAdjustedHeight(8),
      tintColor: theme.colors.bronzeDark,
    },
    body: {
      textAlign: "center",
      lineHeight: 26,
    },
    buttonsGroup: {
      gap: theme.spacing.x3,
    },
    providerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.x2,
      width: "100%",
      paddingVertical: theme.spacing.x3,
      paddingHorizontal: theme.spacing.x4,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 3,
      borderColor: theme.colors.bronze,
      backgroundColor: theme.colors.parchment,
      ...theme.shadows.default,
    },
    providerButtonPressed: {
      transform: [{ scale: 0.98 }],
    },
    skipPressable: {
      paddingVertical: theme.spacing.x3,
      alignItems: "center",
      justifyContent: "center",
      minHeight: getAdjustedHeight(44),
    },
    skipText: {
      textAlign: "center",
    },
    googleMark: {
      width: getAdjustedWidth(20),
      height: getAdjustedWidth(20),
      borderRadius: theme.borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
    },

    confirmContainer: {
      flex: 1,
      paddingVertical: theme.spacing.x2,
      gap: theme.spacing.x3,
    },
    confirmCaption: {
      textAlign: "center",
      lineHeight: 24,
    },
    nameInput: {
      borderWidth: 2,
      borderColor: theme.colors.bronze,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.parchment,
      paddingVertical: theme.spacing.x3,
      paddingHorizontal: theme.spacing.x4,
      fontSize: 18,
      fontFamily: theme.fonts.serif,
      color: theme.colors.bronzeDark,
      textAlign: "center",
    },
    validationRow: {
      minHeight: getAdjustedHeight(20),
      alignItems: "center",
      justifyContent: "center",
    },
    validationText: {
      textAlign: "center",
    },
    saveScrollButton: {
      width: "100%",
      height: getAdjustedHeight(56),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.borderRadius.lg,
      borderWidth: 3,
      borderColor: theme.colors.bronze,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },

    updateModalContainer: {
      flex: 1,
      alignItems: "center",
      gap: theme.spacing.x4,
    },
    updateTopIconWrapper: {
      width: getAdjustedWidth(100),
      height: getAdjustedWidth(100),
      borderRadius: theme.borderRadius.full,
      borderWidth: 3,
      borderColor: theme.colors.bronzeDark,
      backgroundColor: theme.colors.parchmentTint,
      alignItems: "center",
      justifyContent: "center",
    },
    updateBody: {
      textAlign: "center",
      lineHeight: 26,
    },
    updateButtonsGroup: {
      width: "100%",
      gap: getAdjustedHeight(8),
      marginTop: "auto",
    },
    updateScrollButton: {
      width: "100%",
      height: getAdjustedHeight(56),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.borderRadius.lg,
      borderWidth: 3,
      borderColor: theme.colors.bronze,
    },
  });
