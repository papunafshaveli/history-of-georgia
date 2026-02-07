import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

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
import { useTranslation } from "@/src/hooks";
import { GLOBAL_COLORS } from "@/src/constants";

import styles from "./styles";

const GameScreen = () => {
  const { gameState, actions, modalHandlers } = useGameScreen();
  const t = useTranslation();

  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={[]}
      style={{
        flex: 1,
        paddingTop: topInset,
        paddingBottom: bottomInset,
        backgroundColor: GLOBAL_COLORS.mixedColors.cream,
      }}
    >
      <View style={styles.gameScreenContainer}>
        <GameHeader
          crowns={gameState.crowns}
          correctAnswersCount={gameState.stats.correctAnswers}
          questionsCount={gameState.stats.questionsAnswered}
        />

        {gameState.status.hasError ? (
          <View style={errorStyles.container}>
            <Text style={errorStyles.text}>{t.game_failed_to_load}</Text>
            <Pressable style={errorStyles.button} onPress={actions.handleRetry}>
              <Text style={errorStyles.buttonText}>{t.game_retry}</Text>
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
            correctAnswers: gameState.stats.correctAnswers,
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

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  text: {
    fontFamily: "gf-aisi-bold-italic",
    fontSize: 18,
    color: GLOBAL_COLORS.mixedColors.darkCoffeeThird,
    textAlign: "center",
  },
  button: {
    backgroundColor: GLOBAL_COLORS.mixedColors.darkCoffee,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontFamily: "gf-aisi-bold-italic",
    fontSize: 16,
    color: GLOBAL_COLORS.primaryColors.white,
  },
});

export default GameScreen;
