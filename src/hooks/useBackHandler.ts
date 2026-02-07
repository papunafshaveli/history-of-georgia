import { useEffect } from "react";
import { BackHandler } from "react-native";

export const useBackHandler = (onBackPress: () => boolean) => {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );
    return () => backHandler.remove();
  }, [onBackPress]);
};
