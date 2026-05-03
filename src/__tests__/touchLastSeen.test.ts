import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  __TEST_LAST_SEEN_INTERNALS,
  touchLastSeen,
} from "@/src/services/firestore-user";

const { LAST_SEEN_THROTTLE_MS, lastSeenLocalKey } =
  __TEST_LAST_SEEN_INTERNALS;

const mockedUpdateDoc = jest.fn();

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

jest.mock("@/firebase", () => ({ db: {} }));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db, _collection, id) => ({ id })),
  serverTimestamp: jest.fn(() => "<serverTimestamp>"),
  // The functions used elsewhere in firestore-user.ts that aren't relevant
  // to this test still need to exist as identifiers.
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn((...args) => mockedUpdateDoc(...args)),
}));

const getItemMock = AsyncStorage.getItem as jest.Mock;
const setItemMock = AsyncStorage.setItem as jest.Mock;

// In-memory map that simulates real per-key AsyncStorage behavior, so
// multi-uid scenarios behave the same way they would on-device.
const fakeStorage = (initial: Record<string, string> = {}) => {
  const store: Record<string, string> = { ...initial };
  getItemMock.mockImplementation(async (key: string) => store[key] ?? null);
  setItemMock.mockImplementation(async (key: string, value: string) => {
    store[key] = value;
  });
  return store;
};

beforeEach(() => {
  mockedUpdateDoc.mockClear();
  getItemMock.mockReset();
  setItemMock.mockReset();
});

describe("touchLastSeen", () => {
  it("writes Firestore + populates the cache when the cache is empty", async () => {
    fakeStorage();

    await touchLastSeen("uid-fresh");

    expect(mockedUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockedUpdateDoc).toHaveBeenCalledWith(
      { id: "uid-fresh" },
      { lastSeenAt: "<serverTimestamp>" },
    );
    expect(setItemMock).toHaveBeenCalledTimes(1);
    expect(setItemMock).toHaveBeenCalledWith(
      lastSeenLocalKey("uid-fresh"),
      expect.any(String),
    );
  });

  it("skips Firestore when the cache says we synced within the throttle window", async () => {
    const recent = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
    fakeStorage({ [lastSeenLocalKey("uid-recent")]: String(recent) });

    await touchLastSeen("uid-recent");

    expect(mockedUpdateDoc).not.toHaveBeenCalled();
    expect(setItemMock).not.toHaveBeenCalled();
  });

  it("writes Firestore again once the throttle window has elapsed", async () => {
    const stale = Date.now() - LAST_SEEN_THROTTLE_MS - 1000;
    fakeStorage({ [lastSeenLocalKey("uid-stale")]: String(stale) });

    await touchLastSeen("uid-stale");

    expect(mockedUpdateDoc).toHaveBeenCalledTimes(1);
    expect(setItemMock).toHaveBeenCalledTimes(1);
    expect(setItemMock).toHaveBeenCalledWith(
      lastSeenLocalKey("uid-stale"),
      expect.any(String),
    );
  });

  it("treats a malformed cache value as no cache and writes", async () => {
    fakeStorage({ [lastSeenLocalKey("uid-broken-cache")]: "not-a-number" });

    await touchLastSeen("uid-broken-cache");

    // Number("not-a-number") === NaN; elapsed is NaN; the >= 0 guard
    // fails and the function proceeds with the Firestore write.
    expect(mockedUpdateDoc).toHaveBeenCalledTimes(1);
    expect(setItemMock).toHaveBeenCalledTimes(1);
  });

  it("ignores a future cache timestamp (clock skew / restore) and writes", async () => {
    // Cached timestamp is 1 day in the FUTURE — could happen if the
    // device clock was rewound, or AsyncStorage was restored from a
    // device with a different clock. Without a guard, elapsed would be
    // negative and the throttle would treat the value as "recent
    // enough" → skip writes forever.
    const future = Date.now() + 1 * 24 * 60 * 60 * 1000;
    fakeStorage({ [lastSeenLocalKey("uid-clock-skew")]: String(future) });

    await touchLastSeen("uid-clock-skew");

    expect(mockedUpdateDoc).toHaveBeenCalledTimes(1);
    expect(setItemMock).toHaveBeenCalledTimes(1);
    expect(setItemMock).toHaveBeenCalledWith(
      lastSeenLocalKey("uid-clock-skew"),
      expect.any(String),
    );
  });

  it("uses a per-uid throttle so a different uid on the same device is not blocked", async () => {
    // Pre-seed: uid-A was just synced (within the throttle window).
    const recent = Date.now() - 1 * 24 * 60 * 60 * 1000; // 1 day ago
    fakeStorage({ [lastSeenLocalKey("uid-A")]: String(recent) });

    // uid-A: should be throttled — no Firestore write.
    await touchLastSeen("uid-A");
    expect(mockedUpdateDoc).not.toHaveBeenCalled();

    // uid-B on the SAME device, within uid-A's throttle window: must
    // still write because its cache key is independent.
    await touchLastSeen("uid-B");
    expect(mockedUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockedUpdateDoc).toHaveBeenCalledWith(
      { id: "uid-B" },
      { lastSeenAt: "<serverTimestamp>" },
    );
    expect(setItemMock).toHaveBeenCalledWith(
      lastSeenLocalKey("uid-B"),
      expect.any(String),
    );

    // Switch back to uid-A, still within throttle: still skipped, never
    // wrote on uid-A's behalf.
    await touchLastSeen("uid-A");
    expect(mockedUpdateDoc).toHaveBeenCalledTimes(1); // unchanged from before
  });
});
