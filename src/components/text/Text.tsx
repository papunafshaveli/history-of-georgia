import React from "react";
import { Text as RNText } from "react-native";

import { useStyles } from "@/src/hooks";

import { getTextStyles } from "./styles";
import type { TextProps } from "./types";

const AppText: React.FC<TextProps> = ({
  type = "body",
  color,
  fontSize,
  lineHeight,
  fontWeight,
  fontFamily,
  style,
  children,
  ...rest
}) => {
  const styles = useStyles(getTextStyles, {
    type,
    color,
    fontSize,
    lineHeight,
    fontWeight,
    fontFamily,
  });

  return (
    <RNText allowFontScaling={false} style={[styles.text, style]} {...rest}>
      {children}
    </RNText>
  );
};

export default AppText;
