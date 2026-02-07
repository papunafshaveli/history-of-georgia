jest.mock("@/src/helpers/logger", () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { logEvent, AnalyticsEvent } from "@/src/helpers/analytics";
import { logger } from "@/src/helpers/logger";

describe("logEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs event with params in dev mode", () => {
    logEvent(AnalyticsEvent.GAME_START, { category: "quiz" });

    expect(logger.log).toHaveBeenCalledWith(
      "[Analytics] game_start",
      { category: "quiz" }
    );
  });

  it("logs event without params", () => {
    logEvent(AnalyticsEvent.GAME_START);

    expect(logger.log).toHaveBeenCalledWith("[Analytics] game_start", "");
  });

  it("logs different event types", () => {
    logEvent(AnalyticsEvent.HINT_USED, { question_id: 42 });

    expect(logger.log).toHaveBeenCalledWith(
      "[Analytics] hint_used",
      { question_id: 42 }
    );
  });
});
