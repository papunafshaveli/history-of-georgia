import React, { useCallback, useState } from "react";
import { Platform, Pressable, ToastAndroid, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

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
  if (Platform.OS === "android") {
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
};

const AccountRow: React.FC<AccountRowProps> = ({
  iconName,
  label,
  onPress,
  rightIconName,
  labelColor,
  iconColor,
  accessibilityLabel,
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      android_ripple={{ color: colors.parchmentDivider }}
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
    signInWithGoogle,
    signInWithApple,
    signOut: authSignOut,
  } = useAuth();

  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await authSignOut();
    } catch (err) {
      logger.warn("[AccountSection] sign-out failed:", err);
    } finally {
      setIsSigningOut(false);
      setSignOutConfirmOpen(false);
    }
  }, [authSignOut, isSigningOut]);

  const showApple = Platform.OS === "ios";

  if (isAnonymous) {
    return (
      <View style={styles.section}>
        <AccountRow
          iconName="logo-google"
          label={t.signin_button_google}
          onPress={handleGooglePress}
          rightIconName="chevron-right"
        />
        {showApple ? (
          <>
            <View style={styles.divider} />
            <AccountRow
              iconName="logo-apple"
              label={t.signin_button_apple}
              onPress={handleApplePress}
              rightIconName="chevron-right"
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
          accessibilityState={{ disabled: isSigningOut }}
          onPress={handleSignOutConfirm}
          style={styles.signOutConfirmButton}
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
      />

      <Modal
        isVisible={signOutConfirmOpen}
        headerTitle={t.settings_signout_confirm_title}
        onClose={isSigningOut ? undefined : handleSignOutCancel}
        renderComponent={signOutModalBody}
      />
    </View>
  );
};

export default AccountSection;
