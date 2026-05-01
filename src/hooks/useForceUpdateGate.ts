import { useEffect, useState } from "react";
import * as Application from "expo-application";

import { logger } from "@/src/helpers/logger";
import { getAppConfig } from "@/src/services/appConfig";
import { compareSemver } from "@/src/utils/semver";

type ForceUpdateGateResult = {
  isBlocked: boolean;
  latestVersion: string | null;
};

/**
 * Reads `app_config/version` from Firestore (via the 6h cache in
 * appConfig service) and compares the running binary's version
 * (`Application.nativeApplicationVersion`) against `minSupportedVersion`.
 *
 * Returns `{ isBlocked: true }` when the binary is below the minimum.
 * Returns `{ isBlocked: false }` when above OR when the config can't
 * be fetched (grace mode: never block on transient network failures —
 * the next launch will retry).
 */
export const useForceUpdateGate = (): ForceUpdateGateResult => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const config = await getAppConfig();
        if (cancelled || !config) return;

        const currentVersion =
          Application.nativeApplicationVersion ?? "0.0.0";
        if (compareSemver(currentVersion, config.minSupportedVersion) < 0) {
          setIsBlocked(true);
        }
        setLatestVersion(config.latestVersion);
      } catch (err) {
        logger.warn("[useForceUpdateGate] check failed:", err);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return { isBlocked, latestVersion };
};
