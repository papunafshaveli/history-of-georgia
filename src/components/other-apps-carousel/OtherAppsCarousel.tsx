import React, { useCallback, useMemo } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type ListRenderItem,
  type PressableStateCallbackType,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { DroshaIcon, KrossiIcon } from "@/src/assets";
import GradientWrapper from "@/src/components/gradient-wrapper/GradientWrapper";
import { AppText } from "@/src/components/text";
import { IS_IOS } from "@/src/constants";
import { AnalyticsEvent, logger, logEvent, openAppOrUrl } from "@/src/helpers";
import { useAppTheme, useStyles, useTranslation } from "@/src/hooks";

import { getStyles, OTHER_APP_CARD_GAP } from "./styles";

const CARD_MAX_WIDTH = 320;
const NEXT_CARD_PEEK = 88;

enum OtherAppId {
  KROSSI = "krossi",
  DROSHA = "drosha",
}

type StoreLink = {
  appUrl: string;
  webUrl: string;
};

type OtherApp = {
  id: OtherAppId;
  name: string;
  description: string;
  accessibilityLabel: string;
  icon: ImageSourcePropType;
  ios: StoreLink;
  android: StoreLink;
};

const KROSSI_PLAY_URL =
  "https://play.google.com/store/apps/details?id=ge.papunamachurishvili.krossi&referrer=utm_source%3Dhistoryofgeorgia_app%26utm_medium%3Dcrosspromo%26utm_campaign%3Dgrowth90";

const OtherAppsCarousel = () => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();

  const cardWidth = Math.min(windowWidth - NEXT_CARD_PEEK, CARD_MAX_WIDTH);
  const styles = useStyles(getStyles, { cardWidth });

  const apps = useMemo<OtherApp[]>(
    () => [
      {
        id: OtherAppId.KROSSI,
        name: "Krossi",
        description: t.other_apps_krossi_description,
        accessibilityLabel: t.other_apps_krossi_accessibility,
        icon: KrossiIcon,
        ios: {
          appUrl: "https://apps.apple.com/app/id6807862575",
          webUrl: "https://apps.apple.com/app/id6807862575",
        },
        android: {
          appUrl: KROSSI_PLAY_URL,
          webUrl: KROSSI_PLAY_URL,
        },
      },
      {
        id: OtherAppId.DROSHA,
        name: "Drosha",
        description: t.other_apps_drosha_description,
        accessibilityLabel: t.other_apps_drosha_accessibility,
        icon: DroshaIcon,
        ios: {
          appUrl: "https://apps.apple.com/app/id6761765281",
          webUrl: "https://apps.apple.com/app/id6761765281",
        },
        android: {
          appUrl:
            "https://play.google.com/store/apps/details?id=com.papunafshaveli.drosha",
          webUrl:
            "https://play.google.com/store/apps/details?id=com.papunafshaveli.drosha",
        },
      },
    ],
    [
      t.other_apps_drosha_accessibility,
      t.other_apps_drosha_description,
      t.other_apps_krossi_accessibility,
      t.other_apps_krossi_description,
    ],
  );

  const handleAppPress = useCallback(
    (app: OtherApp) => async () => {
      const storeLink = IS_IOS ? app.ios : app.android;

      logEvent(AnalyticsEvent.OTHER_APP_OPEN, {
        app: app.id,
        platform: Platform.OS,
      });

      try {
        await openAppOrUrl(storeLink.appUrl, storeLink.webUrl);
      } catch (error) {
        logger.warn("Failed to open other app store page", error);
      }
    },
    [],
  );

  const getCardStyle = useCallback(
    ({ pressed }: PressableStateCallbackType) =>
      pressed ? [styles.card, styles.cardPressed] : styles.card,
    [styles.card, styles.cardPressed],
  );

  const renderApp: ListRenderItem<OtherApp> = useCallback(
    ({ item }) => {
      const onPress = handleAppPress(item);

      return (
        <Pressable
          onPress={onPress}
          style={getCardStyle}
          accessibilityRole="link"
          accessibilityLabel={item.accessibilityLabel}
        >
          <GradientWrapper style={styles.cardBody}>
            <View style={styles.iconFrame}>
              <Image
                source={item.icon}
                resizeMode="cover"
                style={styles.icon}
                accessibilityIgnoresInvertColors
              />
            </View>

            <View style={styles.copy}>
              <AppText
                type="headline"
                fontFamily="serif"
                color={colors.bronzeDark}
                numberOfLines={1}
              >
                {item.name}
              </AppText>
              <AppText
                type="body"
                color={colors.textMuted}
                numberOfLines={2}
                style={styles.description}
              >
                {item.description}
              </AppText>
            </View>

            <View style={styles.action}>
              <MaterialCommunityIcons
                name="arrow-right"
                size={22}
                color={colors.bronzeLight}
              />
            </View>
          </GradientWrapper>
        </Pressable>
      );
    },
    [
      colors.bronzeDark,
      colors.textMuted,
      getCardStyle,
      handleAppPress,
      styles.action,
      styles.cardBody,
      styles.copy,
      styles.description,
      styles.icon,
      styles.iconFrame,
    ],
  );

  const keyExtractor = useCallback((item: OtherApp) => item.id, []);
  const snapInterval = cardWidth + OTHER_APP_CARD_GAP;

  return (
    <View style={styles.container}>
      <View style={styles.titlePill}>
        <AppText
          type="body"
          fontFamily="serif"
          fontWeight="bold"
          color={colors.bronzeLight}
        >
          {t.other_apps_title}
        </AppText>
      </View>

      <FlatList
        horizontal
        data={apps}
        renderItem={renderApp}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        disableIntervalMomentum
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

export default OtherAppsCarousel;
