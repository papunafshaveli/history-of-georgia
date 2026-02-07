import React, { useEffect, useMemo, useState } from "react";

import { View, Text, ImageBackground, Pressable, Linking, Share } from "react-native";

import * as Animatable from "react-native-animatable";
import AsyncStorage from "@react-native-async-storage/async-storage";

import * as StoreReview from "expo-store-review";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  GLOBAL_COLORS,
  IS_ANDROID,
  ScoreThreshold,
} from "@/src/constants";
import { CircleIcon } from "@/src/assets";
import { openAppOrUrl } from "@/src/helpers";
import { useTranslation } from "@/src/hooks";
import { STORE_REVIEW_PULSE_DURATION_MS } from "@/src/constants";

import IconButton from "../icon-button/IconButton";
import GradientWrapper from "../gradient-wrapper/GradientWrapper";

import styles from "./styles";

type GameSummaryProps = {
  onRestartBtnPress: () => void;
  score: number;
};

const GameSummary: React.FC<GameSummaryProps> = ({
  onRestartBtnPress,
  score,
}) => {
  const [highestScore, setHighestScore] = useState<number | null>(null);
  const t = useTranslation();

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

  const handleShare = async () => {
    const message = t.game_share_message.replace("{score}", String(score));
    try {
      await Share.share({ message });
    } catch {
      // Share cancelled or failed
    }
  };

  const scoreFeedback = useMemo(() => {
    if (score <= ScoreThreshold.Low) {
      return t.feedback_low;
    } else if (score <= ScoreThreshold.Medium) {
      return t.feedback_medium;
    } else if (score <= ScoreThreshold.High) {
      return t.feedback_high;
    } else if (score <= ScoreThreshold.Excellent) {
      return t.feedback_excellent;
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
        <Text style={styles.scoreText}>{score}</Text>
      </ImageBackground>
      <Text style={styles.resultFeedbackText}>{scoreFeedback}</Text>
      <Text style={styles.highScoreText}>
        {t.game_best_score} {highestScore}
      </Text>
      <View style={styles.buttonsWrapper}>
        <GradientWrapper style={styles.gradient}>
          <IconButton
            iconName="facebook"
            onPress={handleVisitFbPage}
            size={24}
            color={GLOBAL_COLORS.mixedColors.darkCoffeeThird}
            containerStyle={styles.gradient}
            accessibilityLabel="Facebook"
          />
        </GradientWrapper>

        <GradientWrapper style={styles.gradient}>
          <IconButton
            iconName="share-variant"
            onPress={handleShare}
            size={24}
            color={GLOBAL_COLORS.mixedColors.darkCoffeeThird}
            containerStyle={styles.gradient}
            accessibilityLabel="Share score"
          />
        </GradientWrapper>

        <Pressable
          onPress={onRestartBtnPress}
          accessibilityRole="button"
          accessibilityLabel={t.game_restart}
        >
          <GradientWrapper style={styles.button}>
            <Text style={styles.btnText}>{t.game_restart}</Text>
            <MaterialCommunityIcons
              name="restart"
              size={24}
              color={GLOBAL_COLORS.mixedColors.darkCoffeeThird}
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
              iconName="star-circle"
              size={24}
              color={GLOBAL_COLORS.mixedColors.darkCoffeeThird}
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
