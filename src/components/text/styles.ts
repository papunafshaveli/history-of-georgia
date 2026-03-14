import { StyleSheet } from "react-native";

import { getAdjustedWidth } from "@/src/helpers";
import type { AppTheme } from "@/src/theme";

import type { TextType, CustomTextProps } from "./types";

type TextPreset = {
  fontSize: number;
  lineHeight: number;
};

const TEXT_PRESETS: Record<TextType, TextPreset> = {
  caption: { fontSize: 12, lineHeight: 18 },
  body: { fontSize: 14, lineHeight: 20 },
  subHeadline: { fontSize: 16, lineHeight: 24 },
  headline: { fontSize: 18, lineHeight: 26 },
  title: { fontSize: 24, lineHeight: 32 },
  display: { fontSize: 35, lineHeight: 42 },
};

type TextStyleProps = Pick<
  CustomTextProps,
  "type" | "color" | "fontSize" | "lineHeight" | "fontWeight" | "fontFamily"
>;

export const getTextStyles = (theme: AppTheme, props: TextStyleProps) => {
  const preset = TEXT_PRESETS[props.type ?? "body"];
  const fontFamilyKey = props.fontFamily ?? "script";

  return StyleSheet.create({
    text: {
      fontFamily: theme.fonts[fontFamilyKey],
      fontSize: getAdjustedWidth(props.fontSize ?? preset.fontSize),
      lineHeight: getAdjustedWidth(props.lineHeight ?? preset.lineHeight),
      color: props.color ?? theme.colors.text,
      ...(props.fontWeight ? { fontWeight: props.fontWeight } : {}),
    },
  });
};
