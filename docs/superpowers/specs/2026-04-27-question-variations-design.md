# Question Variations — Design

**Status:** Draft for review
**Date:** 2026-04-27

## Goal

Enrich the existing 1,514-question quiz pool with three new variation types that test different cognitive skills (category recognition, chronological reasoning, statement judgment), without breaking the app's design language, schema, or "no in-game explanations" interaction model.

## New Variations

Three variation types, with Statement-judgment having two sub-modes (true / false):

| Variation | Player task | Prefix highlight |
|---|---|---|
| **NOT-type** | Pick the option that doesn't belong to a stated category | `აირჩიე განსხვავებული:` |
| **Chronological** | Pick the earliest / latest event among 4 | None — plain question |
| **Statement-judgment** | Pick the one true (or one false) statement among 4 | `ჩამოთვლილთაგან ერთი სწორია:` / `ჩამოთვლილთაგან ერთი მცდარია:` |

All variations use the same 4-option layout, same scoring, same hint mechanism, and the same `QuizQuestion` shape. The existing `ასოციაცია:` pattern (159 questions) is preserved as-is.

## Architecture

**Single infrastructure change.** `src/components/game-screen-components/QuestionDisplay.tsx` currently checks the question against one prefix (`t.common_association`). Generalize this to iterate a list of recognized prefix keys and apply the same primary-color highlight to whichever matches first.

```
recognizedPrefixes = [
  t.common_association,
  t.common_pick_different,
  t.common_truth,
  t.common_falsehood,
]
```

Adding a future variation type = one new translation key + one entry in this list. No other component or screen changes.

## Data Model

**Zero schema changes.** Each new question is a normal `QuizQuestion`:

```typescript
{ id, question, options, correctAnswer, hint, difficulty, randomField }
```

Variation type is conveyed entirely through the question text prefix. `upload.ts`, the Firestore `tickets` collection, and the existing 1,514 questions are untouched.

## Translation Keys

Three new keys, added to both `src/locales/ka.json` and `src/locales/en.json`:

| Key | ka.json (Georgian) | en.json (English) |
|---|---|---|
| `common_pick_different` | `აირჩიე განსხვავებული:` | `Pick the different one:` |
| `common_truth` | `ჩამოთვლილთაგან ერთი სწორია:` | `One of the following is correct:` |
| `common_falsehood` | `ჩამოთვლილთაგან ერთი მცდარია:` | `One of the following is false:` |

## Authoring Conventions

### Universal rules (apply to every new question)

- **No Roman numerals.** Use Georgian ordinals (`მესამე`, `მეოთხე`) or `მე-N` + Arabic digits (`მე-12 საუკუნე`). Never `XII`, `V`, `III`, etc.
- **Georgian grammar accuracy.** Before authoring a batch, sample existing questions in `data.json` for similar topics to match phrasing style; verify case endings, verb forms, and proper-noun declensions.
- **Hint required.** Every new question must include a meaningful `hint` string — used by the existing in-game hint button.
- **Difficulty assigned.** Every new question must have `difficulty: "easy" | "medium" | "hard"`.

### NOT-type

- **Format:** `აირჩიე განსხვავებული: <category>` followed by 4 options.
- **Content rule:** 3 options clearly belong to `<category>`; 1 clearly does not (but is plausible at a glance).
- **Hard rule:** the category must be explicit in the question text. If you can't state the rule without giving away the answer, the question doesn't work as NOT-type — write it as a regular question.
- **Hint:** what defines the category, or what makes the odd one different.

**Example:**
- `question`: `აირჩიე განსხვავებული: ბაგრატიონთა დინასტიის წარმომადგენლები`
- `options`: `["დავით აღმაშენებელი", "თამარი", "გიორგი ბრწყინვალე", "შოთა რუსთაველი"]`
- `correctAnswer`: `შოთა რუსთაველი`
- `hint`: `პოეტი, არა მეფე`

### Chronological

- **Format:** `ჩამოთვლილთაგან, რომელი მოვლენა მოხდა ყველაზე ადრე?` or `...ყველაზე გვიან?` followed by 4 events.
- **No prefix highlight.** Question reads as a plain prompt; no UI distinction from standard questions.
- **Difficulty mapping:**
  - `easy` — events from different centuries (≥100 years apart)
  - `medium` — events within the same century
  - `hard` — events within the same decade or closer
- **Hint:** narrow the time window without naming the answer.

**Example (medium):**
- `question`: `ჩამოთვლილთაგან, რომელი მოხდა ყველაზე ადრე?`
- `options`: `["დიდგორის ბრძოლა", "ბასიანის ბრძოლა", "შამქორის ბრძოლა", "ბოლნისის ტაძრის აშენება"]`
- `correctAnswer`: `ბოლნისის ტაძრის აშენება`
- `hint`: `მე-5 საუკუნე`

### Statement-judgment

- **Format:** prefix label (`ჩამოთვლილთაგან ერთი სწორია:` or `ჩამოთვლილთაგან ერთი მცდარია:`), then 4 statements about the same subject.
- **Length cap:** each option ≤ ~50 Georgian characters, single line. Statements must fit in the existing `OptionButton` (height = `getAdjustedHeight(45)`) without UI changes.
- **Content rules:**
  - `ჩამოთვლილთაგან ერთი სწორია:` → 1 fully correct + 3 with one clear error each (wrong date, wrong person, wrong role).
  - `ჩამოთვლილთაგან ერთი მცდარია:` → 3 fully correct + 1 with one clear error.
- **Distractor strategy:** errors should match common misconceptions, not arbitrary noise. Tight statements force one clear claim per option; long multi-fact statements are forbidden by the length cap.
- **Hint:** points toward the truth without naming it.

**Example (`ჩამოთვლილთაგან ერთი სწორია:`):**
- `question`: `ჩამოთვლილთაგან ერთი სწორია:`
- `options`:
  - `თამარი იყო გიორგი მესამის ქალიშვილი` (correct)
  - `თამარი იყო ბაგრატ მესამის ქალიშვილი`
  - `თამარი იყო დავით მეოთხის ქალიშვილი`
  - `თამარი იყო გიორგი მეოთხის ქალიშვილი`
- `correctAnswer`: `თამარი იყო გიორგი მესამის ქალიშვილი`
- `hint`: `მამამისი მესამე იყო, არა მეოთხე`

## UX Caveat — Statement → false

When the player answers a `ჩამოთვლილთაგან ერთი მცდარია:` question correctly, the false statement receives the standard green correct-answer highlight on reveal. Players who don't read the prefix carefully may walk away thinking the highlighted (false) statement is true. The prefix highlight is the only safeguard.

If playtesting surfaces real confusion, the fallback is to ship only `ჩამოთვლილთაგან ერთი სწორია:` and skip `ჩამოთვლილთაგან ერთი მცდარია:`. Decision deferred until after Phase 1.

## Scope & Targets

### Phase 1 — Validation batch (~30 questions)

Goal: lock in tone, prefix wording, difficulty calibration, and Georgian phrasing on a small sample before producing volume.

| Variation | Phase 1 count |
|---|---|
| NOT-type | 10 |
| Chronological | 10 |
| Statement → true | 5 |
| Statement → false | 5 |

### Phase 2 — Scale-up

Targets, not commitments. Actual count depends on quality bar during review.

| Variation | Target | Source |
|---|---|---|
| NOT-type | 50–100 | Curated authoring around historical categories |
| Chronological | 100–150 | Mined from 186 existing date-anchored questions + manual additions |
| Statement → true | 80–120 | Any factual subject in the existing pool |
| Statement → false | 80–120 | Same — inverted |

## Authoring Workflow

A staging file separates drafts from production data.

1. **Draft.** Claude appends a batch to `data-draft.json` (project root, sibling to `data.json`). Each entry uses a temporary `draftId` string (e.g., `"not-1"`, `"chrono-7"`, `"true-3"`) instead of a numeric `id`.
2. **Review.** User edits `data-draft.json` inline — fixes Georgian phrasing, fact-checks, adjusts difficulty. To reject an entry, the user either deletes it from the file or marks it with `"reject": true`.
3. **Merge.** On user approval, a small script (`scripts/merge-drafts.ts`) drops entries flagged with `reject: true`, assigns sequential numeric `id`s to the survivors starting from `max(existing IDs) + 1`, removes `draftId` and any `reject` keys, appends to `data.json`, and empties `data-draft.json`.
4. **Sync.** User runs existing `upload.ts` to push new questions to Firestore. Existing logic handles new IDs as `set` and re-uploads as `update`.

`data-draft.json` is checked into git (small file, version-controlled visibility into pending content).

## Implementation Footprint

One-time engineering work:

1. **Generalize prefix detection** in `src/components/game-screen-components/QuestionDisplay.tsx:24-58` — replace single-prefix check with iteration over a list.
2. **Centralize the prefix list** in a new constant module (e.g., `src/constants/questionPrefixes.ts`) so future additions are a one-line change.
3. **Add 3 translation keys** to `src/locales/ka.json` and `src/locales/en.json`.
4. **Author `scripts/merge-drafts.ts`** — small Node script that merges `data-draft.json` into `data.json` with proper ID assignment.
5. **Create empty `data-draft.json`** at project root.

The bulk of the project is content authoring + user review, not engineering.

## Out of Scope

- Schema changes to `QuizQuestion` (no `type` field, no new fields).
- Modifying the 1,514 existing questions (including normalizing existing Roman numerals — left alone).
- New game modes or filtering by variation type.
- New UI components for variation-specific layouts (e.g., taller buttons, drag-to-order chronologies).
- Player-facing tutorials or first-time tooltips for new variations — relies on prefix highlight + question text alone.
- Analytics/telemetry for per-variation performance (could be a follow-up).

## Open Decisions Deferred to Implementation

- **Exact ka.json/en.json wording** for the three new prefix translation keys — Georgian text above is the working version; may refine during Phase 1 review.
- **`data-draft.json` git status** — currently planned to be checked in; user can move to `.gitignore` if they prefer drafts local.
- **`merge-drafts.ts` exact shape** — sequential IDs and dedup logic to be locked in the implementation plan.
- **Fate of `ჩამოთვლილთაგან ერთი მცდარია:` variation** — ship-or-skip decision after Phase 1 playtesting.
