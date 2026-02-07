import React, { useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import NativeYoutubePlayer from "react-native-youtube-iframe";

import { getAdjustedHeight } from "@/src/helpers";

type YoutubePlayerComponentProps = {
  videoId?: string;
  playlist?: string[];
  height?: number;
};

const YoutubePlayer: React.FC<YoutubePlayerComponentProps> = ({
  videoId,
  playlist,
  height = getAdjustedHeight(200),
}) => {
  const [playing, setPlaying] = useState(false);

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
    } else if (state === "playing") {
      setPlaying(true);
    } else if (state === "paused") {
      setPlaying(false);
    }
  }, []);

  const videoParams = playlist?.length
    ? { videoId: playlist[0], playlist: playlist.slice(1) }
    : { videoId };

  return (
    <View style={styles.container}>
      <NativeYoutubePlayer
        height={height}
        play={playing}
        onChangeState={onStateChange}
        {...videoParams}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    width: "100%",
  },
});

export default YoutubePlayer;
