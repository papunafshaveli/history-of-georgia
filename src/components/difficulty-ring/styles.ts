import { StyleSheet } from "react-native";

import type { AppTheme } from "@/src/theme";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

const WRAPPER_SIZE = getAdjustedHeight(390);
const EDGE_WIDTH = getAdjustedHeight(3);
const BAND_WIDTH = getAdjustedHeight(48);
const INNER_INSET = EDGE_WIDTH + BAND_WIDTH;
export const RING_WRAPPER_SIZE = WRAPPER_SIZE;
export const RING_INNER_DIAMETER = WRAPPER_SIZE - INNER_INSET * 2;
export const RING_ORBIT_RADIUS = WRAPPER_SIZE / 2 - EDGE_WIDTH - BAND_WIDTH / 2;

export const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    wrapper: {
      width: WRAPPER_SIZE,
      height: WRAPPER_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    outerEdge: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: WRAPPER_SIZE / 2,
      borderWidth: EDGE_WIDTH,
      borderColor: theme.colors.ringEdge,
    },
    innerEdge: {
      position: "absolute",
      top: INNER_INSET,
      left: INNER_INSET,
      right: INNER_INSET,
      bottom: INNER_INSET,
      borderRadius: (WRAPPER_SIZE - INNER_INSET * 2) / 2,
      borderWidth: EDGE_WIDTH,
      borderColor: theme.colors.ringEdge,
    },

    segmentsWrapper: {
      ...StyleSheet.absoluteFillObject,
      transform: [{ rotate: "-45deg" }],
    },
    segmentMask: {
      position: "absolute",
      width: WRAPPER_SIZE / 2,
      height: WRAPPER_SIZE / 2,
      overflow: "hidden",
    },
    segmentMaskTopLeft: {
      top: 0,
      left: 0,
    },
    segmentMaskTopRight: {
      top: 0,
      right: 0,
    },
    segmentMaskBottomLeft: {
      bottom: 0,
      left: 0,
    },
    segmentMaskBottomRight: {
      bottom: 0,
      right: 0,
    },
    segmentCircle: {
      position: "absolute",
      width: WRAPPER_SIZE,
      height: WRAPPER_SIZE,
      borderRadius: WRAPPER_SIZE / 2,
      borderWidth: BAND_WIDTH,
    },
    segmentCircleTopLeft: {
      top: 0,
      left: 0,
    },
    segmentCircleTopRight: {
      top: 0,
      left: -WRAPPER_SIZE / 2,
    },
    segmentCircleBottomLeft: {
      top: -WRAPPER_SIZE / 2,
      left: 0,
    },
    segmentCircleBottomRight: {
      top: -WRAPPER_SIZE / 2,
      left: -WRAPPER_SIZE / 2,
    },
    segmentActive: {
      borderColor: theme.colors.ringActive,
    },
    segmentInactive: {
      borderColor: theme.colors.ringBand,
    },

    labelCentering: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    labelPressable: {
      paddingHorizontal: getAdjustedWidth(6),
      paddingVertical: getAdjustedHeight(2),
      alignItems: "center",
      justifyContent: "center",
    },
    labelPressableVertical: {
      paddingHorizontal: getAdjustedWidth(4),
      paddingVertical: getAdjustedHeight(4),
    },
    labelText: {
      letterSpacing: 0.6,
      textAlign: "center",
    },
  });
