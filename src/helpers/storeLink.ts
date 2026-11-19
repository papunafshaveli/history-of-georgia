import { IS_ANDROID } from "@/src/constants/platform";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.papunafshaveli.historyofgeorgia";
const APP_STORE_URL = "https://apps.apple.com/app/id6741484980";

export const storeLink = (): string => (IS_ANDROID ? PLAY_STORE_URL : APP_STORE_URL);
