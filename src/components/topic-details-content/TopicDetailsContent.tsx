import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTranslation } from "@/src/hooks";

import YoutubePlayer from "../youtube-player/YoutubePlayer";

import styles from "./styles";

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
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {content.map((paragraph, index) => {
          const isTitle = index % 2 === 0;

          const paragraphStyles = StyleSheet.compose(
            styles.paragraph,
            isTitle && styles.titleParagraph
          );

          return (
            <Text style={paragraphStyles} key={index}>
              {paragraph}
            </Text>
          );
        })}
        {!!ytVideoIds?.length && (
          <View style={styles.videoInfoWrapper}>
            <Text style={styles.text}>{t.common_learn_more}</Text>
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
