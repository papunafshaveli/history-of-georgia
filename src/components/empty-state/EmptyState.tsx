import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { EmptyStateImg } from "@/src/assets";
import { getAdjustedHeight } from "@/src/helpers";

import { AppText } from "../text";

type EmptyStateProps = {
  title: string;
  description?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  return (
    <View style={styles.container}>
      <Image source={EmptyStateImg} style={styles.image} />
      <AppText type="title" fontFamily="script" style={styles.text}>
        {title}
      </AppText>
      <AppText type="headline" fontFamily="script" style={styles.text}>
        {description}
      </AppText>
    </View>
  );
};

export default EmptyState;

const styles = StyleSheet.create({
  container: {
    paddingVertical: getAdjustedHeight(16),
    alignItems: "center",
    justifyContent: "center",
    gap: getAdjustedHeight(8),
  },
  image: {
    maxWidth: getAdjustedHeight(145),
    maxHeight: getAdjustedHeight(145),
  },
  text: {
    textAlign: "center",
  },
});
