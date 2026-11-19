import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { visibleStreak } from "@/src/helpers/dailyStreak";
import {
  loadDailySet,
  prefetchTomorrow,
  pruneOldDailySets,
} from "@/src/services/daily-challenge";
import { DAILY_QUESTION_COUNT } from "@/src/constants/daily";
import { syncDailyResults } from "@/src/services/firestore-daily";
import {
  correctCount,
  finishDaily,
  pruneOldRecords,
  readRecord,
  readStreak,
} from "@/src/services/local-daily-progress";
import { DailyCardKind, DailyStatus } from "@/src/types";
import {
  msUntilNextTbilisiMidnight,
  todayTbilisi,
} from "@/src/utils/tbilisiDate";

import { useAuth } from "./useAuth";

const COUNTDOWN_TICK_MS = 1000;
// Lands safely past midnight so todayTbilisi() has already moved on.
const ROLLOVER_MARGIN_MS = 1000;

export type DailyCardState = {
  kind: DailyCardKind;
  date: string;
  streak: number;
  correct: number;
  elapsedMs: number;
};

const INITIAL: DailyCardState = {
  kind: DailyCardKind.UNAVAILABLE,
  date: todayTbilisi(),
  streak: 0,
  correct: 0,
  elapsedMs: 0,
};

export const useDailyChallenge = () => {
  const { uid } = useAuth();
  const [state, setState] = useState<DailyCardState>(INITIAL);
  const [msToNext, setMsToNext] = useState(msUntilNextTbilisiMidnight());

  const runningRef = useRef(false);
  const rerunRef = useRef(false);
  // Bumped after every refresh so the midnight timer re-arms even when a refresh failed.
  const [refreshCount, setRefreshCount] = useState(0);

  const load = useCallback(async () => {
    const today = todayTbilisi();
    let [record, streak] = await Promise.all([readRecord(today), readStreak()]);
    // Killed after the 10th answer but before finishing.
    if (
      record &&
      record.status !== DailyStatus.DONE &&
      record.answers.length >= DAILY_QUESTION_COUNT
    ) {
      record = await finishDaily(today, record.elapsedMs);
      streak = await readStreak();
    }
    const isDone = record?.status === DailyStatus.DONE;
    // An attempt in progress already has its questions cached; otherwise today's set must exist.
    const set = record ? true : await loadDailySet(today);

    let kind = DailyCardKind.UNAVAILABLE;
    if (isDone) kind = DailyCardKind.DONE;
    else if (record) kind = DailyCardKind.IN_PROGRESS;
    else if (set) kind = DailyCardKind.NOT_PLAYED;

    setState({
      kind,
      date: today,
      streak: visibleStreak(streak, today),
      correct: record ? correctCount(record) : 0,
      elapsedMs: record?.elapsedMs ?? 0,
    });
    setMsToNext(msUntilNextTbilisiMidnight());

    prefetchTomorrow(today);
    pruneOldDailySets(today);
    pruneOldRecords(today);
    if (uid) syncDailyResults(uid);
  }, [uid]);

  // One refresh at a time; a request made meanwhile runs once more afterwards.
  const refresh = useCallback(async () => {
    if (runningRef.current) {
      rerunRef.current = true;
      return;
    }
    runningRef.current = true;
    try {
      do {
        rerunRef.current = false;
        await load();
      } while (rerunRef.current);
    } catch {
      // Storage or network trouble: keep the last card state.
    } finally {
      runningRef.current = false;
      setRefreshCount((n) => n + 1);
    }
  }, [load]);

  // Focus alone misses a phone left on the home screen overnight, so app resume refreshes too.
  useFocusEffect(
    useCallback(() => {
      refresh();
      const sub = AppState.addEventListener("change", (next) => {
        if (next === "active") refresh();
      });
      return () => sub.remove();
    }, [refresh]),
  );

  // Rolls the card over at midnight while the app stays open.
  useEffect(() => {
    const id = setTimeout(
      refresh,
      msUntilNextTbilisiMidnight() + ROLLOVER_MARGIN_MS,
    );
    return () => clearTimeout(id);
  }, [state.date, refreshCount, refresh]);

  // The countdown only shows on the "done" card.
  useEffect(() => {
    if (state.kind !== DailyCardKind.DONE) return undefined;
    const id = setInterval(
      () => setMsToNext(msUntilNextTbilisiMidnight()),
      COUNTDOWN_TICK_MS,
    );
    return () => clearInterval(id);
  }, [state.kind]);

  return { ...state, msToNext };
};
