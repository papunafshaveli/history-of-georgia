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
import type { AppTheme } from "@/src/theme";
import { ScreenName, TabParamList } from "@/src/types";

import { useAppTheme, useTranslation } from "../hooks";
import { getAdjustedHeight } from "../helpers";

const Tab = createBottomTabNavigator<TabParamList>();

type TabNavigationProps = {
  toggleRulesModal: () => void;
  toggleSettingsModal: () => void;
};

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    tabBar: {
      backgroundColor: theme.colors.headerBg,
      height: getAdjustedHeight(90),
      borderTopColor: theme.colors.headerBg,
      borderTopWidth: 0,
    },
    tabBarLabel: {
      fontSize: 14,
      fontWeight: "bold",
      fontFamily: theme.fonts.accent,
    },
  });

const TabNavigation: React.FC<TabNavigationProps> = ({
  toggleRulesModal,
  toggleSettingsModal,
}) => {
  const t = useTranslation();
  const theme = useAppTheme();

  const styles = useMemo(() => getStyles(theme), [theme]);

  const commonOptions: BottomTabNavigationOptions = useMemo(
    () => ({
      header: () => (
        <CustomHeader
          onLeftBtnPress={toggleSettingsModal}
          onRightBtnPress={toggleRulesModal}
          leftBtnIconName="settings-suggest"
          rightBtnIconName="rule-folder"
        />
      ),
    }),
    [toggleRulesModal, toggleSettingsModal],
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
      <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
    ),
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.coffee,
        tabBarInactiveTintColor: theme.colors.coffeeDark,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarLabelPosition: "below-icon",
        sceneStyle: { backgroundColor: theme.colors.background },
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
