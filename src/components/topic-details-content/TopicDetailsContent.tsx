import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStyles, useTranslation } from "@/src/hooks";

import YoutubePlayer from "../youtube-player/YoutubePlayer";
import { AppText } from "../text";

import { getStyles } from "./styles";

type DescriptionItem = {
  biography?: string[];
  facts?: string[];
};

type DetailsScreenProps = {
  title: string;
  description: DescriptionItem;
  ytVideoIds?: string[];
};

const TopicDetailsContent: React.FC<DetailsScreenProps> = ({
  title,
  description,
  ytVideoIds,
}) => {
  const styles = useStyles(getStyles);
  const scrollVideosHorizontally = Number(ytVideoIds?.length) > 1;
  const content = description.biography || description.facts || [];

  const videoWrapperStyles = [
    styles.videoWrapper,
    ytVideoIds?.length === 1 && styles.singleVideoWrapper,
  ];

  const t = useTranslation();

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <View style={styles.titleWrapper}>
        <AppText fontFamily="secondary" fontWeight="bold" type="headline">
          {title}
        </AppText>
      </View>
      <ScrollView style={styles.scrollView}>
        {content.map((paragraph, index) => {
          const isTitle = index % 2 === 0;

          const paragraphStyles = StyleSheet.compose(
            styles.paragraph,
            isTitle && styles.titleParagraph
          );

          return (
            <AppText
              fontFamily="secondary"
              fontWeight={isTitle ? "bold" : undefined}
              type={isTitle ? "subHeadline" : "body"}
              lineHeight={isTitle ? undefined : 22}
              style={paragraphStyles}
              key={index}
            >
              {paragraph}
            </AppText>
          );
        })}
        {!!ytVideoIds?.length && (
          <View style={styles.videoInfoWrapper}>
            <AppText fontWeight="bold" fontSize={20} style={styles.text}>
              {t.common_learn_more}
            </AppText>
            <ScrollView
              horizontal={scrollVideosHorizontally}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollView}
            >
              {ytVideoIds.map((id: string) => {
                return (
                  <View style={videoWrapperStyles} key={id}>
                    <YoutubePlayer videoId={id} />
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TopicDetailsContent;
