import { buildDailyShare } from "@/src/helpers/dailyShare";

it("fills the template with score, time, marks and streak only", () => {
  const text = buildDailyShare("{date}: {n}/10 · {time} {marks} · {streak} {link}", {
    date: "2026-11-18",
    answers: [true, false, true],
    elapsedMs: 108_000,
    streak: 13,
    link: "https://example/app",
  });
  expect(text).toBe("18.11: 2/10 · 1:48 ✅❌✅ · 13 https://example/app");
});
