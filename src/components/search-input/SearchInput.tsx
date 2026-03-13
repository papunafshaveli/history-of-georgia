import React from "react";
import { TextInput, StyleSheet, View } from "react-native";
import { EvilIcons } from "@expo/vector-icons";

import type { AppTheme } from "@/src/theme";
import { useAppTheme, useStyles } from "@/src/hooks";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

type SearchInputProps = {
  searchText: string;
  onChangeSearchText: (value: string) => void;
  placeHolder?: string;
};

const SearchInput: React.FC<SearchInputProps> = ({
  searchText,
  onChangeSearchText,
  placeHolder = "მოძებნე",
}) => {
  const theme = useAppTheme();
  const styles = useStyles(getStyles);

  return (
    <View style={styles.container}>
      <EvilIcons
        name="search"
        color={theme.colors.muted}
        size={32}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        value={searchText}
        onChangeText={onChangeSearchText}
        placeholder={placeHolder}
        placeholderTextColor={theme.colors.muted}
        accessibilityLabel={placeHolder}
        accessibilityRole="search"
      />
    </View>
  );
};

export default SearchInput;

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      width: "100%",
      height: getAdjustedHeight(62),
      borderStyle: "solid",
      borderColor: theme.colors.muted,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: getAdjustedWidth(16),
    },
    input: {
      flex: 1,
      fontFamily: theme.fonts.secondary,
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.dark,
      paddingVertical: getAdjustedHeight(16),
    },
    searchIcon: {
      marginRight: getAdjustedWidth(8),
    },
  });
