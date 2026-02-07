import { Linking } from "react-native";

export const openAppOrUrl = async (appUrl: string, websiteUrl: string) => {
  const isSupported = await Linking.canOpenURL(appUrl);
  return Linking.openURL(isSupported ? appUrl : websiteUrl);
};
