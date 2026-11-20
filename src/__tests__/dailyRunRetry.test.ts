jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
}));
jest.mock("@/src/assets", () => ({ CorrectSound: 1, IncorrectSound: 2 }));
jest.mock("@/src/helpers/logger", () => ({ logger: { warn: jest.fn() } }));
jest.mock("@/src/helpers/vibration", () => ({ vibrateImpact: jest.fn() }));
jest.mock("@/src/services/daily-challenge", () => ({ loadDailySet: jest.fn() }));
jest.mock("@/src/services/local-daily-progress", () => ({
  markQuestionShown: () => Promise.resolve(),
  saveAnswer: (...args: unknown[]) => mockSave(...args),
}));
jest.mock("@/src/hooks/useSettings", () => ({
  useSettings: () => ({ isMuted: true, isVibrationOff: true }),
}));
jest.mock("@/src/hooks/usePlaySound", () => ({
  usePlaySound: () => ({ playSound: jest.fn() }),
}));

import React from "react";
import { CORRECT_ANSWER_DELAY_MS } from "@/src/constants/timing";
import { useDailyRun } from "@/src/hooks/useDailyGame";
import { DailyStatus, type DailyRecord, type DailySet } from "@/src/types";

const renderer = jest.requireActual<{
  create: (element: React.ReactElement) => { unmount: () => void };
}>("react-test-renderer");
const { act } = React;
const mockNavigation = { reset: jest.fn() };
const mockSave = jest.fn();
const date = "2026-11-18";
const set: DailySet = {
  date,
  ticketIds: ["a", "b"],
  questions: [1, 2].map((id) => ({
    id,
    question: "Question",
    options: ["yes", "no"],
    correctAnswer: "yes",
    hint: "",
    randomField: 0,
    difficulty: "easy",
  })),
};
const record: DailyRecord = {
  date,
  status: DailyStatus.IN_PROGRESS,
  elapsedMs: 0,
  answers: [],
  questionShownAt: null,
  syncedUid: null,
};

it("retries the same failed selection and resumes at the next question", async () => {
  jest.useFakeTimers();
  mockSave.mockRejectedValueOnce(new Error("storage")).mockResolvedValueOnce(undefined);
  let latest!: ReturnType<typeof useDailyRun>;
  let tree!: ReturnType<typeof renderer.create>;
  const Harness = () => {
    latest = useDailyRun(date, set, record, 0);
    return null;
  };
  try {
    await act(async () => { tree = renderer.create(React.createElement(Harness)); });
    await act(async () => latest.handleOptionPress("yes"));
    expect(latest.hasSaveError).toBe(true);
    expect(latest.index).toBe(0);
    expect(latest.locked).toBe(true);

    await act(async () => latest.retrySave());
    expect(mockSave).toHaveBeenCalledTimes(2);
    expect(mockSave.mock.calls[1]).toEqual(mockSave.mock.calls[0]);
    expect(latest.hasSaveError).toBe(false);

    await act(async () => { jest.advanceTimersByTime(CORRECT_ANSWER_DELAY_MS); });
    expect(latest.index).toBe(1);
    expect(latest.locked).toBe(false);
  } finally {
    await act(async () => tree?.unmount());
    jest.useRealTimers();
  }
});
