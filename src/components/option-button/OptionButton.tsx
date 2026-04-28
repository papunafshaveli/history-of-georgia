import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable } from "react-native";

import { useAppTheme, useStyles } from "@/src/hooks";

import { AppText } from "../text";

import { getStyles } from "./styles";

type OptionButtonProps = {
  option: string;
  isCorrect?: boolean;
  onPress: () => void;
  isOptionDisabled?: boolean;
  isLoading?: boolean;
  shouldShowCorrect?: boolean;
};

const OptionButton: React.FC<OptionButtonProps> = ({
  option,
  isCorrect,
  onPress,
  isOptionDisabled,
  isLoading,
  shouldShowCorrect,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  useEffect(() => {
    setIsPressed(false);
  }, [isLoading]);

  const handlePress = () => {
    setIsPressed(true);
    onPress();
  };

  return (
    <Pressable
      disabled={isOptionDisabled}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={option}
      accessibilityState={{ disabled: isOptionDisabled }}
      style={() => [
        styles.pressableBtn,
        shouldShowCorrect && isCorrect && styles.correctOption,
        isPressed && isCorrect && styles.correctOption,
        isPressed && !isCorrect && styles.incorrectOption,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.bronzeMid} />
      ) : (
        <AppText
          type="headline"
          fontFamily="script"
          style={styles.optionText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {option}
        </AppText>
      )}
    </Pressable>
  );
};

export default OptionButton;
