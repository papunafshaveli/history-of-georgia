import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useAppTheme, useStyles } from "@/src/hooks";
import { getAdjustedHeight } from "@/src/helpers";
import type { AppTheme } from "@/src/theme";

type ScoreChangeIndicatorProps = {
  value: number | null;
  changeKey: number;
};

const ANIMATION_DURATION_MS = 800;
const FLOAT_DISTANCE = getAdjustedHeight(30);

const ScoreChangeIndicator: React.FC<ScoreChangeIndicatorProps> = ({
  value,
  changeKey,
}) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (value === null || value === 0 || changeKey === 0) return;

    const timingConfig = {
      duration: ANIMATION_DURATION_MS,
      easing: Easing.out(Easing.ease),
    };

    translateY.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(-FLOAT_DISTANCE, timingConfig),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 0 }),
      withTiming(0, timingConfig),
    );
  }, [changeKey, value, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (value === null) return null;

  const label = `+${value}`;

  return (
    <Animated.Text
      allowFontScaling={false}
      style={[styles.text, { color: colors.correctBorder }, animatedStyle]}
    >
      {label}
    </Animated.Text>
  );
};

export default ScoreChangeIndicator;

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    text: {
      position: "absolute",
      top: 0,
      fontFamily: theme.fonts.serif,
      fontSize: getAdjustedHeight(18),
      fontWeight: "700",
    },
  });
