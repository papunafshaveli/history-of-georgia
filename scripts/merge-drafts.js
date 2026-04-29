/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data.json");
const DRAFT_PATH = path.join(ROOT, "data-draft.json");

const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse ${filePath}: ${err.message}`);
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf-8");
}

function validateDraft(entry, index) {
  const errors = [];
  const ref = entry.draftId ? `draftId="${entry.draftId}"` : `index ${index}`;

  if (typeof entry.question !== "string" || entry.question.trim() === "") {
    errors.push(`${ref}: "question" must be a non-empty string`);
  }
  if (!Array.isArray(entry.options) || entry.options.length !== 4) {
    errors.push(`${ref}: "options" must be an array of 4 strings`);
  } else if (!entry.options.every((o) => typeof o === "string")) {
    errors.push(`${ref}: every entry in "options" must be a string`);
  }
  if (typeof entry.correctAnswer !== "string") {
    errors.push(`${ref}: "correctAnswer" must be a string`);
  } else if (
    Array.isArray(entry.options) &&
    !entry.options.includes(entry.correctAnswer)
  ) {
    errors.push(`${ref}: "correctAnswer" must match one of "options"`);
  }
  if (typeof entry.hint !== "string" || entry.hint.trim() === "") {
    errors.push(`${ref}: "hint" must be a non-empty string`);
  }
  if (!VALID_DIFFICULTIES.has(entry.difficulty)) {
    errors.push(
      `${ref}: "difficulty" must be one of easy | medium | hard (got ${JSON.stringify(entry.difficulty)})`,
    );
  }
  if ("id" in entry) {
    errors.push(`${ref}: drafts must not pre-assign "id" — that happens here`);
  }
  return errors;
}

function main() {
  const data = readJson(DATA_PATH);
  const drafts = readJson(DRAFT_PATH);

  if (!Array.isArray(data)) {
    throw new Error(`data.json must be a JSON array`);
  }
  if (!Array.isArray(drafts)) {
    throw new Error(`data-draft.json must be a JSON array`);
  }

  if (drafts.length === 0) {
    console.log("data-draft.json is empty — nothing to merge.");
    return;
  }

  const surviving = [];
  let rejectedCount = 0;
  const allErrors = [];

  drafts.forEach((entry, index) => {
    if (entry && entry.reject === true) {
      rejectedCount++;
      return;
    }
    const errors = validateDraft(entry, index);
    if (errors.length > 0) {
      allErrors.push(...errors);
      return;
    }
    surviving.push(entry);
  });

  if (allErrors.length > 0) {
    console.error("Validation failed. No changes written.\n");
    allErrors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  // Existing data.json contains a small number of outlier IDs in the
  // hundreds of thousands / millions (likely from earlier batch imports).
  // Treat any ID above this cutoff as an outlier and ignore it when
  // computing the next sequential ID, so new questions stay in the
  // contiguous numeric range.
  const SEQUENTIAL_ID_CUTOFF = 50000;
  const maxId = data.reduce(
    (max, q) =>
      typeof q.id === "number" && q.id <= SEQUENTIAL_ID_CUTOFF && q.id > max
        ? q.id
        : max,
    0,
  );
  let nextId = maxId + 1;

  const merged = surviving.map((entry) => {
    // eslint-disable-next-line no-unused-vars
    const { draftId, reject, ...rest } = entry;
    return { ...rest, id: nextId++ };
  });

  const newData = [...data, ...merged];

  writeJson(DATA_PATH, newData);
  writeJson(DRAFT_PATH, []);

  console.log(
    `Merged ${merged.length} new question(s). Rejected ${rejectedCount}. Next available id: ${nextId}.`,
  );
}

main();
