import { StyleSheet } from "react-native";

import { GLOBAL_COLORS } from "@/src/constants";
import { getAdjustedHeight } from "@/src/helpers";

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: GLOBAL_COLORS.mixedColors.cream,
    marginTop: getAdjustedHeight(-18),
    padding: 16,
    flex: 1,
  },
  container: {
    flex: 1,
  },
  titleWrapper: {
    alignItems: "center",
    marginTop: getAdjustedHeight(20),
    marginBottom: getAdjustedHeight(20),
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  searchInputWrapper: {
    width: "100%",
    marginBottom: getAdjustedHeight(16),
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: getAdjustedHeight(20),
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: getAdjustedHeight(16),
  },
});

export default styles;
