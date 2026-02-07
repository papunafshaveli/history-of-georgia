import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

import { GLOBAL_COLORS } from "@/src/constants";

import styles from "./styles";

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
        <ActivityIndicator
          size="small"
          color={GLOBAL_COLORS.mixedColors.darkCoffeeSecond}
        />
      ) : (
        <Text style={styles.optionText}>{option}</Text>
      )}
    </Pressable>
  );
};

export default OptionButton;
