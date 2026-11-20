import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppText } from "@/src/components";
import { DAILY_QUESTION_COUNT } from "@/src/constants";
import { formatClock, getAdjustedWidth } from "@/src/helpers";
import { useAppTheme, useStyles } from "@/src/hooks";
import type { LeaderboardEntry } from "@/src/types";

import { getStyles } from "./styles";

type LeaderboardScoreProps = {
  entry: LeaderboardEntry;
  compact?: boolean;
};

// Weekly/all-time show points; Today shows "N/10" plus the time that breaks ties.
const LeaderboardScore: React.FC<LeaderboardScoreProps> = ({ entry, compact = false }) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  const isDaily = entry.timeMs !== undefined;
  const scoreLabel = isDaily ? `${entry.points}/${DAILY_QUESTION_COUNT}` : String(entry.points);
  const textType = compact ? "caption" : "subHeadline";
  const iconSize = getAdjustedWidth(compact ? 12 : 15);
  const wrapperStyle = compact ? styles.scoreTimeCompact : styles.scoreTime;

  if (!isDaily) {
    return (
      <AppText type={textType} fontFamily="serif" color={colors.bronzeDark}>
        {scoreLabel}
      </AppText>
    );
  }

  return (
    <View style={wrapperStyle}>
      <AppText type={textType} fontFamily="serif" color={colors.bronzeDark}>
        {scoreLabel}
      </AppText>
      <View style={styles.timeChip}>
        <MaterialCommunityIcons name="timer-outline" size={iconSize} color={colors.bronzeMid} />
        <AppText type={textType} fontFamily="serif" color={colors.text}>
          {formatClock(entry.timeMs ?? 0)}
        </AppText>
      </View>
    </View>
  );
};

export default React.memo(LeaderboardScore);
