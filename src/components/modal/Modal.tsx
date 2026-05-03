import React from "react";
import {
  Modal as NativeModal,
  ImageBackground,
  Pressable,
  ScrollView,
  View,
  type FlexStyle,
} from "react-native";

import { EvilIcons } from "@expo/vector-icons";

import { useAppTheme, useStyles, useThemeMode } from "@/src/hooks";
import { BodyRoll, HeaderRoll } from "@/src/assets";

import GradientWrapper from "../gradient-wrapper/GradientWrapper";
import { AppText } from "../text";

import { getStyles } from "./styles";

const SAFE_INSET_DEFAULTS = {
  horizontal: 24,
  vertical: 40,
};

type SafeContentInset = {
  horizontal?: number;
  vertical?: number;
};

type ReusableModalProps = {
  headerTitle: string;
  onClose?: () => void;
  renderComponent: React.ReactNode;
  isVisible: boolean;
  safeContentInset?: SafeContentInset;
  enableInnerScroll?: boolean;
};

const ReusableModal: React.FC<ReusableModalProps> = ({
  headerTitle,
  onClose,
  renderComponent,
  isVisible,
  safeContentInset,
  enableInnerScroll,
}) => {
  const { colors } = useAppTheme();
  const { isThemeDark } = useThemeMode();
  const styles = useStyles(getStyles);

  const handleModalPress = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

  const horizontalInset =
    safeContentInset?.horizontal ?? SAFE_INSET_DEFAULTS.horizontal;
  const verticalInset =
    safeContentInset?.vertical ?? SAFE_INSET_DEFAULTS.vertical;
  const innerPadding = {
    paddingHorizontal: horizontalInset,
    paddingVertical: verticalInset,
  };
  const innerStyle = [styles.innerContent, innerPadding];

  const headerJustify: FlexStyle["justifyContent"] = onClose
    ? "space-between"
    : "center";
  const headerStyle = [styles.header, { justifyContent: headerJustify }];

  return (
    <NativeModal
      transparent={true}
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={handleModalPress}>
          <ImageBackground
            source={HeaderRoll}
            style={headerStyle}
            resizeMode="stretch"
          >
            {isThemeDark && <View style={styles.darkTint} />}
            <AppText>{""}</AppText>
            <AppText fontFamily="script" type="title" color={colors.onImage}>
              {headerTitle}
            </AppText>
            {onClose && (
              <Pressable onPress={onClose}>
                <GradientWrapper style={styles.closeBtnBackground}>
                  <EvilIcons name="close" color={colors.onImage} size={40} />
                </GradientWrapper>
              </Pressable>
            )}
          </ImageBackground>

          <ImageBackground
            source={BodyRoll}
            style={styles.background}
            resizeMode="stretch"
          >
            {isThemeDark && <View style={styles.darkTint} />}
            {enableInnerScroll ? (
              <ScrollView
                contentContainerStyle={innerStyle}
                showsVerticalScrollIndicator={false}
              >
                {renderComponent}
              </ScrollView>
            ) : (
              <View style={innerStyle}>{renderComponent}</View>
            )}
          </ImageBackground>
        </Pressable>
      </Pressable>
    </NativeModal>
  );
};

export default ReusableModal;
