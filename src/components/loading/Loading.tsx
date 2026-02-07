import React from "react";
import { ActivityIndicator, ImageBackground } from "react-native";

import { GLOBAL_COLORS } from "@/src/constants";
import { SplashScreenBackground } from "@/src/assets";

import styles from "./styles";

const Loading = () => {
  return (
    <ImageBackground
      source={SplashScreenBackground}
      resizeMode="cover"
      style={styles.imageBackContainer}
      imageStyle={styles.imageBackStyles}
    >
      <ActivityIndicator size="large" color={GLOBAL_COLORS.primaryColors.red} />
    </ImageBackground>
  );
};

export default Loading;
