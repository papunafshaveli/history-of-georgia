import type { TextProps as RNTextProps } from "react-native";

export type TextType =
  | "caption"
  | "body"
  | "subHeadline"
  | "headline"
  | "title"
  | "display";

export type CustomTextProps = {
  type?: TextType;
  color?: string;
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: RNTextProps["style"] extends infer S
    ? S extends { fontWeight?: infer W }
      ? W
      : never
    : never;
  fontFamily?: "sans" | "serif" | "script" | "display";
};

export type TextProps = RNTextProps & CustomTextProps;
