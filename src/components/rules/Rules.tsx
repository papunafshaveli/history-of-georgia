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
  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.imageBackgroundWrapper}
        source={InfoIcon}
        resizeMode="contain"
        imageStyle={styles.imageBackground}
      />
      <View style={styles.rulesTextWrapper}>
        <>
          <AppText color={colors.onImage} fontSize={17} style={styles.ruleTextTitle}>
            {t.rules_title}
          </AppText>
          <AppText color={colors.onImage} type="body" style={styles.ruleTextDesc}>
            {t.rules_description}
          </AppText>
        </>
      </View>
      <View />
    </View>
  );
};

export default Rules;
