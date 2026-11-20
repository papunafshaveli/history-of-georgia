import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";

type ProgressProps = { size: number; columns?: number };

export const getStyles = (theme: AppTheme, props: ProgressProps) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      columnGap: theme.spacing.x2,
      rowGap: theme.spacing.x1,
      maxWidth: props.columns
        ? props.columns * (props.size + theme.spacing.x2)
        : undefined,
    },
    cell: {
      width: props.size,
      height: props.size,
      alignItems: "center",
      justifyContent: "center",
    },
  });

// The MDI "sword" glyph runs tip (top-left) to hilt (bottom-right); turned upright, it is
// cut across the blade, and the tip half is knocked aside.
const BREAK_AT = 0.36;
const GAP = 0.05;
const TIP_TILT = "-14deg";

export const getBrokenSwordStyles = (_theme: AppTheme, props: { size: number }) =>
  StyleSheet.create({
    box: {
      width: props.size,
      height: props.size,
      transform: [{ rotate: "-45deg" }],
    },
    tipHalf: {
      position: "absolute",
      top: 0,
      left: 0,
      width: props.size,
      height: props.size * BREAK_AT,
      overflow: "hidden",
      transform: [
        { translateX: -props.size * 0.06 },
        { translateY: -props.size * 0.04 },
        { rotate: TIP_TILT },
      ],
    },
    hiltHalf: {
      position: "absolute",
      top: props.size * (BREAK_AT + GAP),
      left: 0,
      width: props.size,
      height: props.size * (1 - BREAK_AT - GAP),
      overflow: "hidden",
    },
    glyphUpright: {
      transform: [{ rotate: "45deg" }],
    },
    glyphUprightShifted: {
      marginTop: -props.size * (BREAK_AT + GAP),
      transform: [{ rotate: "45deg" }],
    },
  });
