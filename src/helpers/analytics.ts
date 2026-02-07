/**
 * Analytics utility — tracks key user events.
 *
 * Currently logs to console in __DEV__ mode only.
 * To enable production analytics:
 * 1. Install: npx expo install @react-native-firebase/app @react-native-firebase/analytics
 * 2. Add google-services.json (Android) and GoogleService-Info.plist (iOS)
 * 3. Add "@react-native-firebase/app" to plugins in app.config.ts
 * 4. Replace the logEvent implementation below with:
 *    import analytics from '@react-native-firebase/analytics';
 *    analytics().logEvent(name, params);
 * 5. Rebuild with: npx expo prebuild && npx expo run:ios
 */

import { logger } from "./logger";

export enum TopicCategory {
  RULERS = "rulers",
  BATTLES = "battles",
  PUBLIC_FIGURES = "public_figures",
}

export enum AnalyticsEvent {
  GAME_START = "game_start",
  GAME_END = "game_end",
  HINT_USED = "hint_used",
  TOPIC_VIEW = "topic_view",
  QUESTION_ANSWERED = "question_answered",
}

type EventParams = Record<string, string | number | boolean>;

export const logEvent = (name: AnalyticsEvent, params?: EventParams) => {
  if (__DEV__) {
    logger.log(`[Analytics] ${name}`, params ?? "");
  }
};
