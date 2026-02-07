import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavigationProp, useNavigation } from "@react-navigation/native";

import { GameState } from "@/src/types/quizQuestion";
import { RootStackParamList, ScreenName } from "@/src/types";
import {
  INITIAL_STATE,
  CORRECT_ANSWER_DELAY_MS,
  INCORRECT_ANSWER_DELAY_MS,
  GAME_OVER_SUMMARY_DELAY_MS,
} from "@/src/constants";
import { ClickSound, CorrectSound, Crown, IncorrectSound } from "@/src/assets";

import { fetchRandomQuestion, vibrateImpact } from "../helpers";
import { logEvent, AnalyticsEvent } from "../helpers/analytics";
import { saveGameResult } from "../helpers/gameHistory";

import { useSettings } from "./useSettings";
import { usePlaySound } from "./usePlaySound";

const MAX_DUPLICATE_RETRIES = 3;

export const useGameScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const { isMuted, isVibrationOff } = useSettings();
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const seenIdsRef = useRef<Set<number>>(new Set());

  const { playSound } = usePlaySound();

  useEffect(() => {
    if (gameState.crowns === 0) {
      logEvent(AnalyticsEvent.GAME_END, {
        score: gameState.stats.correctAnswers,
        questions_answered: gameState.stats.questionsAnswered,
      });
      saveGameResult({
        score: gameState.stats.correctAnswers,
        questionsAnswered: gameState.stats.questionsAnswered,
        date: new Date().toISOString(),
      });
      const timeout = setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          modals: { ...prev.modals, summary: true },
        }));
      }, GAME_OVER_SUMMARY_DELAY_MS);

      return () => clearTimeout(timeout);
    }
  }, [gameState.crowns]);

  const getNextQuestion = useCallback(async () => {
    setGameState((prev) => ({
      ...prev,
      status: { ...prev.status, isLoading: true, hasError: false },
    }));

    let question = null;
    let retries = 0;

    while (retries < MAX_DUPLICATE_RETRIES) {
      question = await fetchRandomQuestion();

      if (!question) break;

      if (!seenIdsRef.current.has(question.id)) break;

      retries++;
    }

    if (question) {
      seenIdsRef.current.add(question.id);
      setGameState((prev) => ({
        ...prev,
        currentQuestion: question,
        status: { ...prev.status, isLoading: false, hasError: false },
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        status: { ...prev.status, isLoading: false, hasError: true },
      }));
    }
  }, []);

  useEffect(() => {
    logEvent(AnalyticsEvent.GAME_START);
    getNextQuestion();
  }, [getNextQuestion]);

  const handleOptionPress = useCallback(
    (option: string) => {
      if (
        !gameState.currentQuestion ||
        gameState.status.isOptionLocked ||
        gameState.status.isLoading
      )
        return;

      const isCorrect = option === gameState.currentQuestion.correctAnswer;
      logEvent(AnalyticsEvent.QUESTION_ANSWERED, { correct: isCorrect });
      if (!isVibrationOff) vibrateImpact();
      playSound(isCorrect ? CorrectSound : IncorrectSound, isMuted);

      setGameState((prev) => ({
        ...prev,
        crowns: isCorrect ? prev.crowns : prev.crowns - 1,
        stats: {
          questionsAnswered: prev.stats.questionsAnswered + 1,
          correctAnswers: isCorrect
            ? prev.stats.correctAnswers + 1
            : prev.stats.correctAnswers,
        },
        status: { ...prev.status, isOptionLocked: true },
      }));

      const nextQuestionGetTime = isCorrect
        ? CORRECT_ANSWER_DELAY_MS
        : INCORRECT_ANSWER_DELAY_MS;

      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          status: { ...prev.status, isOptionLocked: false, canUseHint: true },
        }));
        getNextQuestion();
      }, nextQuestionGetTime);
    },
    [gameState.currentQuestion, gameState.status, isMuted, isVibrationOff, playSound, getNextQuestion]
  );

  const handleHint = useCallback(() => {
    if (gameState.hintsRemaining > 0) {
      logEvent(AnalyticsEvent.HINT_USED, { remaining: gameState.hintsRemaining - 1 });
      if (!isVibrationOff) {
        vibrateImpact();
      }

      playSound(ClickSound, isMuted);

      setGameState((prev) => ({
        ...prev,
        hintsRemaining: prev.hintsRemaining - 1,
        status: { ...prev.status, canUseHint: false },
        modals: { ...prev.modals, hint: true },
      }));
    }
  }, [gameState.hintsRemaining, isMuted, isVibrationOff, playSound]);

  const handleExit = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      modals: { ...prev.modals, exit: false, summary: false },
    }));

    navigation.navigate("tabs", {
      screen: ScreenName.START_GAME_SCREEN,
    });
  }, [navigation]);

  const handleRestart = useCallback(async () => {
    seenIdsRef.current.clear();
    setGameState(INITIAL_STATE);
    await getNextQuestion();
  }, [getNextQuestion]);

  const handleRetry = useCallback(() => {
    getNextQuestion();
  }, [getNextQuestion]);

  const toggleExitModal = useCallback(() => {
    if (!isVibrationOff) vibrateImpact();
    setGameState((prev) => ({
      ...prev,
      modals: { ...prev.modals, exit: !prev.modals.exit },
    }));
  }, [isVibrationOff]);

  const toggleSettingsModal = useCallback(() => {
    if (!isVibrationOff) vibrateImpact();
    setGameState((prev) => ({
      ...prev,
      modals: { ...prev.modals, settings: !prev.modals.settings },
    }));
  }, [isVibrationOff]);

  const toggleHintModal = useCallback(() => {
    if (!isVibrationOff) vibrateImpact();
    setGameState((prev) => ({
      ...prev,
      modals: { ...prev.modals, hint: !prev.modals.hint },
    }));
  }, [isVibrationOff]);

  const actions = useMemo(
    () => ({
      handleOptionPress,
      handleHint,
      handleExit,
      handleRestart,
      handleRetry,
    }),
    [handleOptionPress, handleHint, handleExit, handleRestart, handleRetry]
  );

  const modalHandlers = useMemo(
    () => ({
      toggleExitModal,
      toggleSettingsModal,
      toggleHintModal,
    }),
    [toggleExitModal, toggleSettingsModal, toggleHintModal]
  );

  const crownsArray = useMemo(
    () => Array(gameState.crowns).fill(Crown),
    [gameState.crowns]
  );

  return {
    gameState: {
      ...gameState,
      crowns: crownsArray,
    },
    actions,
    modalHandlers,
  };
};
