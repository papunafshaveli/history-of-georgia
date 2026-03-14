import React from "react";
import { Pressable, View } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";

import IconButton from "../icon-button/IconButton";
import GradientWrapper from "../gradient-wrapper/GradientWrapper";
import { AppText } from "../text";

import { getStyles } from "./styles";

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
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const isDisabled = hintsCount === 0 || isHintDisabled;
  const hintWrapperColor = isDisabled
    ? ([colors.disabled, colors.surfaceSunken, colors.disabled] as const)
    : undefined;

  return (
    <View style={styles.footerWrapper}>
      <GradientWrapper style={styles.iconButtonContainer}>
        <IconButton
          iconName="keyboard-backspace"
          size={30}
          color={colors.text}
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
              color={colors.text}
            />

            <AppText
              color={colors.text}
              type="title"
              fontFamily="script"
              style={styles.hintText}
            >
              {t.common_hint} ({hintsCount})
            </AppText>
          </View>
        </GradientWrapper>
      </Pressable>

      <GradientWrapper style={styles.iconButtonContainer}>
        <IconButton
          iconName="settings-suggest"
          size={24}
          color={colors.text}
          onPress={onSettings}
          containerStyle={styles.iconButtonContainer}
          accessibilityLabel={t.common_parameters}
        />
      </GradientWrapper>
    </View>
  );
};

export default React.memo(GameFooter);
