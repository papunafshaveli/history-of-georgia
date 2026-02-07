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
  },
  imageBackground: {
    width: "100%",
    height: "100%",
  },

  hint: {
    fontFamily: "dm-media-main",
    fontSize: getAdjustedHeight(18),
    textAlign: "center",
  },

  button: {
    position: "absolute",
    bottom: getAdjustedHeight(-40),

    width: "100%",
  },
  gradient: {
    width: "100%",
    height: getAdjustedHeight(56),

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 16,
    borderWidth: 3,
    borderColor: GLOBAL_COLORS.mixedColors.darkCoffee,

    backgroundColor: GLOBAL_COLORS.mixedColors.lightCoffee,
  },
  btnText: {
    fontSize: 12,
    fontFamily: "dm-media-main",
  },
});

export default styles;
