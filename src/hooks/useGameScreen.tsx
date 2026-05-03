import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { Difficulty, GameState } from "@/src/types/quizQuestion";
import { RootStackParamList, ScreenName } from "@/src/types";
import {
  INITIAL_STATE,
  CORRECT_ANSWER_DELAY_MS,
  INCORRECT_ANSWER_DELAY_MS,
  GAME_OVER_SUMMARY_DELAY_MS,
  pointsFor,
} from "@/src/constants";
import { ClickSound, CorrectSound, Crown, IncorrectSound } from "@/src/assets";

import {
  GameResultRulesError,
  GameResultTransientError,
  saveGameAndUpdateStats,
  type GameEndPayload,
} from "@/src/services/firestore-game-result";
import { recordGame as recordLifetimeGame } from "@/src/services/local-lifetime-stats";
import { addLocalRecentGame } from "@/src/services/local-recent-games";
import { enqueuePendingResult } from "@/src/services/pending-results";
import { invalidateLeaderboardCache } from "@/src/hooks/useLeaderboard";
import { invalidateUserStatsCache } from "@/src/hooks/useUserStats";
import { uuid } from "@/src/utils/uuid";

import { fetchRandomQuestion, vibrateImpact } from "../helpers";
import { logEvent, AnalyticsEvent } from "../helpers/analytics";
import { logger } from "../helpers/logger";

import { useAuth } from "./useAuth";
import { useSettings } from "./useSettings";
import { usePlaySound } from "./usePlaySound";

const MAX_DUPLICATE_RETRIES = 3;

export const useGameScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "game-screen">>();
  const difficulty: Difficulty | undefined = route.params?.difficulty;

  const { isMuted, isVibrationOff } = useSettings();
  const { uid } = useAuth();
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const gameResultPersistedRef = useRef(false);

  const { playSound } = usePlaySound();

  useEffect(() => {
    if (gameState.crowns !== 0) return;
    if (gameResultPersistedRef.current) return;
    gameResultPersistedRef.current = true;

    const payload: GameEndPayload = {
      score: gameState.score,
      correctCount: gameState.stats.correctAnswers,
      totalQuestions: gameState.stats.questionsAnswered,
      selectedDifficulty: difficulty ?? null,
      scoreByDifficulty: gameState.scoreByDifficulty,
    };

    logEvent(AnalyticsEvent.GAME_END, {
      score: payload.score,
      questions_answered: payload.totalQuestions,
    });

    const persist = async () => {
      const resultId = uuid();
      const createdAtMs = Date.now();

      // Save to local storage immediately so the user sees the game in
      // "ბოლო თამაშები" the next time they open the leaderboard tab —
      // independent of network, auth, or Firestore success.
      await addLocalRecentGame({
        resultId,
        score: payload.score,
        correctCount: payload.correctCount,
        totalQuestions: payload.totalQuestions,
        selectedDifficulty: payload.selectedDifficulty,
        createdAtMs,
      });

      // Local lifetime-stats accumulator powers the Stats screen. Fires
      // once per game-end (regardless of Firestore success) so sign-out
      // doesn't appear to wipe the user's stats.
      try {
        await recordLifetimeGame({
          score: payload.score,
          correctCount: payload.correctCount,
          totalQuestions: payload.totalQuestions,
        });
      } catch (err) {
        logger.warn("[useGameScreen] recordLifetimeGame failed:", err);
      }

      if (!uid) {
        // No authenticated user yet — extremely rare, but reachable when
        // the boot-time anonymous sign-in fails (e.g. offline first
        // launch). Queue the result with `uid: null`; replay attributes
        // null to the current uid (there's no other uid that could own
        // it, by definition). This keeps the user's game data safe
        // through transient auth bootstrap failures without blocking
        // gameplay.
        await enqueuePendingResult({
          resultId,
          payload,
          gameEndedAt: new Date(createdAtMs).toISOString(),
          uid: null,
        });
        return;
      }
      try {
        await saveGameAndUpdateStats(uid, resultId, payload);
        await Promise.all([
          invalidateUserStatsCache(uid),
          invalidateLeaderboardCache(),
        ]);
      } catch (error) {
        if (error instanceof GameResultTransientError) {
          await enqueuePendingResult({
            resultId,
            payload,
            gameEndedAt: new Date(createdAtMs).toISOString(),
            uid,
          });
          return;
        }
        if (error instanceof GameResultRulesError) {
          logEvent(AnalyticsEvent.GAME_END, {
            dropped: "rules_violation",
          });
          return;
        }
        logger.warn("[useGameScreen] saveGameAndUpdateStats failed:", error);
      }
    };

    persist();

    const timeout = setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        modals: { ...prev.modals, summary: true },
      }));
    }, GAME_OVER_SUMMARY_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [gameState.crowns]);

  const getNextQuestion = useCallback(async () => {
    setGameState((prev) => ({
      ...prev,
      status: { ...prev.status, isLoading: true, hasError: false },
    }));

    let question = null;
    let retries = 0;

    while (retries < MAX_DUPLICATE_RETRIES) {
      question = await fetchRandomQuestion(difficulty);

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
  }, [difficulty]);

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
      const questionDifficulty = gameState.currentQuestion.difficulty;
      const earnedPoints =
        isCorrect && questionDifficulty ? pointsFor(questionDifficulty) : 0;

      logEvent(AnalyticsEvent.QUESTION_ANSWERED, { correct: isCorrect });
      if (!isVibrationOff) vibrateImpact();
      playSound(isCorrect ? CorrectSound : IncorrectSound, isMuted);

      setGameState((prev) => {
        const nextScoreByDifficulty = { ...prev.scoreByDifficulty };
        if (earnedPoints > 0 && questionDifficulty) {
          nextScoreByDifficulty[questionDifficulty] += earnedPoints;
        }
        const didEarn = earnedPoints > 0;
        return {
          ...prev,
          crowns: isCorrect ? prev.crowns : prev.crowns - 1,
          score: prev.score + earnedPoints,
          scoreByDifficulty: nextScoreByDifficulty,
          lastScoreChange: didEarn ? earnedPoints : prev.lastScoreChange,
          scoreChangeKey: didEarn
            ? prev.scoreChangeKey + 1
            : prev.scoreChangeKey,
          stats: {
            questionsAnswered: prev.stats.questionsAnswered + 1,
            correctAnswers: isCorrect
              ? prev.stats.correctAnswers + 1
              : prev.stats.correctAnswers,
          },
          status: { ...prev.status, isOptionLocked: true },
        };
      });

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
    [gameState, isMuted, isVibrationOff, playSound, getNextQuestion],
  );

  const handleHint = useCallback(() => {
    if (gameState.hintsRemaining > 0) {
      logEvent(AnalyticsEvent.HINT_USED, {
        remaining: gameState.hintsRemaining - 1,
      });
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

    navigation.reset({
      index: 0,
      routes: [
        {
          name: "tabs",
          params: { screen: ScreenName.START_GAME_SCREEN },
        },
      ],
    });
  }, [navigation]);

  const handleRestart = useCallback(async () => {
    seenIdsRef.current.clear();
    gameResultPersistedRef.current = false;
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

  const closeSummaryModal = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      modals: { ...prev.modals, summary: false },
    }));
  }, []);

  const actions = useMemo(
    () => ({
      handleOptionPress,
      handleHint,
      handleExit,
      handleRestart,
      handleRetry,
    }),
    [handleOptionPress, handleHint, handleExit, handleRestart, handleRetry],
  );

  const modalHandlers = useMemo(
    () => ({
      toggleExitModal,
      toggleSettingsModal,
      toggleHintModal,
      closeSummaryModal,
    }),
    [
      toggleExitModal,
      toggleSettingsModal,
      toggleHintModal,
      closeSummaryModal,
    ],
  );

  const crownsArray = useMemo(
    () => Array(gameState.crowns).fill(Crown),
    [gameState.crowns],
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
