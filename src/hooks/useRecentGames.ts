import { useCallback, useEffect, useState } from "react";

import {
  getLocalRecentGames,
  type LocalRecentGame,
} from "@/src/services/local-recent-games";

export type RecentGameLite = LocalRecentGame;

type UseRecentGamesReturn = {
  games: RecentGameLite[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

export const useRecentGames = (): UseRecentGamesReturn => {
  const [games, setGames] = useState<RecentGameLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const stored = await getLocalRecentGames();
    setGames(stored);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { games, isLoading, refresh: load };
};
