import React, { useCallback } from "react";
import { Linking, Pressable, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { IS_IOS } from "@/src/constants";
import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";

import GradientWrapper from "../gradient-wrapper/GradientWrapper";
import Modal from "../modal/Modal";
import { AppText } from "../text";

import { getStyles } from "./styles";

const APP_STORE_URL = "https://apps.apple.com/app/id6741484980";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.papunafshaveli.historyofgeorgia";
const TOP_ICON_SIZE = 56;

type SoftUpdateModalProps = {
  isVisible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
};

const SoftUpdateModal: React.FC<SoftUpdateModalProps> = ({
  isVisible,
  onUpdate,
  onDismiss,
}) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const handleUpdatePress = useCallback(() => {
    const url = IS_IOS ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(url).catch(() => undefined);
    onUpdate();
  }, [onUpdate]);

  const renderComponent = (
    <View style={styles.updateModalContainer}>
      <View style={styles.updateTopIconWrapper}>
        <MaterialCommunityIcons
          name="update"
          size={TOP_ICON_SIZE}
          color={colors.bronzeDark}
        />
      </View>

      <AppText
        type="subHeadline"
        fontFamily="serif"
        color={colors.onImage}
        style={styles.updateBody}
      >
        {t.soft_update_body}
      </AppText>

      <View style={styles.updateButtonsGroup}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.soft_update_primary}
          onPress={handleUpdatePress}
        >
          <GradientWrapper style={styles.updateScrollButton}>
            <AppText fontFamily="script" type="headline">
              {t.soft_update_primary}
            </AppText>
          </GradientWrapper>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.soft_update_secondary}
          onPress={onDismiss}
        >
          <GradientWrapper style={styles.updateScrollButton}>
            <AppText fontFamily="script" type="headline">
              {t.soft_update_secondary}
            </AppText>
          </GradientWrapper>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal
      isVisible={isVisible}
      headerTitle={t.soft_update_title}
      onClose={onDismiss}
      renderComponent={renderComponent}
    />
  );
};

export default SoftUpdateModal;
