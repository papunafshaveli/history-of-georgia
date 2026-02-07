import { StyleSheet } from "react-native";

import { GLOBAL_COLORS } from "@/src/constants";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: GLOBAL_COLORS.mixedColors.cream,
    marginTop: getAdjustedHeight(-18),
    flex: 1,
  },

  titleDescWrapper: {
    alignItems: "center",
    gap: 5,
    marginTop: getAdjustedHeight(45),
  },
  title: {
    fontFamily: "helvetica-main",
    fontSize: 18,
    fontWeight: "bold",
  },
  description: {
    color: GLOBAL_COLORS.mixedColors.midGrey,
    fontFamily: "helvetica-main",
    fontWeight: "bold",
    fontSize: 16,
  },
  historicalTopicsContainer: {
    flexGrow: 1,
    paddingHorizontal: getAdjustedWidth(16),
    paddingVertical: getAdjustedHeight(36),
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: GLOBAL_COLORS.mixedColors.darkCoffee,
    marginBottom: getAdjustedHeight(16),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: GLOBAL_COLORS.mixedColors.darkCoffee,
  },

  text: {
    fontSize: 20,
    fontFamily: "gf-aisi-bold-italic",
    color: GLOBAL_COLORS.mixedColors.cream,
    marginBottom: 5,
  },

  imageBackgroundStyle: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});

export default styles;
