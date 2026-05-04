import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ToastAndroid,
  View,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { AppText, ConfirmNameModal, EmptyState } from "@/src/components";
import { IS_ANDROID, IS_IOS } from "@/src/constants";
import { getAdjustedWidth } from "@/src/helpers";
import {
  useAppTheme,
  useAuth,
  useLeaderboard,
  useStyles,
  useTranslation,
} from "@/src/hooks";
import { LeaderboardTab, type LeaderboardEntry } from "@/src/types";

import LeaderboardPodium from "./LeaderboardPodium";
import LeaderboardRow from "./LeaderboardRow";
import LeaderboardTabs from "./LeaderboardTabs";

import { getStyles } from "./styles";

const PODIUM_MIN_ENTRIES = 3;

const showSignInFailureToast = (message: string) => {
  if (IS_ANDROID) {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
};

type ProviderButtonProps = {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap | "logo-apple";
  onPress: () => void;
  disabled?: boolean;
};

const ProviderButton: React.FC<ProviderButtonProps> = ({
  label,
  iconName,
  onPress,
  disabled,
}) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const buttonStyle = useCallback(
    ({ pressed }: { pressed: boolean }) => {
      const base = pressed
        ? [styles.signInButton, styles.signInButtonPressed]
        : styles.signInButton;
      return disabled ? [base, styles.signInButtonDisabled] : base;
    },
    [styles, disabled],
  );

  const isApple = iconName === "logo-apple";
  const isDisabled = !!disabled;
  const buttonAccessibilityState = { disabled: isDisabled };

  let iconNode;
  if (isDisabled) {
    iconNode = <ActivityIndicator size="small" color={colors.bronzeDark} />;
  } else if (isApple) {
    iconNode = (
      <Ionicons name="logo-apple" size={22} color={colors.bronzeDark} />
    );
  } else {
    iconNode = (
      <MaterialCommunityIcons
        name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
        size={22}
        color={colors.bronzeDark}
      />
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={buttonAccessibilityState}
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
    >
      {iconNode}
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
  const { isAnonymous, uid, isSigningIn, signInWithGoogle, signInWithApple } =
    useAuth();

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

  const showApple = IS_IOS;

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

  const hasFullPodium = entries.length >= PODIUM_MIN_ENTRIES;
  const listData = hasFullPodium ? entries.slice(PODIUM_MIN_ENTRIES) : entries;

  const listKeyExtractor = useCallback(
    (entry: LeaderboardEntry) => entry.uid,
    [],
  );

  const renderListItem: ListRenderItem<LeaderboardEntry> = useCallback(
    ({ item }) => <LeaderboardRow entry={item} isSelf={item.uid === uid} />,
    [uid],
  );

  const listHeader = (
    <View>
      {ownRankCaption ? (
        <View style={styles.rankTextWrapper}>
          <AppText
            type="subHeadline"
            fontFamily="serif"
            color={colors.bronzeDark}
            style={styles.titleText}
          >
            {ownRankCaption}
          </AppText>
        </View>
      ) : null}

      <LeaderboardTabs activeTab={activeTab} onChangeTab={setActiveTab} />

      <LeaderboardPodium entries={entries} currentUid={uid} />
    </View>
  );

  let listEmpty: React.ReactNode = null;
  if (isLoading && entries.length === 0) {
    listEmpty = (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={colors.bronzeDark} />
      </View>
    );
  } else if (isLeaderboardEmpty) {
    listEmpty = <EmptyState title={emptyTitle} description={emptyDesc} />;
  }

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <View style={styles.fixedTitleContainer}>
        <ScreenTitle title={t.leaderboard_title} />
      </View>

      {isAnonymous ? (
        <View style={styles.anonGate}>
          <View style={styles.anonIconCircle}>
            <MaterialCommunityIcons
              name="script-text-outline"
              size={getAdjustedWidth(36)}
              color={colors.bronzeDark}
            />
          </View>
          <AppText
            type="title"
            fontFamily="serif"
            color={colors.bronzeDark}
            style={styles.anonHeadline}
          >
            {t.leaderboard_anon_headline}
          </AppText>
          <View style={styles.anonButtonsStack}>
            <ProviderButton
              label={t.signin_button_google}
              iconName="google"
              onPress={handleGooglePress}
              disabled={isSigningIn}
            />
            {showApple ? (
              <ProviderButton
                label={t.signin_button_apple}
                iconName="logo-apple"
                onPress={handleApplePress}
                disabled={isSigningIn}
              />
            ) : null}
          </View>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={listKeyExtractor}
          renderItem={renderListItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
        />
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
