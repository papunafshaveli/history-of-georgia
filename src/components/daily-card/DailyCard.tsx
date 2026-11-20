import React, { useCallback, useMemo } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { KingMuted, KingTopic, WaxSeal } from "@/src/assets";
import { AppText } from "@/src/components/text";
import { DAILY_QUESTION_COUNT } from "@/src/constants";
import { formatClock, formatCountdown } from "@/src/helpers/stopwatch";
import { getAdjustedWidth } from "@/src/helpers";
import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";
import { DailyCardKind, SwordState } from "@/src/types";

import DailyProgress from "../daily-progress/DailyProgress";
import { getStyles } from "./styles";

// Script glyphs rise well above the preset line heights, so each size carries its own.
const TITLE_SIZE = 30;
const TITLE_LINE = 36;
const CTA_SIZE = 19;
const CTA_LINE = 24;
const GHOST_SIZE = 14;
const GHOST_LINE = 20;
const SEAL_SIZE = 22;
const SEAL_LINE = 26;
const META_ICON = 14;
const DESCRIPTION_SIZE = 13;
const DESCRIPTION_LINE = 18;
const FLAME_ICON = 18;
const SWORD_SIZE = getAdjustedWidth(17);
// The painting fades in from the left so the copy sits on plain ground.
const ART_FADE = [0, 0.2, 0.45] as const;
const SHADE_FADE = [0.55, 1] as const;
const CTA_STOPS = [0, 0.48, 1] as const;
const LEFT = { x: 0, y: 0 };
const RIGHT = { x: 1, y: 0 };

type DailyCardProps = {
  kind: DailyCardKind;
  streak: number;
  correct: number;
  marks: boolean[];
  elapsedMs: number;
  msToNext: number;
  onPlay: () => void;
  onOpenLeaderboard: () => void;
};

const toSwords = (kind: DailyCardKind, marks: boolean[]): SwordState[] =>
  Array.from({ length: DAILY_QUESTION_COUNT }, (_, i) => {
    if (i < marks.length) return marks[i] ? SwordState.WHOLE : SwordState.BROKEN;
    if (kind === DailyCardKind.IN_PROGRESS && i === marks.length) return SwordState.CURRENT;
    return SwordState.UPCOMING;
  });

const DailyCard: React.FC<DailyCardProps> = ({
  kind,
  streak,
  correct,
  marks,
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
  const swords = useMemo(() => toSwords(kind, marks), [kind, marks]);
  const swordPalette = useMemo(
    () => ({
      [SwordState.WHOLE]: colors.dailySwordWhole,
      [SwordState.BROKEN]: colors.dailySwordBroken,
      [SwordState.CURRENT]: colors.dailySwordCurrent,
      [SwordState.UPCOMING]: colors.dailySwordUpcoming,
    }),
    [colors],
  );

  if (kind === DailyCardKind.UNAVAILABLE) return null;

  const isDone = kind === DailyCardKind.DONE;
  const time = formatClock(elapsedMs);
  const streakLine = t.daily_streak_line.replace("{n}", String(streak));
  const showStreak = streak > 0;
  const artColors = [colors.dailyCardBg, colors.dailyCardBgVeil, colors.dailyCardBgClear] as const;
  const shadeColors = [colors.dailyCardBgClear, colors.dailyCardShade] as const;
  const ctaColors = [colors.dailyCtaTop, colors.dailyCtaMid, colors.dailyCtaBottom] as const;
  const ctaLabel = kind === DailyCardKind.IN_PROGRESS ? t.daily_card_resume : t.common_start;
  const score = `${correct}/${DAILY_QUESTION_COUNT}`;
  const nextIn = t.daily_next_in.replace("{time}", formatCountdown(msToNext));
  const a11y = isDone
    ? t.daily_card_a11y_done.replace("{n}", String(correct)).replace("{time}", time)
    : t.daily_card_a11y_play.replace("{streak}", String(streak));
  const onPress = isDone ? onOpenLeaderboard : onPlay;
  const art = isDone ? KingMuted : KingTopic;
  const artStyle = isDone ? [styles.artImage, styles.artImageMuted] : styles.artImage;

  const playFooter = (
    <View style={styles.footer}>
      <LinearGradient colors={ctaColors} locations={CTA_STOPS} style={styles.cta}>
        <AppText
          fontFamily="script"
          fontSize={CTA_SIZE}
          lineHeight={CTA_LINE}
          color={colors.dailyCtaText}
        >
          {ctaLabel}
        </AppText>
      </LinearGradient>
      {showStreak ? (
        <View style={styles.streak}>
          <MaterialCommunityIcons name="fire" size={FLAME_ICON} color={colors.dailyFlame} />
          <AppText type="caption" fontFamily="serif" color={colors.dailyStreak}>
            {streakLine}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  const doneFooter = (
    <View style={styles.footer}>
      <View style={styles.ghost}>
        <MaterialCommunityIcons name="podium" size={FLAME_ICON} color={colors.dailyGhostText} />
        <AppText
          fontFamily="script"
          fontSize={GHOST_SIZE}
          lineHeight={GHOST_LINE}
          color={colors.dailyGhostText}
          numberOfLines={1}
        >
          {t.daily_open_leaderboard}
        </AppText>
      </View>
    </View>
  );

  const doneDetails = (
    <View style={styles.meta}>
      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="timer-outline" size={META_ICON} color={colors.dailyText} />
        <AppText type="caption" color={colors.dailyText}>
          {time}
        </AppText>
      </View>
      {showStreak ? (
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="fire" size={META_ICON} color={colors.dailyFlame} />
          <AppText type="caption" color={colors.dailyText}>
            {streakLine}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPress}
        style={getCardStyle}
        accessibilityRole="button"
        accessibilityLabel={a11y}
      >
        <View style={styles.art} pointerEvents="none">
          <Image source={art} style={artStyle} />
          <LinearGradient
            colors={artColors}
            locations={ART_FADE}
            start={LEFT}
            end={RIGHT}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <LinearGradient
          colors={shadeColors}
          locations={SHADE_FADE}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.hairline} pointerEvents="none" />

        {isDone ? (
          <>
            <View style={styles.seal} pointerEvents="none">
              <Image source={WaxSeal} style={styles.sealImage} />
              <AppText
                fontFamily="script"
                fontSize={SEAL_SIZE}
                lineHeight={SEAL_LINE}
                color={colors.dailySealText}
                style={styles.sealText}
              >
                {score}
              </AppText>
            </View>
            <AppText type="caption" color={colors.dailyTextMuted} style={styles.countdown}>
              {nextIn}
            </AppText>
          </>
        ) : null}

        <View style={styles.content}>
          <AppText
            fontFamily="script"
            fontSize={TITLE_SIZE}
            lineHeight={TITLE_LINE}
            color={colors.dailyTitle}
            style={styles.title}
            numberOfLines={1}
          >
            {t.daily_section_title}
          </AppText>

          {isDone ? (
            doneDetails
          ) : (
            <AppText
              type="caption"
              fontSize={DESCRIPTION_SIZE}
              lineHeight={DESCRIPTION_LINE}
              color={colors.dailyText}
              style={styles.description}
            >
              {t.daily_card_description}
            </AppText>
          )}

          <DailyProgress
            states={swords}
            size={SWORD_SIZE}
            palette={swordPalette}
            style={styles.swords}
          />

          <View style={styles.spacer} />
          {isDone ? doneFooter : playFooter}
        </View>
      </Pressable>
    </View>
  );
};

export default React.memo(DailyCard);
