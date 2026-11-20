import { addDaysToDate, todayTbilisi } from "./tbilisiDate";

// Monday of the current Tbilisi week (YYYY-MM-DD), independent of the phone's time zone.
export const mondayTbilisi = (now: Date = new Date()): string => {
  const today = todayTbilisi(now);
  const daysSinceMonday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDaysToDate(today, -daysSinceMonday);
};
