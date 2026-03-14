import React from "react";
import {
  Pressable,
  View,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import type { AppTheme } from "@/src/theme";
import { useAppTheme, useStyles } from "@/src/hooks";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

import { AppText } from "../text";

type NavigationPressableProps = {
  onBtnPress: () => void;
  img: ImageSourcePropType;
  title: string;
};

const NavigationPressable: React.FC<NavigationPressableProps> = ({
  onBtnPress,
  img,
  title,
}) => {
  const theme = useAppTheme();
  const styles = useStyles(getStyles);
  const crownGradientColors = [
    theme.colors.parchmentAlt,
    theme.colors.parchment,
  ] as const;

  return (
    <Pressable
      style={styles.pressable}
      onPress={onBtnPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.imgAndTextWrapper}>
        <LinearGradient
          colors={crownGradientColors}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 0.2, y: 0.8 }}
          style={styles.crownWrapper}
        >
          <Image resizeMode="contain" width={50} height={50} source={img} />
        </LinearGradient>
        <AppText fontFamily="sans" fontWeight="700" type="body">
          {title}
        </AppText>
      </View>
      <View style={styles.iconWrapper}>
        <MaterialCommunityIcons
          name="arrow-right"
          size={20}
          color={theme.colors.text}
        />
      </View>
    </Pressable>
  );
};

export default NavigationPressable;

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    pressable: {
      backgroundColor: theme.colors.surfaceRaised,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      boxShadow: `0px 2px 5.9px 0px ${theme.colors.cardShadow}`,

      paddingVertical: getAdjustedHeight(12),
      paddingHorizontal: getAdjustedWidth(16),
      marginBottom: getAdjustedHeight(16),

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    imgAndTextWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x3,
    },

    crownWrapper: {
      alignItems: "center",
      justifyContent: "center",
      width: getAdjustedWidth(50),
      height: getAdjustedWidth(50),

      paddingHorizontal: getAdjustedWidth(6),
      paddingVertical: getAdjustedHeight(10),
      borderWidth: 1,
      borderColor: theme.colors.bronzeMid,
      borderRadius: theme.borderRadius.md,
      overflow: "hidden",
    },

    iconWrapper: {
      alignItems: "center",
      justifyContent: "center",
      padding: getAdjustedWidth(10),
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
    },
  });
