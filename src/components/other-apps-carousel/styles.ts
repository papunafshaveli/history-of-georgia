import { StyleSheet } from "react-native";

import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";
import type { AppTheme } from "@/src/theme";

type StyleProps = {
  cardWidth: number;
};

export const OTHER_APP_CARD_GAP = getAdjustedWidth(12);

export const getStyles = (theme: AppTheme, props: StyleProps) =>
  StyleSheet.create({
    container: {
      width: "100%",
      paddingBottom: getAdjustedHeight(12),
    },
    // Same chrome as the tab bar so the title stays legible over the bright photo.
    titlePill: {
      alignSelf: "flex-start",
      marginLeft: theme.spacing.x4,
      marginBottom: theme.spacing.x2,
      paddingHorizontal: theme.spacing.x3,
      paddingVertical: theme.spacing.x1,
      backgroundColor: theme.colors.chromeBg,
      borderRadius: theme.borderRadius.full,
    },
    list: {
      flexGrow: 0,
    },
    listContent: {
      gap: OTHER_APP_CARD_GAP,
      paddingHorizontal: theme.spacing.x4,
      paddingRight: theme.spacing.x8,
    },
    card: {
      width: props.cardWidth,
      borderWidth: 1,
      borderColor: theme.colors.bronzeMid,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.default,
    },
    cardBody: {
      flex: 1,
      minHeight: getAdjustedHeight(88),
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.x3,
      padding: theme.spacing.x3,
      borderRadius: theme.borderRadius.lg,
    },
    cardPressed: {
      opacity: 0.82,
    },
    iconFrame: {
      borderWidth: 2,
      borderColor: theme.colors.bronzeMid,
      borderRadius: theme.borderRadius.md,
      overflow: "hidden",
    },
    icon: {
      width: getAdjustedWidth(56),
      height: getAdjustedWidth(56),
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    description: {
      marginTop: theme.spacing.x1,
    },
    action: {
      width: getAdjustedWidth(40),
      height: getAdjustedWidth(40),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.chromeBg,
      borderRadius: theme.borderRadius.full,
    },
  });
