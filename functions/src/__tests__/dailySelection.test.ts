import { selectDailySet, type PoolTicket } from "../dailySelection";

const pool = (
  prefix: string,
  difficulty: PoolTicket["difficulty"],
  n: number,
): PoolTicket[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, difficulty }));

const seq = () => {
  let i = 0;
  return () => (i++ * 0.37) % 1;
};

describe("selectDailySet", () => {
  const all = [
    ...pool("e", "easy", 10),
    ...pool("m", "medium", 10),
    ...pool("h", "hard", 10),
  ];

  it("returns 3 easy, 4 medium, 3 hard in that order, all distinct", () => {
    const ids = selectDailySet(all, [], seq());
    expect(ids).toHaveLength(10);
    expect(ids.slice(0, 3).every((id) => id.startsWith("e"))).toBe(true);
    expect(ids.slice(3, 7).every((id) => id.startsWith("m"))).toBe(true);
    expect(ids.slice(7).every((id) => id.startsWith("h"))).toBe(true);
    expect(new Set(ids).size).toBe(10);
  });

  it("avoids recently used ids", () => {
    const recent = ["e0", "e1", "e2", "e3", "e4", "e5", "e6"];
    const ids = selectDailySet(all, recent, seq());
    expect(ids.filter((id) => recent.includes(id))).toEqual([]);
  });

  it("falls back to the oldest-used ids when a difficulty runs short", () => {
    const recent = ["e9", "e8", "e7", "e6", "e5", "e4", "e3", "e2", "e1", "e0"];
    const ids = selectDailySet(all, recent, seq());
    expect(ids.slice(0, 3).sort()).toEqual(["e0", "e1", "e2"]);
  });

  it("ranks a reused id by its latest use and never picks it twice", () => {
    // e0 was used long ago AND yesterday, so e1 and e2 are the least recently used.
    const recent = ["e0", "e9", "e8", "e7", "e6", "e5", "e4", "e3", "e2", "e1", "e0"];
    const ids = selectDailySet(all, recent, seq());
    expect(ids.slice(0, 3).sort()).toEqual(["e1", "e2", "e3"]);
  });

  it("fails loudly when a difficulty has too few questions", () => {
    expect(() => selectDailySet(pool("e", "easy", 10), [], seq())).toThrow(
      /medium/,
    );
  });
});
