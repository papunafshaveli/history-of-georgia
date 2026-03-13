import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ImageBackground } from "react-native";
import * as Animatable from "react-native-animatable";
import * as SplashScreen from "expo-splash-screen";

import {
  NavigationProp,
  ParamListBase,
  useNavigation,
} from "@react-navigation/native";

import { SplashScreenBackground } from "@/src/assets";
import { SPLASH_SCREEN_MIN_DURATION_MS } from "@/src/constants";
import { useStyles, useTranslation } from "@/src/hooks";

import { getStyles } from "./styles";

const CustomSplashScreen = () => {
  const navigation: NavigationProp<ParamListBase> = useNavigation();
  const styles = useStyles(getStyles);

  useEffect(() => {
    SplashScreen.hideAsync();

    const timer = setTimeout(() => {
      navigation.navigate("tabs");
    }, SPLASH_SCREEN_MIN_DURATION_MS);

    return () => clearTimeout(timer);
  }, [navigation]);

  const t = useTranslation();

  return (
    <SafeAreaView edges={[]} style={styles.splashScreenContainer}>
      <View style={styles.splashScreenContainer}>
        <ImageBackground
          source={SplashScreenBackground}
          resizeMode="cover"
          style={styles.imageBackContainer}
          imageStyle={styles.imageBackStyles}
        >
          <View style={styles.textsContainer}>
            <Animatable.Text animation="fadeInLeft" style={styles.fistText}>
              {t.common_know}
            </Animatable.Text>
            <Animatable.Text animation="fadeInRight" style={styles.secondText}>
              {t.common_georgian}
            </Animatable.Text>
            <Animatable.Text animation="fadeInLeft" style={styles.thirdText}>
              {t.common_history}
            </Animatable.Text>
          </View>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
};

export default CustomSplashScreen;
