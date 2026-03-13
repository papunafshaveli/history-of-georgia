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
        fontFamily="accent"
        fontWeight="bold"
        type="title"
        color={colors.coffeeDark}
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
          color={colors.coffeeDark}
        />
        <AppText
          fontFamily="accent"
          fontWeight="bold"
          type="subHeadline"
          color={colors.coffeeDark}
        >
          {t.stats_recent_games}
        </AppText>
      </View>

      {history.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
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
                  color={colors.muted}
                />
                <AppText fontSize={13} color={colors.muted}>
                  {formatDate("DD/MM/YYYY", game.date)}
                </AppText>
              </View>
              <View style={styles.historyRight}>
                <AppText
                  fontFamily="display"
                  type="subHeadline"
                  color={colors.coffeeDark}
                >
                  {game.score}
                </AppText>
                <AppText
                  fontFamily="display"
                  type="body"
                  color={colors.coffeeMedium}
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
                    color={colors.coffeeMedium}
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
