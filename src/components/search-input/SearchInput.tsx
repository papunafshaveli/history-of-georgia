import React from "react";
import { TextInput, StyleSheet, View } from "react-native";
import { EvilIcons } from "@expo/vector-icons";

import { GLOBAL_COLORS } from "@/src/constants";
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
  return (
    <View style={styles.container}>
      <EvilIcons
        name="search"
        color={GLOBAL_COLORS.mixedColors.midGrey}
        size={32}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        value={searchText}
        onChangeText={onChangeSearchText}
        placeholder={placeHolder}
        placeholderTextColor={GLOBAL_COLORS.mixedColors.midGrey}
        accessibilityLabel={placeHolder}
        accessibilityRole="search"
      />
    </View>
  );
};

export default SearchInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GLOBAL_COLORS.mixedColors.cream,
    width: "100%",
    height: getAdjustedHeight(62),
    borderStyle: "solid",
    borderColor: GLOBAL_COLORS.mixedColors.midGrey,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: getAdjustedWidth(16),
  },
  input: {
    flex: 1,
    fontFamily: "helvetica-main",
    fontSize: 16,
    fontWeight: "700",
    color: GLOBAL_COLORS.primaryColors.dark,
    paddingVertical: getAdjustedHeight(16),
  },
  searchIcon: {
    marginRight: getAdjustedWidth(8),
  },
});
