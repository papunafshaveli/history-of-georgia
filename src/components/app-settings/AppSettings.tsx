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
  const { isMuted, isVibrationOff, setIsMuted, setIsVibrationOff } =
    useSettings();
  const { themeMode, setThemeMode } = useThemeMode();

  const styles = useStyles(getStyles);

  const toggleSettings = [
    {
      key: "vibration",
      iconName: "vibrate" as const,
      label: isVibrationOff ? t.vibration_turn_on : t.vibration_turn_off,
      value: !isVibrationOff,
      onValueChange: () => setIsVibrationOff(!isVibrationOff),
    },
    {
      key: "sound",
      iconName: "volume-high" as const,
      label: isMuted ? t.sound_turn_on : t.sound_turn_off,
      value: !isMuted,
      onValueChange: () => setIsMuted(!isMuted),
    },
  ];

  return (
    <View style={styles.container}>
      {toggleSettings.map(({ key, iconName, label, value, onValueChange }) => (
        <SettingToggle
          key={key}
          iconName={iconName}
          label={label}
          value={value}
          onValueChange={onValueChange}
        />
      ))}

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
                onPress={() => setThemeMode(mode)}
                accessibilityRole="button"
                accessibilityLabel={t[key]}
                style={[
                  styles.themeOption,
                  isActive && styles.themeOptionActive,
                ]}
              >
                <AppText
                  color={isActive ? colors.textOnPrimary : colors.text}
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
    </View>
  );
};

export default AppSettings;
