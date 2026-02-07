import React from "react";
import { View, Text, ImageBackground, Pressable } from "react-native";

import { CloseIcon } from "@/src/assets";

import GradientWrapper from "../gradient-wrapper/GradientWrapper";

import styles from "./styles";

type EndgameProps = {
  onPressContinue: () => void;
  onPressExit: () => void;
  title: string;
  continueBtnText: string;
  closeBtnText: string;
};

const Endgame: React.FC<EndgameProps> = ({
  onPressContinue,
  onPressExit,
  title,
  continueBtnText,
  closeBtnText,
}) => {
  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.imageBackgroundWrapper}
        source={CloseIcon}
        resizeMode="contain"
        imageStyle={styles.imageBackground}
        accessibilityElementsHidden
      />
      <Text style={styles.question}>{title}</Text>
      <View style={styles.buttonsWrapper}>
        <Pressable
          onPress={onPressContinue}
          accessibilityRole="button"
          accessibilityLabel={continueBtnText}
        >
          <GradientWrapper style={styles.button}>
            <Text style={styles.btnText}>{continueBtnText}</Text>
          </GradientWrapper>
        </Pressable>
        <Pressable
          onPress={onPressExit}
          accessibilityRole="button"
          accessibilityLabel={closeBtnText}
        >
          <GradientWrapper style={styles.button}>
            <Text style={styles.btnText}>{closeBtnText}</Text>
          </GradientWrapper>
        </Pressable>
      </View>
    </View>
  );
};

export default Endgame;
