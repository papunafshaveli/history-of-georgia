export type Difficulty = "easy" | "medium" | "hard";
export type PoolTicket = { id: string; difficulty: Difficulty };

const MIX: [Difficulty, number][] = [
  ["easy", 3],
  ["medium", 4],
  ["hard", 3],
];

const shuffle = <T>(items: T[], rng: () => number): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// recentNewestFirst: ticket ids of earlier daily sets, most recent day first.
export const selectDailySet = (
  pool: PoolTicket[],
  recentNewestFirst: string[],
  rng: () => number = Math.random,
): string[] => {
  const recent = new Set(recentNewestFirst);
  const picked: string[] = [];
  for (const [difficulty, count] of MIX) {
    const levelIds = new Set(
      pool.filter((t) => t.difficulty === difficulty).map((t) => t.id),
    );
    const fresh = shuffle(
      [...levelIds].filter((id) => !recent.has(id)),
      rng,
    );
    // Short on unused questions: reuse the ones whose latest use is oldest.
    const oldestFirst = [...new Set(recentNewestFirst)]
      .reverse()
      .filter((id) => levelIds.has(id));
    const chosen = [...fresh, ...oldestFirst].slice(0, count);
    if (chosen.length < count) {
      throw new Error(`only ${chosen.length} ${difficulty} tickets available`);
    }
    picked.push(...chosen);
  }
  return picked;
};
