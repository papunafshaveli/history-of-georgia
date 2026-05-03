import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db } from "@/firebase";
import { logger } from "@/src/helpers/logger";

const APP_CONFIG_COLLECTION = "app_config";
const APP_CONFIG_DOC = "version";
const CACHE_KEY = "appConfig:cache:v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export type AppConfig = {
  minSupportedVersion: string;
  latestVersion: string;
};

type CacheEnvelope = {
  fetchedAt: number;
  data: AppConfig;
};

const isAppConfig = (value: unknown): value is AppConfig =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as AppConfig).minSupportedVersion === "string" &&
  typeof (value as AppConfig).latestVersion === "string";

const readFreshCache = async (): Promise<AppConfig | null> => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope;
    if (typeof parsed.fetchedAt !== "number") return null;
    if (Date.now() - parsed.fetchedAt >= CACHE_TTL_MS) return null;
    if (!isAppConfig(parsed.data)) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const writeCache = async (data: AppConfig): Promise<void> => {
  try {
    const envelope: CacheEnvelope = { fetchedAt: Date.now(), data };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(envelope));
  } catch {
    // best-effort
  }
};

/**
 * Fetch the app_config/version doc with a 6-hour AsyncStorage cache.
 * Returns null when the doc is missing, the network is unreachable AND
 * the cache is empty/stale, or the doc shape is invalid — callers must
 * treat null as "grace mode: don't block, retry on next launch".
 */
export const getAppConfig = async (): Promise<AppConfig | null> => {
  const cached = await readFreshCache();
  if (cached) return cached;

  try {
    const ref = doc(db, APP_CONFIG_COLLECTION, APP_CONFIG_DOC);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!isAppConfig(data)) return null;
    await writeCache(data);
    return data;
  } catch (err) {
    logger.warn("[appConfig] Firestore fetch failed:", err);
    return null;
  }
};
