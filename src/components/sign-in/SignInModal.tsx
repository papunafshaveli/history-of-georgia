import React, { useCallback } from "react";
import { Image, Platform, Pressable, ToastAndroid, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Ink } from "@/src/assets";
import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";

import Modal from "../modal/Modal";
import { AppText } from "../text";

import { getStyles } from "./styles";

type SignInModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

const showComingSoonToast = (message: string) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
  // iOS toast wiring lands when Phase 4 wires real OAuth; stub no-op for now.
};

type GoogleMarkProps = { size?: number };

const GoogleMark: React.FC<GoogleMarkProps> = () => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  return (
    <View style={styles.googleMark}>
      <AppText type="caption" fontFamily="serif" color={colors.bronzeDark}>
        G
      </AppText>
    </View>
  );
};

const SignInModal: React.FC<SignInModalProps> = ({ isVisible, onClose }) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const handleGooglePress = useCallback(() => {
    showComingSoonToast(t.signin_coming_soon);
  }, [t.signin_coming_soon]);

  const handleApplePress = useCallback(() => {
    showComingSoonToast(t.signin_coming_soon);
  }, [t.signin_coming_soon]);

  const buttonStyle = useCallback(
    ({ pressed }: { pressed: boolean }) =>
      pressed
        ? [styles.providerButton, styles.providerButtonPressed]
        : styles.providerButton,
    [styles],
  );

  const showApple = Platform.OS === "ios";

  const renderComponent = (
    <View style={styles.container}>
      <View style={styles.topGroup}>
        <Image source={Ink} resizeMode="contain" style={styles.flourish} />
        <AppText
          type="subHeadline"
          fontFamily="serif"
          color={colors.onImage}
          style={styles.body}
        >
          {t.signin_modal_body}
        </AppText>
      </View>

      <View style={styles.buttonsGroup}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.signin_button_google}
          style={buttonStyle}
          onPress={handleGooglePress}
        >
          <GoogleMark />
          <AppText type="subHeadline" fontFamily="serif" color={colors.bronzeDark}>
            {t.signin_button_google}
          </AppText>
        </Pressable>

        {showApple ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.signin_button_apple}
            style={buttonStyle}
            onPress={handleApplePress}
          >
            <Ionicons name="logo-apple" size={20} color={colors.bronzeDark} />
            <AppText type="subHeadline" fontFamily="serif" color={colors.bronzeDark}>
              {t.signin_button_apple}
            </AppText>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.signin_skip}
          onPress={onClose}
          style={styles.skipPressable}
        >
          <AppText
            type="body"
            fontFamily="sans"
            color={colors.bronzeMid}
            style={styles.skipText}
          >
            {t.signin_skip}
          </AppText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal
      isVisible={isVisible}
      headerTitle={t.signin_modal_title}
      onClose={onClose}
      renderComponent={renderComponent}
    />
  );
};

export default SignInModal;
