import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Share,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { QuestionBackground } from "@/src/assets";
import { AppText, DailyProgress } from "@/src/components";
import { DAILY_QUESTION_COUNT } from "@/src/constants";
import {
  buildDailyShare,
  formatClock,
  getAdjustedWidth,
  storeLink,
} from "@/src/helpers";
import {
  primeLeaderboardCache,
  useAppTheme,
  useAuth,
  useStyles,
  useTranslation,
} from "@/src/hooks";
import { syncDailyResults } from "@/src/services/firestore-daily";
import { getLeaderboard } from "@/src/services/firestore-leaderboard";
import {
  correctCount,
  readRecord,
  readStreak,
} from "@/src/services/local-daily-progress";
import {
  LeaderboardTab,
  ScreenName,
  SwordState,
  type DailyRecord,
  type RootStackParamList,
} from "@/src/types";
import { todayTbilisi } from "@/src/utils/tbilisiDate";

import { getStyles } from "./styles";

type ResultRoute = RouteProp<RootStackParamList, "daily-result-screen">;

const formatDay = (date: string) => {
  const [, month, day] = date.split("-");
  return `${day}.${month}`;
};

const DailyResultScreen = () => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  const { params } = useRoute<ResultRoute>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { uid, isAnonymous } = useAuth();
  const { top, bottom } = useSafeAreaInsets();

  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [streak, setStreak] = useState(0);
  const [place, setPlace] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [saved, savedStreak] = await Promise.all([
        readRecord(params.date),
        readStreak(),
      ]);
      if (cancelled) return;
      setRecord(saved);
      setStreak(savedStreak.current);
      if (!uid) return;
      await syncDailyResults(uid);
      // Guests are never on the Today board, so don't spend reads looking for their place.
      if (cancelled || isAnonymous || params.date !== todayTbilisi()) return;
      // Only players in the shown top list get a place; others simply see no place line.
      const board = await getLeaderboard(LeaderboardTab.TODAY, params.date).catch(
        () => null,
      );
      if (!board || params.date !== todayTbilisi()) return;
      // The Today tab opened from here reuses this fetch instead of reading the board again.
      await primeLeaderboardCache(LeaderboardTab.TODAY, board, params.date);
      const self = board.find((entry) => entry.uid === uid);
      if (!cancelled && self) setPlace(self.rank);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.date, uid, isAnonymous]);

  const answers = useMemo(
    () => record?.answers.map((a) => a.isCorrect) ?? [],
    [record],
  );
  const swordStates = useMemo(
    () => answers.map((ok) => (ok ? SwordState.WHOLE : SwordState.BROKEN)),
    [answers],
  );
  // The parchment stays light in both themes, so its swords use fixed ink colours.
  const parchmentSwords = useMemo(
    () => ({
      [SwordState.WHOLE]: colors.parchmentSwordWhole,
      [SwordState.BROKEN]: colors.parchmentSwordBroken,
      [SwordState.CURRENT]: colors.parchmentSwordCurrent,
      [SwordState.UPCOMING]: colors.parchmentSwordUpcoming,
    }),
    [colors],
  );
  const correct = record ? correctCount(record) : 0;
  const elapsed = record?.elapsedMs ?? 0;
  const scoreLabel = `${correct}/${DAILY_QUESTION_COUNT}`;
  const timeLabel = formatClock(elapsed);
  const title = t.daily_result_title.replace("{date}", formatDay(params.date));
  const streakLine = t.daily_streak_line.replace("{n}", String(streak));
  const placeLine =
    place === null ? null : t.daily_place_line.replace("{n}", String(place));
  const insetStyle = [
    styles.safeArea,
    { paddingTop: top, paddingBottom: bottom },
  ];
  const shareStyle = ({ pressed }: { pressed: boolean }) =>
    pressed ? [styles.shareButton, styles.pressed] : styles.shareButton;
  const secondaryStyle = ({ pressed }: { pressed: boolean }) =>
    pressed ? [styles.secondaryButton, styles.pressed] : styles.secondaryButton;

  const handleShare = useCallback(() => {
    if (!record) return;
    const message = buildDailyShare(t.daily_share_message, {
      date: params.date,
      answers,
      elapsedMs: elapsed,
      streak,
      link: storeLink(),
    });
    Share.share({ message }).catch(() => undefined);
  }, [record, t.daily_share_message, params.date, answers, elapsed, streak]);

  const handleLeaderboard = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "tabs",
          params: {
            screen: ScreenName.LEADERBOARD_SCREEN,
            params: { initialTab: LeaderboardTab.TODAY },
          },
        },
      ],
    });
  }, [navigation]);

  const handleClose = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: "tabs" }] });
  }, [navigation]);

  return (
    <SafeAreaView edges={[]} style={insetStyle}>
      <ScrollView
        contentContainerStyle={styles.content}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <AppText type="headline" fontFamily="script" color={colors.text}>
          {title}
        </AppText>

        <ImageBackground
          source={QuestionBackground}
          resizeMode="stretch"
          style={styles.scroll}
        >
          <AppText
            type="display"
            fontFamily="script"
            color={colors.primary}
            style={styles.score}
          >
            {scoreLabel}
          </AppText>
          <View style={styles.timeRow}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={getAdjustedWidth(18)}
              color={colors.bronzeDark}
            />
            <AppText type="headline" fontFamily="script" color={colors.onImage}>
              {timeLabel}
            </AppText>
          </View>
          <DailyProgress
            states={swordStates}
            size={getAdjustedWidth(28)}
            columns={5}
            palette={parchmentSwords}
          />
        </ImageBackground>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <AppText type="caption" fontFamily="serif" color={colors.bronzeMid}>
            ❖
          </AppText>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.lines}>
          <AppText type="headline" fontFamily="script" color={colors.text}>
            {streakLine}
          </AppText>
          {placeLine ? (
            <AppText type="headline" fontFamily="script" color={colors.text}>
              {placeLine}
            </AppText>
          ) : null}
        </View>

        <View style={styles.spacer} />

        <View style={styles.buttons}>
          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            style={shareStyle}
          >
            <MaterialCommunityIcons
              name="share-variant"
              size={getAdjustedWidth(20)}
              color={colors.onImage}
            />
            <AppText type="headline" fontFamily="script" color={colors.onImage}>
              {t.daily_share}
            </AppText>
          </Pressable>
          <Pressable
            onPress={handleLeaderboard}
            accessibilityRole="button"
            style={secondaryStyle}
          >
            <AppText type="subHeadline" fontFamily="script" color={colors.text}>
              {t.daily_open_leaderboard}
            </AppText>
          </Pressable>
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            style={styles.closeButton}
          >
            <AppText type="body" fontFamily="serif" color={colors.bronzeDark}>
              {t.common_close}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DailyResultScreen;
