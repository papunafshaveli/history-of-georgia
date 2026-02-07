import React from "react";
import { View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { usePlaySound, useSettings } from "@/src/hooks";
import { ClickSound } from "@/src/assets";
import { getAdjustedWidth, vibrateImpact } from "@/src/helpers";

import IconButton from "../icon-button/IconButton";
import { GLOBAL_COLORS } from "../../constants";

type CustomHeaderProps = {
  onLeftBtnPress: () => void;
  onRightBtnPress: () => void;
  leftBtnIconName: keyof typeof MaterialCommunityIcons.glyphMap;
  rightBtnIconName: keyof typeof MaterialCommunityIcons.glyphMap;
};

const CustomHeader: React.FC<CustomHeaderProps> = ({
  onLeftBtnPress,
  onRightBtnPress,
  leftBtnIconName,
  rightBtnIconName,
}) => {
  const { playSound } = usePlaySound();
  const { isMuted, isVibrationOff } = useSettings();

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
          color={GLOBAL_COLORS.mixedColors.lightCoffee}
          size={24}
          onPress={handleLeftBtnPress}
          accessibilityLabel="Settings"
        />
        <IconButton
          iconName={rightBtnIconName}
          color={GLOBAL_COLORS.mixedColors.lightCoffee}
          size={24}
          onPress={handleRightBtnPress}
          accessibilityLabel="Rules"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: GLOBAL_COLORS.primaryColors.dark,
    height: 80,
    justifyContent: "flex-end",
    zIndex: 1000,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingHorizontal: getAdjustedWidth(16),
    height: 60,
  },
});

export default CustomHeader;
