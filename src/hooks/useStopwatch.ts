import { useCallback, useEffect, useRef, useState } from "react";

import {
  elapsedMs,
  pauseStopwatch,
  resumeStopwatch,
  startStopwatch,
  type Stopwatch,
} from "@/src/helpers/stopwatch";

const TICK_MS = 250;

// The starting total is read once: mount this only after the saved attempt has loaded.
export const useStopwatch = (initialMs: number) => {
  const ref = useRef<Stopwatch>(startStopwatch(initialMs, Date.now()));
  const [displayMs, setDisplayMs] = useState(initialMs);

  useEffect(() => {
    const id = setInterval(
      () => setDisplayMs(elapsedMs(ref.current, Date.now())),
      TICK_MS,
    );
    return () => clearInterval(id);
  }, []);

  const pauseClock = useCallback(() => {
    ref.current = pauseStopwatch(ref.current, Date.now());
    setDisplayMs(ref.current.baseMs);
  }, []);

  const resumeClock = useCallback(() => {
    ref.current = resumeStopwatch(ref.current, Date.now());
  }, []);

  const readMs = useCallback(() => elapsedMs(ref.current, Date.now()), []);

  return { displayMs, pauseClock, resumeClock, readMs };
};
