import { StyleSheet } from "react-native";

import { GLOBAL_COLORS } from "@/src/constants";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GLOBAL_COLORS.mixedColors.cream,
  },
  scrollContent: {
    paddingHorizontal: getAdjustedWidth(16),
    paddingTop: getAdjustedHeight(24),
    paddingBottom: getAdjustedHeight(16),
  },
  title: {
    fontFamily: "helvetica-main",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: GLOBAL_COLORS.mixedColors.darkCoffeeThird,
    marginBottom: getAdjustedHeight(20),
  },

  // Stats grid — 2x2 cards
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: getAdjustedHeight(24),
  },
  statCard: {
    width: "48%",
    backgroundColor: GLOBAL_COLORS.primaryColors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GLOBAL_COLORS.mixedColors.darkCoffee,
    paddingVertical: getAdjustedHeight(14),
    paddingHorizontal: getAdjustedWidth(12),
    alignItems: "center",
    marginBottom: getAdjustedHeight(12),
  },
  statValue: {
    fontFamily: "gf-aisi-bold-italic",
    fontSize: 28,
    color: GLOBAL_COLORS.mixedColors.darkCoffee,
  },
  statLabel: {
    fontFamily: "dm-media-main",
    fontSize: 12,
    color: GLOBAL_COLORS.mixedColors.darkCoffeeSecond,
    marginTop: 4,
    textAlign: "center",
  },

  // Recent games section
  sectionTitle: {
    fontFamily: "helvetica-main",
    fontSize: 16,
    fontWeight: "bold",
    color: GLOBAL_COLORS.mixedColors.darkCoffeeThird,
    marginBottom: getAdjustedHeight(12),
  },
  emptyText: {
    fontFamily: "dm-media-main",
    fontSize: 14,
    color: GLOBAL_COLORS.mixedColors.midGrey,
    textAlign: "center",
    marginTop: getAdjustedHeight(32),
  },

  // History list items
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: GLOBAL_COLORS.primaryColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GLOBAL_COLORS.mixedColors.lightCoffee,
    paddingVertical: getAdjustedHeight(12),
    paddingHorizontal: getAdjustedWidth(14),
    marginBottom: getAdjustedHeight(8),
  },
  historyDate: {
    fontFamily: "dm-media-main",
    fontSize: 13,
    color: GLOBAL_COLORS.mixedColors.midGrey,
  },
  historyScore: {
    fontFamily: "gf-aisi-bold-italic",
    fontSize: 18,
    color: GLOBAL_COLORS.mixedColors.darkCoffee,
  },
  historyDetail: {
    fontFamily: "dm-media-main",
    fontSize: 12,
    color: GLOBAL_COLORS.mixedColors.darkCoffeeSecond,
  },
});

export default styles;
