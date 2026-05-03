import React from "react";
import { Image, View } from "react-native";

import { AppText } from "@/src/components";
import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";
import type { LeaderboardEntry } from "@/src/types";

import { getStyles } from "./styles";

const PODIUM_MIN_ENTRIES = 3;
const PODIUM_INITIAL_FONT_SIZE_CENTER = 36;
const PODIUM_INITIAL_FONT_SIZE_SIDE = 28;

type PodiumRank = 1 | 2 | 3;

type LeaderboardPodiumProps = {
  entries: LeaderboardEntry[];
  currentUid: string | null;
};

const initialFor = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "?";
  return Array.from(trimmed)[0]?.toUpperCase() ?? "?";
};

type PodiumCardProps = {
  rank: PodiumRank;
  entry: LeaderboardEntry;
  isSelf: boolean;
};

const PodiumCard: React.FC<PodiumCardProps> = ({ rank, entry, isSelf }) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const isCenter = rank === 1;
  const cardHeightStyle = isCenter
    ? styles.podiumCardCenter
    : styles.podiumCardSide;
  const cardSelfStyle = isSelf ? styles.podiumCardSelf : null;
  const cardStyle = [styles.podiumCard, cardHeightStyle, cardSelfStyle];

  const avatarSizeStyle = isCenter
    ? styles.podiumAvatarLarge
    : styles.podiumAvatarSmall;
  const avatarStyle = [styles.podiumAvatar, avatarSizeStyle];

  const ribbonStyle = isCenter
    ? [styles.podiumRankRibbon, styles.podiumRankRibbonCenter]
    : styles.podiumRankRibbon;

  const initialFontSize = isCenter
    ? PODIUM_INITIAL_FONT_SIZE_CENTER
    : PODIUM_INITIAL_FONT_SIZE_SIDE;

  const photoSource = entry.photoURL ? { uri: entry.photoURL } : null;
  const initialChar = initialFor(entry.displayName);

  return (
    <View style={cardStyle}>
      <View style={ribbonStyle}>
        <AppText
          type="subHeadline"
          fontFamily="serif"
          color={colors.textOnPrimary}
        >
          {String(rank)}
        </AppText>
      </View>

      <View style={avatarStyle}>
        {photoSource ? (
          <Image source={photoSource} style={styles.podiumAvatarImage} />
        ) : (
          <AppText
            fontFamily="script"
            color={colors.bronzeDark}
            fontSize={initialFontSize}
          >
            {initialChar}
          </AppText>
        )}
      </View>

      <AppText
        type="subHeadline"
        fontFamily="serif"
        color={colors.bronzeDark}
        numberOfLines={1}
        style={styles.podiumName}
      >
        {entry.displayName}
      </AppText>

      <AppText
        type="caption"
        fontFamily="sans"
        color={colors.bronzeDark}
        style={styles.podiumPoints}
      >
        {String(entry.points)}
      </AppText>

      {isSelf ? (
        <AppText
          type="caption"
          fontFamily="serif"
          color={colors.bronzeDark}
          style={styles.podiumSelfTag}
        >
          {t.leaderboard_self_tag}
        </AppText>
      ) : null}
    </View>
  );
};

const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  entries,
  currentUid,
}) => {
  const styles = useStyles(getStyles);

  if (entries.length < PODIUM_MIN_ENTRIES) return null;

  const [first, second, third] = entries;

  return (
    <View style={styles.podiumRow}>
      <PodiumCard rank={2} entry={second} isSelf={second.uid === currentUid} />
      <PodiumCard rank={1} entry={first} isSelf={first.uid === currentUid} />
      <PodiumCard rank={3} entry={third} isSelf={third.uid === currentUid} />
    </View>
  );
};

export default LeaderboardPodium;
