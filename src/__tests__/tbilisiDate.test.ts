import {
  addDaysToDate,
  msUntilNextTbilisiMidnight,
  todayTbilisi,
} from "@/src/utils/tbilisiDate";

describe("tbilisiDate", () => {
  it("uses Tbilisi (UTC+4) for the calendar day", () => {
    expect(todayTbilisi(new Date("2026-11-18T19:59:00Z"))).toBe("2026-11-18");
    expect(todayTbilisi(new Date("2026-11-18T20:00:00Z"))).toBe("2026-11-19");
  });

  it("adds days across month and year ends", () => {
    expect(addDaysToDate("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDaysToDate("2026-12-31", 2)).toBe("2027-01-02");
    expect(addDaysToDate("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts down to the next Tbilisi midnight", () => {
    expect(msUntilNextTbilisiMidnight(new Date("2026-11-18T19:00:00Z"))).toBe(3_600_000);
    expect(msUntilNextTbilisiMidnight(new Date("2026-11-18T20:00:00Z"))).toBe(86_400_000);
  });
});
