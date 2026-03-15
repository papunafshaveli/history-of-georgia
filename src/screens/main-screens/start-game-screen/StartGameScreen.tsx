import React, { useState } from "react";
import { View, ImageBackground, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useAppTheme,
  usePlaySound,
  useSettings,
  useStyles,
  useThemeMode,
  useTranslation,
} from "@/src/hooks";
import { RootStackParamList, ScreenName } from "@/src/types";
import { Difficulty } from "@/src/types/quizQuestion";
import { ClickSound, Shield, StartScreenBack } from "@/src/assets";
import { vibrateImpact } from "@/src/helpers";
import { AppText, DifficultyRing } from "@/src/components";

import { getStyles } from "./styles";

const StartGameScreen = () => {
  const { isMuted, isVibrationOff } = useSettings();
  const { isThemeDark } = useThemeMode();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>();

  const { playSound } = usePlaySound();

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  const overlayStyle = isThemeDark ? styles.overlayDark : styles.overlayLight;

  const handlePressStart = () => {
    if (!isVibrationOff) {
      vibrateImpact();
    }

    playSound(ClickSound, isMuted);

    navigation.navigate(ScreenName.GAME_SCREEN, {
      difficulty: selectedDifficulty,
    });
  };

  const t = useTranslation();

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <View style={styles.startGameContainer}>
        <ImageBackground
          source={StartScreenBack}
          resizeMode="cover"
          style={styles.imageBackContainer}
          imageStyle={styles.imageBackStyles}
        >
          <View
            pointerEvents="none"
            style={[styles.overlayBase, overlayStyle]}
          />
          <DifficultyRing
            selectedDifficulty={selectedDifficulty}
            onSelectDifficulty={setSelectedDifficulty}
          >
            <Pressable
              android_ripple={{
                color: colors.border,
                borderless: true,
              }}
              onPress={handlePressStart}
              style={styles.startGameBtn}
              accessibilityRole="button"
              accessibilityLabel={t.common_start}
            >
              <ImageBackground
                source={Shield}
                resizeMode="cover"
                style={styles.shieldBackContainer}
                imageStyle={styles.imageBackStyles}
              >
                <View style={styles.textAndIcon}>
                  <AppText
                    color={colors.bronzeLight}
                    type="display"
                    fontFamily="display"
                    lineHeight={100}
                    style={isThemeDark ? styles.darkOpacity : undefined}
                  >
                    {t.common_start}
                  </AppText>
                  <MaterialCommunityIcons
                    name="sword-cross"
                    color={colors.bronzeLight}
                    size={40}
                    style={isThemeDark ? styles.darkOpacity : undefined}
                  />
                </View>
              </ImageBackground>
            </Pressable>
          </DifficultyRing>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
};

export default StartGameScreen;
