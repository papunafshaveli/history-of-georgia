import { use } from "react";

import { SettingsContext } from "@/src/context/SettingsContext";
import { SettingsContextType } from "@/src/types/settingsContextType";

export const useSettings = (): SettingsContextType => {
  const context = use(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
