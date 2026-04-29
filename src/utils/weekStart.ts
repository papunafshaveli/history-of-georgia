const TBILISI_OFFSET_HOURS = 4;

const pad = (n: number) => n.toString().padStart(2, "0");

export const mondayTbilisi = (now: Date = new Date()): string => {
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const tbilisi = new Date(utcMs + TBILISI_OFFSET_HOURS * 3_600_000);

  const day = tbilisi.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  tbilisi.setUTCDate(tbilisi.getUTCDate() - daysSinceMonday);

  const year = tbilisi.getUTCFullYear();
  const month = pad(tbilisi.getUTCMonth() + 1);
  const date = pad(tbilisi.getUTCDate());
  return `${year}-${month}-${date}`;
};
