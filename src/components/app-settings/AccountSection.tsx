import React, { useCallback, useState } from "react";
import { Pressable, ToastAndroid, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { IS_ANDROID, IS_IOS } from "@/src/constants";
import {
  useAppTheme,
  useAuth,
  useStyles,
  useTranslation,
} from "@/src/hooks";
import { logger } from "@/src/helpers/logger";

import Modal from "../modal/Modal";
import { AppText } from "../text";

import { getStyles } from "./styles";

const ROW_ICON_SIZE = 22;

const showSignInFailureToast = (message: string) => {
  if (IS_ANDROID) {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
};

type AccountRowProps = {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap | "logo-google" | "logo-apple";
  label: string;
  onPress?: () => void;
  rightIconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  labelColor?: string;
  iconColor?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
};

const AccountRow: React.FC<AccountRowProps> = ({
  iconName,
  label,
  onPress,
  rightIconName,
  labelColor,
  iconColor,
  accessibilityLabel,
  disabled,
}) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  const resolvedLabelColor = labelColor ?? colors.onImage;
  const resolvedIconColor = iconColor ?? colors.onImage;

  const renderIcon = () => {
    if (iconName === "logo-apple") {
      return (
        <Ionicons name="logo-apple" size={ROW_ICON_SIZE} color={resolvedIconColor} />
      );
    }
    if (iconName === "logo-google") {
      return (
        <MaterialCommunityIcons
          name="google"
          size={ROW_ICON_SIZE}
          color={resolvedIconColor}
        />
      );
    }
    return (
      <MaterialCommunityIcons
        name={iconName}
        size={ROW_ICON_SIZE}
        color={resolvedIconColor}
      />
    );
  };

  const isDisabled = !!disabled;
  const accessibilityRowLabel = accessibilityLabel ?? label;
  const rowAccessibilityState = { disabled: isDisabled };
  const rippleConfig = isDisabled
    ? null
    : { color: colors.parchmentDivider };
  const pressableStyle = isDisabled ? styles.accountRowDisabled : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityRowLabel}
      accessibilityState={rowAccessibilityState}
      onPress={onPress}
      disabled={disabled}
      android_ripple={rippleConfig}
      style={pressableStyle}
    >
      <View style={styles.accountRow}>
        <View style={styles.accountRowLeft}>
          {renderIcon()}
          <AppText
            type="title"
            fontFamily="script"
            color={resolvedLabelColor}
            numberOfLines={1}
            style={styles.accountRowLabel}
          >
            {label}
          </AppText>
        </View>
        {rightIconName ? (
          <MaterialCommunityIcons
            name={rightIconName}
            size={20}
            color={colors.bronzeMid}
          />
        ) : null}
      </View>
    </Pressable>
  );
};

const AccountSection: React.FC = () => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  const {
    isAnonymous,
    isSigningIn,
    signInWithGoogle,
    signInWithApple,
    signOut: authSignOut,
  } = useAuth();

  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  const handleGooglePress = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch {
      showSignInFailureToast(t.signin_failure_toast);
    }
  }, [signInWithGoogle, t.signin_failure_toast]);

  const handleApplePress = useCallback(async () => {
    try {
      await signInWithApple();
    } catch {
      showSignInFailureToast(t.signin_failure_toast);
    }
  }, [signInWithApple, t.signin_failure_toast]);

  const handleSignOutPress = useCallback(() => {
    setSignOutConfirmOpen(true);
  }, []);

  const handleSignOutCancel = useCallback(() => {
    setSignOutConfirmOpen(false);
  }, []);

  const handleSignOutConfirm = useCallback(async () => {
    if (isSigningIn) return;
    try {
      await authSignOut();
    } catch (err) {
      logger.warn("[AccountSection] sign-out failed:", err);
    } finally {
      setSignOutConfirmOpen(false);
    }
  }, [authSignOut, isSigningIn]);

  const showApple = IS_IOS;
  const confirmAccessibilityState = { disabled: isSigningIn };
  const confirmButtonStyle = isSigningIn
    ? [styles.signOutConfirmButton, styles.signOutConfirmButtonDisabled]
    : styles.signOutConfirmButton;
  const signOutModalCloseHandler = isSigningIn
    ? undefined
    : handleSignOutCancel;

  if (isAnonymous) {
    return (
      <View style={styles.section}>
        <AccountRow
          iconName="logo-google"
          label={t.signin_button_google}
          onPress={handleGooglePress}
          rightIconName="chevron-right"
          disabled={isSigningIn}
        />
        {showApple ? (
          <>
            <View style={styles.divider} />
            <AccountRow
              iconName="logo-apple"
              label={t.signin_button_apple}
              onPress={handleApplePress}
              rightIconName="chevron-right"
              disabled={isSigningIn}
            />
          </>
        ) : null}
      </View>
    );
  }

  const signOutModalBody = (
    <View style={styles.signOutModalContainer}>
      <AppText
        type="subHeadline"
        fontFamily="serif"
        color={colors.onImage}
        style={styles.signOutModalBody}
      >
        {t.settings_signout_confirm_body}
      </AppText>
      <View style={styles.signOutModalButtons}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.settings_signout_confirm_cancel}
          onPress={handleSignOutCancel}
          style={styles.signOutCancelButton}
        >
          <AppText
            type="subHeadline"
            fontFamily="serif"
            color={colors.bronzeDark}
          >
            {t.settings_signout_confirm_cancel}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.settings_signout_button}
          accessibilityState={confirmAccessibilityState}
          onPress={handleSignOutConfirm}
          disabled={isSigningIn}
          style={confirmButtonStyle}
        >
          <AppText
            type="subHeadline"
            fontFamily="serif"
            color={colors.textOnPrimary}
          >
            {t.settings_signout_button}
          </AppText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.section}>
      <AccountRow
        iconName="logout"
        label={t.settings_signout_button}
        onPress={handleSignOutPress}
        labelColor={colors.incorrectBorder}
        iconColor={colors.incorrectBorder}
        disabled={isSigningIn}
      />

      <Modal
        isVisible={signOutConfirmOpen}
        headerTitle={t.settings_signout_confirm_title}
        onClose={signOutModalCloseHandler}
        renderComponent={signOutModalBody}
      />
    </View>
  );
};

export default AccountSection;
