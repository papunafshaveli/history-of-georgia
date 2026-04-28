import React from "react";
import { View, Image } from "react-native";

import { useStyles, useTranslation } from "@/src/hooks";

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

  const scoreText = `${t.common_correct_answer} ${correctAnswersCount}/${questionsCount}`;

  return (
    <>
      <View style={styles.crownsWrapper}>
        {crowns.map((crown, index) => (
          <Image key={index} source={crown} style={styles.singleCrown} />
        ))}
      </View>
      <AppText
        type="headline"
        fontFamily="serif"
        style={styles.answersTextAndCount}
        numberOfLines={1}
      >
        {scoreText}
      </AppText>
    </>
  );
};

export default React.memo(GameHeader);
