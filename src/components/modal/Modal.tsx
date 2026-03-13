import React from "react";
import { Modal as NativeModal, ImageBackground, Pressable } from "react-native";

import { EvilIcons } from "@expo/vector-icons";

import { useAppTheme, useStyles } from "@/src/hooks";
import { BodyRoll, HeaderRoll } from "@/src/assets";

import GradientWrapper from "../gradient-wrapper/GradientWrapper";
import { AppText } from "../text";

import { getStyles } from "./styles";

type ReusableModalProps = {
  headerTitle: string;
  onClose?: () => void;
  renderComponent: React.ReactNode;
  isVisible: boolean;
};

const ReusableModal: React.FC<ReusableModalProps> = ({
  headerTitle,
  onClose,
  renderComponent,
  isVisible,
}) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const handleModalPress = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

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
            style={{
              ...styles.header,
              justifyContent: onClose ? "space-between" : "center",
            }}
            resizeMode="stretch"
          >
            <AppText>{""}</AppText>
            <AppText fontFamily="primary" type="title" color={colors.onImage}>
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
            {renderComponent}
          </ImageBackground>
        </Pressable>
      </Pressable>
    </NativeModal>
  );
};

export default ReusableModal;
