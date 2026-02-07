import React from "react";
import { View, Image, Text } from "react-native";

import { useTranslation } from "@/src/hooks";

import styles from "./styles";

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

  const correctAnswerText = `${t.common_correct_answer} ${correctAnswersCount}/${questionsCount}`;

  return (
    <>
      <View style={styles.crownsWrapper}>
        {crowns.map((crown, index) => (
          <Image key={index} source={crown} style={styles.singleCrown} />
        ))}
      </View>
      <Text style={styles.answersTextAndCount}>{correctAnswerText}</Text>
    </>
  );
};

export default React.memo(GameHeader);
