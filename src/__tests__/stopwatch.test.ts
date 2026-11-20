import {
  elapsedMs,
  formatClock,
  formatCountdown,
  pauseStopwatch,
  resumeStopwatch,
  startStopwatch,
} from "@/src/helpers/stopwatch";

describe("stopwatch", () => {
  it("counts only running time", () => {
    let s = startStopwatch(0, 1_000);
    expect(elapsedMs(s, 4_000)).toBe(3_000);
    s = pauseStopwatch(s, 4_000); // answer tapped
    expect(elapsedMs(s, 6_000)).toBe(3_000); // feedback delay not counted
    s = resumeStopwatch(s, 6_000); // next question shown
    expect(elapsedMs(s, 8_500)).toBe(5_500);
  });

  it("resumes from a saved total", () => {
    expect(elapsedMs(startStopwatch(42_000, 0), 1_000)).toBe(43_000);
  });

  it("ignores a double pause and a double resume", () => {
    let s = startStopwatch(0, 0);
    s = pauseStopwatch(pauseStopwatch(s, 1_000), 2_000);
    s = resumeStopwatch(resumeStopwatch(s, 3_000), 4_000);
    expect(elapsedMs(s, 5_000)).toBe(3_000);
  });

  it("formats m:ss", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(47_900)).toBe("0:47");
    expect(formatClock(108_000)).toBe("1:48");
    expect(formatClock(600_000)).toBe("10:00");
  });

  it("formats the countdown as hh:mm:ss", () => {
    expect(formatCountdown(20_530_000)).toBe("05:42:10");
    expect(formatCountdown(-5)).toBe("00:00:00");
  });
});
