import { GameState } from "@/src/types/quizQuestion";
import { HINT_LIMIT } from "./hint";

export const INITIAL_STATE: GameState = {
  currentQuestion: null,
  crowns: 5,
  hintsRemaining: HINT_LIMIT,
  stats: {
    questionsAnswered: 0,
    correctAnswers: 0,
  },
  status: {
    isLoading: false,
    isOptionLocked: false,
    canUseHint: true,
    hasError: false,
  },
  modals: {
    exit: false,
    settings: false,
    hint: false,
    summary: false,
  },
};
