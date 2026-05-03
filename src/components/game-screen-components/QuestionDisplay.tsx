import { ActivityIndicator, ImageBackground } from "react-native";
import React from "react";

import { QuestionBackground } from "@/src/assets";
import { RECOGNIZED_PREFIX_KEYS } from "@/src/constants";
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

  const matchedPrefix = RECOGNIZED_PREFIX_KEYS.map((key) => t[key]).find(
    (prefix) => question?.startsWith(prefix),
  );

  const remainderAfterPrefix = matchedPrefix
    ? question?.slice(matchedPrefix.length)
    : undefined;

  return (
    <ImageBackground
      source={QuestionBackground}
      style={styles.imageBackgroundWrapper}
      resizeMode="contain"
    >
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.bronzeMid} />
      ) : (
        <AppText
          fontFamily="script"
          type="title"
          color={colors.onImage}
          style={styles.questionText}
        >
          {matchedPrefix ? (
            <>
              <AppText fontFamily="script" type="title" color={colors.primary}>
                {matchedPrefix}
              </AppText>
              <AppText fontFamily="script" type="title" color={colors.onImage}>
                {remainderAfterPrefix}
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
