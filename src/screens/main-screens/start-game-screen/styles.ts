import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    startGameContainer: {
      flex: 1,
    },
    overlayBase: {
      ...StyleSheet.absoluteFillObject,
    },
    overlayDark: {
      backgroundColor: theme.colors.overlayLight,
    },
    overlayLight: {
      backgroundColor: "transparent",
    },
    imageBackContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: -18,
    },
    imageBackStyles: {
      width: "100%",
      height: "100%",
    },
    startGameBtn: {
      width: getAdjustedHeight(300),
      height: getAdjustedHeight(300),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",

      ...theme.shadows.default,
    },
    shieldBackContainer: {
      width: getAdjustedHeight(300),
      height: getAdjustedHeight(300),
      borderRadius: "50%",
      alignItems: "center",
      justifyContent: "center",
    },
    textAndIcon: {
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.x4,
    },

    ethernetText: {
      textAlign: "center",
      marginTop: "30%",
    },

    safeArea: {
      flex: 1,
    },
    darkOpacity: {
      opacity: 0.7,
    },
  });
