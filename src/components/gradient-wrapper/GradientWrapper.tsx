import React from "react";
import { StyleProp, ViewStyle } from "react-native";

import { LinearGradient } from "expo-linear-gradient";

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
  colors = ["#b9976e", "#d8c2aa", "#b9976e"] as const,
  locations = [0, 0.5, 1] as const,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
}) => {
  return (
    <LinearGradient
      colors={colors}
      locations={locations}
      start={start}
      end={end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
};

export default GradientWrapper;
