import { StyleSheet } from "react-native";

import { getAdjustedHeight } from "@/src/helpers";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
  },

  imageBackgroundWrapper: {
    width: 100,
    height: 100,

    overflow: "hidden",

    borderRadius: "50%",
  },
  imageBackground: {
    width: "100%",
    height: "100%",
  },

  rulesTextWrapper: {
    marginHorizontal: 20,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
  },

  ruleTextTitle: {
    textAlign: "center",
    fontSize: getAdjustedHeight(17),
    fontFamily: "dm-media-main",
  },
  ruleTextDesc: {
    textAlign: "center",
    fontSize: getAdjustedHeight(14),
    fontFamily: "dm-media-main",
  },
});

export default styles;
