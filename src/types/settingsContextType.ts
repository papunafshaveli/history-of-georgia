export type SettingsContextType = {
  isMuted: boolean;
  isVibrationOff: boolean;
  isPushEnabled: boolean;
  setIsMuted: (value: boolean) => void;
  setIsVibrationOff: (value: boolean) => void;
  setIsPushEnabled: (value: boolean) => void;
};
