import React from "react";
import { Image, ImageBackground, View } from "react-native";

import { AppText } from "@/src/components";
import { Crown, QuestionBackground } from "@/src/assets";
import { useAppTheme, useStyles, useThemeMode } from "@/src/hooks";
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
  const { isThemeDark } = useThemeMode();
  const styles = useStyles(getStyles);

  const cardStyle = [styles.rowCard, isSelf ? styles.rowCardSelf : null];

  return (
    <View style={cardStyle}>
      <ImageBackground
        source={QuestionBackground}
        resizeMode="stretch"
        style={styles.rowCardInner}
      >
        {isThemeDark ? <View style={styles.darkTint} /> : null}

        {isSelf ? (
          <Image source={Crown} style={styles.rowCrownIcon} resizeMode="contain" />
        ) : null}

        <AppText
          type="subHeadline"
          fontFamily="display"
          color={colors.bronzeDark}
          style={styles.rowRank}
        >
          {`#${entry.rank}`}
        </AppText>

        <View style={styles.rowAvatar}>
          {entry.photoURL ? (
            <Image source={{ uri: entry.photoURL }} style={styles.avatarImage} />
          ) : (
            <AppText
              type="subHeadline"
              fontFamily="script"
              color={colors.bronzeDark}
            >
              {initialFor(entry.displayName)}
            </AppText>
          )}
        </View>

        <AppText
          type="subHeadline"
          fontFamily="serif"
          color={colors.onImage}
          numberOfLines={1}
          style={styles.rowName}
        >
          {entry.displayName}
        </AppText>

        <AppText
          type="subHeadline"
          fontFamily="sans"
          color={colors.bronzeDark}
          style={styles.rowPoints}
        >
          {entry.points}
        </AppText>
      </ImageBackground>
    </View>
  );
};

export default React.memo(LeaderboardRow);
