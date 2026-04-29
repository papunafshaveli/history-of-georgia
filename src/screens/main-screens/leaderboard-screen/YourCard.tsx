import React, { useCallback, useMemo } from "react";
import { Image, ImageBackground, Pressable, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppText } from "@/src/components";
import {
  useAppTheme,
  useStyles,
  useThemeMode,
  useTranslation,
  useUserStats,
} from "@/src/hooks";
import { BodyRoll, Crown, Ink } from "@/src/assets";
import { LeaderboardTab, type UserDoc } from "@/src/types";

import { getStyles } from "./styles";

type YourCardProps = {
  isAnonymous: boolean;
  activeTab: LeaderboardTab;
  rank: number | null;
  onPressSignIn: () => void;
};

const initialFor = (name: string | null): string => {
  if (!name) return "?";
  const trimmed = name.trim();
  if (trimmed.length === 0) return "?";
  return Array.from(trimmed)[0]?.toUpperCase() ?? "?";
};

const computeAccuracy = (stats: UserDoc | null): number => {
  if (!stats || stats.totalQuestions === 0) return 0;
  return Math.round((stats.totalCorrect / stats.totalQuestions) * 100);
};

const formatRank = (
  rank: number | null,
  unrankedLabel: string,
): string => (rank === null ? unrankedLabel : `#${rank}`);

const providerLabelFor = (
  stats: UserDoc | null,
  t: ReturnType<typeof useTranslation>,
): string | null => {
  if (!stats || stats.isAnonymous) return null;
  // photoURL presence is a coarse proxy; refined in Phase 4 with provider data
  return stats.photoURL ? t.common_signed_in_with_google : t.common_signed_in_with_apple;
};

type AnonymousCtaProps = {
  onPressSignIn: () => void;
};

const AnonymousCta: React.FC<AnonymousCtaProps> = ({ onPressSignIn }) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const { isThemeDark } = useThemeMode();
  const styles = useStyles(getStyles);

  const buttonStyle = useCallback(
    ({ pressed }: { pressed: boolean }) =>
      pressed
        ? [styles.primaryButton, styles.primaryButtonPressed]
        : styles.primaryButton,
    [styles],
  );

  return (
    <ImageBackground
      source={BodyRoll}
      resizeMode="stretch"
      style={styles.parchmentPanel}
    >
      {isThemeDark ? <View style={styles.darkTint} /> : null}
      <View style={styles.parchmentPanelInner}>
        <View style={styles.ctaTitleRow}>
          <Image source={Crown} style={styles.ctaCrown} resizeMode="contain" />
          <AppText
            type="title"
            fontFamily="script"
            color={colors.onImage}
            style={styles.yourCardCtaTitle}
          >
            {t.leaderboard_signin_cta_title}
          </AppText>
        </View>
        <AppText
          type="body"
          fontFamily="serif"
          color={colors.onImage}
          style={styles.yourCardCtaBody}
        >
          {t.leaderboard_signin_cta_body}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.leaderboard_signin_cta_button}
          style={buttonStyle}
          onPress={onPressSignIn}
        >
          <MaterialCommunityIcons
            name="login-variant"
            size={22}
            color={colors.bronzeDark}
          />
          <AppText type="subHeadline" fontFamily="serif" color={colors.bronzeDark}>
            {t.leaderboard_signin_cta_button}
          </AppText>
        </Pressable>
      </View>
    </ImageBackground>
  );
};

type SignedInCardProps = {
  stats: UserDoc;
  rank: number | null;
  activeTab: LeaderboardTab;
};

const SignedInCard: React.FC<SignedInCardProps> = ({ stats, rank, activeTab }) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const { isThemeDark } = useThemeMode();
  const styles = useStyles(getStyles);

  const accuracy = useMemo(() => computeAccuracy(stats), [stats]);
  const initial = initialFor(stats.displayName);
  const provider = providerLabelFor(stats, t);
  const rankLabel = formatRank(rank, t.your_card_unranked);
  const tabLabel =
    activeTab === LeaderboardTab.WEEKLY
      ? t.leaderboard_tab_week
      : t.leaderboard_tab_alltime;

  return (
    <ImageBackground
      source={BodyRoll}
      resizeMode="stretch"
      style={styles.parchmentPanel}
    >
      {isThemeDark ? <View style={styles.darkTint} /> : null}
      <View style={styles.parchmentPanelInner}>
        <View style={styles.yourCardHeader}>
          <View style={styles.avatarCircle}>
            {stats.photoURL ? (
              <Image source={{ uri: stats.photoURL }} style={styles.avatarImage} />
            ) : (
              <AppText
                type="display"
                fontFamily="script"
                color={colors.bronzeDark}
              >
                {initial}
              </AppText>
            )}
          </View>
          <View style={styles.yourCardNameBlock}>
            <AppText
              type="title"
              fontFamily="serif"
              color={colors.onImage}
              numberOfLines={1}
            >
              {stats.displayName ?? t.your_card_anonymous_name}
            </AppText>
            {provider ? (
              <AppText type="caption" fontFamily="sans" color={colors.bronzeMid}>
                {provider}
              </AppText>
            ) : null}
          </View>
        </View>

        <View>
          <AppText
            type="caption"
            fontFamily="sans"
            color={colors.bronzeMid}
            style={styles.rankCaption}
          >
            {tabLabel}
          </AppText>
          <AppText
            fontFamily={rank === null ? "script" : "display"}
            color={colors.bronzeDark}
            style={styles.rankNumberHero}
          >
            {rankLabel}
          </AppText>
        </View>

        <Image source={Ink} style={styles.miniDivider} resizeMode="stretch" />

        <View style={styles.miniStatsRow}>
          <MiniStat label={t.your_card_total_points} value={stats.totalPoints} />
          <View style={styles.miniStatDivider} />
          <MiniStat label={t.your_card_games} value={stats.gamesPlayed} />
          <View style={styles.miniStatDivider} />
          <MiniStat label={t.your_card_best} value={stats.bestSingleGameScore} />
          <View style={styles.miniStatDivider} />
          <MiniStat label={t.your_card_accuracy} value={`${accuracy}%`} />
        </View>
      </View>
    </ImageBackground>
  );
};

type MiniStatProps = {
  label: string;
  value: number | string;
};

const MiniStat: React.FC<MiniStatProps> = ({ label, value }) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  return (
    <View style={styles.miniStatCell}>
      <AppText type="subHeadline" fontFamily="sans" color={colors.bronzeDark}>
        {value}
      </AppText>
      <AppText type="caption" fontFamily="sans" color={colors.bronzeMid}>
        {label}
      </AppText>
    </View>
  );
};

const YourCard: React.FC<YourCardProps> = ({
  isAnonymous,
  activeTab,
  rank,
  onPressSignIn,
}) => {
  const { stats } = useUserStats();

  if (isAnonymous || stats === null) {
    return <AnonymousCta onPressSignIn={onPressSignIn} />;
  }

  return <SignedInCard stats={stats} rank={rank} activeTab={activeTab} />;
};

export default YourCard;
