import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import {
  type LifetimeStats,
  getLifetimeStats,
} from "@/src/services/local-lifetime-stats";

const ZERO_STATS: LifetimeStats = {
  totalGames: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  totalPoints: 0,
  bestSingleGameScore: 0,
  updatedAt: 0,
};

export const useLifetimeStats = () => {
  const [stats, setStats] = useState<LifetimeStats>(ZERO_STATS);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await getLifetimeStats();
      setStats(next);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { stats, isLoading, refresh };
};
