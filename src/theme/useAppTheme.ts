import { useContext } from "react";

import { ThemeContext } from "./ThemeContext";

export const useAppTheme = () => useContext(ThemeContext);
