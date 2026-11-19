import { EMPTY_STREAK, nextStreak, visibleStreak } from "@/src/helpers/dailyStreak";

describe("nextStreak", () => {
  it("starts at 1", () => {
    expect(nextStreak(EMPTY_STREAK, "2026-11-18")).toEqual({
      current: 1,
      longest: 1,
      lastDate: "2026-11-18",
    });
  });

  it("grows on the next day", () => {
    expect(
      nextStreak({ current: 4, longest: 6, lastDate: "2026-11-17" }, "2026-11-18"),
    ).toEqual({ current: 5, longest: 6, lastDate: "2026-11-18" });
  });

  it("grows across a month end", () => {
    expect(
      nextStreak({ current: 2, longest: 2, lastDate: "2026-11-30" }, "2026-12-01"),
    ).toEqual({ current: 3, longest: 3, lastDate: "2026-12-01" });
  });

  it("resets after a missed day", () => {
    expect(
      nextStreak({ current: 9, longest: 9, lastDate: "2026-11-15" }, "2026-11-18"),
    ).toEqual({ current: 1, longest: 9, lastDate: "2026-11-18" });
  });

  it("is unchanged when the same day is completed twice", () => {
    const s = { current: 3, longest: 3, lastDate: "2026-11-18" };
    expect(nextStreak(s, "2026-11-18")).toBe(s);
  });
});

describe("visibleStreak", () => {
  it("shows 0 before any daily", () => {
    expect(visibleStreak(EMPTY_STREAK, "2026-11-18")).toBe(0);
  });

  it("keeps yesterday's streak alive until today ends", () => {
    expect(
      visibleStreak({ current: 5, longest: 5, lastDate: "2026-11-17" }, "2026-11-18"),
    ).toBe(5);
  });

  it("shows 0 once a day was missed", () => {
    expect(
      visibleStreak({ current: 5, longest: 5, lastDate: "2026-11-15" }, "2026-11-18"),
    ).toBe(0);
  });
});
