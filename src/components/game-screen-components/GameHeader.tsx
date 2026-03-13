import React from "react";
import { View, Image } from "react-native";

import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";

import { AppText } from "../text";

import { getStyles } from "./styles";

type GameHeaderProps = {
  crowns: number[];
  correctAnswersCount: number;
  questionsCount: number;
};

const GameHeader: React.FC<GameHeaderProps> = ({
  crowns,
  correctAnswersCount,
  questionsCount,
}) => {
  const t = useTranslation();
  const styles = useStyles(getStyles);
  const { colors } = useAppTheme();

  const correctAnswerCountColor =
    correctAnswersCount > 0 ? colors.correctBorder : colors.dark;

  return (
    <>
      <View style={styles.crownsWrapper}>
        {crowns.map((crown, index) => (
          <Image key={index} source={crown} style={styles.singleCrown} />
        ))}
      </View>
      <AppText
        type="headline"
        fontFamily="primary"
        style={styles.answersTextAndCount}
      >
        {t.common_correct_answer}{" "}
        <AppText
          color={correctAnswerCountColor}
          type="headline"
          fontFamily="primary"
        >
          {correctAnswersCount}
        </AppText>
        /
        <AppText type="headline" fontFamily="primary">
          {questionsCount}
        </AppText>
      </AppText>
    </>
  );
};

export default React.memo(GameHeader);
