import React, { useCallback } from "react";
import { Pressable, View } from "react-native";

import { AppText } from "@/src/components";
import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";
import { LeaderboardTab } from "@/src/types";

import { getStyles } from "./styles";

type LeaderboardTabsProps = {
  activeTab: LeaderboardTab;
  onChangeTab: (tab: LeaderboardTab) => void;
};

const LeaderboardTabs: React.FC<LeaderboardTabsProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const handleTabPress = useCallback(
    (tab: LeaderboardTab) => () => onChangeTab(tab),
    [onChangeTab],
  );

  const buttonStyleFor = useCallback(
    (isActive: boolean) =>
      ({ pressed }: { pressed: boolean }) => {
        const base = isActive
          ? [styles.tabButton, styles.tabButtonActive]
          : [styles.tabButton];
        return pressed ? [...base, styles.tabButtonPressed] : base;
      },
    [styles],
  );

  const tabs: { key: LeaderboardTab; label: string }[] = [
    { key: LeaderboardTab.WEEKLY, label: t.leaderboard_tab_week },
    { key: LeaderboardTab.ALLTIME, label: t.leaderboard_tab_alltime },
  ];

  return (
    <View style={styles.tabsRibbonWrapper}>
      {tabs.map(({ key, label }) => {
        const isActive = key === activeTab;
        const labelColor = isActive ? colors.surface : colors.bronzeDark;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
            style={buttonStyleFor(isActive)}
            onPress={handleTabPress(key)}
          >
            <AppText type="subHeadline" fontFamily="serif" color={labelColor}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};

export default React.memo(LeaderboardTabs);
