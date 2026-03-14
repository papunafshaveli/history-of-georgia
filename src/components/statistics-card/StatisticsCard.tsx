import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import type { AppTheme } from "@/src/theme";
import { useStyles, useAppTheme } from "@/src/hooks";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

import { AppText } from "../text";
import GradientWrapper from "../gradient-wrapper/GradientWrapper";

type CardProps = {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string | number;
  description: string;
};

const StatisticsCard: React.FC<CardProps> = ({
  iconName,
  title,
  description,
}) => {
  const styles = useStyles(getStyles);
  const { colors } = useAppTheme();

  return (
    <GradientWrapper style={styles.statCard}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name={iconName}
          size={22}
          color={colors.bronzeDark}
        />
      </View>
      <AppText fontFamily="sans" type="title" color={colors.bronzeDark}>
        {title}
      </AppText>
      <AppText
        color={colors.bronzeMid}
        fontFamily="script"
        type="headline"
        style={styles.statLabel}
      >
        {description}
      </AppText>
    </GradientWrapper>
  );
};

export default StatisticsCard;

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    statCard: {
      width: "48%",
      height: getAdjustedHeight(150),
      borderRadius: theme.borderRadius.md,
      borderWidth: 1.5,
      borderColor: theme.colors.bronze,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: getAdjustedHeight(12),
      paddingHorizontal: getAdjustedWidth(12),
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: theme.colors.bronzeDark,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: getAdjustedHeight(8),
    },

    statLabel: {
      textAlign: "center",
    },
  });
