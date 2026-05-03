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

const buildSnapshot = (collectionName: string, count: number) => ({
  docs: Array.from({ length: count }, (_, i) => ({
    ref: { collectionName, id: `${collectionName}_${i}` },
  })),
});

const stubGetDocs = (pushTokenCount: number, gameResultCount: number) => {
  // The service calls getDocs twice in order: push_tokens then game_results.
  mockedGetDocs.mockResolvedValueOnce(
    buildSnapshot("push_tokens", pushTokenCount),
  );
  mockedGetDocs.mockResolvedValueOnce(
    buildSnapshot("game_results", gameResultCount),
  );
};

beforeEach(() => {
  mockedDelete.mockClear();
  mockedCommit.mockClear();
  mockedGetDocs.mockReset();
  batches.length = 0;
});

describe("deleteUserData — cascade order: push_tokens → game_results → users/{uid}", () => {
  it("deletes only users/{uid} when there are no push tokens or game results", async () => {
    stubGetDocs(0, 0);

    await deleteUserData("uid");

    // No push_tokens batch (the snapshot is empty so the helper skips it).
    // No game_results batch (same).
    // One batch for users/{uid}.
    expect(batches).toHaveLength(1);
    expect(batches[0].ops).toBe(1);
    expect(mockedCommit).toHaveBeenCalledTimes(1);
  });

  it("deletes 1 game result then users/{uid} in two separate batches", async () => {
    stubGetDocs(0, 1);

    await deleteUserData("uid");

    expect(batches).toHaveLength(2);
    expect(batches[0].ops).toBe(1); // 1 game_result
    expect(batches[1].ops).toBe(1); // users/{uid}
    expect(mockedCommit).toHaveBeenCalledTimes(2);
  });

  it("packs 500 game results into one batch (chunk boundary)", async () => {
    stubGetDocs(0, 500);

    await deleteUserData("uid");

    expect(batches).toHaveLength(2);
    expect(batches[0].ops).toBe(500); // exactly Firestore's per-batch cap
    expect(batches[1].ops).toBe(1); // users/{uid}
    expect(mockedCommit).toHaveBeenCalledTimes(2);
  });

  it("splits 501 game results into two chunks plus users/{uid}", async () => {
    stubGetDocs(0, 501);

    await deleteUserData("uid");

    expect(batches).toHaveLength(3);
    expect(batches[0].ops).toBe(500);
    expect(batches[1].ops).toBe(1);
    expect(batches[2].ops).toBe(1); // users/{uid}
    expect(mockedCommit).toHaveBeenCalledTimes(3);
  });

  it("splits 1000 game results into two chunks plus users/{uid}", async () => {
    stubGetDocs(0, 1000);

    await deleteUserData("uid");

    expect(batches).toHaveLength(3);
    expect(batches[0].ops).toBe(500);
    expect(batches[1].ops).toBe(500);
    expect(batches[2].ops).toBe(1); // users/{uid}
    expect(mockedCommit).toHaveBeenCalledTimes(3);
  });

  it("cascades push tokens for the deleted user (other-device cleanup)", async () => {
    // Multi-device user: 2 tokens, 3 games.
    stubGetDocs(2, 3);

    await deleteUserData("uid");

    expect(batches).toHaveLength(3);
    expect(batches[0].ops).toBe(2); // push_tokens
    expect(batches[1].ops).toBe(3); // game_results
    expect(batches[2].ops).toBe(1); // users/{uid}
    expect(mockedCommit).toHaveBeenCalledTimes(3);
  });

  it("chunks push tokens at the 500-op cap", async () => {
    stubGetDocs(501, 0);

    await deleteUserData("uid");

    expect(batches).toHaveLength(3);
    expect(batches[0].ops).toBe(500);
    expect(batches[1].ops).toBe(1);
    expect(batches[2].ops).toBe(1); // users/{uid}
    expect(mockedCommit).toHaveBeenCalledTimes(3);
  });
});
