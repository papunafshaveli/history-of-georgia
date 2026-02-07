import { useEffect, useState } from "react";

import * as Font from "expo-font";

type FontMap = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [fontName: string]: any;
};

export const useCustomFonts = (fontMap: FontMap): boolean => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync(fontMap);
        setFontsLoaded(true);
      } catch {
        // Font loading failed silently
      }
    };

    loadFonts();
  }, [fontMap]);

  return fontsLoaded;
};
