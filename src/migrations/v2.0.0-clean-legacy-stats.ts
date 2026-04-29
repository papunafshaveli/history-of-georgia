import AsyncStorage from "@react-native-async-storage/async-storage";

import { logger } from "@/src/helpers/logger";

const FLAG_KEY = "migrations:v2.0.0:cleanLegacyStats";
const LEGACY_KEYS = ["gameHistory", "highScore"];

export const cleanLegacyStats = async (): Promise<{ ran: boolean }> => {
  try {
    const flag = await AsyncStorage.getItem(FLAG_KEY);
    if (flag === "done") return { ran: false };

    await AsyncStorage.multiRemove(LEGACY_KEYS);
    await AsyncStorage.setItem(FLAG_KEY, "done");
    return { ran: true };
  } catch (error) {
    logger.warn("[migration v2.0.0] cleanLegacyStats failed:", error);
    return { ran: false };
  }
};
