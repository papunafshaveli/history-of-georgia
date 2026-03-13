import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme } from "@/src/hooks";

interface GradientWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  colors?: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

const GradientWrapper: React.FC<GradientWrapperProps> = ({
  children,
  style,
  colors,
  locations = [0, 0.5, 1] as const,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
}) => {
  const { colors: appColors } = useAppTheme();
  const defaultColors = [
    appColors.gradientStart,
    appColors.gradientMid,
    appColors.gradientEnd,
  ] as const;

  return (
    <View style={[style, { overflow: "hidden" }]}>
      <LinearGradient
        colors={colors ?? defaultColors}
        locations={locations}
        start={start}
        end={end}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </View>
  );
};

export default GradientWrapper;
