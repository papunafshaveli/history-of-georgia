import React from "react";
import { ActivityIndicator, ImageBackground } from "react-native";

import { lightTheme } from "@/src/theme";
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
      <ActivityIndicator size="large" color={lightTheme.colors.accent} />
    </ImageBackground>
  );
};

export default Loading;
