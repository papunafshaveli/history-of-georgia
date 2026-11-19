import type { DailyStreak } from "@/src/types/daily";
import { addDaysToDate } from "@/src/utils/tbilisiDate";

export const EMPTY_STREAK: DailyStreak = { current: 0, longest: 0, lastDate: null };

export const nextStreak = (
  prev: DailyStreak,
  completedDate: string,
): DailyStreak => {
  if (prev.lastDate === completedDate) return prev;
  const continues = prev.lastDate === addDaysToDate(completedDate, -1);
  const current = continues ? prev.current + 1 : 1;
  return {
    current,
    longest: Math.max(prev.longest, current),
    lastDate: completedDate,
  };
};

// A streak stays visible through the day after the last completion, then drops to 0.
export const visibleStreak = (streak: DailyStreak, today: string): number => {
  if (!streak.lastDate) return 0;
  const alive =
    streak.lastDate === today ||
    streak.lastDate === addDaysToDate(today, -1);
  return alive ? streak.current : 0;
};
