import type { NavigatorScreenParams } from "@react-navigation/native";

import { ScreenName } from "./screenNames";
import { Difficulty } from "./quizQuestion";
import type { LeaderboardTab } from "./leaderboard";

export type TabParamList = {
  "start-game-screen": undefined;
  "historical-topics-screen": undefined;
  "leaderboard-screen": { initialTab?: LeaderboardTab } | undefined;
  "stats-screen": undefined;
};

export type RootStackParamList = {
  "splash-screen": undefined;
  tabs: NavigatorScreenParams<TabParamList> | undefined;
  "game-screen": { difficulty?: Difficulty } | undefined;
  "daily-game-screen": { date: string };
  "daily-result-screen": { date: string };
  "rulers-screen": undefined;
  "battles-screen": undefined;
  "public-figures-screen": { publicFigureId: string };
  [ScreenName.PUBLIC_FIGURES_DETAILS]: { publicFigureId: string };
  [ScreenName.RULER_DETAILS]: { rulerId: string };
  [ScreenName.BATTLE_DETAILS]: { battleId: string };
};
