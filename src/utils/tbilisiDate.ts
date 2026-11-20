// Tbilisi is UTC+4 all year (no DST), so shifting the instant is exact.
const TBILISI_OFFSET_MS = 4 * 3_600_000;
const DAY_MS = 86_400_000;

const pad = (n: number) => n.toString().padStart(2, "0");

const formatUtc = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export const todayTbilisi = (now: Date = new Date()): string =>
  formatUtc(new Date(now.getTime() + TBILISI_OFFSET_MS));

export const addDaysToDate = (date: string, days: number): string =>
  formatUtc(new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS));

export const msUntilNextTbilisiMidnight = (now: Date = new Date()): number => {
  const shifted = now.getTime() + TBILISI_OFFSET_MS;
  return DAY_MS - (shifted % DAY_MS);
};
