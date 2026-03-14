import React, { useEffect, useMemo, useState } from "react";

import { View, ImageBackground, Pressable, Linking } from "react-native";

import * as Animatable from "react-native-animatable";
import AsyncStorage from "@react-native-async-storage/async-storage";

import * as StoreReview from "expo-store-review";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { NavigationProp, useNavigation } from "@react-navigation/native";

import { IS_ANDROID, ScoreThreshold } from "@/src/constants";
import { CircleIcon } from "@/src/assets";
import { openAppOrUrl } from "@/src/helpers";
import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";
import { STORE_REVIEW_PULSE_DURATION_MS } from "@/src/constants";
import { RootStackParamList, ScreenName } from "@/src/types";

import IconButton from "../icon-button/IconButton";
import GradientWrapper from "../gradient-wrapper/GradientWrapper";
import { AppText } from "../text";

import { getStyles } from "./styles";

type GameSummaryProps = {
  onRestartBtnPress: () => void;
  score: number;
};

const GameSummary: React.FC<GameSummaryProps> = ({
  onRestartBtnPress,
  score,
}) => {
  const [highestScore, setHighestScore] = useState<number | null>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const promptForReview = async () => {
    if (await StoreReview.isAvailableAsync()) {
      StoreReview.requestReview();
    }
  };

  const saveScore = async () => {
    const storedHighScore = await AsyncStorage.getItem("highScore");
    const highScore = storedHighScore ? JSON.parse(storedHighScore) : 0;

    if (score > highScore) {
      await AsyncStorage.setItem("highScore", JSON.stringify(score));
      setHighestScore(score);
      promptForReview();
    } else {
      setHighestScore(highScore);
    }
  };

  const getHighestScore = async () => {
    const storedHighScore = await AsyncStorage.getItem("highScore");
    if (storedHighScore) {
      setHighestScore(JSON.parse(storedHighScore));
    }
  };

  useEffect(() => {
    getHighestScore();
    saveScore();
  }, [score]);

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

  const handleNavigateToStats = () => {
    navigation.navigate("tabs", { screen: ScreenName.STATS_SCREEN });
  };

  const scoreFeedback = useMemo(() => {
    if (score <= ScoreThreshold.Low) {
      return t.feedback_low;
    } else if (score <= ScoreThreshold.Medium) {
      return t.feedback_medium;
    } else if (score <= ScoreThreshold.High) {
      return t.feedback_high;
    } else if (score <= ScoreThreshold.Excellent) {
      return t.feedback_outstanding;
    } else {
      return t.feedback_outstanding;
    }
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
          fontFamily="script"
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
        {t.game_best_score} {highestScore}
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
            iconName="bar-chart"
            onPress={handleNavigateToStats}
            size={24}
            color={colors.bronzeDark}
            containerStyle={styles.gradient}
            accessibilityLabel="Stats"
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
