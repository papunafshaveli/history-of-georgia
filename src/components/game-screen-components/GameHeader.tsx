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
    correctAnswersCount > 0 ? colors.correctBorder : colors.text;

  return (
    <>
      <View style={styles.crownsWrapper}>
        {crowns.map((crown, index) => (
          <Image key={index} source={crown} style={styles.singleCrown} />
        ))}
      </View>
      <AppText
        type="headline"
        fontFamily="script"
        style={styles.answersTextAndCount}
      >
        {t.common_correct_answer}{" "}
        <AppText
          color={correctAnswerCountColor}
          type="title"
          fontFamily="script"
        >
          {correctAnswersCount}
        </AppText>
        /
        <AppText type="title" fontFamily="script">
          {questionsCount}
        </AppText>
      </AppText>
    </>
  );
};

export default React.memo(GameHeader);
