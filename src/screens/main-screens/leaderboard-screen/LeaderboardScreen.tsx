import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  ToastAndroid,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { AppText, ConfirmNameModal, EmptyState, Loading } from "@/src/components";
import {
  useAppTheme,
  useAuth,
  useLeaderboard,
  useStyles,
  useTranslation,
} from "@/src/hooks";
import { LeaderboardTab } from "@/src/types";

import LeaderboardRow from "./LeaderboardRow";
import LeaderboardTabs from "./LeaderboardTabs";

import { getStyles } from "./styles";

const showSignInFailureToast = (message: string) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
};

type ProviderButtonProps = {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap | "logo-apple";
  onPress: () => void;
};

const ProviderButton: React.FC<ProviderButtonProps> = ({
  label,
  iconName,
  onPress,
}) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const buttonStyle = useCallback(
    ({ pressed }: { pressed: boolean }) =>
      pressed
        ? [styles.signInButton, styles.signInButtonPressed]
        : styles.signInButton,
    [styles],
  );

  const isApple = iconName === "logo-apple";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={buttonStyle}
      onPress={onPress}
    >
      {isApple ? (
        <Ionicons name="logo-apple" size={22} color={colors.bronzeDark} />
      ) : (
        <MaterialCommunityIcons
          name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
          size={22}
          color={colors.bronzeDark}
        />
      )}
      <AppText type="subHeadline" fontFamily="serif" color={colors.bronzeDark}>
        {label}
      </AppText>
    </Pressable>
  );
};

type ScreenTitleProps = {
  title: string;
};

const ScreenTitle: React.FC<ScreenTitleProps> = ({ title }) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  return (
    <View style={styles.titleBlock}>
      <AppText
        type="title"
        fontFamily="script"
        color={colors.bronzeDark}
        style={styles.titleText}
      >
        {title}
      </AppText>
      <View style={styles.titleDivider} />
    </View>
  );
};

const LeaderboardScreen: React.FC = () => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  const { isAnonymous, uid, signInWithGoogle, signInWithApple } = useAuth();

  const [activeTab, setActiveTab] = useState<LeaderboardTab>(
    LeaderboardTab.WEEKLY,
  );
  const [confirmNameOpen, setConfirmNameOpen] = useState(false);
  const [confirmNameInitial, setConfirmNameInitial] = useState<string | null>(
    null,
  );

  const { entries, isLoading, isRefreshing, refresh } = useLeaderboard({
    tab: activeTab,
  });

  const openConfirmNameIfFirstLink = useCallback(
    (result: { wasFirstLink: boolean; displayName: string | null }) => {
      if (result.wasFirstLink) {
        setConfirmNameInitial(result.displayName);
        setConfirmNameOpen(true);
      }
    },
    [],
  );

  const handleGooglePress = useCallback(async () => {
    try {
      const result = await signInWithGoogle();
      openConfirmNameIfFirstLink(result);
    } catch {
      showSignInFailureToast(t.signin_failure_toast);
    }
  }, [signInWithGoogle, openConfirmNameIfFirstLink, t.signin_failure_toast]);

  const handleApplePress = useCallback(async () => {
    try {
      const result = await signInWithApple();
      openConfirmNameIfFirstLink(result);
    } catch {
      showSignInFailureToast(t.signin_failure_toast);
    }
  }, [signInWithApple, openConfirmNameIfFirstLink, t.signin_failure_toast]);

  const handleConfirmNameSaved = useCallback(() => {
    setConfirmNameOpen(false);
    setConfirmNameInitial(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const showApple = Platform.OS === "ios";

  const ownRank = useMemo<number | null>(() => {
    if (!uid) return null;
    const self = entries.find((entry) => entry.uid === uid);
    return self ? self.rank : null;
  }, [entries, uid]);

  const ownRankCaption = useMemo(() => {
    if (ownRank === null) return null;
    return t.leaderboard_your_rank.replace("{rank}", String(ownRank));
  }, [ownRank, t.leaderboard_your_rank]);

  const isLeaderboardEmpty = !isLoading && entries.length === 0;
  const emptyTitle =
    activeTab === LeaderboardTab.WEEKLY
      ? t.leaderboard_empty_week_title
      : t.leaderboard_empty_alltime_title;
  const emptyDesc =
    activeTab === LeaderboardTab.WEEKLY
      ? t.leaderboard_empty_week_desc
      : t.leaderboard_empty_alltime_desc;

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <View style={styles.fixedTitleContainer}>
        <ScreenTitle title={t.leaderboard_title} />
      </View>

      {isAnonymous ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
        >
          <View style={styles.providersStack}>
            <ProviderButton
              label={t.signin_button_google}
              iconName="google"
              onPress={handleGooglePress}
            />
            {showApple ? (
              <ProviderButton
                label={t.signin_button_apple}
                iconName="logo-apple"
                onPress={handleApplePress}
              />
            ) : null}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
        >
          {ownRankCaption ? (
            <AppText
              type="subHeadline"
              fontFamily="serif"
              color={colors.bronzeDark}
              style={styles.titleText}
            >
              {ownRankCaption}
            </AppText>
          ) : null}

          <LeaderboardTabs activeTab={activeTab} onChangeTab={setActiveTab} />

          {isLoading && entries.length === 0 ? (
            <View style={styles.loadingState}>
              <Loading />
            </View>
          ) : isLeaderboardEmpty ? (
            <EmptyState title={emptyTitle} description={emptyDesc} />
          ) : (
            <View style={styles.leaderboardListWrapper}>
              {entries.map((entry) => (
                <LeaderboardRow
                  key={entry.uid}
                  entry={entry}
                  isSelf={entry.uid === uid}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <ConfirmNameModal
        isVisible={confirmNameOpen}
        initialName={confirmNameInitial}
        onSaved={handleConfirmNameSaved}
      />
    </SafeAreaView>
  );
};

export default LeaderboardScreen;
