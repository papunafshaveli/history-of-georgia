import React from "react";
import { Pressable, View, StyleProp, ViewStyle } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "@/src/hooks";

import { AppText } from "../text";

import { styles } from "./styles";

type IconButtonProps = {
  iconName: keyof typeof MaterialIcons.glyphMap;
  size: number;
  color?: string;
  onPress: () => void;
  text?: string;
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const IconButton: React.FC<IconButtonProps> = ({
  iconName,
  size,
  color,
  onPress,
  text,
  containerStyle,
  accessibilityLabel,
}) => {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || iconName}
    >
      <View style={[styles.btnContainer, containerStyle]}>
        <MaterialIcons name={iconName} size={size} color={color} />
        {text && (
          <AppText color={colors.white} fontFamily="primary" type="headline">
            {text}
          </AppText>
        )}
      </View>
    </Pressable>
  );
};

export default IconButton;
