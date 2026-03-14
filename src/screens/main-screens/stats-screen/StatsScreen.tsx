import React, { useCallback, useState } from "react";
import { View, ScrollView, Share, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useStyles, useAppTheme, useTranslation } from "@/src/hooks";
import {
  getGameHistory,
  getStats,
  GameResult,
  formatDate,
} from "@/src/helpers";
import { AppText, EmptyState, StatisticsCard } from "@/src/components";

import { getStyles } from "./styles";

const STATS_CARDS = [
  {
    iconName: "sword-cross",
    field: "totalGames",
    descKey: "stats_total_games",
  },
  { iconName: "trophy", field: "bestScore", descKey: "stats_best_score" },
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
  const [history, setHistory] = useState<GameResult[]>([]);

  const handleShare = async (score: number) => {
    const message = t.game_share_message.replace("{score}", String(score));
    try {
      await Share.share({ message });
    } catch {
      // Share cancelled or failed
    }
  };

  useFocusEffect(
    useCallback(() => {
      getGameHistory().then(setHistory);
    }, []),
  );

  const stats = getStats(history);

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
            title={stats[field]}
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

      {history.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title={t.stats_no_games_title}
            description={t.stats_no_games_desc}
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {history.map((game, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={16}
                  color={colors.uiMuted}
                />
                <AppText fontSize={17} color={colors.uiMuted}>
                  {formatDate("DD/MM/YYYY", game.date)}
                </AppText>
              </View>
              <View style={styles.historyRight}>
                <AppText
                  fontFamily="serif"
                  type="subHeadline"
                  color={colors.bronzeDark}
                >
                  {game.score}
                </AppText>
                <AppText
                  fontFamily="serif"
                  type="body"
                  color={colors.bronzeMid}
                >
                  /{game.questionsAnswered}
                </AppText>
                <Pressable
                  onPress={() => handleShare(game.score)}
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
      )}
    </SafeAreaView>
  );
};

export default StatsScreen;
