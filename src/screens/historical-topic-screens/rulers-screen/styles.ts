import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.background,
      marginTop: getAdjustedHeight(-18),
      padding: 16,
      flex: 1,
    },
    container: {
      flex: 1,
    },
    titleWrapper: {
      alignItems: "center",
      marginTop: getAdjustedHeight(20),
      marginBottom: getAdjustedHeight(20),
    },
    searchInputWrapper: {
      width: "100%",
      marginBottom: getAdjustedHeight(16),
    },
    scrollViewContent: {
      flexGrow: 1,
      paddingBottom: getAdjustedHeight(20),
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: getAdjustedHeight(16),
    },
  });
