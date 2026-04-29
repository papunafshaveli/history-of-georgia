import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

import { replayPendingResults } from "@/src/services/pending-results";

import { useAuth } from "./useAuth";

export const usePendingResultsReplay = () => {
  const { uid, isAuthenticating } = useAuth();
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!uid || isAuthenticating) return;

    const replay = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        await replayPendingResults(uid);
      } finally {
        inFlightRef.current = false;
      }
    };

    replay();

    const appStateSub = AppState.addEventListener(
      "change",
      (next: AppStateStatus) => {
        if (next === "active") replay();
      },
    );

    const netInfoUnsub = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        replay();
      }
    });

    return () => {
      appStateSub.remove();
      netInfoUnsub();
    };
  }, [uid, isAuthenticating]);
};
