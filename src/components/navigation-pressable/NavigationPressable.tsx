import React from "react";
import {
  Pressable,
  View,
  StyleSheet,
  Text,
  Image,
  ImageSourcePropType,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { GLOBAL_COLORS } from "@/src/constants";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

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
  return (
    <Pressable
      style={styles.pressable}
      onPress={onBtnPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.imgAndTextWrapper}>
        <LinearGradient
          colors={["rgba(255, 240, 219, 0.5)", "rgba(214, 174, 129, 0.5)"]}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 0.2, y: 0.8 }}
          style={styles.crownWrapper}
        >
          <Image resizeMode="contain" width={50} height={50} source={img} />
        </LinearGradient>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.iconWrapper}>
        <MaterialCommunityIcons
          name="arrow-right"
          size={20}
          color={GLOBAL_COLORS.primaryColors.dark}
        />
      </View>
    </Pressable>
  );
};

export default NavigationPressable;

const styles = StyleSheet.create({
  pressable: {
    backgroundColor: GLOBAL_COLORS.primaryColors.btnDefault,
    borderWidth: 1,
    borderColor: GLOBAL_COLORS.mixedColors.midGrey,
    borderRadius: 16,
    boxShadow: "0px 2px 5.9px 0px rgba(62, 45, 3, 0.12)",

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
    gap: 12,
  },

  crownWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: getAdjustedWidth(50),
    height: getAdjustedWidth(50),

    paddingHorizontal: getAdjustedWidth(6),
    paddingVertical: getAdjustedHeight(10),
    borderWidth: 1,
    borderColor: GLOBAL_COLORS.mixedColors.darkCoffeeSecond,
    borderRadius: 12,
    overflow: "hidden",
  },

  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    padding: getAdjustedWidth(10),
    borderWidth: 1,
    borderColor: GLOBAL_COLORS.mixedColors.midGrey,
    borderRadius: 12,
  },

  title: {
    fontFamily: "helvetica-main",
    fontSize: 14,
    fontWeight: "700",
  },
});
