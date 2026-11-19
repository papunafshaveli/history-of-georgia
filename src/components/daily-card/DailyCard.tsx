import React, { useCallback } from "react";
import { Pressable, View, type PressableStateCallbackType } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppText } from "@/src/components/text";
import { DAILY_QUESTION_COUNT } from "@/src/constants";
import { formatClock, formatCountdown } from "@/src/helpers/stopwatch";
import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";
import { DailyCardKind } from "@/src/types";

import GradientWrapper from "../gradient-wrapper/GradientWrapper";
import { getStyles } from "./styles";

// Width-scaled like the font, so the digits are never clipped; long streaks (1234) shrink to fit.
const STREAK_LINE_HEIGHT = 28;
const STREAK_MIN_FONT_SCALE = 0.5;

type DailyCardProps = {
  kind: DailyCardKind;
  streak: number;
  correct: number;
  elapsedMs: number;
  msToNext: number;
  onPlay: () => void;
  onOpenLeaderboard: () => void;
};

const DailyCard: React.FC<DailyCardProps> = ({
  kind,
  streak,
  correct,
  elapsedMs,
  msToNext,
  onPlay,
  onOpenLeaderboard,
}) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const getCardStyle = useCallback(
    ({ pressed }: PressableStateCallbackType) =>
      pressed ? [styles.card, styles.cardPressed] : styles.card,
    [styles.card, styles.cardPressed],
  );
  const getDoneStyle = useCallback(
    ({ pressed }: PressableStateCallbackType) =>
      pressed ? [styles.cardDone, styles.cardPressed] : styles.cardDone,
    [styles.cardDone, styles.cardPressed],
  );

  if (kind === DailyCardKind.UNAVAILABLE) return null;

  const time = formatClock(elapsedMs);
  const titlePill = (
    <View style={styles.titlePill}>
      <AppText type="body" fontFamily="serif" fontWeight="bold" color={colors.bronzeLight}>
        {t.daily_section_title}
      </AppText>
    </View>
  );

  if (kind === DailyCardKind.DONE) {
    const doneTitle = `${correct}/${DAILY_QUESTION_COUNT} · ${time}`;
    const nextIn = t.daily_next_in.replace("{time}", formatCountdown(msToNext));
    const a11y = t.daily_card_a11y_done
      .replace("{n}", String(correct))
      .replace("{time}", time);
    return (
      <View style={styles.container}>
        {titlePill}
        <Pressable
          onPress={onOpenLeaderboard}
          style={getDoneStyle}
          accessibilityRole="button"
          accessibilityLabel={a11y}
        >
          <View style={styles.cardBody}>
            <View style={styles.iconFrame}>
              <MaterialCommunityIcons name="check-decagram" size={32} color={colors.bronzeDark} />
            </View>
            <View style={styles.copy}>
              <AppText type="headline" fontFamily="serif" color={colors.textOnPrimary} numberOfLines={1}>
                {doneTitle}
              </AppText>
              <AppText type="body" color={colors.bronzeLight} style={styles.description}>
                {nextIn}
              </AppText>
            </View>
            <View style={styles.action}>
              <MaterialCommunityIcons name="podium" size={22} color={colors.bronzeLight} />
            </View>
          </View>
        </Pressable>
      </View>
    );
  }

  const title =
    kind === DailyCardKind.IN_PROGRESS ? t.daily_card_resume : t.daily_card_title;
  const a11y = t.daily_card_a11y_play.replace("{streak}", String(streak));

  return (
    <View style={styles.container}>
      {titlePill}
      <Pressable
        onPress={onPlay}
        style={getCardStyle}
        accessibilityRole="button"
        accessibilityLabel={a11y}
      >
        <GradientWrapper style={styles.cardBody}>
          <View style={styles.iconFrame}>
            <AppText
              type="title"
              fontFamily="serif"
              lineHeight={STREAK_LINE_HEIGHT}
              color={colors.bronzeDark}
              style={styles.streakNumber}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={STREAK_MIN_FONT_SCALE}
            >
              {String(streak)}
            </AppText>
            <AppText type="caption" color={colors.textMuted}>
              {t.daily_days}
            </AppText>
          </View>
          <View style={styles.copy}>
            <AppText type="headline" fontFamily="serif" color={colors.bronzeDark} numberOfLines={1}>
              {title}
            </AppText>
            <AppText type="body" color={colors.textMuted} numberOfLines={2} style={styles.description}>
              {t.daily_card_description}
            </AppText>
          </View>
          <View style={styles.action}>
            <MaterialCommunityIcons name="arrow-right" size={22} color={colors.bronzeLight} />
          </View>
        </GradientWrapper>
      </Pressable>
    </View>
  );
};

export default React.memo(DailyCard);
