import React from "react";
import { StyleSheet, Switch, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import type { AppTheme } from "@/src/theme";
import { useStyles, useAppTheme } from "@/src/hooks";

import { AppText } from "../text";

const ICON_SIZE = 22;

const TRACK_COLOR = {
  false: "rgba(0, 0, 0, 0.12)",
  true: "rgba(0, 0, 0, 0.12)",
};

type SettingToggleProps = {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: boolean;
  onValueChange: () => void;
};

const SettingToggle: React.FC<SettingToggleProps> = ({
  iconName,
  label,
  value,
  onValueChange,
}) => {
  const styles = useStyles(getStyles);
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <MaterialCommunityIcons
          name={iconName}
          size={ICON_SIZE}
          color={colors.onImage}
        />
        <AppText type="title" fontFamily="primary" color={colors.onImage}>
          {label}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={TRACK_COLOR}
        thumbColor={value ? colors.coffee : colors.muted}
        ios_backgroundColor="rgba(0, 0, 0, 0.12)"
        accessibilityLabel={label}
        accessibilityRole="switch"
      />
    </View>
  );
};

export default SettingToggle;

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    row: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x3,
    },
  });
