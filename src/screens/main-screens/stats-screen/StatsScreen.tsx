import React, { useCallback, useMemo } from "react";
import { Pressable, ScrollView, Share, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppText, EmptyState, StatisticsCard } from "@/src/components";
import { formatDate } from "@/src/helpers";
import {
  useAppTheme,
  useRecentGames,
  useStyles,
  useTranslation,
  useUserStats,
} from "@/src/hooks";

import { getStyles } from "./styles";

type StatsCardField =
  | "totalGames"
  | "bestScore"
  | "averageScore"
  | "totalQuestions";

const STATS_CARDS = [
  {
    iconName: "sword-cross",
    field: "totalGames",
    descKey: "stats_total_games",
  },
  {
    iconName: "trophy",
    field: "bestScore",
    descKey: "stats_best_score",
  },
  {
    iconName: "chart-line",
    field: "averageScore",
    descKey: "stats_average_score",
  },
  {
    iconName: "help-circle-outline",
    field: "totalQuestions",
    descKey: "stats_total_questions",
  },
] as const;

const StatsScreen = () => {
  const t = useTranslation();
  const styles = useStyles(getStyles);
  const { colors } = useAppTheme();

  const { stats, refresh: refreshStats } = useUserStats();
  const { games, refresh: refreshRecent } = useRecentGames();

  useFocusEffect(
    useCallback(() => {
      refreshStats();
      refreshRecent();
    }, [refreshStats, refreshRecent]),
  );

  const cardValues = useMemo<Record<StatsCardField, number>>(() => {
    const gamesPlayed = stats?.gamesPlayed ?? 0;
    const totalPoints = stats?.totalPoints ?? 0;
    return {
      totalGames: gamesPlayed,
      bestScore: stats?.bestSingleGameScore ?? 0,
      averageScore:
        gamesPlayed > 0 ? Math.round(totalPoints / gamesPlayed) : 0,
      totalQuestions: stats?.totalQuestions ?? 0,
    };
  }, [stats]);

  const handleShare = useCallback(
    (score: number) => async () => {
      const message = t.game_share_message.replace("{score}", String(score));
      try {
        await Share.share({ message });
      } catch {
        // Share cancelled or failed
      }
    },
    [t.game_share_message],
  );

  const hasRecentGames = games.length > 0;

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <AppText
        fontFamily="serif"
        fontWeight="bold"
        type="title"
        color={colors.bronzeDark}
        style={styles.title}
      >
        {t.stats_title}
      </AppText>

      <View style={styles.statsGrid}>
        {STATS_CARDS.map(({ iconName, field, descKey }) => (
          <StatisticsCard
            key={field}
            iconName={iconName}
            title={cardValues[field]}
            description={t[descKey]}
          />
        ))}
      </View>

      <View style={styles.sectionTitleRow}>
        <MaterialCommunityIcons
          name="history"
          size={20}
          color={colors.bronzeDark}
        />
        <AppText
          fontFamily="serif"
          fontWeight="bold"
          type="subHeadline"
          color={colors.bronzeDark}
        >
          {t.stats_recent_games}
        </AppText>
      </View>

      {hasRecentGames ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {games.map((game) => (
            <View key={game.resultId} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={16}
                  color={colors.uiMuted}
                />
                <AppText fontSize={17} color={colors.uiMuted}>
                  {formatDate("DD/MM/YYYY", game.createdAtMs)}
                </AppText>
              </View>
              <View style={styles.historyRight}>
                <AppText
                  fontFamily="serif"
                  type="subHeadline"
                  color={colors.bronzeDark}
                >
                  {game.correctCount}
                </AppText>
                <AppText
                  fontFamily="serif"
                  type="body"
                  color={colors.bronzeMid}
                >
                  {`/${game.totalQuestions}`}
                </AppText>
                <Pressable
                  onPress={handleShare(game.score)}
                  style={styles.shareButton}
                  accessibilityLabel="Share score"
                >
                  <MaterialCommunityIcons
                    name="share-variant"
                    size={18}
                    color={colors.bronzeMid}
                  />
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title={t.stats_no_games_title}
            description={t.stats_no_games_desc}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default StatsScreen;
