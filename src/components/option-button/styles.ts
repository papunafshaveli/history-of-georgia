import { StyleSheet } from "react-native";

import { GLOBAL_COLORS } from "@/src/constants";

const styles = StyleSheet.create({
  pressableBtn: {
    width: "100%",
    height: 45,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: GLOBAL_COLORS.mixedColors.midGrey,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: GLOBAL_COLORS.primaryColors.btnDefault,
  },
  correctOption: {
    backgroundColor: GLOBAL_COLORS.primaryColors.right,
    borderColor: GLOBAL_COLORS.primaryColors.rightBorder,
  },
  incorrectOption: {
    backgroundColor: GLOBAL_COLORS.primaryColors.incorrect,
    borderColor: GLOBAL_COLORS.primaryColors.incorrectBorder,
  },

  optionText: {
    fontSize: 18,

    fontFamily: "gf-aisi-bold-italic",
    textAlign: "center",
  },
});

export default styles;
