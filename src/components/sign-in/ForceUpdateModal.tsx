import React, { useCallback } from "react";
import { Linking, Platform, Pressable, View } from "react-native";

import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";

import Modal from "../modal/Modal";
import { AppText } from "../text";

import { getStyles } from "./styles";

const APP_STORE_URL = "https://apps.apple.com/app/id6741484980";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.papunafshaveli.historyofgeorgia";

type ForceUpdateModalProps = {
  isVisible: boolean;
};

const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({ isVisible }) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const handleUpdatePress = useCallback(() => {
    const url = Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(url).catch(() => undefined);
  }, []);

  const buttonStyle = useCallback(
    ({ pressed }: { pressed: boolean }) =>
      pressed ? [styles.saveButton, styles.saveButtonPressed] : styles.saveButton,
    [styles],
  );

  const renderComponent = (
    <View style={styles.confirmContainer}>
      <AppText
        type="subHeadline"
        fontFamily="serif"
        color={colors.onImage}
        style={styles.confirmCaption}
      >
        {t.force_update_body}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.force_update_button}
        onPress={handleUpdatePress}
        style={buttonStyle}
      >
        <AppText
          type="subHeadline"
          fontFamily="serif"
          color={colors.bronzeDark}
        >
          {t.force_update_button}
        </AppText>
      </Pressable>
    </View>
  );

  return (
    <Modal
      isVisible={isVisible}
      headerTitle={t.force_update_title}
      renderComponent={renderComponent}
    />
  );
};

export default ForceUpdateModal;
