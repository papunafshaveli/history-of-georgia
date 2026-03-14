import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    splashScreenContainer: {
      flex: 1,
    },
    imageBackContainer: {
      flex: 1,
    },
    imageBackStyles: {
      width: "100%",
      height: "100%",
    },
    fistText: {
      fontFamily: theme.fonts.display,
      fontSize: 35,
      color: theme.colors.onImage,
      textAlign: "left",
    },
    secondText: {
      fontFamily: theme.fonts.display,
      fontSize: 35,
      color: theme.colors.accent,
      textAlign: "center",
    },
    thirdText: {
      fontFamily: theme.fonts.display,
      fontSize: 35,
      color: theme.colors.onImage,
      textAlign: "right",
    },
    textsContainer: {
      flex: 1,
      marginTop: getAdjustedHeight(200),
      paddingHorizontal: 20,
      gap: 20,
    },
  });
