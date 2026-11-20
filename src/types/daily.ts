import type { QuizQuestion } from "./quizQuestion";

export type DailyChallenge = {
  date: string;
  ticketIds: string[];
};

export type DailySet = DailyChallenge & {
  questions: QuizQuestion[];
};

export type DailyAnswer = {
  ticketId: string;
  isCorrect: boolean;
  // Records from earlier builds only stored local answer feedback.
  option?: string;
};

export enum DailyStatus {
  IN_PROGRESS = "in_progress",
  DONE = "done",
}

export type DailyRecord = {
  date: string;
  status: DailyStatus;
  answers: DailyAnswer[];
  elapsedMs: number;
  // When the open question appeared; killing the app must not erase that running time.
  questionShownAt: number | null;
  // The last account this result was processed for.
  syncedUid: string | null;
};

export type DailyStreak = {
  current: number;
  longest: number;
  lastDate: string | null;
};

export enum DailyCardKind {
  UNAVAILABLE = "unavailable",
  NOT_PLAYED = "not_played",
  IN_PROGRESS = "in_progress",
  DONE = "done",
}

export enum SwordState {
  WHOLE = "whole",
  BROKEN = "broken",
  CURRENT = "current",
  UPCOMING = "upcoming",
}
