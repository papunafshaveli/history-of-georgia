import React from "react";
import { useRoute } from "@react-navigation/native";
import { allBattles } from "@/src/assets/history-topics-data/battles";
import { TopicDetailsContent } from "@/src/components";
import { logEvent, AnalyticsEvent, TopicCategory } from "@/src/helpers/analytics";

type RouteParams = {
  battleId: string;
};

const BattleDetailsScreen = () => {
  const route = useRoute();
  const { battleId } = route.params as RouteParams;
  const selectedBattle = allBattles.find((battle) => battle.id === battleId);

  if (!selectedBattle) return null;

  logEvent(AnalyticsEvent.TOPIC_VIEW, { category: TopicCategory.BATTLES, name: selectedBattle.name });

  return (
    <TopicDetailsContent
      title={selectedBattle.name}
      description={selectedBattle.description}
      ytVideoIds={selectedBattle.ytVideoIds}
    />
  );
};

export default BattleDetailsScreen;
