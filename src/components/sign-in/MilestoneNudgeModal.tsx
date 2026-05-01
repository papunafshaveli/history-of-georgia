import React, { useCallback } from "react";
import { Platform, Pressable, ToastAndroid, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useAppTheme, useAuth, useStyles, useTranslation } from "@/src/hooks";
import type { SignInResult } from "@/src/context/AuthProvider";

import Modal from "../modal/Modal";
import { AppText } from "../text";

import { getStyles } from "./styles";

const showSignInFailureToast = (message: string) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
};

type MilestoneNudgeModalProps = {
  isVisible: boolean;
  score: number;
  onSignedIn: (result: SignInResult) => void;
  onSkip: () => void;
};

type ProviderButtonProps = {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap | "logo-apple";
  onPress: () => void;
};

const ProviderButton: React.FC<ProviderButtonProps> = ({
  label,
  iconName,
  onPress,
}) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const buttonStyle = useCallback(
    ({ pressed }: { pressed: boolean }) =>
      pressed
        ? [styles.providerButton, styles.providerButtonPressed]
        : styles.providerButton,
    [styles],
  );

  const isApple = iconName === "logo-apple";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={buttonStyle}
      onPress={onPress}
    >
      {isApple ? (
        <Ionicons name="logo-apple" size={22} color={colors.bronzeDark} />
      ) : (
        <MaterialCommunityIcons
          name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
          size={22}
          color={colors.bronzeDark}
        />
      )}
      <AppText type="subHeadline" fontFamily="serif" color={colors.bronzeDark}>
        {label}
      </AppText>
    </Pressable>
  );
};

const MilestoneNudgeModal: React.FC<MilestoneNudgeModalProps> = ({
  isVisible,
  score,
  onSignedIn,
  onSkip,
}) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  const { signInWithGoogle, signInWithApple } = useAuth();

  const showApple = Platform.OS === "ios";

  const bodyText = t.milestone_body.replace("{score}", String(score));

  const handleGooglePress = useCallback(async () => {
    try {
      const result = await signInWithGoogle();
      // Treat any non-cancellation as a successful sign-in attempt; the
      // hook returns wasFirstLink:false on cancel too, so we differentiate
      // by whether the auth.currentUser actually changed identity. The
      // simplest signal is whether a displayName came back from a real
      // OAuth round trip — cancelled responses give us null.
      if (result.displayName !== null || result.wasFirstLink) {
        onSignedIn(result);
      }
    } catch {
      showSignInFailureToast(t.signin_failure_toast);
    }
  }, [signInWithGoogle, onSignedIn, t.signin_failure_toast]);

  const handleApplePress = useCallback(async () => {
    try {
      const result = await signInWithApple();
      if (result.displayName !== null || result.wasFirstLink) {
        onSignedIn(result);
      }
    } catch {
      showSignInFailureToast(t.signin_failure_toast);
    }
  }, [signInWithApple, onSignedIn, t.signin_failure_toast]);

  const skipButtonStyle = useCallback(
    ({ pressed }: { pressed: boolean }) =>
      pressed ? [styles.skipPressable, { opacity: 0.6 }] : styles.skipPressable,
    [styles],
  );

  const renderComponent = (
    <View style={styles.container}>
      <View style={styles.topGroup}>
        <AppText
          type="subHeadline"
          fontFamily="serif"
          color={colors.onImage}
          style={styles.body}
        >
          {bodyText}
        </AppText>
        <AppText
          type="body"
          fontFamily="sans"
          color={colors.bronzeDark}
          style={styles.body}
        >
          {t.milestone_subbody}
        </AppText>
      </View>

      <View style={styles.buttonsGroup}>
        <ProviderButton
          label={t.signin_button_google}
          iconName="google"
          onPress={handleGooglePress}
        />
        {showApple ? (
          <ProviderButton
            label={t.signin_button_apple}
            iconName="logo-apple"
            onPress={handleApplePress}
          />
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.milestone_skip_button}
          onPress={onSkip}
          style={skipButtonStyle}
        >
          <AppText
            type="body"
            fontFamily="sans"
            color={colors.bronzeMid}
            style={styles.skipText}
          >
            {t.milestone_skip_button}
          </AppText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal
      isVisible={isVisible}
      headerTitle={t.milestone_title}
      renderComponent={renderComponent}
    />
  );
};

export default MilestoneNudgeModal;
