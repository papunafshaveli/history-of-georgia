import { mondayTbilisi } from "@/src/utils/weekStart";

// getTimezoneOffset() in minutes: -240 is a phone set to Tbilisi time (UTC+4).
const phoneOffset = (minutes: number) =>
  jest.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(minutes);

afterEach(() => jest.restoreAllMocks());

describe("mondayTbilisi", () => {
  it("starts the new week at Monday 00:00 Tbilisi time", () => {
    phoneOffset(-240);
    // Monday 2026-11-23 00:30 in Tbilisi is Sunday 20:30 UTC.
    expect(mondayTbilisi(new Date("2026-11-22T20:30:00Z"))).toBe("2026-11-23");
    // Sunday 23:59 in Tbilisi is still the old week.
    expect(mondayTbilisi(new Date("2026-11-22T19:59:00Z"))).toBe("2026-11-16");
  });

  it.each([-240, 0, 300, -600])(
    "gives the same week on a phone with offset %i",
    (minutes) => {
      phoneOffset(minutes);
      expect(mondayTbilisi(new Date("2026-11-22T20:30:00Z"))).toBe("2026-11-23");
      expect(mondayTbilisi(new Date("2026-11-22T19:59:00Z"))).toBe("2026-11-16");
    },
  );

  it("crosses month and year ends", () => {
    expect(mondayTbilisi(new Date("2026-12-01T10:00:00Z"))).toBe("2026-11-30");
    expect(mondayTbilisi(new Date("2027-01-01T10:00:00Z"))).toBe("2026-12-28");
  });
});
