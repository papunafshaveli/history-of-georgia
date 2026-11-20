import React from "react";
import { View, ImageBackground, Pressable } from "react-native";

import { CloseIcon } from "@/src/assets";

import { useAppTheme, useStyles } from "@/src/hooks";

import GradientWrapper from "../gradient-wrapper/GradientWrapper";
import { AppText, type TextType } from "../text";

import { getStyles } from "./styles";

type EndgameProps = {
  onPressContinue: () => void;
  onPressExit: () => void;
  title: string;
  continueBtnText: string;
  closeBtnText: string;
  // A short question reads large; a longer explanation needs a smaller size to fit above the buttons.
  titleType?: TextType;
};

const Endgame: React.FC<EndgameProps> = ({
  onPressContinue,
  onPressExit,
  title,
  continueBtnText,
  closeBtnText,
  titleType = "display",
}) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.imageBackgroundWrapper}
        source={CloseIcon}
        resizeMode="contain"
        imageStyle={styles.imageBackground}
        accessibilityElementsHidden
      />
      <AppText
        fontFamily="script"
        type={titleType}
        color={colors.onImage}
        style={styles.question}
      >
        {title}
      </AppText>
      <View style={styles.buttonsWrapper}>
        <Pressable
          onPress={onPressContinue}
          accessibilityRole="button"
          accessibilityLabel={continueBtnText}
        >
          <GradientWrapper style={styles.button}>
            <AppText fontFamily="script" type="headline">
              {continueBtnText}
            </AppText>
          </GradientWrapper>
        </Pressable>
        <Pressable
          onPress={onPressExit}
          accessibilityRole="button"
          accessibilityLabel={closeBtnText}
        >
          <GradientWrapper style={styles.button}>
            <AppText fontFamily="script" type="headline">
              {closeBtnText}
            </AppText>
          </GradientWrapper>
        </Pressable>
      </View>
    </View>
  );
};

export default Endgame;
