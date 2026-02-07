import React, { useCallback, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { useTranslation } from "@/src/hooks";
import {
  getGameHistory,
  getStats,
  GameResult,
} from "@/src/helpers/gameHistory";

import styles from "./styles";

const StatsScreen = () => {
  const t = useTranslation();
  const [history, setHistory] = useState<GameResult[]>([]);

  useFocusEffect(
    useCallback(() => {
      getGameHistory().then(setHistory);
    }, [])
  );

  const stats = getStats(history);

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t.stats_title}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalGames}</Text>
            <Text style={styles.statLabel}>{t.stats_total_games}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.bestScore}</Text>
            <Text style={styles.statLabel}>{t.stats_best_score}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.averageScore}</Text>
            <Text style={styles.statLabel}>{t.stats_average_score}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalQuestions}</Text>
            <Text style={styles.statLabel}>{t.stats_total_questions}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t.stats_recent_games}</Text>

        {history.length === 0 ? (
          <Text style={styles.emptyText}>{t.stats_no_games}</Text>
        ) : (
          history.map((game, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyDate}>{formatDate(game.date)}</Text>
              <Text style={styles.historyScore}>{game.score}</Text>
              <Text style={styles.historyDetail}>
                {game.score}/{game.questionsAnswered}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatsScreen;
