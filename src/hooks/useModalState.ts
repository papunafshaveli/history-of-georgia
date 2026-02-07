import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export const useModalState = () => {
  const [isRulesModalVisible, setRulesModalVisible] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isExitModalVisible, setExitModalVisible] = useState(false);

  const [isEthernetModalVisible, setIsEthernetModalVisible] = useState(false);

  useEffect(() => {
    NetInfo.fetch().then((state) => {
      setIsEthernetModalVisible(!state.isConnected);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsEthernetModalVisible(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const toggleRulesModal = () => setRulesModalVisible((prev) => !prev);
  const toggleSettingsModal = () => setSettingsModalVisible((prev) => !prev);
  const toggleExitModal = () => setExitModalVisible((prev) => !prev);

  return {
    isRulesModalVisible,
    toggleRulesModal,

    isSettingsModalVisible,
    toggleSettingsModal,

    isExitModalVisible,
    toggleExitModal,

    isEthernetModalVisible,
  };
};
