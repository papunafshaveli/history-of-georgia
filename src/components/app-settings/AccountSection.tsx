import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { CloseIcon } from "@/src/assets";
import { useAppTheme, useAuth, useStyles, useTranslation } from "@/src/hooks";
import { logger } from "@/src/helpers/logger";
import { showToast } from "@/src/helpers/showToast";

import GradientWrapper from "../gradient-wrapper/GradientWrapper";
import Modal from "../modal/Modal";
import { AppText } from "../text";

import { getStyles } from "./styles";

const ROW_ICON_SIZE = 22;

type AccountRowProps = {
  iconName:
    | keyof typeof MaterialCommunityIcons.glyphMap
    | "logo-google"
    | "logo-apple";
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
        <Ionicons
          name="logo-apple"
          size={ROW_ICON_SIZE}
          color={resolvedIconColor}
        />
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
  const rippleConfig = isDisabled ? null : { color: colors.parchmentDivider };
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
            type="headline"
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
  const { isAnonymous, deleteAccount } = useAuth();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePress = useCallback(() => {
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmOpen(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteAccount();
      // onAuthStateChanged fires null → fresh anon user; AccountSection
      // unmounts naturally because isAnonymous becomes true.
    } catch (err) {
      logger.warn("[AccountSection] deleteAccount failed:", err);
      showToast({
        type: "error",
        text1: t.common_delete_account_error,
      });
      setIsDeleting(false);
    }
  }, [deleteAccount, isDeleting, t]);

  if (isAnonymous) {
    return null;
  }

  const confirmAccessibilityState = { disabled: isDeleting };
  const disabledPressableStyle = isDeleting
    ? styles.signOutConfirmButtonDisabled
    : undefined;
  const deleteModalCloseHandler = isDeleting ? undefined : handleDeleteCancel;
  const confirmButtonContent = isDeleting ? (
    <ActivityIndicator size="small" color={colors.bronzeDark} />
  ) : (
    <AppText fontFamily="script" type="headline">
      {t.common_delete_account_button}
    </AppText>
  );

  const deleteModalBody = (
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
        {t.common_delete_account_message}
      </AppText>

      <View style={styles.signOutModalButtons}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common_cancel}
          accessibilityState={confirmAccessibilityState}
          onPress={handleDeleteCancel}
          disabled={isDeleting}
          style={disabledPressableStyle}
        >
          <GradientWrapper style={styles.signOutScrollButton}>
            <AppText fontFamily="script" type="headline">
              {t.common_cancel}
            </AppText>
          </GradientWrapper>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common_delete_account_button}
          accessibilityState={confirmAccessibilityState}
          onPress={handleDeleteConfirm}
          disabled={isDeleting}
          style={disabledPressableStyle}
        >
          <GradientWrapper style={styles.signOutScrollButton}>
            {confirmButtonContent}
          </GradientWrapper>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.section}>
      <AccountRow
        iconName="delete-outline"
        label={t.common_delete_account_row}
        onPress={handleDeletePress}
        labelColor={colors.dangerOnParchment}
        iconColor={colors.dangerOnParchment}
        disabled={isDeleting}
      />

      <Modal
        isVisible={deleteConfirmOpen}
        headerTitle={t.common_delete_account_title}
        onClose={deleteModalCloseHandler}
        renderComponent={deleteModalBody}
      />
    </View>
  );
};

export default AccountSection;
