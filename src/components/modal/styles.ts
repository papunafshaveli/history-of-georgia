import { StyleSheet } from "react-native";

import { GLOBAL_COLORS } from "@/src/constants";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    minHeight: getAdjustedHeight(550),
    overflow: "visible",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: getAdjustedWidth(15),
  },
  headerTitle: {
    fontSize: 18,
    color: GLOBAL_COLORS.primaryColors.dark,
    fontFamily: "dm-media-main",
  },

  closeBtnBackground: {
    backgroundColor: GLOBAL_COLORS.primaryColors.oldRollSecond,
    borderWidth: 0.5,

    alignItems: "center",
    justifyContent: "center",

    width: getAdjustedWidth(40),
    height: getAdjustedWidth(40),

    borderRadius: 12,
    borderColor: GLOBAL_COLORS.primaryColors.dark,
  },

  background: {
    flex: 1,
    padding: getAdjustedWidth(15),
  },
});

export default styles;
