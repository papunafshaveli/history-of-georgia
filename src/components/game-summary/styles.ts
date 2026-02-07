import { StyleSheet } from "react-native";

import { GLOBAL_COLORS } from "@/src/constants";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: getAdjustedWidth(20),
  },

  imageBackgroundWrapper: {
    width: getAdjustedWidth(100),
    height: getAdjustedWidth(100),

    overflow: "hidden",

    borderRadius: "50%",
    alignItems: "center",
    justifyContent: "center",
  },
  imageBackground: {
    width: "100%",
    height: "100%",
  },

  hint: {
    fontFamily: "dm-media-main",
    fontSize: 15,
    textAlign: "center",
  },

  button: {
    width: getAdjustedWidth(150),
    height: getAdjustedHeight(56),

    flexDirection: "row-reverse",
    gap: 5,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 16,
    borderWidth: 3,
    borderColor: GLOBAL_COLORS.mixedColors.darkCoffee,
  },
  btnText: {
    fontSize: 12,
    fontFamily: "dm-media-main",
  },
  buttonsWrapper: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    position: "absolute",
    bottom: getAdjustedHeight(-40),
  },
  scoreText: {
    fontSize: 24,
    fontFamily: "dm-media-main",
  },
  gradient: {
    borderWidth: 3,

    borderRadius: 10,
    width: getAdjustedWidth(56),
    height: getAdjustedWidth(56),
    alignItems: "center",
    justifyContent: "center",

    borderColor: GLOBAL_COLORS.mixedColors.darkCoffee,
  },
  resultFeedbackText: {
    fontSize: 18,
    fontFamily: "dm-media-main",
    marginTop: getAdjustedHeight(10),
    textAlign: "center",
  },
  highScoreText: {
    fontSize: 14,
    fontFamily: "dm-media-main",
    marginTop: getAdjustedHeight(10),
    textAlign: "center",
  },
});

export default styles;
