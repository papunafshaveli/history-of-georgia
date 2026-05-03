export const RECOGNIZED_PREFIX_KEYS = [
  "common_association",
  "common_pick_different",
  "common_truth",
  "common_falsehood",
] as const;

export type RecognizedPrefixKey = (typeof RECOGNIZED_PREFIX_KEYS)[number];
