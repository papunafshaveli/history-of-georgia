import React from "react";
import { ImageBackground, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { InfoIcon } from "@/src/assets";
import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";

import { AppText } from "../text";

import { getStyles } from "./styles";

const RULE_ICON_SIZE = 20;
const CHIP_SPLIT_TOKEN = " — ";

type RuleRowProps = {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
};

const RuleRow: React.FC<RuleRowProps> = ({ iconName, text }) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  return (
    <View style={styles.ruleRow}>
      <MaterialCommunityIcons
        name={iconName}
        size={RULE_ICON_SIZE}
        color={colors.onImage}
        style={styles.ruleIcon}
      />
      <AppText
        type="subHeadline"
        fontFamily="serif"
        color={colors.onImage}
        style={styles.ruleText}
      >
        {text}
      </AppText>
    </View>
  );
};

const RuleDivider: React.FC = () => {
  const styles = useStyles(getStyles);
  return <View style={styles.ruleDivider} />;
};

type ScoringChipProps = {
  label: string;
};

const ScoringChip: React.FC<ScoringChipProps> = ({ label }) => {
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  const [chipLabel, chipValue] = label.includes(CHIP_SPLIT_TOKEN)
    ? label.split(CHIP_SPLIT_TOKEN)
    : [label, null];

  return (
    <View style={styles.scoringChip}>
      <AppText
        type="caption"
        fontFamily="serif"
        color={colors.onImage}
        style={styles.scoringChipLabel}
      >
        {chipLabel}
      </AppText>
      {chipValue ? (
        <AppText
          type="caption"
          fontFamily="sans"
          color={colors.onImage}
          style={styles.scoringChipValue}
        >
          {chipValue}
        </AppText>
      ) : null}
    </View>
  );
};

const Rules: React.FC = () => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircleWrapper}>
        <ImageBackground
          style={styles.iconImageWrapper}
          source={InfoIcon}
          resizeMode="contain"
          imageStyle={styles.iconImage}
        />
      </View>

      <AppText
        color={colors.onImage}
        type="title"
        fontFamily="script"
        style={styles.title}
      >
        {t.rules_title}
      </AppText>

      <RuleRow iconName="heart-multiple-outline" text={t.rules_lives} />
      <RuleDivider />
      <RuleRow iconName="lightbulb-outline" text={t.rules_hints} />
      <RuleDivider />
      <RuleRow
        iconName="script-text-outline"
        text={t.rules_scoring_intro}
      />

      <View style={styles.scoringChipsRow}>
        <ScoringChip label={t.rules_scoring_easy} />
        <ScoringChip label={t.rules_scoring_medium} />
        <ScoringChip label={t.rules_scoring_hard} />
      </View>

      <AppText
        type="body"
        fontFamily="serif"
        color={colors.onImage}
        style={styles.outroLine}
      >
        {t.rules_scoring_outro}
      </AppText>
    </View>
  );
};

export default Rules;
