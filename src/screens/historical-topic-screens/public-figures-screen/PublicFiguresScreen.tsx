import React, { useState, useMemo } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@react-navigation/native";

import {
  AppText,
  EmptyState,
  NavigationPressable,
  SearchInput,
} from "@/src/components";
import { RootStackParamList, ScreenName } from "@/src/types";
import {
  PUBLIC_FIGURES,
  KEYBOARD_AVOIDING_DEFAULT_BEHAVIOR,
} from "@/src/constants";
import type { AppTheme } from "@/src/theme";
import { ClickSound, Ink } from "@/src/assets";
import {
  useAppTheme,
  usePlaySound,
  useSettings,
  useTranslation,
} from "@/src/hooks";
import { getAdjustedHeight, vibrateImpact } from "@/src/helpers";

const MIN_AMOUNT_TO_SHOW_INPUT = 3;

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.background,
      marginTop: getAdjustedHeight(-18),
      flex: 1,
      padding: 16,
    },
    container: {
      flex: 1,
    },
    scrollViewContent: {
      flexGrow: 1,
      paddingBottom: getAdjustedHeight(20),
    },
    titleWrapper: {
      alignItems: "center",
      marginTop: getAdjustedHeight(20),
      marginBottom: getAdjustedHeight(20),
    },
    searchInputWrapper: {
      width: "100%",
      marginBottom: getAdjustedHeight(16),
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: getAdjustedHeight(16),
    },
  });

const PublicFiguresScreen = () => {
  const t = useTranslation();
  const theme = useAppTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { playSound } = usePlaySound();

  const { isMuted, isVibrationOff } = useSettings();

  const styles = useMemo(() => getStyles(theme), [theme]);

  const handlePress = (publicFigureId: string) => {
    if (!isVibrationOff) {
      vibrateImpact();
    }
    playSound(ClickSound, isMuted);
    navigation.navigate(ScreenName.PUBLIC_FIGURES_DETAILS, { publicFigureId });
  };

  const [searchText, setSearchText] = useState("");

  const filteredPublicFigures = PUBLIC_FIGURES.filter((item) =>
    item.name.startsWith(searchText),
  );

  const showSearchInput = !(
    searchText === "" &&
    filteredPublicFigures.length <= MIN_AMOUNT_TO_SHOW_INPUT
  );
  const showEmptyState = filteredPublicFigures.length === 0;

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={KEYBOARD_AVOIDING_DEFAULT_BEHAVIOR}
        style={styles.container}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 30 })}
      >
        <View style={styles.titleWrapper}>
          <AppText fontWeight="bold" type="headline">
            {t.common_public_figures}
          </AppText>
        </View>
        {showSearchInput && (
          <View style={styles.searchInputWrapper}>
            <SearchInput
              searchText={searchText}
              onChangeSearchText={setSearchText}
            />
          </View>
        )}
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          {showEmptyState ? (
            <View style={styles.emptyStateContainer}>
              <EmptyState title={t.common_not_found_info} />
            </View>
          ) : (
            filteredPublicFigures.map((publicFigure) => {
              const onPress = () => {
                handlePress(publicFigure.id);
              };
              return (
                <NavigationPressable
                  onBtnPress={onPress}
                  title={publicFigure.name}
                  img={Ink}
                  key={publicFigure.id}
                />
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PublicFiguresScreen;
