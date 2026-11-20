import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavigationProp, useNavigation } from "@react-navigation/native";

import { CorrectSound, IncorrectSound } from "@/src/assets";
import {
  CORRECT_ANSWER_DELAY_MS,
  INCORRECT_ANSWER_DELAY_MS,
} from "@/src/constants/timing";
import { DAILY_QUESTION_COUNT } from "@/src/constants/daily";
import { logger } from "@/src/helpers/logger";
import { vibrateImpact } from "@/src/helpers/vibration";
import { loadDailySet } from "@/src/services/daily-challenge";
import {
  finishDaily,
  markQuestionShown,
  readRecord,
  resumeElapsed,
  saveAnswer,
  startDaily,
} from "@/src/services/local-daily-progress";
import {
  DailyStatus,
  ScreenName,
  SwordState,
  type DailyAnswer,
  type DailyRecord,
  type DailySet,
  type RootStackParamList,
} from "@/src/types";

import { usePlaySound } from "./usePlaySound";
import { useSettings } from "./useSettings";
import { useStopwatch } from "./useStopwatch";

type DailyNavigation = NavigationProp<RootStackParamList>;

export type DailyLoadState =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | {
      kind: "ready";
      date: string;
      set: DailySet;
      record: DailyRecord;
      startMs: number;
    };

const goToResult = (navigation: DailyNavigation, date: string) =>
  navigation.reset({
    index: 1,
    routes: [
      { name: "tabs" },
      { name: ScreenName.DAILY_RESULT_SCREEN, params: { date } },
    ],
  });

// Loads the attempt before the run mounts, so the stopwatch starts from the saved time.
export const useDailyLoad = (date: string): DailyLoadState => {
  const navigation = useNavigation<DailyNavigation>();
  const [state, setState] = useState<DailyLoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    // The screen can be reused for another day (reminder tap after midnight): load it from scratch.
    setState({ kind: "loading" });
    (async () => {
      try {
        const existing = await readRecord(date);
        const allAnswered =
          (existing?.answers.length ?? 0) >= DAILY_QUESTION_COUNT;
        // Killed after the 10th answer but before finishing: finish now, not an empty 11th question.
        if (existing && allAnswered)
          await finishDaily(date, existing.elapsedMs);
        if (existing?.status === DailyStatus.DONE || allAnswered) {
          if (!cancelled) goToResult(navigation, date);
          return;
        }
        // A started attempt keeps its exact questions even if the day was overridden since.
        const started =
          !!existing &&
          (existing.answers.length > 0 || existing.questionShownAt !== null);
        const set = await loadDailySet(date, { preferCache: started });
        if (cancelled) return;
        if (!set) {
          setState({ kind: "unavailable" });
          return;
        }
        // The attempt only counts once its questions are actually here.
        const record = await startDaily(date);
        if (cancelled) return;
        setState({
          kind: "ready",
          date,
          set,
          record,
          startMs: resumeElapsed(record, Date.now()),
        });
      } catch (error) {
        logger.warn("useDailyLoad failed", error);
        if (!cancelled) setState({ kind: "unavailable" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date, navigation]);

  // Until the effect resets it, a date change would otherwise render the previous day's run.
  return state.kind === "ready" && state.date !== date ? { kind: "loading" } : state;
};

export const useDailyRun = (
  date: string,
  set: DailySet,
  record: DailyRecord,
  startMs: number,
) => {
  const navigation = useNavigation<DailyNavigation>();
  const { isMuted, isVibrationOff } = useSettings();
  const { playSound } = usePlaySound();
  const { displayMs, pauseClock, resumeClock, readMs } = useStopwatch(startMs);
  const [answers, setAnswers] = useState<DailyAnswer[]>(record.answers);
  const [locked, setLocked] = useState(false);
  // Shown on the swords during the answer feedback, before the next question appears.
  const [pending, setPending] = useState<DailyAnswer | null>(null);
  const [failedSave, setFailedSave] = useState<{
    answer: DailyAnswer;
    ms: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mountedRef = useRef(false);
  const savingRef = useRef(false);
  const questionWriteRef = useRef<Promise<void>>(Promise.resolve());
  // State updates lag a fast double tap; the ref blocks a second answer at once.
  const answeringRef = useRef(false);

  const index = answers.length;
  const total = set.questions.length;
  const question = set.questions[index];

  // Persist when this question appeared, so leaving or a crash keeps counting its time.
  useEffect(() => {
    if (!locked) {
      questionWriteRef.current = markQuestionShown(
        date,
        readMs(),
        Date.now(),
      ).catch((error) => {
        logger.warn("Could not save when the daily question opened", error);
      });
    }
  }, [date, index, locked, readMs]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const persistSelection = useCallback(
    async (answer: DailyAnswer, ms: number) => {
      if (savingRef.current) return;
      savingRef.current = true;
      setFailedSave(null);
      const isLast = index + 1 === total;
      try {
        await questionWriteRef.current;
        await saveAnswer(date, answer, ms);
        if (isLast) await finishDaily(date, ms);
      } catch (error) {
        logger.warn("Could not save a daily answer", error);
        savingRef.current = false;
        if (mountedRef.current) setFailedSave({ answer, ms });
        return;
      }

      if (!mountedRef.current) return;
      const delay = answer.isCorrect
        ? CORRECT_ANSWER_DELAY_MS
        : INCORRECT_ANSWER_DELAY_MS;
      timerRef.current = setTimeout(() => {
        if (isLast) {
          goToResult(navigation, date);
          return;
        }
        setAnswers((prev) => [...prev, answer]);
        setPending(null);
        resumeClock();
        setLocked(false);
        answeringRef.current = false;
        savingRef.current = false;
      }, delay);
    },
    [date, index, navigation, resumeClock, total],
  );

  const retrySave = useCallback(() => {
    if (failedSave) void persistSelection(failedSave.answer, failedSave.ms);
  }, [failedSave, persistSelection]);

  const handleOptionPress = useCallback(
    (option: string) => {
      if (!question || locked || answeringRef.current) return;
      answeringRef.current = true;
      pauseClock();
      setLocked(true);
      const ms = readMs();
      const isCorrect = option === question.correctAnswer;
      const answer: DailyAnswer = { ticketId: set.ticketIds[index], isCorrect, option };

      setPending(answer);
      if (!isVibrationOff) vibrateImpact();
      playSound(isCorrect ? CorrectSound : IncorrectSound, isMuted);
      void persistSelection(answer, ms);
    },
    [
      question,
      locked,
      pauseClock,
      readMs,
      set.ticketIds,
      index,
      isVibrationOff,
      playSound,
      isMuted,
      persistSelection,
    ],
  );

  const swordStates = useMemo(() => {
    const shown = pending ? [...answers, pending] : answers;
    return Array.from({ length: total }, (_, i) => {
      if (i < shown.length) {
        return shown[i].isCorrect ? SwordState.WHOLE : SwordState.BROKEN;
      }
      return i === shown.length ? SwordState.CURRENT : SwordState.UPCOMING;
    });
  }, [answers, pending, total]);

  return {
    question,
    index,
    total,
    displayMs,
    swordStates,
    locked,
    hasSaveError: failedSave !== null,
    retrySave,
    handleOptionPress,
  };
};
