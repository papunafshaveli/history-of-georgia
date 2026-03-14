import React from "react";
import { View, ImageBackground, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useAppTheme,
  usePlaySound,
  useSettings,
  useStyles,
  useTranslation,
} from "@/src/hooks";
import { ScreenName } from "@/src/types";
import { ClickSound, Shield, StartScreenBack } from "@/src/assets";
import { vibrateImpact } from "@/src/helpers";
import { AppText } from "@/src/components";

import { getStyles } from "./styles";

const StartGameScreen = () => {
  const { isMuted, isVibrationOff } = useSettings();

  const { playSound } = usePlaySound();

  const navigation: NavigationProp<ParamListBase> = useNavigation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

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
                >
                  {t.common_start}
                </AppText>
                <MaterialCommunityIcons
                  name="sword-cross"
                  color={colors.bronzeLight}
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
