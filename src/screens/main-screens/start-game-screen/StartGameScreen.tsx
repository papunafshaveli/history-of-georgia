import React, { useCallback, useState } from "react";
import { View, ImageBackground, Pressable, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useAppTheme,
  useDailyChallenge,
  useDailyReminderTap,
  usePlaySound,
  useSettings,
  useStyles,
  useThemeMode,
  useTranslation,
} from "@/src/hooks";
import { LeaderboardTab, RootStackParamList, ScreenName } from "@/src/types";
import { Difficulty } from "@/src/types/quizQuestion";
import { ClickSound, Shield, StartScreenBack } from "@/src/assets";
import { vibrateImpact } from "@/src/helpers";
import { todayTbilisi } from "@/src/utils/tbilisiDate";
import {
  AppText,
  DailyCard,
  DifficultyRing,
  OtherAppsCarousel,
} from "@/src/components";

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
  const daily = useDailyChallenge();
  useDailyReminderTap();

  const handlePlayDaily = useCallback(() => {
    if (!isVibrationOff) vibrateImpact();
    playSound(ClickSound, isMuted);
    // The tap's own day, in case the card hasn't rolled over yet.
    navigation.navigate(ScreenName.DAILY_GAME_SCREEN, { date: todayTbilisi() });
  }, [isVibrationOff, playSound, isMuted, navigation]);

  const handleOpenTodayBoard = useCallback(() => {
    navigation.navigate("tabs", {
      screen: ScreenName.LEADERBOARD_SCREEN,
      params: { initialTab: LeaderboardTab.TODAY },
    });
  }, [navigation]);

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
          {/* Short phones scroll the card and carousel up instead of squeezing the shield. */}
          <ScrollView
            style={styles.homeContent}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.gameControl}>
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
            </View>

            <DailyCard
              kind={daily.kind}
              streak={daily.streak}
              correct={daily.correct}
              elapsedMs={daily.elapsedMs}
              msToNext={daily.msToNext}
              onPlay={handlePlayDaily}
              onOpenLeaderboard={handleOpenTodayBoard}
            />

            <OtherAppsCarousel />
          </ScrollView>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
};

export default StartGameScreen;
