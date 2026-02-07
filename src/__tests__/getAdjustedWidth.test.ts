import { getAdjustedWidth } from "@/src/helpers/getAdjustedWidth";
import { SCREEN_WIDTH, DESIGN_SCREEN_WIDTH } from "@/src/constants";

describe("getAdjustedWidth", () => {
  it("scales width proportionally to screen size", () => {
    const input = 100;
    const expected = (input * SCREEN_WIDTH) / DESIGN_SCREEN_WIDTH;
    expect(getAdjustedWidth(input)).toBe(expected);
  });

  it("returns 0 for input 0", () => {
    expect(getAdjustedWidth(0)).toBe(0);
  });

  it("handles negative values", () => {
    const input = -20;
    const expected = (input * SCREEN_WIDTH) / DESIGN_SCREEN_WIDTH;
    expect(getAdjustedWidth(input)).toBe(expected);
  });
});
