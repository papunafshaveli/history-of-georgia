import React from "react";
import { View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  useAppTheme,
  useSettings,
  useTranslation,
  useThemeMode,
} from "@/src/hooks";
import { ThemeMode, useStyles } from "@/src/theme";

import { AppText } from "../text";

import AccountSection from "./AccountSection";
import SettingToggle from "./SettingToggle";
import { getStyles } from "./styles";

const THEME_OPTIONS = [
  { mode: ThemeMode.LIGHT, key: "theme_light" as const },
  { mode: ThemeMode.DARK, key: "theme_dark" as const },
  { mode: ThemeMode.SYSTEM, key: "theme_system" as const },
];

const AppSettings: React.FC = () => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const {
    isMuted,
    isVibrationOff,
    isPushEnabled,
    setIsMuted,
    setIsVibrationOff,
    setIsPushEnabled,
  } = useSettings();
  const { themeMode, setThemeMode } = useThemeMode();

  const styles = useStyles(getStyles);

  const vibrationLabel = isVibrationOff
    ? t.vibration_turn_on
    : t.vibration_turn_off;
  const soundLabel = isMuted ? t.sound_turn_on : t.sound_turn_off;
  const pushLabel = isPushEnabled
    ? t.notifications_turn_off
    : t.notifications_turn_on;

  const handleVibrationToggle = () => setIsVibrationOff(!isVibrationOff);
  const handleSoundToggle = () => setIsMuted(!isMuted);
  const handlePushToggle = () => setIsPushEnabled(!isPushEnabled);
  const handleThemePress = (mode: ThemeMode) => () => setThemeMode(mode);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <SettingToggle
          iconName="vibrate"
          label={vibrationLabel}
          value={!isVibrationOff}
          onValueChange={handleVibrationToggle}
        />
        <View style={styles.divider} />
        <SettingToggle
          iconName="volume-high"
          label={soundLabel}
          value={!isMuted}
          onValueChange={handleSoundToggle}
        />
        <View style={styles.divider} />
        <SettingToggle
          iconName="bell"
          label={pushLabel}
          value={isPushEnabled}
          onValueChange={handlePushToggle}
        />
      </View>

      <View style={styles.themeSection}>
        <View style={styles.themeLabelRow}>
          <MaterialCommunityIcons
            name="theme-light-dark"
            size={22}
            color={colors.onImage}
          />
          <AppText type="title" fontFamily="script" color={colors.onImage}>
            {t.common_theme}
          </AppText>
        </View>
        <View style={styles.themeOptions}>
          {THEME_OPTIONS.map(({ mode, key }) => {
            const isActive = themeMode === mode;
            return (
              <Pressable
                key={mode}
                onPress={handleThemePress(mode)}
                accessibilityRole="button"
                accessibilityLabel={t[key]}
                style={[
                  styles.themeOption,
                  isActive && styles.themeOptionActive,
                ]}
              >
                <AppText
                  color={isActive ? colors.textOnPrimary : colors.onImage}
                  fontFamily="script"
                  type="headline"
                  style={[
                    styles.themeOptionText,
                    isActive && styles.themeOptionTextActive,
                  ]}
                >
                  {t[key]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <AccountSection />
    </View>
  );
};

export default AppSettings;
