import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    crownsWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: getAdjustedWidth(6),
      paddingTop: getAdjustedHeight(20),
    },
    singleCrown: {
      width: getAdjustedWidth(38),
      height: getAdjustedWidth(24),
    },
    answersTextAndCount: {
      marginTop: getAdjustedHeight(12),
    },
    imageBackgroundWrapper: {
      width: "100%",
      height: "100%",
      maxHeight: getAdjustedHeight(360),
      maxWidth: getAdjustedWidth(430),

      alignItems: "center",
      justifyContent: "center",
    },
    questionText: {
      textAlign: "center",

      maxWidth: "80%",
    },

    optionsWrapper: {
      width: "100%",
    },

    footerWrapper: {
      position: "absolute",
      bottom: getAdjustedHeight(10),

      width: "100%",

      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    iconButtonContainer: {
      borderWidth: 1.5,
      borderColor: theme.colors.coffeeMedium,
      borderRadius: 10,
      width: getAdjustedWidth(50),
      height: getAdjustedWidth(50),
      alignItems: "center",
      justifyContent: "center",
    },

    helpGradient: {
      borderWidth: 1.5,
      borderColor: theme.colors.coffeeMedium,
      borderRadius: 10,
      height: getAdjustedHeight(50),
      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: theme.spacing.x5,
    },

    helpIconAdnText: {
      flexDirection: "row",
      alignItems: "center",
      gap: getAdjustedWidth(5),
    },

    hintText: {
      textAlign: "center",
    },

    flatListContentContainer: {
      flex: 1,
      gap: getAdjustedHeight(6),
      justifyContent: "space-between",
      marginBottom: getAdjustedHeight(90),
      maxHeight: getAdjustedHeight(240),
      marginTop: getAdjustedHeight(20),
    },
  });
