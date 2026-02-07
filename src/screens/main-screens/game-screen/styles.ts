import { GLOBAL_COLORS } from "@/src/constants";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  gameScreenContainer: {
    flex: 1,
    alignItems: "center",

    backgroundColor: GLOBAL_COLORS.mixedColors.cream,

    paddingHorizontal: 24,

    position: "relative",
  },
});

export default styles;
