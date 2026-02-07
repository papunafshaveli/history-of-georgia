import { DESIGN_SCREEN_WIDTH, SCREEN_WIDTH } from "@/src/constants";

export const getAdjustedWidth = (width: number) => {
  return (width * SCREEN_WIDTH) / DESIGN_SCREEN_WIDTH;
};
