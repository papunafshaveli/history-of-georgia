import { use } from "react";

import { ThemeModeContext } from "./ThemeModeContext";

export const useThemeMode = () => use(ThemeModeContext);
