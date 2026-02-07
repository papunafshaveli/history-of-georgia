import { StyleSheet } from "react-native";

import { GLOBAL_COLORS } from "@/src/constants";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

const styles = StyleSheet.create({
  ethernetText: {
    fontFamily: "dm-media-main",
    textAlign: "center",
    marginTop: "30%",
    fontSize: 20,
    color: GLOBAL_COLORS.primaryColors.red,
  },
  crownsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,

    paddingTop: getAdjustedHeight(20),
  },
  singleCrown: {
    width: getAdjustedWidth(38),
    height: getAdjustedWidth(24),
  },
  answersTextAndCount: {
    marginTop: getAdjustedHeight(12),
    fontSize: 14,

    fontFamily: "dm-media-main",
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
    fontSize: 14,
    fontFamily: "dm-media-main",
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
    borderColor: GLOBAL_COLORS.mixedColors.darkCoffeeSecond,
    borderRadius: 10,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  helpGradient: {
    borderWidth: 1.5,
    borderColor: GLOBAL_COLORS.mixedColors.darkCoffeeSecond,
    borderRadius: 10,
    height: 50,
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 20,
  },

  helpIconAdnText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  hintText: {
    fontFamily: "gf-aisi-bold-italic",
    fontSize: 24,
    color: GLOBAL_COLORS.primaryColors.dark,
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

export default styles;
