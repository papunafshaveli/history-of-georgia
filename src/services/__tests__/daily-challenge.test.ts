jest.mock("@react-native-async-storage/async-storage", () =>
  // The package ships an in-memory mock; jest.mock factories cannot use import.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/firebase", () => ({ db: {} }));

const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  collection: jest.fn(),
  documentId: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDoc: (...a: unknown[]) => mockGetDoc(...a),
  getDocs: (...a: unknown[]) => mockGetDocs(...a),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadDailySet,
  prefetchTomorrow,
  pruneOldDailySets,
} from "@/src/services/daily-challenge";

const ids = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
const ticket = (id: string) => ({
  id,
  data: () => ({
    id: 1,
    question: `q-${id}`,
    options: [],
    correctAnswer: "",
    hint: "",
    randomField: 0,
    difficulty: "easy",
  }),
});
const dayDoc = (ticketIds: string[]) => ({
  exists: () => true,
  data: () => ({ date: "2026-11-18", ticketIds }),
});

beforeEach(async () => {
  await AsyncStorage.clear();
  mockGetDoc.mockReset();
  mockGetDocs.mockReset();
});

it("fetches the set and keeps the play order", async () => {
  mockGetDoc.mockResolvedValue(dayDoc(ids));
  mockGetDocs.mockResolvedValue({ docs: [...ids].reverse().map(ticket) });
  const set = await loadDailySet("2026-11-18");
  expect(set?.questions.map((q) => q.question)).toEqual(
    ids.map((id) => `q-${id}`),
  );
});

it("falls back to the cache when offline", async () => {
  mockGetDoc.mockResolvedValue(dayDoc(ids));
  mockGetDocs.mockResolvedValue({ docs: ids.map(ticket) });
  await loadDailySet("2026-11-18");
  mockGetDoc.mockRejectedValue(new Error("offline"));
  expect((await loadDailySet("2026-11-18"))?.ticketIds).toEqual(ids);
});

it("picks up a manual override online, but a started attempt keeps its cached set", async () => {
  mockGetDoc.mockResolvedValue(dayDoc(ids));
  mockGetDocs.mockResolvedValue({ docs: ids.map(ticket) });
  await loadDailySet("2026-11-18");

  const override = ids.map((id) => `${id}2`);
  mockGetDoc.mockResolvedValue(dayDoc(override));
  mockGetDocs.mockResolvedValue({ docs: override.map(ticket) });
  expect(
    (await loadDailySet("2026-11-18", { preferCache: true }))?.ticketIds,
  ).toEqual(ids);
  expect((await loadDailySet("2026-11-18"))?.ticketIds).toEqual(override);
});

it("re-reads only the day doc when the cached set still matches", async () => {
  mockGetDoc.mockResolvedValue(dayDoc(ids));
  mockGetDocs.mockResolvedValue({ docs: ids.map(ticket) });
  await loadDailySet("2026-11-18");
  await loadDailySet("2026-11-18");
  expect(mockGetDoc).toHaveBeenCalledTimes(2);
  expect(mockGetDocs).toHaveBeenCalledTimes(1);
});

it("prefetches tomorrow only when it isn't cached yet", async () => {
  mockGetDoc.mockResolvedValue(dayDoc(ids));
  mockGetDocs.mockResolvedValue({ docs: ids.map(ticket) });
  await prefetchTomorrow("2026-11-18");
  await prefetchTomorrow("2026-11-18");
  expect(mockGetDoc).toHaveBeenCalledTimes(1);
  expect(mockGetDocs).toHaveBeenCalledTimes(1);
});

it("returns null when the day has no set and nothing is cached", async () => {
  mockGetDoc.mockResolvedValue({ exists: () => false });
  expect(await loadDailySet("2026-11-18")).toBeNull();
});

it("rejects a set with missing tickets", async () => {
  mockGetDoc.mockResolvedValue(dayDoc(ids));
  mockGetDocs.mockResolvedValue({ docs: ids.slice(0, 9).map(ticket) });
  expect(await loadDailySet("2026-11-18")).toBeNull();
});

it("prunes sets other than today and tomorrow", async () => {
  await AsyncStorage.multiSet([
    ["daily:set:2026-11-16", "{}"],
    ["daily:set:2026-11-18", "{}"],
    ["daily:set:2026-11-19", "{}"],
    ["other", "{}"],
  ]);
  await pruneOldDailySets("2026-11-18");
  expect([...(await AsyncStorage.getAllKeys())].sort()).toEqual([
    "daily:set:2026-11-18",
    "daily:set:2026-11-19",
    "other",
  ]);
});
