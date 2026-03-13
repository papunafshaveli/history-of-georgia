import { useMemo } from "react";

import { useAppTheme } from "./useAppTheme";
import type { AppTheme } from "./types";

export function useStyles<T>(createStyles: (theme: AppTheme) => T): T;
export function useStyles<T, P>(
  createStyles: (theme: AppTheme, props: P) => T,
  props: P,
): T;
export function useStyles<T, P>(
  createStyles: (theme: AppTheme, props?: P) => T,
  props?: P,
): T {
  const theme = useAppTheme();
  return useMemo(
    () => createStyles(theme, props),
    [theme, createStyles, props],
  );
}
