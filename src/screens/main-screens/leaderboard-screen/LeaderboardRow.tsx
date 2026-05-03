import React from "react";
import { Image, View } from "react-native";

import { AppText } from "@/src/components";
import { useAppTheme, useStyles } from "@/src/hooks";
import type { LeaderboardEntry } from "@/src/types";

import { getStyles } from "./styles";

type LeaderboardRowProps = {
  entry: LeaderboardEntry;
  isSelf: boolean;
};

const initialFor = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "?";
  return Array.from(trimmed)[0]?.toUpperCase() ?? "?";
};

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, isSelf }) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const cardStyle = [styles.rowCard, isSelf ? styles.rowCardSelf : null];

  return (
    <View style={cardStyle}>
      <AppText
        type="subHeadline"
        fontFamily="serif"
        color={colors.bronzeDark}
        style={styles.rowRank}
      >
        {`#${entry.rank}`}
      </AppText>

      <View style={styles.rowAvatar}>
        {entry.photoURL ? (
          <Image source={{ uri: entry.photoURL }} style={styles.rowAvatarImage} />
        ) : (
          <AppText type="subHeadline" fontFamily="script" color={colors.bronzeDark}>
            {initialFor(entry.displayName)}
          </AppText>
        )}
      </View>

      <AppText
        type="subHeadline"
        fontFamily="serif"
        color={colors.text}
        numberOfLines={1}
        style={styles.rowName}
      >
        {entry.displayName}
      </AppText>

      <AppText
        type="subHeadline"
        fontFamily="serif"
        color={colors.bronzeDark}
        style={styles.rowPoints}
      >
        {entry.points}
      </AppText>
    </View>
  );
};

export default React.memo(LeaderboardRow);
