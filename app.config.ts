import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "საქართველოს ისტორია",
  slug: "history-of-georgia",
  version: "1.1.0",
  runtimeVersion: "2.0.0",
  orientation: "portrait",
  icon: "./src/assets/images/hofGeLogo.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  experiments: {
    reactCompiler: true,
  },
  ios: {
    buildNumber: "1.1.0",
    supportsTablet: false,
    infoPlist: {
      LSApplicationQueriesSchemes: ["fb", "youtube"],
      ITSAppUsesNonExemptEncryption: false,
    },
    bundleIdentifier: "com.papunafshaveli.historyofgeorgia",
  },
  android: {
    versionCode: 10,
    adaptiveIcon: {
      foregroundImage: "./src/assets/images/faviconHofGe.png",
      backgroundColor: "#ffffff",
    },
    package: "com.papunafshaveli.historyofgeorgia",
    permissions: [
      "INTERNET",
      "ACCESS_NETWORK_STATE",
      "VIBRATE",
      "ACCESS_WIFI_STATE",
    ],
  },
  web: {
    bundler: "metro",
    favicon: "./src/assets/images/faviconHofGe.png",
  },
  plugins: [
    [
      "expo-splash-screen",
      {
        image: "./src/assets/images/faviconHofGe.png",
        resizeMode: "cover",
        backgroundColor: "#2C2C2C",
      },
    ],
    "expo-font",
    "expo-notifications",
    "expo-audio",
    "expo-asset",
    "@react-native-google-signin/google-signin",
    "expo-apple-authentication",
  ],
  extra: {
    eas: {
      projectId: "27042bfa-ef74-4c27-89e1-395a3eef60df",
    },
  },
  updates: {
    url: "https://u.expo.dev/27042bfa-ef74-4c27-89e1-395a3eef60df",
  },
});
