import React from "react";
import { View, Pressable, StyleSheet } from "react-native";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  GameFooter,
  GameHeader,
  GameModals,
  OptionsDisplay,
  QuestionDisplay,
} from "@/src/components/game-screen-components";

import { useGameScreen } from "@/src/hooks/useGameScreen";
import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";
import { AppText } from "@/src/components";
import type { AppTheme } from "@/src/theme";

import { getStyles } from "./styles";

const GameScreen = () => {
  const { gameState, actions, modalHandlers } = useGameScreen();
  const t = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(getStyles);
  const errorStyles = useStyles(getErrorStyles);

  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={[]}
      style={[
        styles.safeArea,
        { paddingTop: topInset, paddingBottom: bottomInset },
      ]}
    >
      <View style={styles.gameScreenContainer}>
        <GameHeader crowns={gameState.crowns} score={gameState.score} />

        {gameState.status.hasError ? (
          <View style={errorStyles.container}>
            <AppText
              fontFamily="serif"
              type="headline"
              color={theme.colors.bronzeDark}
              style={errorStyles.text}
            >
              {t.game_failed_to_load}
            </AppText>
            <Pressable style={errorStyles.button} onPress={actions.handleRetry}>
              <AppText
                fontFamily="serif"
                type="subHeadline"
                color={theme.colors.surface}
              >
                {t.game_retry}
              </AppText>
            </Pressable>
          </View>
        ) : (
          <>
            <QuestionDisplay
              isLoading={gameState.status.isLoading}
              question={gameState.currentQuestion?.question}
            />

            <OptionsDisplay
              options={gameState.currentQuestion?.options}
              correctAnswer={gameState.currentQuestion?.correctAnswer}
              onOptionPress={actions.handleOptionPress}
              isOptionDisabled={gameState.status.isOptionLocked}
              isLoading={gameState.status.isLoading}
            />
          </>
        )}

        <GameFooter
          onExit={modalHandlers.toggleExitModal}
          onHint={actions.handleHint}
          onSettings={modalHandlers.toggleSettingsModal}
          hintsCount={gameState.hintsRemaining}
          isHintDisabled={!gameState.status.canUseHint}
        />

        <GameModals
          modals={{
            ...gameState.modals,
            score: gameState.score,
          }}
          onClose={modalHandlers}
          onExit={actions.handleExit}
          onRestart={actions.handleRestart}
          currentHint={gameState.currentQuestion?.hint}
        />
      </View>
    </SafeAreaView>
  );
};

const getErrorStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: theme.spacing.x4,
    },
    text: {
      textAlign: "center",
    },
    button: {
      backgroundColor: theme.colors.bronze,
      paddingHorizontal: theme.spacing.x6,
      paddingVertical: theme.spacing.x3,
      borderRadius: theme.borderRadius.md,
    },
  });

export default GameScreen;
