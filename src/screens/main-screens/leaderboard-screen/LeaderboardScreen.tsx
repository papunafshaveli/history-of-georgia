import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  RefreshControl,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Loading, SignInModal } from "@/src/components";
import { BodyRoll, HeaderRoll, Ink, StartScreenBack } from "@/src/assets";
import {
  useAppTheme,
  useAuth,
  useLeaderboard,
  useStyles,
  useThemeMode,
  useTranslation,
  useUserStats,
} from "@/src/hooks";
import { LeaderboardTab, type LeaderboardEntry } from "@/src/types";

import LeaderboardPodium from "./LeaderboardPodium";
import LeaderboardRow from "./LeaderboardRow";
import LeaderboardTabs from "./LeaderboardTabs";
import YourCard from "./YourCard";

import { getStyles } from "./styles";

const ListSeparator: React.FC = () => {
  const styles = useStyles(getStyles);
  return <View style={styles.listSeparator} />;
};

const LoadingState: React.FC = () => {
  const styles = useStyles(getStyles);
  return (
    <View style={styles.loadingState}>
      <Loading />
    </View>
  );
};

type LeaderboardEmptyPanelProps = {
  title: string;
};

const LeaderboardEmptyPanel: React.FC<LeaderboardEmptyPanelProps> = ({
  title,
}) => {
  const { colors } = useAppTheme();
  const { isThemeDark } = useThemeMode();
  const styles = useStyles(getStyles);
  return (
    <ImageBackground
      source={BodyRoll}
      resizeMode="stretch"
      style={styles.emptyPanel}
    >
      {isThemeDark ? <View style={styles.darkTint} /> : null}
      <View style={styles.emptyPanelInner}>
        <AppText
          type="title"
          fontFamily="script"
          color={colors.onImage}
          style={styles.emptyPanelTitle}
        >
          {title}
        </AppText>
      </View>
    </ImageBackground>
  );
};

type ScreenTitleProps = {
  title: string;
};

const ScreenTitle: React.FC<ScreenTitleProps> = ({ title }) => {
  const { colors } = useAppTheme();
  const { isThemeDark } = useThemeMode();
  const styles = useStyles(getStyles);
  return (
    <View>
      <ImageBackground
        source={HeaderRoll}
        resizeMode="stretch"
        style={styles.titleHeader}
      >
        {isThemeDark ? <View style={styles.darkTint} /> : null}
        <AppText type="title" fontFamily="script" color={colors.onImage}>
          {title}
        </AppText>
      </ImageBackground>
      <Image
        source={Ink}
        resizeMode="contain"
        style={styles.titleFlourishUnder}
      />
    </View>
  );
};

const LeaderboardScreen: React.FC = () => {
  const t = useTranslation();
  const styles = useStyles(getStyles);
  const { isAnonymous, uid } = useAuth();
  const { stats } = useUserStats();

  const [activeTab, setActiveTab] = useState<LeaderboardTab>(
    LeaderboardTab.WEEKLY,
  );
  const [isSignInVisible, setIsSignInVisible] = useState(false);

  const { entries, isLoading, isRefreshing, refresh } = useLeaderboard({
    tab: activeTab,
  });

  const topThree = useMemo(() => entries.slice(0, 3), [entries]);
  const tail = useMemo(() => entries.slice(3), [entries]);

  const myRank = useMemo(() => {
    if (!stats || isAnonymous) return null;
    const inTopList = entries.find((e) => e.uid === uid);
    return inTopList ? inTopList.rank : null;
  }, [stats, isAnonymous, entries, uid]);

  const openSignIn = useCallback(() => setIsSignInVisible(true), []);
  const closeSignIn = useCallback(() => setIsSignInVisible(false), []);

  const renderRow = useCallback(
    ({ item }: { item: LeaderboardEntry }) => (
      <LeaderboardRow entry={item} isSelf={item.uid === uid} />
    ),
    [uid],
  );

  const keyExtractor = useCallback((item: LeaderboardEntry) => item.uid, []);

  const isEmpty = !isLoading && entries.length === 0;
  const emptyTitle =
    activeTab === LeaderboardTab.WEEKLY
      ? t.leaderboard_empty_week
      : t.leaderboard_empty_alltime;

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <ImageBackground
        source={StartScreenBack}
        resizeMode="cover"
        style={styles.screenBackground}
        imageStyle={styles.screenBackgroundImage}
      >
        <FlatList
          data={tail}
          keyExtractor={keyExtractor}
          renderItem={renderRow}
          contentContainerStyle={styles.scrollContent}
          ItemSeparatorComponent={ListSeparator}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
          ListHeaderComponent={
            <>
              <ScreenTitle title={t.leaderboard_title} />
              <YourCard
                isAnonymous={isAnonymous}
                activeTab={activeTab}
                rank={myRank}
                onPressSignIn={openSignIn}
              />
              <LeaderboardTabs activeTab={activeTab} onChangeTab={setActiveTab} />
              {!isLoading && entries.length > 0 ? (
                <LeaderboardPodium topThree={topThree} />
              ) : null}
              {isEmpty ? <LeaderboardEmptyPanel title={emptyTitle} /> : null}
            </>
          }
          ListEmptyComponent={isLoading ? <LoadingState /> : null}
        />

        <SignInModal isVisible={isSignInVisible} onClose={closeSignIn} />
      </ImageBackground>
    </SafeAreaView>
  );
};

export default LeaderboardScreen;
