import React from "react";
import { StyleSheet } from "react-native";

import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";

import Modal from "../modal/Modal";
import AppSettings from "../app-settings/AppSettings";
import Rules from "../rules/Rules";
import Endgame from "../end-game/EndGame";
import { AppText } from "../text";

type AppModalsProps = {
  isRulesModalVisible: boolean;
  toggleRulesModal: () => void;
  isSettingsModalVisible: boolean;
  toggleSettingsModal: () => void;
  isExitModalVisible: boolean;
  toggleExitModal: () => void;
  handleExitApp: () => void;
  isEthernetModalVisible: boolean;
};

const AppModals: React.FC<AppModalsProps> = ({
  isRulesModalVisible,
  toggleRulesModal,
  isSettingsModalVisible,
  toggleSettingsModal,
  isExitModalVisible,
  toggleExitModal,
  handleExitApp,
  isEthernetModalVisible,
}) => {
  const t = useTranslation();

  const styles = useStyles(getStyles);
  const { colors } = useAppTheme();

  const ethernetRenderComponent = (
    <AppText
      fontFamily="primary"
      type="display"
      color={colors.accent}
      style={styles.ethernetText}
    >
      {t.ethernet_connection_lost}
    </AppText>
  );
  return (
    <>
      <Modal
        isVisible={isRulesModalVisible}
        headerTitle={t.common_rules}
        onClose={toggleRulesModal}
        renderComponent={<Rules />}
      />
      <Modal
        isVisible={isSettingsModalVisible}
        headerTitle={t.common_parameters}
        onClose={toggleSettingsModal}
        renderComponent={<AppSettings />}
      />
      <Modal
        isVisible={isExitModalVisible}
        headerTitle={t.common_logout}
        onClose={toggleExitModal}
        renderComponent={
          <Endgame
            onPressExit={handleExitApp}
            onPressContinue={toggleExitModal}
            title={t.game_sign_out_confirmation}
            continueBtnText={t.common_continue}
            closeBtnText={t.common_logout}
          />
        }
      />
      <Modal
        isVisible={isEthernetModalVisible}
        headerTitle={t.common_connection_problem}
        renderComponent={ethernetRenderComponent}
      />
    </>
  );
};

export default AppModals;

const getStyles = () =>
  StyleSheet.create({
    ethernetText: {
      textAlign: "center",
      marginTop: "30%",
    },
  });
