import React from "react";
import { View, StyleSheet, Image, Text } from "react-native";

import { EmptyStateImg } from "@/src/assets";
import { getAdjustedHeight } from "@/src/helpers";

type EmptyStateProps = {
  title: string;
  description?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  return (
    <View style={styles.container}>
      <Image source={EmptyStateImg} style={styles.image} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
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
  title: {
    fontFamily: "helvetica-main",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  desc: {
    fontFamily: "helvetica-main",
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
  },
});
