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

const DAY_MS = 86_400_000;
const daysFrom = (from: string, to: string): number =>
  Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

// Joins the server's streak to the phone's by date: the phone's run extends the server's when they
// touch or overlap. A newer server streak (another phone) replaces the phone's, like on the server.
export const mergeStreaks = (local: DailyStreak, cloud: DailyStreak): DailyStreak => {
  const longest = Math.max(local.longest, cloud.longest, cloud.current);
  if (!cloud.lastDate) return local;
  if (!local.lastDate || cloud.lastDate > local.lastDate) {
    return { ...cloud, longest: Math.max(longest, local.current) };
  }
  const touches = daysFrom(cloud.lastDate, local.lastDate) <= local.current;
  const current = touches
    ? Math.max(local.current, cloud.current + daysFrom(cloud.lastDate, local.lastDate))
    : local.current;
  return { current, longest: Math.max(longest, current), lastDate: local.lastDate };
};
