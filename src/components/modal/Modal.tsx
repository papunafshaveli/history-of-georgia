import React from "react";
import {
  Modal as NativeModal,
  Text,
  ImageBackground,
  Pressable,
} from "react-native";

import { EvilIcons } from "@expo/vector-icons";

import { GLOBAL_COLORS } from "@/src/constants";
import { BodyRoll, HeaderRoll } from "@/src/assets";

import GradientWrapper from "../gradient-wrapper/GradientWrapper";

import styles from "./styles";

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
            <Text></Text>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            {onClose && (
              <Pressable onPress={onClose}>
                <GradientWrapper style={styles.closeBtnBackground}>
                  <EvilIcons
                    name="close"
                    color={GLOBAL_COLORS.primaryColors.dark}
                    size={40}
                  />
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
