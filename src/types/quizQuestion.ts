export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  randomField: number;
};

export type GameState = {
  currentQuestion: QuizQuestion | null;
  crowns: number;
  hintsRemaining: number;
  stats: {
    questionsAnswered: number;
    correctAnswers: number;
  };
  status: {
    isLoading: boolean;
    isOptionLocked: boolean;
    canUseHint: boolean;
    hasError: boolean;
  };
  modals: {
    exit: boolean;
    settings: boolean;
    hint: boolean;
    summary: boolean;
  };
};
