import { StyleSheet } from "react-native";

import { GLOBAL_COLORS } from "@/src/constants";
import { getAdjustedHeight } from "@/src/helpers";

const styles = StyleSheet.create({
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
    fontFamily: "dm-media-main",
    fontSize: 35,
    color: GLOBAL_COLORS.primaryColors.dark,
    textAlign: "left",
  },
  secondText: {
    fontFamily: "dm-media-main",
    fontSize: 35,
    color: GLOBAL_COLORS.primaryColors.red,
    textAlign: "center",
  },
  thirdText: {
    fontFamily: "dm-media-main",
    fontSize: 35,
    color: GLOBAL_COLORS.primaryColors.dark,
    textAlign: "right",
  },
  textsContainer: {
    flex: 1,
    marginTop: getAdjustedHeight(200),
    paddingHorizontal: 20,
    gap: 20,
  },
});

export default styles;
