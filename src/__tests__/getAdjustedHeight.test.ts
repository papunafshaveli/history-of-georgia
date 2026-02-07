import { getAdjustedHeight } from "@/src/helpers/getAdjustedHeight";
import { SCREEN_HEIGHT, DESIGN_SCREEN_HEIGHT } from "@/src/constants";

describe("getAdjustedHeight", () => {
  it("scales height proportionally to screen size", () => {
    const input = 100;
    const expected = (input * SCREEN_HEIGHT) / DESIGN_SCREEN_HEIGHT;
    expect(getAdjustedHeight(input)).toBe(expected);
  });

  it("returns 0 for input 0", () => {
    expect(getAdjustedHeight(0)).toBe(0);
  });

  it("handles negative values", () => {
    const input = -40;
    const expected = (input * SCREEN_HEIGHT) / DESIGN_SCREEN_HEIGHT;
    expect(getAdjustedHeight(input)).toBe(expected);
  });
});
