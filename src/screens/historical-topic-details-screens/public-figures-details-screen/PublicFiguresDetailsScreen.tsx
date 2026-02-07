import React from "react";
import { useRoute } from "@react-navigation/native";
import { allPublicFigures } from "@/src/assets";
import { TopicDetailsContent } from "@/src/components";
import { logEvent, AnalyticsEvent, TopicCategory } from "@/src/helpers/analytics";

type RouteParams = {
  publicFigureId: string;
};

const PublicFiguresDetailsScreen = () => {
  const route = useRoute();
  const { publicFigureId } = route.params as RouteParams;
  const selectedPublicFigure = allPublicFigures.find(
    (publicFigure) => publicFigure.id === publicFigureId
  );

  if (!selectedPublicFigure) return null;

  logEvent(AnalyticsEvent.TOPIC_VIEW, { category: TopicCategory.PUBLIC_FIGURES, name: selectedPublicFigure.name });

  return (
    <TopicDetailsContent
      title={selectedPublicFigure.name}
      description={selectedPublicFigure.description}
      ytVideoIds={selectedPublicFigure.ytVideoIds}
    />
  );
};

export default PublicFiguresDetailsScreen;
