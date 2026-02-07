export type SettingsContextType = {
  isMuted: boolean;
  isVibrationOff: boolean;
  setIsMuted: (value: boolean) => void;
  setIsVibrationOff: (value: boolean) => void;
};
