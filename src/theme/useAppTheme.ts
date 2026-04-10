import { use } from "react";

import { ThemeContext } from "./ThemeContext";

export const useAppTheme = () => use(ThemeContext);
