import { useCallback, useEffect, useState } from "react";
import * as Application from "expo-application";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { logger } from "@/src/helpers/logger";
import { getAppConfig } from "@/src/services/appConfig";
import { compareSemver } from "@/src/utils/semver";

const SOFT_DISMISS_KEY = "softUpdate:lastDismissedAt";
const SOFT_COOLDOWN_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SOFT_COOLDOWN_MS = SOFT_COOLDOWN_DAYS * MS_PER_DAY;

type ForceUpdateGateResult = {
  isHardBlocked: boolean;
  isSoftBlocked: boolean;
  latestVersion: string | null;
  dismissSoft: () => Promise<void>;
};

/**
 * Reads `app_config/version` from Firestore (via the 6h cache in
 * appConfig service) and decides whether to show:
 *
 *   - Hard block (ForceUpdateModal): nativeApplicationVersion < minSupportedVersion
 *   - Soft block (SoftUpdateModal):  nativeApplicationVersion < latestVersion
 *                                    AND not dismissed within last 7 days
 *
 * Hard supersedes soft — when both fire, only isHardBlocked is true.
 *
 * Grace mode: returns all-false when the config can't be fetched (never
 * block on transient network failures — the next launch will retry).
 */
export const useForceUpdateGate = (): ForceUpdateGateResult => {
  const [isHardBlocked, setIsHardBlocked] = useState(false);
  const [isSoftBlocked, setIsSoftBlocked] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const config = await getAppConfig();
        if (cancelled || !config) return;

        const currentVersion =
          Application.nativeApplicationVersion ?? "0.0.0";
        setLatestVersion(config.latestVersion);

        const hardBlocked =
          compareSemver(currentVersion, config.minSupportedVersion) < 0;
        if (hardBlocked) {
          setIsHardBlocked(true);
          return;
        }

        const softBlockedByVersion =
          compareSemver(currentVersion, config.latestVersion) < 0;
        if (!softBlockedByVersion) return;

        const dismissedAtRaw = await AsyncStorage.getItem(SOFT_DISMISS_KEY);
        const dismissedAt = dismissedAtRaw ? Number(dismissedAtRaw) : 0;
        const cooldownActive = Date.now() - dismissedAt < SOFT_COOLDOWN_MS;
        if (!cooldownActive && !cancelled) {
          setIsSoftBlocked(true);
        }
      } catch (err) {
        logger.warn("[useForceUpdateGate] check failed:", err);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismissSoft = useCallback(async () => {
    try {
      await AsyncStorage.setItem(SOFT_DISMISS_KEY, String(Date.now()));
    } catch (err) {
      logger.warn("[useForceUpdateGate] dismissSoft failed:", err);
    }
    setIsSoftBlocked(false);
  }, []);

  return { isHardBlocked, isSoftBlocked, latestVersion, dismissSoft };
};
