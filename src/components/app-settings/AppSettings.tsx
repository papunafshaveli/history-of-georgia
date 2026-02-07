import React from "react";
import { View, Text, Switch, ImageBackground } from "react-native";

import { useSettings, useTranslation } from "@/src/hooks";
import { MusicIcon } from "@/src/assets";
import { GLOBAL_COLORS } from "@/src/constants";

import styles from "./styles";

const AppSettings: React.FC = () => {
  const t = useTranslation();
  const { isMuted, isVibrationOff, setIsMuted, setIsVibrationOff } =
    useSettings();

  const handleVibrationChange = () => {
    setIsVibrationOff(!isVibrationOff);
  };
  const handleSoundChange = () => {
    setIsMuted(!isMuted);
  };

  const vibrationThumbColor = isVibrationOff
    ? GLOBAL_COLORS.mixedColors.midGrey
    : GLOBAL_COLORS.mixedColors.darkCoffeeSecond;

  const vibrationTrackColor = {
    false: GLOBAL_COLORS.primaryColors.lightGrey,
    true: GLOBAL_COLORS.mixedColors.cream,
  };

  const soundThumbColor = isMuted
    ? GLOBAL_COLORS.mixedColors.midGrey
    : GLOBAL_COLORS.mixedColors.darkCoffeeSecond;

  const soundTrackColor = {
    false: GLOBAL_COLORS.primaryColors.lightGrey,
    true: GLOBAL_COLORS.mixedColors.cream,
  };

  const vibrationLabel = isVibrationOff
    ? t.vibration_turn_on
    : t.vibration_turn_off;
  const soundLabel = isMuted ? t.sound_turn_on : t.sound_turn_off;

  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.imageBackgroundWrapper}
        source={MusicIcon}
        resizeMode="contain"
        imageStyle={styles.imageBackground}
        accessibilityElementsHidden
      />
      <View style={styles.settingsWrapper}>
        <View style={styles.vibrationSettingsWrapper}>
          <View style={styles.vibrationTextAndIcon}>
            <Text style={styles.text}>{vibrationLabel}</Text>
          </View>
          <Switch
            value={!isVibrationOff}
            onValueChange={handleVibrationChange}
            trackColor={vibrationTrackColor}
            thumbColor={vibrationThumbColor}
            ios_backgroundColor={GLOBAL_COLORS.mixedColors.cream}
            accessibilityLabel={vibrationLabel}
            accessibilityRole="switch"
          />
        </View>

        <View style={styles.soundSettingsWrapper}>
          <View style={styles.soundTextAndIcon}>
            <Text style={styles.text}>{soundLabel}</Text>
          </View>
          <Switch
            value={!isMuted}
            onValueChange={handleSoundChange}
            trackColor={soundTrackColor}
            thumbColor={soundThumbColor}
            ios_backgroundColor={GLOBAL_COLORS.mixedColors.cream}
            accessibilityLabel={soundLabel}
            accessibilityRole="switch"
          />
        </View>
        <View />
      </View>
    </View>
  );
};

export default AppSettings;
