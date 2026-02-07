import { Linking } from "react-native";
import { openAppOrUrl } from "@/src/helpers/openAppOrUrl";

jest.mock("react-native", () => ({
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
}));

describe("openAppOrUrl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the app URL when supported", async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(true);

    await openAppOrUrl("fb://profile/123", "https://facebook.com/123");

    expect(Linking.canOpenURL).toHaveBeenCalledWith("fb://profile/123");
    expect(Linking.openURL).toHaveBeenCalledWith("fb://profile/123");
  });

  it("falls back to website URL when app is not supported", async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    (Linking.openURL as jest.Mock).mockResolvedValue(true);

    await openAppOrUrl("fb://profile/123", "https://facebook.com/123");

    expect(Linking.canOpenURL).toHaveBeenCalledWith("fb://profile/123");
    expect(Linking.openURL).toHaveBeenCalledWith("https://facebook.com/123");
  });
});
