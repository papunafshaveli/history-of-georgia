import React from "react";
import { View, Pressable, StyleProp, ViewStyle } from "react-native";

import {
  useAppTheme,
  usePlaySound,
  useSettings,
  useStyles,
  useTranslation,
} from "@/src/hooks";
import { Difficulty } from "@/src/types/quizQuestion";
import { getAdjustedHeight, vibrateImpact } from "@/src/helpers";
import { ClickSound } from "@/src/assets";

import { AppText } from "../text";

import { getStyles, RING_ORBIT_RADIUS } from "./styles";

type DifficultyRingProps = {
  selectedDifficulty: Difficulty | undefined;
  onSelectDifficulty: (value: Difficulty | undefined) => void;
  children: React.ReactNode;
};

type Quadrant = "topLeft" | "topRight" | "bottomRight" | "bottomLeft";

type DifficultyOption = {
  value: Difficulty | undefined;
  key:
    | "difficulty_all"
    | "difficulty_easy"
    | "difficulty_medium"
    | "difficulty_hard";
  angleDeg: number;
  quadrant: Quadrant;
};

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    value: undefined,
    key: "difficulty_all",
    angleDeg: -90,
    quadrant: "topRight",
  },
  {
    value: "easy",
    key: "difficulty_easy",
    angleDeg: 0,
    quadrant: "bottomRight",
  },
  {
    value: "medium",
    key: "difficulty_medium",
    angleDeg: 90,
    quadrant: "bottomLeft",
  },
  { value: "hard", key: "difficulty_hard", angleDeg: 180, quadrant: "topLeft" },
];

const getLabelRotation = (angleDeg: number): string | undefined => {
  if (angleDeg === 0) return "90deg";
  if (angleDeg === 180) return "-90deg";
  return undefined;
};

const DifficultyRing: React.FC<DifficultyRingProps> = ({
  selectedDifficulty,
  onSelectDifficulty,
  children,
}) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  const t = useTranslation();
  const { isMuted, isVibrationOff } = useSettings();
  const { playSound } = usePlaySound();

  const maskStyleMap: Record<Quadrant, StyleProp<ViewStyle>> = {
    topLeft: styles.segmentMaskTopLeft,
    topRight: styles.segmentMaskTopRight,
    bottomRight: styles.segmentMaskBottomRight,
    bottomLeft: styles.segmentMaskBottomLeft,
  };

  const circleStyleMap: Record<Quadrant, StyleProp<ViewStyle>> = {
    topLeft: styles.segmentCircleTopLeft,
    topRight: styles.segmentCircleTopRight,
    bottomRight: styles.segmentCircleBottomRight,
    bottomLeft: styles.segmentCircleBottomLeft,
  };

  const handlePress = (value: Difficulty | undefined) => () => {
    if (!isVibrationOff) {
      vibrateImpact();
    }
    playSound(ClickSound, isMuted);
    onSelectDifficulty(value);
  };

  const labelRadius = RING_ORBIT_RADIUS - getAdjustedHeight(4);

  return (
    <View style={styles.wrapper}>
      <View style={styles.outerEdge} />

      <View style={styles.segmentsWrapper} pointerEvents="none">
        {DIFFICULTY_OPTIONS.map(({ value, quadrant }) => {
          const isActive = selectedDifficulty === value;
          return (
            <View
              key={`segment-${quadrant}`}
              style={[styles.segmentMask, maskStyleMap[quadrant]]}
            >
              <View
                style={[
                  styles.segmentCircle,
                  circleStyleMap[quadrant],
                  isActive ? styles.segmentActive : styles.segmentInactive,
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.innerEdge} />

      {children}

      {DIFFICULTY_OPTIONS.map(({ value, key, angleDeg }) => {
        const isActive = selectedDifficulty === value;
        const rad = (angleDeg * Math.PI) / 180;
        const isSideLabel = angleDeg === 0 || angleDeg === 180;
        const offsetX = Math.cos(rad) * labelRadius;
        const offsetY = Math.sin(rad) * labelRadius;
        const rotation = getLabelRotation(angleDeg);

        const pressableStyles = [
          styles.labelPressable,
          isSideLabel && styles.labelPressableVertical,
          {
            transform: [
              { translateX: offsetX },
              { translateY: offsetY },
              { rotate: rotation ?? "0deg" },
            ],
          },
        ];
        const textFont = isActive ? "sans" : "serif";

        const textType = isActive ? "headline" : "subHeadline";

        const textColor = isActive ? colors.ringTextActive : colors.bronzeLight;

        return (
          <View
            key={key}
            style={styles.labelCentering}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={handlePress(value)}
              accessibilityRole="button"
              accessibilityLabel={t[key]}
              style={pressableStyles}
            >
              <AppText
                color={textColor}
                fontFamily={textFont}
                type={textType}
                style={styles.labelText}
              >
                {t[key]}
              </AppText>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
};

export default DifficultyRing;
