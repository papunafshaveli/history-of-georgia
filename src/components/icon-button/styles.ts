import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  btnContainer: {
    borderRadius: 4,
    padding: 6,
    marginHorizontal: 8,
    marginVertical: 2,

    gap: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  pressed: {
    opacity: 0.8,
  },
  btnText: {
    color: "white",

    fontWeight: "bold",
    fontSize: 12,
  },
});
