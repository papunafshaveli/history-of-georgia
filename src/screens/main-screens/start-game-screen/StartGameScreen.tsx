import React from "react";
import { View, Text, ImageBackground, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GLOBAL_COLORS } from "@/src/constants";
import { usePlaySound, useSettings, useTranslation } from "@/src/hooks";
import { ScreenName } from "@/src/types";
import { ClickSound, Shield, StartScreenBack } from "@/src/assets";
import { vibrateImpact } from "@/src/helpers";

import styles from "./styles";

const StartGameScreen = () => {
  const { isMuted, isVibrationOff } = useSettings();

  const { playSound } = usePlaySound();

  const navigation: NavigationProp<ParamListBase> = useNavigation();

  const handlePressStart = async () => {
    if (!isVibrationOff) {
      vibrateImpact();
    }

    playSound(ClickSound, isMuted);

    navigation.navigate(ScreenName.GAME_SCREEN);
  };

  const t = useTranslation();

  return (
    <SafeAreaView edges={[]} style={{ flex: 1 }}>
      <View style={styles.startGameContainer}>
        <ImageBackground
          source={StartScreenBack}
          resizeMode="cover"
          style={styles.imageBackContainer}
          imageStyle={styles.imageBackStyles}
        >
          <Pressable
            android_ripple={{
              color: GLOBAL_COLORS.primaryColors.lightGrey,
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
                <Text style={styles.startGameText}>{t.common_start}</Text>
                <MaterialCommunityIcons
                  name="sword-cross"
                  color={GLOBAL_COLORS.mixedColors.darkCoffee}
                  size={40}
                />
              </View>
            </ImageBackground>
          </Pressable>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
};

export default StartGameScreen;
