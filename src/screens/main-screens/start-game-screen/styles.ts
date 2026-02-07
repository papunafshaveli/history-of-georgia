import { StyleSheet } from "react-native";

import { GLOBAL_COLORS } from "@/src/constants";
import { getAdjustedHeight } from "@/src/helpers";

const styles = StyleSheet.create({
  startGameContainer: {
    flex: 1,
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

    elevation: 10,
    shadowColor: GLOBAL_COLORS.primaryColors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
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
  },
  startGameText: {
    color: GLOBAL_COLORS.mixedColors.lightCoffee,
    fontSize: 40,
    fontFamily: "dm-media-main",
  },
  ethernetText: {
    fontFamily: "dm-media-main",
    textAlign: "center",
    marginTop: "30%",
    fontSize: 20,
    color: GLOBAL_COLORS.primaryColors.red,
  },
});

export default styles;
