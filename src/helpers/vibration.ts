import * as Haptics from "expo-haptics";

type HapticFeedbacks = "impactHeavy" | "impactMedium" | "impactLight";

export const vibrateImpact = async (
  impact: HapticFeedbacks = "impactHeavy"
) => {
  const map: Record<HapticFeedbacks, Haptics.ImpactFeedbackStyle> = {
    impactHeavy: Haptics.ImpactFeedbackStyle.Heavy,
    impactMedium: Haptics.ImpactFeedbackStyle.Medium,
    impactLight: Haptics.ImpactFeedbackStyle.Light,
  };

  await Haptics.impactAsync(map[impact]);
};
