import React from "react";
import { BackHandler, StatusBar, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { registerRootComponent } from "expo";

import {
  BPGNinoEliteUltra,
  DMMedea,
  GFAisiBoldItalic,
  Helvetica,
} from "@/src/assets";
import {
  useBackHandler,
  useCustomFonts,
  useModalState,
  useNotifications,
} from "@/src/hooks";
import { AppModals, ErrorBoundary, Loading } from "@/src/components";

import { SettingsProvider } from "@/src/context/SettingsContext";

import { AppNavigation } from "@/src/navigation/AppNavigation";

import {
  ThemeProvider,
  ThemeModeContext,
  useModifyThemeMode,
  AppTheme,
  useStyles,
} from "./src/theme";
import { LanguageProvider } from "./src/context/LanguageContext";

const App: React.FC = () => {
  useNotifications(false);

  const fontsLoaded = useCustomFonts({
    "aisi-bold": GFAisiBoldItalic,
    "dm-medea": DMMedea,
    "helvetica-main": Helvetica,
    "nino-elite": BPGNinoEliteUltra,
  });

  const styles = useStyles(getStyles);

  const {
    isRulesModalVisible,
    toggleRulesModal,
    isSettingsModalVisible,
    toggleSettingsModal,
    isExitModalVisible,
    toggleExitModal,
    isEthernetModalVisible,
  } = useModalState();

  const { themeMode, isThemeDark, setThemeMode, theme } = useModifyThemeMode();

  useBackHandler(() => {
    toggleExitModal();
    return true;
  });

  if (!fontsLoaded) return <Loading />;

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SettingsProvider>
          <ThemeModeContext.Provider
            value={{ themeMode, isThemeDark, setThemeMode }}
          >
            <ThemeProvider theme={theme}>
              <SafeAreaProvider>
                <View style={styles.container}>
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
            </ThemeProvider>
          </ThemeModeContext.Provider>
        </SettingsProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

registerRootComponent(App);

export default App;

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.dark,
    },
  });
