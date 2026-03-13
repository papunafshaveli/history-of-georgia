import React, { useLayoutEffect, useState } from "react";
import { FlatList } from "react-native";

import { useStyles } from "@/src/hooks";

import OptionButton from "../option-button/OptionButton";

import { getStyles } from "./styles";

type OptionDisplayProps = {
  options?: string[];
  correctAnswer?: string;
  onOptionPress: (option: string) => void;
  isLoading: boolean;
  isOptionDisabled: boolean;
};

const OptionsDisplay: React.FC<OptionDisplayProps> = ({
  options,
  correctAnswer,
  onOptionPress,
  isLoading,
  isOptionDisabled,
}) => {
  const styles = useStyles(getStyles);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useLayoutEffect(() => {
    setSelectedOption(null);
  }, [options]);

  const handleOptionPress = (option: string) => {
    setSelectedOption(option);
    onOptionPress(option);
  };

  return (
    <FlatList
      contentContainerStyle={styles.flatListContentContainer}
      style={styles.optionsWrapper}
      data={options}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <OptionButton
          isLoading={isLoading}
          option={item}
          isCorrect={item === correctAnswer}
          onPress={() => handleOptionPress(item)}
          isOptionDisabled={isOptionDisabled || !!selectedOption}
          shouldShowCorrect={!!selectedOption && !isLoading}
        />
      )}
    />
  );
};

export default React.memo(OptionsDisplay);
