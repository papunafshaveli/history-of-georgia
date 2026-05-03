export type Difficulty = "easy" | "medium" | "hard";

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  randomField: number;
  difficulty: Difficulty;
};

export type GameState = {
  currentQuestion: QuizQuestion | null;
  crowns: number;
  hintsRemaining: number;
  score: number;
  scoreByDifficulty: Record<Difficulty, number>;
  lastScoreChange: number | null;
  scoreChangeKey: number;
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
