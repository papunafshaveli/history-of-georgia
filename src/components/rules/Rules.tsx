import React from "react";
import { View, ImageBackground } from "react-native";

import { InfoIcon } from "@/src/assets";
import { useAppTheme, useTranslation, useStyles } from "@/src/hooks";

import { AppText } from "../text";

import { getStyles } from "./styles";

const Rules = () => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const bullets = [
    t.rules_lives,
    t.rules_hints,
    t.rules_scoring_intro,
    `   ${t.rules_scoring_easy}`,
    `   ${t.rules_scoring_medium}`,
    `   ${t.rules_scoring_hard}`,
    t.rules_scoring_outro,
  ];

  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.imageBackgroundWrapper}
        source={InfoIcon}
        resizeMode="contain"
        imageStyle={styles.imageBackground}
      />
      <View style={styles.rulesTextWrapper}>
        <AppText
          color={colors.onImage}
          type="display"
          fontFamily="script"
          style={styles.alignCenter}
        >
          {t.rules_title}
        </AppText>
        {bullets.map((line, index) => (
          <AppText
            key={index}
            color={colors.onImage}
            type="subHeadline"
            fontFamily="serif"
            style={styles.alignCenter}
          >
            {line}
          </AppText>
        ))}
      </View>
      <View />
    </View>
  );
};

export default Rules;
