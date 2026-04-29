import React, { useEffect, useMemo } from "react";
import { BackHandler, StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
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
  usePendingResultsReplay,
} from "@/src/hooks";
import { AppModals, ErrorBoundary, Loading } from "@/src/components";

import { AuthProvider } from "@/src/context/AuthProvider";
import { SettingsProvider } from "@/src/context/SettingsContext";

import { AppNavigation } from "@/src/navigation/AppNavigation";

import { runMigrations } from "@/src/migrations";

import {
  ThemeProvider,
  ThemeModeContext,
  useModifyThemeMode,
} from "./src/theme";
import { LanguageProvider } from "./src/context/LanguageContext";

const FONT_MAP = {
  "aisi-bold": GFAisiBoldItalic,
  "dm-medea": DMMedea,
  "helvetica-main": Helvetica,
  "nino-elite": BPGNinoEliteUltra,
} as const;

const BootEffects: React.FC = () => {
  useEffect(() => {
    runMigrations();
  }, []);
  usePendingResultsReplay();
  return null;
};

const App: React.FC = () => {
  useNotifications();

  const fontsLoaded = useCustomFonts(FONT_MAP);

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

  const containerStyle = useMemo(
    () => ({ flex: 1, backgroundColor: theme.colors.background }),
    [theme],
  );

  const navigationTheme = React.useMemo(() => {
    const baseTheme = isThemeDark ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.accent,
      },
    };
  }, [isThemeDark, theme]);

  useBackHandler(() => {
    toggleExitModal();
    return true;
  });

  if (!fontsLoaded) return <Loading />;

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <BootEffects />
          <SettingsProvider>
            <ThemeModeContext value={{ themeMode, isThemeDark, setThemeMode }}>
              <ThemeProvider theme={theme}>
                <SafeAreaProvider>
                  <View style={containerStyle}>
                    <StatusBar
                      hidden
                      barStyle={isThemeDark ? "light-content" : "dark-content"}
                      backgroundColor={theme.colors.background}
                    />
                    <NavigationContainer theme={navigationTheme}>
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
            </ThemeModeContext>
          </SettingsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

registerRootComponent(App);

export default App;
