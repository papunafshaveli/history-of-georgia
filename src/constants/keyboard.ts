import { KeyboardAvoidingViewProps, Platform } from "react-native";

export const KEYBOARD_AVOIDING_DEFAULT_BEHAVIOR = Platform.select({
  android: "height",
  ios: "padding",
}) as KeyboardAvoidingViewProps["behavior"];
