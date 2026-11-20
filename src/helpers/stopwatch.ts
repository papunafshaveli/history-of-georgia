export type Stopwatch = { baseMs: number; runningSince: number | null };

export const startStopwatch = (baseMs: number, now: number): Stopwatch => ({
  baseMs,
  runningSince: now,
});

export const pauseStopwatch = (s: Stopwatch, now: number): Stopwatch =>
  s.runningSince === null
    ? s
    : { baseMs: s.baseMs + (now - s.runningSince), runningSince: null };

export const resumeStopwatch = (s: Stopwatch, now: number): Stopwatch =>
  s.runningSince === null ? { ...s, runningSince: now } : s;

export const elapsedMs = (s: Stopwatch, now: number): number =>
  s.runningSince === null ? s.baseMs : s.baseMs + (now - s.runningSince);

export const formatClock = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const seconds = (total % 60).toString().padStart(2, "0");
  return `${Math.floor(total / 60)}:${seconds}`;
};

export const formatCountdown = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
};
