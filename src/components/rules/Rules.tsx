import React from "react";
import { View, Text, ImageBackground } from "react-native";

import { InfoIcon } from "@/src/assets";
import { useTranslation } from "@/src/hooks";

import styles from "./styles";

const Rules = () => {
  const t = useTranslation();
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
          <Text style={styles.ruleTextTitle}>{t.rules_title}</Text>
          <Text style={styles.ruleTextDesc}>{t.rules_description}</Text>
        </>
      </View>
      <View />
    </View>
  );
};

export default Rules;
