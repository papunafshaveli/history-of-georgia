import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
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

import {
  AppSettings,
  AppText,
  DailyProgress,
  Endgame,
  Modal,
} from "@/src/components";
import {
  GameFooter,
  OptionsDisplay,
  QuestionDisplay,
} from "@/src/components/game-screen-components";
import { formatClock, getAdjustedWidth } from "@/src/helpers";
import {
  useAppTheme,
  useDailyLoad,
  useDailyRun,
  useStyles,
  useTranslation,
} from "@/src/hooks";
import type { DailyRecord, DailySet, RootStackParamList } from "@/src/types";

import { getStyles } from "./styles";

type DailyRoute = RouteProp<RootStackParamList, "daily-game-screen">;

type DailyRunProps = {
  date: string;
  set: DailySet;
  record: DailyRecord;
  startMs: number;
};

const DailyRun: React.FC<DailyRunProps> = ({ date, set, record, startMs }) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {
    question,
    index,
    total,
    displayMs,
    swordStates,
    locked,
    hasSaveError,
    retrySave,
    handleOptionPress,
  } = useDailyRun(date, set, record, startMs);
  const [isExitOpen, setIsExitOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const clockLabel = formatClock(displayMs);
  const clockA11y = t.daily_time_a11y.replace("{time}", clockLabel);
  const progressTitle = t.daily_question_progress.replace(
    "{n}",
    String(Math.min(index + 1, total)),
  );

  const openExit = useCallback(() => setIsExitOpen(true), []);
  const closeExit = useCallback(() => setIsExitOpen(false), []);
  const toggleSettings = useCallback(() => setIsSettingsOpen((v) => !v), []);
  const noop = useCallback(() => undefined, []);
  // Leaving keeps the attempt; it resumes from the home card.
  const handleLeave = useCallback(() => {
    setIsExitOpen(false);
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <AppText type="headline" fontFamily="script" color={colors.text}>
            {progressTitle}
          </AppText>
          <View
            style={styles.clockChip}
            accessible
            accessibilityLabel={clockA11y}
          >
            <MaterialCommunityIcons
              name="timer-outline"
              size={getAdjustedWidth(18)}
              color={colors.bronzeDark}
            />
            <AppText
              type="headline"
              fontFamily="script"
              color={colors.text}
              style={styles.clockText}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {clockLabel}
            </AppText>
          </View>
        </View>
        <DailyProgress states={swordStates} size={getAdjustedWidth(26)} />
      </View>

      <QuestionDisplay isLoading={false} question={question?.question} />
      <OptionsDisplay
        options={question?.options}
        correctAnswer={question?.correctAnswer}
        onOptionPress={handleOptionPress}
        isOptionDisabled={locked}
        isLoading={false}
      />

      {hasSaveError && (
        <View style={styles.saveError}>
          <AppText
            type="body"
            color={colors.text}
            accessibilityLiveRegion="polite"
          >
            {t.daily_save_error}
          </AppText>
          <Pressable
            onPress={retrySave}
            accessibilityRole="button"
            style={styles.loadingClose}
          >
            <AppText type="subHeadline" color={colors.bronzeDark}>
              {t.game_retry}
            </AppText>
          </Pressable>
        </View>
      )}

      <GameFooter
        onExit={openExit}
        onHint={noop}
        onSettings={toggleSettings}
        hintsCount={0}
        isHintDisabled
        showHint={false}
      />

      <Modal
        isVisible={isExitOpen}
        headerTitle={t.game_end}
        onClose={closeExit}
        renderComponent={
          <Endgame
            onPressExit={handleLeave}
            onPressContinue={closeExit}
            title={t.daily_exit_body}
            titleType="subHeadline"
            continueBtnText={t.game_continue}
            closeBtnText={t.common_logout}
          />
        }
      />
      <Modal
        isVisible={isSettingsOpen}
        headerTitle={t.common_parameters}
        onClose={toggleSettings}
        renderComponent={<AppSettings />}
      />
    </View>
  );
};

const DailyGameScreen = () => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  const { params } = useRoute<DailyRoute>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const state = useDailyLoad(params.date);
  const { top, bottom } = useSafeAreaInsets();
  const insetStyle = [
    styles.safeArea,
    { paddingTop: top, paddingBottom: bottom },
  ];
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  let body: React.ReactNode;
  if (state.kind === "ready") {
    body = (
      <DailyRun
        // A different day must start a fresh run, not reuse the previous day's answers and clock.
        key={params.date}
        date={params.date}
        set={state.set}
        record={state.record}
        startMs={state.startMs}
      />
    );
  } else if (state.kind === "unavailable") {
    body = (
      <View style={styles.centered}>
        <AppText
          type="headline"
          fontFamily="serif"
          color={colors.bronzeDark}
          style={styles.centeredText}
        >
          {t.game_failed_to_load}
        </AppText>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          style={styles.backButton}
        >
          <AppText type="subHeadline" fontFamily="serif" color={colors.surface}>
            {t.common_close}
          </AppText>
        </Pressable>
      </View>
    );
  } else {
    // Loading waits on the network; the player can always leave.
    body = (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.bronzeDark} />
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          style={styles.loadingClose}
        >
          <AppText type="body" fontFamily="serif" color={colors.bronzeDark}>
            {t.common_close}
          </AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView edges={[]} style={insetStyle}>
      {body}
    </SafeAreaView>
  );
};

export default DailyGameScreen;
