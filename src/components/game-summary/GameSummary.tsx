import React, { useEffect, useMemo, useRef } from "react";

import { View, ImageBackground, Pressable, Linking } from "react-native";

import * as Animatable from "react-native-animatable";

import * as StoreReview from "expo-store-review";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { NavigationProp, useNavigation } from "@react-navigation/native";

import { IS_ANDROID, ScoreThreshold } from "@/src/constants";
import { CircleIcon } from "@/src/assets";
import { openAppOrUrl } from "@/src/helpers";
import {
  useAppTheme,
  useStyles,
  useTranslation,
  useUserStats,
} from "@/src/hooks";
import { STORE_REVIEW_PULSE_DURATION_MS } from "@/src/constants";
import { RootStackParamList, ScreenName } from "@/src/types";

import IconButton from "../icon-button/IconButton";
import GradientWrapper from "../gradient-wrapper/GradientWrapper";
import { AppText } from "../text";

import { getStyles } from "./styles";

type GameSummaryProps = {
  onRestartBtnPress: () => void;
  onCloseSummary: () => void;
  score: number;
};

const GameSummary: React.FC<GameSummaryProps> = ({
  onRestartBtnPress,
  onCloseSummary,
  score,
}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  // Best score from Firestore — saveGameAndUpdateStats has already run by
  // the time this modal mounts (or is racing in the background); pre-game
  // value in `stats.bestSingleGameScore` is fine because we Math.max with
  // the current `score` for display, and refresh() will pull the post-game
  // value shortly. No legacy AsyncStorage[highScore] read here — that was
  // wiped by the v2.0.0 migration.
  const { stats, refresh: refreshStats } = useUserStats();
  const previousBest = stats?.bestSingleGameScore ?? 0;
  const highestScore = Math.max(score, previousBest);
  const reviewPromptedRef = useRef(false);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    if (reviewPromptedRef.current) return;
    if (stats === null) return;
    if (score <= previousBest) return;
    reviewPromptedRef.current = true;
    StoreReview.isAvailableAsync().then((available) => {
      if (available) StoreReview.requestReview();
    });
  }, [stats, score, previousBest]);

  const handleVisitFbPage = () => {
    const fbAppUrl = "fb://profile/61572292876345";
    const fbWebUrl = "https://www.facebook.com/profile.php?id=61572292876345";

    openAppOrUrl(fbAppUrl, fbWebUrl);
  };

  const handleVisitStore = () => {
    const visitLink = IS_ANDROID
      ? "https://play.google.com/store/apps/details?id=com.papunafshaveli.historyofgeorgia"
      : "https://apps.apple.com/app/id6741484980";

    Linking.openURL(visitLink).catch(() => {});
  };

  const handleNavigateToLeaderboard = () => {
    onCloseSummary();
    navigation.reset({
      index: 0,
      routes: [
        { name: "tabs", params: { screen: ScreenName.LEADERBOARD_SCREEN } },
      ],
    });
  };

  const scoreFeedback = useMemo(() => {
    if (score >= ScoreThreshold.Expert) return t.gamesummary_tier_expert;
    if (score >= ScoreThreshold.Strong) return t.gamesummary_tier_strong;
    if (score >= ScoreThreshold.Solid) return t.gamesummary_tier_solid;
    return t.gamesummary_tier_beginner;
  }, [score, t]);

  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.imageBackgroundWrapper}
        source={CircleIcon}
        resizeMode="contain"
        imageStyle={styles.imageBackground}
      >
        <AppText
          lineHeight={100}
          fontFamily="display"
          type="display"
          color={colors.onImage}
        >
          {score}
        </AppText>
      </ImageBackground>
      <AppText
        type="display"
        fontFamily="script"
        color={colors.onImage}
        style={styles.resultFeedbackText}
      >
        {scoreFeedback}
      </AppText>
      <AppText
        type="title"
        fontFamily="script"
        color={colors.onImage}
        style={styles.highScoreText}
      >
        {t.game_best_score}{" "}
        <AppText
          type="title"
          fontFamily="sans"
          color={colors.onImage}
          style={styles.highScoreText}
        >
          {highestScore}
        </AppText>
      </AppText>
      <View style={styles.buttonsWrapper}>
        <GradientWrapper style={styles.gradient}>
          <IconButton
            iconName="facebook"
            onPress={handleVisitFbPage}
            size={24}
            color={colors.bronzeDark}
            containerStyle={styles.gradient}
            accessibilityLabel="Facebook"
          />
        </GradientWrapper>

        <GradientWrapper style={styles.gradient}>
          <IconButton
            iconName="leaderboard"
            onPress={handleNavigateToLeaderboard}
            size={24}
            color={colors.bronzeDark}
            containerStyle={styles.gradient}
            accessibilityLabel="Leaderboard"
          />
        </GradientWrapper>

        <Pressable
          onPress={onRestartBtnPress}
          accessibilityRole="button"
          accessibilityLabel={t.game_restart}
        >
          <GradientWrapper style={styles.button}>
            <AppText type="headline" fontFamily="script">
              {t.game_restart}
            </AppText>
            <MaterialCommunityIcons
              name="restart"
              size={24}
              color={colors.bronzeDark}
            />
          </GradientWrapper>
        </Pressable>

        <Animatable.View
          animation="pulse"
          easing="ease-in-out"
          iterationCount="infinite"
          duration={STORE_REVIEW_PULSE_DURATION_MS}
        >
          <GradientWrapper style={styles.gradient}>
            <IconButton
              iconName="star-border-purple500"
              size={24}
              color={colors.bronzeDark}
              onPress={handleVisitStore}
              containerStyle={styles.gradient}
              accessibilityLabel="Rate app"
            />
          </GradientWrapper>
        </Animatable.View>
      </View>
    </View>
  );
};

export default GameSummary;
