import { ActivityIndicator, ImageBackground, Text } from "react-native";
import React from "react";

import { GLOBAL_COLORS } from "@/src/constants";
import { QuestionBackground } from "@/src/assets";
import { useTranslation } from "@/src/hooks";

import styles from "./styles";

type QuestionDisplayProps = {
  isLoading?: boolean;
  question?: string;
};

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  isLoading,
  question,
}) => {
  const t = useTranslation();
  const associationText = t.common_association;
  const startsWithAssociationText = question?.startsWith(associationText);

  const withoutAssociationText = question?.slice(associationText.length);

  const associationTextStyles = {
    color: GLOBAL_COLORS.primaryColors.brown,
    fontSize: 16,
  };

  return (
    <ImageBackground
      source={QuestionBackground}
      style={styles.imageBackgroundWrapper}
      resizeMode="contain"
    >
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={GLOBAL_COLORS.mixedColors.darkCoffeeSecond}
        />
      ) : (
        <Text style={styles.questionText}>
          {startsWithAssociationText ? (
            <>
              <Text style={associationTextStyles}>{associationText}</Text>
              <Text> {withoutAssociationText}</Text>
            </>
          ) : (
            question
          )}
        </Text>
      )}
    </ImageBackground>
  );
};

export default React.memo(QuestionDisplay);
