import React from "react";
import {
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { ScreenName } from "@/src/types";
import {
  BattleTopic,
  ClickSound,
  KingTopic,
  PublicFigures,
} from "@/src/assets";
import {
  useAppTheme,
  usePlaySound,
  useSettings,
  useStyles,
  useTranslation,
} from "@/src/hooks";
import { vibrateImpact } from "@/src/helpers";
import { AppText } from "@/src/components";

import { getStyles } from "./styles";

type Topic = {
  id: number;
  title: string;
  screenName: ScreenName;
  isVisible: boolean;
  img?: string;
};

const HistoricalTopicsScreen = () => {
  const navigation = useNavigation();
  const t = useTranslation();
  const styles = useStyles(getStyles);
  const { playSound } = usePlaySound();
  const { colors } = useAppTheme();

  const { isMuted, isVibrationOff } = useSettings();

  const Topics: Topic[] = [
    {
      id: 1,
      title: t.common_rulers,
      screenName: ScreenName.RULERS_SCREEN,
      isVisible: true,
      img: KingTopic,
    },
    {
      id: 2,
      title: t.common_battles,
      screenName: ScreenName.BATTLES_SCREENS,
      isVisible: true,
      img: BattleTopic,
    },
    {
      id: 3,
      title: t.common_public_figures,
      screenName: ScreenName.PUBLIC_FIGURES,
      isVisible: true,
      img: PublicFigures,
    },
  ];

  const handleTopicPress = (screenName: ScreenName) => {
    if (!isVibrationOff) {
      vibrateImpact();
    }
    playSound(ClickSound, isMuted);
    navigation.navigate(screenName as never);
  };

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <View style={styles.titleDescWrapper}>
        <AppText fontFamily="secondary" fontWeight="bold" type="headline">
          {t.learn_about_geo_history}
        </AppText>
        <AppText
          fontFamily="secondary"
          fontWeight="bold"
          type="subHeadline"
          color={colors.muted}
        >
          {t.common_choose_category}
        </AppText>
      </View>
      <ScrollView contentContainerStyle={styles.historicalTopicsContainer}>
        <View style={styles.gridContainer}>
          {Topics.map((topic) => {
            const onTopicPress = () => handleTopicPress(topic.screenName);

            return (
              <Pressable
                key={topic.id}
                onPress={onTopicPress}
                style={styles.gridItem}
              >
                <ImageBackground
                  source={topic.img as ImageSourcePropType}
                  style={styles.imageBackgroundStyle}
                >
                  <AppText
                    fontFamily="accent"
                    type="headline"
                    color={colors.white}
                    style={styles.text}
                  >
                    {topic.title}
                  </AppText>
                </ImageBackground>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HistoricalTopicsScreen;
