import React from "react";
import { useRoute } from "@react-navigation/native";

import { allRulers } from "@/src/assets";
import { TopicDetailsContent } from "@/src/components";
import { logEvent, AnalyticsEvent, TopicCategory } from "@/src/helpers/analytics";

type RouteParams = {
  rulerId: string;
};

const RulerDetailsScreen = () => {
  const route = useRoute();
  const { rulerId } = route.params as RouteParams;
  const selectedRuler = allRulers.find((ruler) => ruler.id === rulerId);

  if (!selectedRuler) return null;

  logEvent(AnalyticsEvent.TOPIC_VIEW, { category: TopicCategory.RULERS, name: selectedRuler.name });

  return (
    <TopicDetailsContent
      title={selectedRuler.name}
      description={selectedRuler.description}
      ytVideoIds={selectedRuler.ytVideoIds}
    />
  );
};

export default RulerDetailsScreen;
