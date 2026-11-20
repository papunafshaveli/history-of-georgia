import { StyleSheet } from "react-native";

import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";
import type { AppTheme } from "@/src/theme";

const CARD_HEIGHT = getAdjustedWidth(200);
const SEAL = getAdjustedWidth(96);
const SEAL_TOP = getAdjustedWidth(20);
const HAIRLINE_INSET = getAdjustedWidth(6);
const BUTTON_HEIGHT = getAdjustedWidth(44);
const COUNTDOWN_WIDTH = getAdjustedWidth(132);
const ART_WIDTH = "58%";
// The square painting is drawn a little larger and nudged left so the king clears the title.
const ART_SIZE = CARD_HEIGHT * 1.25;
// The night painting is let through onto the brown ground so it doesn't read as a black block.
const ART_OPACITY = 0.72;
const ART_MUTED_OPACITY = 0.5;
const ART_SHIFT_X = -CARD_HEIGHT * 0.04;
const ART_SHIFT_Y = -CARD_HEIGHT * 0.06;
const SEAL_TILT = "-9deg";
const PRESSED_OPACITY = 0.9;

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: "100%",
      paddingHorizontal: theme.spacing.x4,
      paddingTop: theme.spacing.x2,
      paddingBottom: getAdjustedHeight(12),
    },
    card: {
      width: "100%",
      // A floor, not a fixed height: the played card's extra lines may push it taller.
      minHeight: CARD_HEIGHT,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.dailyCardFrame,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.dailyCardBg,
      ...theme.shadows.default,
    },
    cardPressed: {
      opacity: PRESSED_OPACITY,
    },
    art: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      width: ART_WIDTH,
      overflow: "hidden",
    },
    artImage: {
      position: "absolute",
      top: ART_SHIFT_Y,
      left: ART_SHIFT_X,
      width: ART_SIZE,
      height: ART_SIZE,
      opacity: ART_OPACITY,
    },
    artImageMuted: {
      opacity: ART_MUTED_OPACITY,
    },
    hairline: {
      position: "absolute",
      top: HAIRLINE_INSET,
      left: HAIRLINE_INSET,
      right: HAIRLINE_INSET,
      bottom: HAIRLINE_INSET,
      borderWidth: 1,
      borderColor: theme.colors.dailyCardHairline,
      borderRadius: theme.borderRadius.md,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.x5,
      paddingTop: theme.spacing.x4,
      paddingBottom: theme.spacing.x5,
    },
    title: {
      textShadowColor: theme.colors.dailyTitleShadow,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },
    description: {
      maxWidth: "50%",
    },
    meta: {
      gap: theme.spacing.x1,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x2,
    },
    swords: {
      justifyContent: "flex-start",
      columnGap: theme.spacing.x1,
      marginTop: theme.spacing.x3,
    },
    spacer: {
      flex: 1,
    },
    footer: {
      marginTop: theme.spacing.x4,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x3,
    },
    cta: {
      height: BUTTON_HEIGHT,
      paddingHorizontal: theme.spacing.x5,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.dailyCtaBorder,
      borderRadius: theme.borderRadius.full,
    },
    streak: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x1,
    },
    ghost: {
      height: BUTTON_HEIGHT,
      paddingHorizontal: theme.spacing.x4,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x2,
      borderWidth: 1,
      borderColor: theme.colors.dailyGhostBorder,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.dailyGhostBg,
    },
    seal: {
      position: "absolute",
      top: SEAL_TOP,
      right: theme.spacing.x6,
      width: SEAL,
      height: SEAL,
      alignItems: "center",
      justifyContent: "center",
      transform: [{ rotate: SEAL_TILT }],
    },
    sealImage: {
      position: "absolute",
      top: 0,
      left: 0,
      width: SEAL,
      height: SEAL,
    },
    sealText: {
      textAlign: "center",
    },
    countdown: {
      position: "absolute",
      top: SEAL_TOP + SEAL + theme.spacing.x2,
      right: theme.spacing.x3,
      width: COUNTDOWN_WIDTH,
      textAlign: "center",
    },
  });
