import { deleteUserData } from "@/src/services/firestore-account-deletion";

const mockedDelete = jest.fn();
const mockedCommit = jest.fn();
const batches: { ops: number }[] = [];
const mockedGetDocs = jest.fn();

jest.mock("@/firebase", () => ({ db: {} }));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn((_db, name) => ({ collectionName: name })),
  doc: jest.fn((_db, collectionName, id) => ({ collectionName, id })),
  query: jest.fn((ref, ...constraints) => ({ ref, constraints })),
  where: jest.fn((field, op, value) => ({ field, op, value })),
  getDocs: jest.fn((...args) => mockedGetDocs(...args)),
  writeBatch: jest.fn(() => {
    const tracker = { ops: 0 };
    batches.push(tracker);
    return {
      delete: jest.fn(() => {
        tracker.ops += 1;
        mockedDelete();
      }),
      commit: jest.fn(() => {
        mockedCommit();
        return Promise.resolve();
      }),
    };
  }),
}));

const buildResultsSnapshot = (count: number) => ({
  docs: Array.from({ length: count }, (_, i) => ({
    ref: { collectionName: "game_results", id: `uid_${i}` },
  })),
});

beforeEach(() => {
  mockedDelete.mockClear();
  mockedCommit.mockClear();
  mockedGetDocs.mockReset();
  batches.length = 0;
});

describe("deleteUserData", () => {
  it("deletes only users/{uid} when there are no game results", async () => {
    mockedGetDocs.mockResolvedValueOnce(buildResultsSnapshot(0));

    await deleteUserData("uid");

    expect(batches).toHaveLength(1);
    expect(batches[0].ops).toBe(1); // just users/{uid}
    expect(mockedCommit).toHaveBeenCalledTimes(1);
  });

  it("deletes 1 game result + users/{uid} in a single batch", async () => {
    mockedGetDocs.mockResolvedValueOnce(buildResultsSnapshot(1));

    await deleteUserData("uid");

    expect(batches).toHaveLength(1);
    expect(batches[0].ops).toBe(2);
    expect(mockedCommit).toHaveBeenCalledTimes(1);
  });

  it("packs 499 results + users/{uid} into one batch (chunk boundary)", async () => {
    mockedGetDocs.mockResolvedValueOnce(buildResultsSnapshot(499));

    await deleteUserData("uid");

    expect(batches).toHaveLength(1);
    expect(batches[0].ops).toBe(500); // exactly Firestore's per-batch cap
    expect(mockedCommit).toHaveBeenCalledTimes(1);
  });

  it("splits 500 results into two batches (499 + 1 + users)", async () => {
    mockedGetDocs.mockResolvedValueOnce(buildResultsSnapshot(500));

    await deleteUserData("uid");

    expect(batches).toHaveLength(2);
    expect(batches[0].ops).toBe(499);
    expect(batches[1].ops).toBe(2); // last result + users/{uid}
    expect(mockedCommit).toHaveBeenCalledTimes(2);
  });

  it("splits 1000 results into three batches (499 + 499 + 2 + users)", async () => {
    mockedGetDocs.mockResolvedValueOnce(buildResultsSnapshot(1000));

    await deleteUserData("uid");

    expect(batches).toHaveLength(3);
    expect(batches[0].ops).toBe(499);
    expect(batches[1].ops).toBe(499);
    expect(batches[2].ops).toBe(3); // 2 trailing results + users/{uid}
    expect(mockedCommit).toHaveBeenCalledTimes(3);
  });
});
