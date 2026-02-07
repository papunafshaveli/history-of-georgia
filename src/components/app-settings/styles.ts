import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
  },

  settingsWrapper: {
    alignItems: "center",
    gap: 20,

    padding: 20,
    marginHorizontal: 20,

    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
  },

  imageBackgroundWrapper: {
    width: 100,
    height: 100,

    overflow: "hidden",

    borderRadius: "50%",
  },
  imageBackground: {
    width: "100%",
    height: "100%",
  },

  vibrationSettingsWrapper: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vibrationTextAndIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  soundSettingsWrapper: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  soundTextAndIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  text: {
    fontSize: 13,
    fontFamily: "dm-media-main",
  },
});

export default styles;
