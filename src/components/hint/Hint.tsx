import React from "react";
import { View, ImageBackground, Pressable } from "react-native";

import { HintIcon } from "@/src/assets";
import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";

import GradientWrapper from "../gradient-wrapper/GradientWrapper";
import { AppText } from "../text";

import { getStyles } from "./styles";

type HintProps = {
  onPressContinue: () => void;
  currentHint?: string;
};

const Hint: React.FC<HintProps> = ({ onPressContinue, currentHint }) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.imageBackgroundWrapper}
        source={HintIcon}
        resizeMode="contain"
        imageStyle={styles.imageBackground}
        accessibilityElementsHidden
      />
      <AppText
        fontFamily="script"
        type="title"
        color={colors.onImage}
        accessibilityRole="text"
        style={styles.hint}
      >
        {currentHint}
      </AppText>

      <Pressable
        style={styles.button}
        onPress={onPressContinue}
        accessibilityRole="button"
        accessibilityLabel={t.common_close}
      >
        <GradientWrapper style={styles.gradient}>
          <AppText fontFamily="script" type="headline">
            {t.common_close}
          </AppText>
        </GradientWrapper>
      </Pressable>
    </View>
  );
};

export default Hint;
