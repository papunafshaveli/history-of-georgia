import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { logger } from "@/src/helpers/logger";
import { getUserDoc } from "@/src/services/firestore-user";
import type { UserDoc } from "@/src/types";

import { useAuth } from "./useAuth";

const CACHE_KEY_PREFIX = "userStats:cache:";
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEnvelope = {
  fetchedAt: number;
  data: UserDoc;
};

const cacheKeyFor = (uid: string) => `${CACHE_KEY_PREFIX}${uid}`;

const readCache = async (uid: string): Promise<CacheEnvelope | null> => {
  try {
    const raw = await AsyncStorage.getItem(cacheKeyFor(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope;
    if (typeof parsed.fetchedAt !== "number" || !parsed.data) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = async (uid: string, data: UserDoc): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      cacheKeyFor(uid),
      JSON.stringify({ fetchedAt: Date.now(), data }),
    );
  } catch {
    // best-effort
  }
};

export const invalidateUserStatsCache = async (uid: string): Promise<void> => {
  await AsyncStorage.removeItem(cacheKeyFor(uid));
};

type UseUserStatsReturn = {
  stats: UserDoc | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

export const useUserStats = (): UseUserStatsReturn => {
  const { uid, isAuthenticating } = useAuth();
  const [stats, setStats] = useState<UserDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(
    async (currentUid: string, force: boolean) => {
      const cache = await readCache(currentUid);
      if (!force && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
        setStats(cache.data);
        setIsLoading(false);
        return;
      }

      if (cache) setStats(cache.data);

      try {
        const fresh = await getUserDoc(currentUid);
        if (fresh) {
          setStats(fresh);
          await writeCache(currentUid, fresh);
        }
      } catch (err) {
        logger.warn("[useUserStats] fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (isAuthenticating) return;
    if (!uid) {
      setStats(null);
      setIsLoading(false);
      return;
    }
    load(uid, false);
  }, [uid, isAuthenticating, load]);

  const refresh = useCallback(async () => {
    if (!uid) return;
    await load(uid, true);
  }, [uid, load]);

  return { stats, isLoading, refresh };
};
