import { ActivityIndicator, ImageBackground } from "react-native";
import React from "react";

import { QuestionBackground } from "@/src/assets";
import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";

import { AppText } from "../text";

import { getStyles } from "./styles";

type QuestionDisplayProps = {
  isLoading?: boolean;
  question?: string;
};

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  isLoading,
  question,
}) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  const associationText = t.common_association;
  const startsWithAssociationText = question?.startsWith(associationText);

  const withoutAssociationText = question?.slice(associationText.length);

  return (
    <ImageBackground
      source={QuestionBackground}
      style={styles.imageBackgroundWrapper}
      resizeMode="contain"
    >
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.coffeeMedium} />
      ) : (
        <AppText
          fontFamily="primary"
          type="title"
          color={colors.onImage}
          style={styles.questionText}
        >
          {startsWithAssociationText ? (
            <>
              <AppText
                fontFamily="primary"
                type="title"
                color={colors.primary}
              >
                {associationText}
              </AppText>
              <AppText fontFamily="primary" type="title" color={colors.onImage}>
                {withoutAssociationText}
              </AppText>
            </>
          ) : (
            question
          )}
        </AppText>
      )}
    </ImageBackground>
  );
};

export default React.memo(QuestionDisplay);
