import React from "react";
import { Pressable, View, Text, StyleProp, ViewStyle } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { styles } from "./styles";

type IconButtonProps = {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || iconName}
    >
      <View style={[styles.btnContainer, containerStyle]}>
        <MaterialCommunityIcons name={iconName} size={size} color={color} />
        {text && <Text style={styles.btnText}>{text}</Text>}
      </View>
    </Pressable>
  );
};

export default IconButton;
