import React from "react";
import { View, Text, ImageBackground, Pressable } from "react-native";

import { HintIcon } from "@/src/assets";
import { useTranslation } from "@/src/hooks";

import GradientWrapper from "../gradient-wrapper/GradientWrapper";

import styles from "./styles";

type HintProps = {
  onPressContinue: () => void;
  currentHint?: string;
};

const Hint: React.FC<HintProps> = ({ onPressContinue, currentHint }) => {
  const t = useTranslation();
  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.imageBackgroundWrapper}
        source={HintIcon}
        resizeMode="contain"
        imageStyle={styles.imageBackground}
        accessibilityElementsHidden
      />
      <Text accessibilityRole="text" style={styles.hint}>
        {currentHint}
      </Text>

      <Pressable
        style={styles.button}
        onPress={onPressContinue}
        accessibilityRole="button"
        accessibilityLabel={t.common_close}
      >
        <GradientWrapper style={styles.gradient}>
          <Text style={styles.btnText}>{t.common_close}</Text>
        </GradientWrapper>
      </Pressable>
    </View>
  );
};

export default Hint;
