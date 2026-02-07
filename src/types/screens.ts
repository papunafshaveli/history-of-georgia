import { ScreenName } from "./screenNames";

export type TabParamList = {
  "start-game-screen": undefined;
  "historical-topics-screen": undefined;
  "stats-screen": undefined;
};

export type RootStackParamList = {
  "splash-screen": undefined;
  tabs: { screen?: keyof TabParamList } | undefined;
  "game-screen": undefined;
  "rulers-screen": undefined;
  "battles-screen": undefined;
  "public-figures-screen": { publicFigureId: string };
  [ScreenName.PUBLIC_FIGURES_DETAILS]: { publicFigureId: string };
  [ScreenName.RULER_DETAILS]: { rulerId: string };
  [ScreenName.BATTLE_DETAILS]: { battleId: string };
};
