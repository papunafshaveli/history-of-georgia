import React from "react";
import { View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import {
  useAppTheme,
  usePlaySound,
  useSettings,
  useStyles,
  useThemeMode,
  useTranslation,
} from "@/src/hooks";
import { ClickSound } from "@/src/assets";
import {
  getAdjustedHeight,
  getAdjustedWidth,
  vibrateImpact,
} from "@/src/helpers";
import type { AppTheme } from "@/src/theme";

import IconButton from "../icon-button/IconButton";

type CustomHeaderProps = {
  onLeftBtnPress: () => void;
  onRightBtnPress: () => void;
  leftBtnIconName: keyof typeof MaterialIcons.glyphMap;
  rightBtnIconName: keyof typeof MaterialIcons.glyphMap;
};

const CustomHeader: React.FC<CustomHeaderProps> = ({
  onLeftBtnPress,
  onRightBtnPress,
  leftBtnIconName,
  rightBtnIconName,
}) => {
  const t = useTranslation();
  const { playSound } = usePlaySound();
  const { isMuted, isVibrationOff } = useSettings();
  const { isThemeDark } = useThemeMode();

  const styles = useStyles(getStyles);
  const { colors } = useAppTheme();
  const iconColor = isThemeDark ? colors.bronzeLight : colors.parchment;

  const handleLeftBtnPress = () => {
    if (!isVibrationOff) {
      vibrateImpact();
    }
    playSound(ClickSound, isMuted);
    onLeftBtnPress();
  };

  const handleRightBtnPress = () => {
    if (!isVibrationOff) {
      vibrateImpact();
    }
    playSound(ClickSound, isMuted);
    onRightBtnPress();
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.contentContainer}>
        <IconButton
          iconName={leftBtnIconName}
          color={iconColor}
          size={24}
          onPress={handleLeftBtnPress}
          accessibilityLabel={t.common_parameters}
        />
        <IconButton
          iconName={rightBtnIconName}
          color={iconColor}
          size={24}
          onPress={handleRightBtnPress}
          accessibilityLabel={t.common_rules}
        />
      </View>
    </View>
  );
};

export default CustomHeader;

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    headerContainer: {
      backgroundColor: theme.colors.chromeBg,
      height: getAdjustedHeight(80),
      justifyContent: "flex-end",
      zIndex: theme.zIndex.header,
      borderBottomLeftRadius: 15,
      borderBottomRightRadius: 15,
    },
    contentContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: getAdjustedWidth(16),
      height: getAdjustedHeight(60),
    },
  });
