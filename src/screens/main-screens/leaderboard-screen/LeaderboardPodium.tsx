import React from "react";
import { Image, ImageBackground, View } from "react-native";

import { AppText } from "@/src/components";
import { BodyRoll, Crown } from "@/src/assets";
import { useAppTheme, useStyles, useThemeMode } from "@/src/hooks";
import type { LeaderboardEntry } from "@/src/types";

import { getStyles } from "./styles";

type PodiumCardProps = {
  entry: LeaderboardEntry;
  isCenter: boolean;
};

const initialFor = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "?";
  return Array.from(trimmed)[0]?.toUpperCase() ?? "?";
};

const PodiumCard: React.FC<PodiumCardProps> = ({ entry, isCenter }) => {
  const { colors } = useAppTheme();
  const { isThemeDark } = useThemeMode();
  const styles = useStyles(getStyles);

  const cardStyle = [
    styles.podiumCard,
    isCenter ? styles.podiumCardCenter : null,
  ];

  return (
    <View style={cardStyle}>
      <ImageBackground
        source={BodyRoll}
        resizeMode="stretch"
        style={styles.podiumCardInner}
      >
        {isThemeDark ? <View style={styles.darkTint} /> : null}

        <View style={styles.podiumRankRibbon}>
          <AppText type="caption" fontFamily="script" color={colors.surface}>
            {`#${entry.rank}`}
          </AppText>
        </View>

        {isCenter ? (
          <Image source={Crown} style={styles.podiumCrown} resizeMode="contain" />
        ) : null}

        <View style={styles.podiumAvatar}>
          {entry.photoURL ? (
            <Image source={{ uri: entry.photoURL }} style={styles.avatarImage} />
          ) : (
            <AppText type="title" fontFamily="script" color={colors.bronzeDark}>
              {initialFor(entry.displayName)}
            </AppText>
          )}
        </View>

        <AppText
          type="subHeadline"
          fontFamily="serif"
          color={colors.onImage}
          numberOfLines={1}
          style={styles.podiumName}
        >
          {entry.displayName}
        </AppText>

        <AppText
          type={isCenter ? "title" : "subHeadline"}
          fontFamily="display"
          color={colors.bronzeDark}
        >
          {entry.points}
        </AppText>
      </ImageBackground>
    </View>
  );
};

const PlaceholderCard: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  return (
    <View style={styles.podiumPlaceholderCard}>
      <AppText type="title" fontFamily="script" color={colors.bronzeMid}>
        ?
      </AppText>
    </View>
  );
};

type LeaderboardPodiumProps = {
  topThree: LeaderboardEntry[];
};

const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({ topThree }) => {
  const styles = useStyles(getStyles);

  if (topThree.length === 0) return null;

  // Render order on screen: 2nd, 1st (center, taller), 3rd
  const second = topThree.find((e) => e.rank === 2);
  const first = topThree.find((e) => e.rank === 1);
  const third = topThree.find((e) => e.rank === 3);

  return (
    <View style={styles.podiumRow}>
      {second ? (
        <PodiumCard entry={second} isCenter={false} />
      ) : (
        <PlaceholderCard />
      )}
      {first ? <PodiumCard entry={first} isCenter={true} /> : <PlaceholderCard />}
      {third ? (
        <PodiumCard entry={third} isCenter={false} />
      ) : (
        <PlaceholderCard />
      )}
    </View>
  );
};

export default React.memo(LeaderboardPodium);
