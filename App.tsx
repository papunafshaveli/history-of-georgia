import React from "react";
import { BackHandler, StatusBar, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { registerRootComponent } from "expo";

import { AisiBoldItalic, Helvetica, MediaMain } from "@/src/assets";
import {
  useBackHandler,
  useCustomFonts,
  useModalState,
  useNotifications,
} from "@/src/hooks";
import { AppModals, ErrorBoundary, Loading } from "@/src/components";

import { SettingsProvider } from "@/src/context/SettingsContext";

import { AppNavigation } from "@/src/navigation/AppNavigation";

import { GLOBAL_COLORS } from "./src/constants";
import { LanguageProvider } from "./src/context/LanguageContext";

const App: React.FC = () => {
  useNotifications(false);

  const fontsLoaded = useCustomFonts({
    "dm-media-main": MediaMain,
    "gf-aisi-bold-italic": AisiBoldItalic,
    "helvetica-main": Helvetica,
  });

  const {
    isRulesModalVisible,
    toggleRulesModal,
    isSettingsModalVisible,
    toggleSettingsModal,
    isExitModalVisible,
    toggleExitModal,
    isEthernetModalVisible,
  } = useModalState();

  useBackHandler(() => {
    toggleExitModal();
    return true;
  });

  if (!fontsLoaded) return <Loading />;

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SettingsProvider>
          <SafeAreaProvider>
            <View style={appStyles.container}>
              <StatusBar hidden />
              <NavigationContainer>
                <AppNavigation
                  toggleRulesModal={toggleRulesModal}
                  toggleSettingsModal={toggleSettingsModal}
                />
              </NavigationContainer>
              <AppModals
                isRulesModalVisible={isRulesModalVisible}
                toggleRulesModal={toggleRulesModal}
                isSettingsModalVisible={isSettingsModalVisible}
                toggleSettingsModal={toggleSettingsModal}
                isExitModalVisible={isExitModalVisible}
                toggleExitModal={toggleExitModal}
                handleExitApp={BackHandler.exitApp}
                isEthernetModalVisible={isEthernetModalVisible}
              />
            </View>
          </SafeAreaProvider>
        </SettingsProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

registerRootComponent(App);

export default App;

const appStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GLOBAL_COLORS.primaryColors.dark,
  },
});
