import React from "react";
import { StyleSheet, Switch, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import type { AppTheme } from "@/src/theme";
import { useStyles, useAppTheme } from "@/src/hooks";

import { AppText } from "../text";

const ICON_SIZE = 22;

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
  const trackColor = {
    false: colors.surfaceAlt,
    true: colors.bronzeLight,
  };

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <MaterialCommunityIcons
          name={iconName}
          size={ICON_SIZE}
          color={colors.onImage}
        />
        <AppText
          type="title"
          fontFamily="script"
          color={colors.onImage}
          style={styles.label}
          numberOfLines={1}
        >
          {label}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={trackColor}
        thumbColor={value ? colors.bronze : colors.uiMuted}
        ios_backgroundColor={colors.surfaceAlt}
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
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x3,
      paddingRight: theme.spacing.x3,
    },
    label: {
      flexShrink: 1,
    },
  });
