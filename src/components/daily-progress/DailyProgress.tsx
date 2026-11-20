import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";
import { SwordState } from "@/src/types";

import BrokenSword from "./BrokenSword";
import { getStyles } from "./styles";

type DailyProgressProps = {
  states: SwordState[];
  size: number;
  columns?: number;
  // Fixed colours for a surface that stays dark in both themes (the daily card).
  palette?: Record<SwordState, string>;
  style?: StyleProp<ViewStyle>;
};

const DailyProgress: React.FC<DailyProgressProps> = ({ states, size, columns, palette, style }) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles, { size, columns });
  const t = useTranslation();

  const colorFor: Record<SwordState, string> = palette ?? {
    [SwordState.WHOLE]: colors.bronzeDark,
    [SwordState.BROKEN]: colors.uiMuted,
    [SwordState.CURRENT]: colors.bronze,
    [SwordState.UPCOMING]: colors.disabledBorder,
  };
  const correct = states.filter((s) => s === SwordState.WHOLE).length;
  const label = t.daily_progress_a11y
    .replace("{correct}", String(correct))
    .replace("{total}", String(states.length));

  const renderSword = (state: SwordState, index: number) => {
    const sword =
      state === SwordState.BROKEN ? (
        <BrokenSword size={size} color={colorFor[state]} />
      ) : (
        <MaterialCommunityIcons name="sword" size={size} color={colorFor[state]} />
      );
    return (
      <View key={index} style={styles.cell}>
        {sword}
      </View>
    );
  };

  return (
    <View
      style={[styles.row, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      {states.map(renderSword)}
    </View>
  );
};

export default React.memo(DailyProgress);
