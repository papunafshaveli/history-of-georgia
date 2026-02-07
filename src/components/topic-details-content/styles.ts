import { StyleSheet } from "react-native";

import { GLOBAL_COLORS } from "@/src/constants";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: GLOBAL_COLORS.mixedColors.cream,
    marginTop: getAdjustedHeight(-18),
    paddingHorizontal: 4,
    flex: 1,
  },

  titleWrapper: {
    alignItems: "center",
    marginTop: getAdjustedHeight(36),
    marginBottom: getAdjustedHeight(12),
  },

  title: {
    fontFamily: "helvetica-main",
    fontSize: 18,
    fontWeight: "bold",
  },

  scrollView: {
    flex: 1,
    padding: getAdjustedWidth(16),
    marginBottom: getAdjustedHeight(32),
  },

  videoInfoWrapper: {
    paddingVertical: getAdjustedHeight(12),
    marginVertical: getAdjustedHeight(32),
    paddingHorizontal: getAdjustedWidth(12),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GLOBAL_COLORS.mixedColors.midGrey,
    width: "100%",
    backgroundColor: GLOBAL_COLORS.primaryColors.btnDefault,
  },

  text: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: getAdjustedHeight(12),
  },

  horizontalScrollView: {
    gap: getAdjustedWidth(12),
  },

  videoWrapper: {
    width: getAdjustedWidth(300),
  },

  singleVideoWrapper: {
    width: "100%",
  },
  paragraph: {
    textAlign: "left",
    fontFamily: "helvetica-main",
    fontSize: 14,
    lineHeight: 22,
  },
  titleParagraph: {
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: "helvetica-main",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default styles;
