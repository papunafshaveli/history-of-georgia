import React, { useState } from "react";
import {
  Text,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@react-navigation/native";

import { RootStackParamList, ScreenName } from "@/src/types";
import { KEYBOARD_AVOIDING_DEFAULT_BEHAVIOR, RULERS } from "@/src/constants";
import { ClickSound, Crown } from "@/src/assets";
import { EmptyState, NavigationPressable, SearchInput } from "@/src/components";
import { usePlaySound, useSettings, useTranslation } from "@/src/hooks";
import { vibrateImpact } from "@/src/helpers";

import styles from "./styles";

const MIN_AMOUNT_TO_SHOW_INPUT = 3;

const RulersScreen = () => {
  const t = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { playSound } = usePlaySound();

  const { isMuted, isVibrationOff } = useSettings();

  const handlePress = (rulerId: string) => {
    if (!isVibrationOff) {
      vibrateImpact();
    }
    playSound(ClickSound, isMuted);
    navigation.navigate(ScreenName.RULER_DETAILS, { rulerId });
  };

  const [searchText, setSearchText] = useState("");

  const filteredRulers = RULERS.filter((item) =>
    item.name.startsWith(searchText),
  );

  const showSearchInput = !(
    searchText === "" && filteredRulers.length <= MIN_AMOUNT_TO_SHOW_INPUT
  );
  const showEmptyState = filteredRulers.length === 0;

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={KEYBOARD_AVOIDING_DEFAULT_BEHAVIOR}
        style={styles.container}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 30 })}
      >
        <View style={styles.titleWrapper}>
          <Text style={styles.title}>{t.common_rulers}</Text>
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
            filteredRulers.map((ruler) => {
              const onRulerPress = () => {
                handlePress(ruler.id);
              };
              return (
                <NavigationPressable
                  onBtnPress={onRulerPress}
                  title={ruler.name}
                  img={Crown}
                  key={ruler.id}
                />
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RulersScreen;
