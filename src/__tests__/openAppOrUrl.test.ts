import { Linking } from "react-native";
import { openAppOrUrl } from "@/src/helpers/openAppOrUrl";

// Spies rather than a module mock: SDK 57 installs a lazy global `fetch` that
// reads Platform off the real react-native module.
describe("openAppOrUrl", () => {
  let canOpenURL: jest.SpyInstance;
  let openURL: jest.SpyInstance;

  beforeEach(() => {
    canOpenURL = jest.spyOn(Linking, "canOpenURL");
    openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("opens the app URL when supported", async () => {
    canOpenURL.mockResolvedValue(true);

    await openAppOrUrl("fb://profile/123", "https://facebook.com/123");

    expect(canOpenURL).toHaveBeenCalledWith("fb://profile/123");
    expect(openURL).toHaveBeenCalledWith("fb://profile/123");
  });

  it("falls back to website URL when app is not supported", async () => {
    canOpenURL.mockResolvedValue(false);

    await openAppOrUrl("fb://profile/123", "https://facebook.com/123");

    expect(canOpenURL).toHaveBeenCalledWith("fb://profile/123");
    expect(openURL).toHaveBeenCalledWith("https://facebook.com/123");
  });
});
