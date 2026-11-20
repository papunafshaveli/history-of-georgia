import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useStyles } from "@/src/hooks";

import { getBrokenSwordStyles } from "./styles";

type BrokenSwordProps = {
  size: number;
  color: string;
};

// No react-native-svg in this app (adding it would break OTA), so two clipped glyphs make the break.
const BrokenSword: React.FC<BrokenSwordProps> = ({ size, color }) => {
  const styles = useStyles(getBrokenSwordStyles, { size });

  return (
    <View style={styles.box}>
      <View style={styles.tipHalf}>
        <MaterialCommunityIcons
          name="sword"
          size={size}
          color={color}
          style={styles.glyphUpright}
        />
      </View>
      <View style={styles.hiltHalf}>
        <MaterialCommunityIcons
          name="sword"
          size={size}
          color={color}
          style={styles.glyphUprightShifted}
        />
      </View>
    </View>
  );
};

export default React.memo(BrokenSword);
