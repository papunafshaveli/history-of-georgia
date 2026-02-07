import React, { useMemo } from "react";
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import StartGameScreen from "@/src/screens/main-screens/start-game-screen/StartGameScreen";
import HistoricalTopicsScreen from "@/src/screens/main-screens/historical-topics-screen/HistoricalTopicsScreen";
import StatsScreen from "@/src/screens/main-screens/stats-screen/StatsScreen";

import { CustomHeader } from "@/src/components";
import { GLOBAL_COLORS } from "@/src/constants";
import { ScreenName, TabParamList } from "@/src/types";

import { useTranslation } from "../hooks";
import { getAdjustedHeight } from "../helpers";

const Tab = createBottomTabNavigator<TabParamList>();

type TabNavigationProps = {
  toggleRulesModal: () => void;
  toggleSettingsModal: () => void;
};

const TabNavigation: React.FC<TabNavigationProps> = ({
  toggleRulesModal,
  toggleSettingsModal,
}) => {
  const t = useTranslation();

  const commonOptions: BottomTabNavigationOptions = useMemo(
    () => ({
      header: () => (
        <CustomHeader
          onLeftBtnPress={toggleSettingsModal}
          onRightBtnPress={toggleRulesModal}
          leftBtnIconName="cellphone-sound"
          rightBtnIconName="frequently-asked-questions"
        />
      ),
    }),
    [toggleRulesModal, toggleSettingsModal]
  );

  const startGameOptions: BottomTabNavigationOptions = {
    ...commonOptions,
    tabBarLabel: t.common_start,
    tabBarIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="sword-cross" size={size} color={color} />
    ),
  };

  const historicalTopicsOptions: BottomTabNavigationOptions = {
    ...commonOptions,
    tabBarLabel: t.common_issues,
    tabBarIcon: ({ color, size }) => (
      <MaterialCommunityIcons
        name="book-open-page-variant-outline"
        size={size}
        color={color}
      />
    ),
  };

  const statsOptions: BottomTabNavigationOptions = {
    ...commonOptions,
    tabBarLabel: t.stats_title,
    tabBarIcon: ({ color, size }) => (
      <MaterialCommunityIcons
        name="chart-bar"
        size={size}
        color={color}
      />
    ),
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: GLOBAL_COLORS.mixedColors.darkCoffee,
        tabBarInactiveTintColor: GLOBAL_COLORS.mixedColors.darkCoffeeThird,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarLabelPosition: "below-icon",
      }}
    >
      <Tab.Screen
        name={ScreenName.START_GAME_SCREEN}
        component={StartGameScreen}
        options={startGameOptions}
      />
      <Tab.Screen
        name={ScreenName.HISTORICAL_TOPICS_SCREEN}
        component={HistoricalTopicsScreen}
        options={historicalTopicsOptions}
      />
      <Tab.Screen
        name={ScreenName.STATS_SCREEN}
        component={StatsScreen}
        options={statsOptions}
      />
    </Tab.Navigator>
  );
};

export default TabNavigation;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: GLOBAL_COLORS.primaryColors.dark,
    height: getAdjustedHeight(90),
    borderTopColor: GLOBAL_COLORS.primaryColors.dark,
    borderTopWidth: 0,
  },
  tabBarLabel: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "gf-aisi-bold-italic",
  },
});
