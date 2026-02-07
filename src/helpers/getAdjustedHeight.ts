import { DESIGN_SCREEN_HEIGHT, SCREEN_HEIGHT } from "@/src/constants";

export const getAdjustedHeight = (height: number) => {
  return (height * SCREEN_HEIGHT) / DESIGN_SCREEN_HEIGHT;
};
