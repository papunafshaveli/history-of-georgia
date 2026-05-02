import React, { useCallback, useState } from "react";
import { ImageBackground, Pressable, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { CloseIcon } from "@/src/assets";
import {
  useAppTheme,
  useAuth,
  useStyles,
  useTranslation,
} from "@/src/hooks";
import { logger } from "@/src/helpers/logger";

import GradientWrapper from "../gradient-wrapper/GradientWrapper";
import Modal from "../modal/Modal";
import { AppText } from "../text";

import { getStyles } from "./styles";

const ROW_ICON_SIZE = 22;

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
  const { isAnonymous, isSigningIn, signOut: authSignOut } = useAuth();

  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

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

  if (isAnonymous) {
    return null;
  }

  const confirmAccessibilityState = { disabled: isSigningIn };
  const confirmPressableStyle = isSigningIn
    ? styles.signOutConfirmButtonDisabled
    : undefined;
  const signOutModalCloseHandler = isSigningIn
    ? undefined
    : handleSignOutCancel;

  const signOutModalBody = (
    <View style={styles.signOutModalContainer}>
      <ImageBackground
        style={styles.signOutTopIconWrapper}
        source={CloseIcon}
        resizeMode="contain"
        imageStyle={styles.signOutTopIcon}
        accessibilityElementsHidden
      />

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
        >
          <GradientWrapper style={styles.signOutScrollButton}>
            <AppText fontFamily="script" type="headline">
              {t.settings_signout_confirm_cancel}
            </AppText>
          </GradientWrapper>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.settings_signout_button}
          accessibilityState={confirmAccessibilityState}
          onPress={handleSignOutConfirm}
          disabled={isSigningIn}
          style={confirmPressableStyle}
        >
          <GradientWrapper style={styles.signOutScrollButton}>
            <AppText fontFamily="script" type="headline">
              {t.settings_signout_button}
            </AppText>
          </GradientWrapper>
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
