import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { logger } from "@/src/helpers/logger";
import { getLeaderboard } from "@/src/services/firestore-leaderboard";
import { LeaderboardTab, type LeaderboardEntry } from "@/src/types";

const CACHE_KEY_PREFIX = "leaderboard:cache:";
const CACHE_TTL_MS = 30 * 60 * 1000;

type CacheEnvelope = {
  fetchedAt: number;
  entries: LeaderboardEntry[];
};

export enum LeaderboardError {
  OFFLINE = "offline",
  UNKNOWN = "unknown",
}

const cacheKeyFor = (tab: LeaderboardTab) => `${CACHE_KEY_PREFIX}${tab}`;

const readCache = async (
  tab: LeaderboardTab,
): Promise<CacheEnvelope | null> => {
  try {
    const raw = await AsyncStorage.getItem(cacheKeyFor(tab));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope;
    if (typeof parsed.fetchedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = async (
  tab: LeaderboardTab,
  entries: LeaderboardEntry[],
): Promise<void> => {
  const envelope: CacheEnvelope = { fetchedAt: Date.now(), entries };
  try {
    await AsyncStorage.setItem(cacheKeyFor(tab), JSON.stringify(envelope));
  } catch {
    // best-effort cache; ignore write failures
  }
};

export const invalidateLeaderboardCache = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    cacheKeyFor(LeaderboardTab.WEEKLY),
    cacheKeyFor(LeaderboardTab.ALLTIME),
  ]);
};

const isCacheFresh = (cache: CacheEnvelope) =>
  Date.now() - cache.fetchedAt < CACHE_TTL_MS;

type UseLeaderboardOptions = {
  tab: LeaderboardTab;
};

type UseLeaderboardReturn = {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: LeaderboardError | null;
  refresh: () => Promise<void>;
};

export const useLeaderboard = ({
  tab,
}: UseLeaderboardOptions): UseLeaderboardReturn => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<LeaderboardError | null>(null);

  const inFlightRef = useRef(false);

  const load = useCallback(
    async (force: boolean) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      const cache = await readCache(tab);
      if (!force && cache && isCacheFresh(cache)) {
        setEntries(cache.entries);
        setIsLoading(false);
        setError(null);
        inFlightRef.current = false;
        return;
      }

      if (cache) {
        setEntries(cache.entries);
      }

      const showRefreshSpinner = cache !== null;
      if (showRefreshSpinner) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const next = await getLeaderboard(tab);
        setEntries(next);
        setError(null);
        await writeCache(tab, next);
      } catch (err) {
        logger.warn("[useLeaderboard] fetch failed:", err);
        setError(LeaderboardError.OFFLINE);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        inFlightRef.current = false;
      }
    },
    [tab],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { entries, isLoading, isRefreshing, error, refresh };
};
