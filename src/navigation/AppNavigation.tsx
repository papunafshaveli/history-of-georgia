import React, { useMemo } from "react";

import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { NavigationProp, useNavigation } from "@react-navigation/native";

import { RootStackParamList, ScreenName } from "@/src/types";
import { CustomHeader } from "@/src/components";

import { GameScreen, CustomSplashScreen } from "../screens/main-screens";

import TabNavigation from "./TabNavigation";
import {
  BattlesScreen,
  PublicFiguresScreen,
  RulersScreen,
} from "../screens/historical-topic-screens";
import {
  BattleDetailsScreen,
  PublicFiguresDetailsScreen,
  RulerDetailsScreen,
} from "../screens/historical-topic-details-screens";

const Stack = createNativeStackNavigator<RootStackParamList>();

type AppNavigationProps = {
  toggleRulesModal: () => void;
  toggleSettingsModal: () => void;
};

export const AppNavigation: React.FC<AppNavigationProps> = ({
  toggleRulesModal,
  toggleSettingsModal,
}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const onBackBtnClick = () => {
    navigation.goBack();
  };

  const commonOptions: NativeStackNavigationOptions = useMemo(
    () => ({
      header: () => (
        <CustomHeader
          onLeftBtnPress={onBackBtnClick}
          onRightBtnPress={toggleSettingsModal}
          leftBtnIconName="arrow-back-ios"
          rightBtnIconName="settings-suggest"
        />
      ),
    }),
    [toggleRulesModal, toggleSettingsModal],
  );

  return (
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.SPLASH_SCREEN}
        component={CustomSplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="tabs" options={{ headerShown: false }}>
        {() => (
          <TabNavigation
            toggleRulesModal={toggleRulesModal}
            toggleSettingsModal={toggleSettingsModal}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name={ScreenName.GAME_SCREEN}
        component={GameScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name={ScreenName.RULER_DETAILS}
        component={RulerDetailsScreen}
        options={commonOptions}
      />
      <Stack.Screen
        name={ScreenName.BATTLE_DETAILS}
        component={BattleDetailsScreen}
        options={commonOptions}
      />
      <Stack.Screen
        name={ScreenName.PUBLIC_FIGURES_DETAILS}
        component={PublicFiguresDetailsScreen}
        options={commonOptions}
      />

      <Stack.Screen
        name={ScreenName.RULERS_SCREEN}
        component={RulersScreen}
        options={commonOptions}
      />
      <Stack.Screen
        name={ScreenName.BATTLES_SCREENS}
        component={BattlesScreen}
        options={commonOptions}
      />
      <Stack.Screen
        name={ScreenName.PUBLIC_FIGURES}
        component={PublicFiguresScreen}
        options={commonOptions}
      />
    </Stack.Navigator>
  );
};
