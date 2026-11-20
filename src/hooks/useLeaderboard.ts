import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { logger } from "@/src/helpers/logger";
import { getLeaderboard } from "@/src/services/firestore-leaderboard";
import { LeaderboardTab, type LeaderboardEntry } from "@/src/types";
import { msUntilNextTbilisiMidnight, todayTbilisi } from "@/src/utils/tbilisiDate";

const CACHE_KEY_PREFIX = "leaderboard:cache:";
const CACHE_TTL_MS = 30 * 60 * 1000;
// Today's board changes all day long.
const TODAY_CACHE_TTL_MS = 2 * 60 * 1000;

type CacheEnvelope = {
  fetchedAt: number;
  entries: LeaderboardEntry[];
  date?: string;
};

export enum LeaderboardError {
  OFFLINE = "offline",
  UNKNOWN = "unknown",
}

const cacheKeyFor = (tab: LeaderboardTab) => `${CACHE_KEY_PREFIX}${tab}`;

const readCache = async (
  tab: LeaderboardTab,
  date?: string,
): Promise<CacheEnvelope | null> => {
  try {
    const raw = await AsyncStorage.getItem(cacheKeyFor(tab));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope;
    if (typeof parsed.fetchedAt !== "number") return null;
    if (tab === LeaderboardTab.TODAY && parsed.date !== date) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = async (
  tab: LeaderboardTab,
  entries: LeaderboardEntry[],
  date?: string,
): Promise<void> => {
  if (tab === LeaderboardTab.TODAY && date !== todayTbilisi()) return;
  const envelope: CacheEnvelope = { fetchedAt: Date.now(), entries, date };
  try {
    await AsyncStorage.setItem(cacheKeyFor(tab), JSON.stringify(envelope));
  } catch {
    // best-effort cache; ignore write failures
  }
};

// Lets a screen that already fetched a board hand it to the leaderboard instead of a refetch.
export const primeLeaderboardCache = writeCache;

export const invalidateLeaderboardCache = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    cacheKeyFor(LeaderboardTab.TODAY),
    cacheKeyFor(LeaderboardTab.WEEKLY),
    cacheKeyFor(LeaderboardTab.ALLTIME),
  ]);
};

const isCacheFresh = (cache: CacheEnvelope, tab: LeaderboardTab) =>
  Date.now() - cache.fetchedAt <
  (tab === LeaderboardTab.TODAY ? TODAY_CACHE_TTL_MS : CACHE_TTL_MS);

type UseLeaderboardOptions = {
  tab: LeaderboardTab;
};

type UseLeaderboardReturn = {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: LeaderboardError | null;
  refresh: () => Promise<void>;
  // Uses the cache while it is fresh.
  reload: () => Promise<void>;
};

export const useLeaderboard = ({
  tab,
}: UseLeaderboardOptions): UseLeaderboardReturn => {
  const [today, setToday] = useState(todayTbilisi);
  const date = tab === LeaderboardTab.TODAY ? today : undefined;
  const key = date ? `${tab}:${date}` : tab;
  const [board, setBoard] = useState<{
    key: string;
    entries: LeaderboardEntry[];
    isRefreshing: boolean;
    error: LeaderboardError | null;
  }>();
  const inFlight = useRef(new Set<string>());
  const currentKey = useRef(key);
  currentKey.current = key;

  useEffect(() => {
    if (tab !== LeaderboardTab.TODAY) return;
    let timer: ReturnType<typeof setTimeout>;
    const updateDate = () => {
      clearTimeout(timer);
      setToday(todayTbilisi());
      timer = setTimeout(updateDate, msUntilNextTbilisiMidnight() + 100);
    };
    updateDate();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") updateDate();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [tab]);

  const load = useCallback(
    async (force: boolean) => {
      if (date && date !== todayTbilisi()) {
        setToday(todayTbilisi());
        return;
      }
      if (inFlight.current.has(key)) return;
      inFlight.current.add(key);
      const isCurrent = () =>
        currentKey.current === key && (!date || date === todayTbilisi());

      try {
        const cache = await readCache(tab, date);
        if (!isCurrent()) return;
        if (!force && cache && isCacheFresh(cache, tab)) {
          setBoard({ key, entries: cache.entries, isRefreshing: false, error: null });
          return;
        }

        if (cache) {
          setBoard({ key, entries: cache.entries, isRefreshing: true, error: null });
        } else {
          setBoard(undefined);
        }

        try {
          const entries = await getLeaderboard(tab, date);
          await writeCache(tab, entries, date);
          if (isCurrent()) setBoard({ key, entries, isRefreshing: false, error: null });
        } catch (err) {
          logger.warn("[useLeaderboard] fetch failed:", err);
          if (isCurrent()) {
            setBoard({
              key,
              entries: cache?.entries ?? [],
              isRefreshing: false,
              error: LeaderboardError.OFFLINE,
            });
          }
        }
      } finally {
        inFlight.current.delete(key);
      }
    },
    [date, key, tab],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);
  const reload = useCallback(() => load(false), [load]);

  const visible = board?.key === key && (!date || date === todayTbilisi())
    ? board
    : undefined;
  return {
    entries: visible?.entries ?? [],
    isLoading: !visible,
    isRefreshing: visible?.isRefreshing ?? false,
    error: visible?.error ?? null,
    refresh,
    reload,
  };
};
