import { useCallback, useEffect } from "react";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { SOUND_CLEANUP_DELAY_MS } from "@/src/constants";

export const usePlaySound = () => {
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
    });
  }, []);

  const playSound = useCallback(async (soundFile: number, isMuted: boolean) => {
    if (isMuted) return;

    try {
      const player = createAudioPlayer(soundFile);

      await player.seekTo(0);
      player.play();

      setTimeout(() => {
        player.remove();
      }, SOUND_CLEANUP_DELAY_MS);
    } catch {
      // Sound playback failed silently
    }
  }, []);

  return { playSound };
};
