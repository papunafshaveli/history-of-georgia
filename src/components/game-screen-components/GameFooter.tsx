import React from "react";
import { Pressable, View, Text } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { GLOBAL_COLORS } from "@/src/constants";
import { useTranslation } from "@/src/hooks";

import IconButton from "../icon-button/IconButton";
import GradientWrapper from "../gradient-wrapper/GradientWrapper";

import styles from "./styles";

type GameFooterProps = {
  onExit: () => void;
  onHint: () => void;
  onSettings: () => void;
  hintsCount: number;
  isHintDisabled: boolean;
};

const GameFooter: React.FC<GameFooterProps> = ({
  onExit,
  onHint,
  onSettings,
  hintsCount,
  isHintDisabled,
}) => {
  const t = useTranslation();

  const hintWrapperColor =
    hintsCount === 0 || isHintDisabled
      ? (["#C4B3A1", "#E0D8CC", "#C4B3A1"] as const)
      : undefined;

  const isDisabled = hintsCount === 0 || isHintDisabled;

  return (
    <View style={styles.footerWrapper}>
      <GradientWrapper style={styles.iconButtonContainer}>
        <IconButton
          iconName="arrow-left-thin"
          size={30}
          color={GLOBAL_COLORS.primaryColors.dark}
          onPress={onExit}
          containerStyle={styles.iconButtonContainer}
          accessibilityLabel={t.common_logout}
        />
      </GradientWrapper>

      <Pressable
        disabled={isDisabled}
        onPress={onHint}
        accessibilityRole="button"
        accessibilityLabel={`${t.common_hint} (${hintsCount})`}
        accessibilityState={{ disabled: isDisabled }}
      >
        <GradientWrapper style={styles.helpGradient} colors={hintWrapperColor}>
          <View style={styles.helpIconAdnText}>
            <MaterialCommunityIcons
              name="lightbulb-on"
              size={24}
              color={GLOBAL_COLORS.primaryColors.dark}
            />
            <Text style={styles.hintText}>
              {t.common_hint} ({hintsCount})
            </Text>
          </View>
        </GradientWrapper>
      </Pressable>

      <GradientWrapper style={styles.iconButtonContainer}>
        <IconButton
          iconName="cellphone-sound"
          size={24}
          color={GLOBAL_COLORS.primaryColors.dark}
          onPress={onSettings}
          containerStyle={styles.iconButtonContainer}
          accessibilityLabel={t.common_parameters}
        />
      </GradientWrapper>
    </View>
  );
};

export default React.memo(GameFooter);
