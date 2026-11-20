// One-off fix (2026-11-19) for six `tickets` whose correct answer was not exactly one of their
// options (unwinnable, and it made submitDailyResult refuse a whole day), plus stray spaces and a
// duplicated option. Each field is written only if it still holds the known broken value, so a
// later manual edit is never overwritten. Dry run by default; pass --apply to write.
//
//   cd functions && node ../scripts/fix-broken-tickets.cjs           # show what would change
//   cd functions && node ../scripts/fix-broken-tickets.cjs --apply   # write it
const path = require("path");
const admin = require(path.join(process.cwd(), "node_modules/firebase-admin"));

const KEY = path.join(
  __dirname,
  "../android-service-account-key/history-of-georgia-43551-firebase-adminsdk-s9u1w-b00923ff6d.json",
);
const APPLY = process.argv.includes("--apply");

const FIXES = [
  { id: "70", field: "correctAnswer", from: "თბილისის ამირა...", to: "თბილისის ამირა" },
  { id: "1368", field: "correctAnswer", from: "დავით აღმაშენებლის აღმზრდელი...", to: "გიორგი ჭყონდიდელი" },
  {
    id: "440", field: "options",
    from: ["1994 წელს სტრასბურგში", "1994 წელს სოხუმში", "1993 წელს თბილისში", "1999 წელს მოსკოვში"],
    to: ["1994 წელს სტრასბურგში", "1994 წელს სოხუმში", "1993 წელს თბილისში", "1994 წელს მოსკოვში"],
  },
  { id: "539", field: "options", from: ["1025", "1014", "1000", "1014"], to: ["1025", "1014", "1000", "1008"] },
  {
    id: "107", field: "options",
    from: ["ალექსანდრე პირველი დიდი", "გიორგი მერვე", "ვახტანგ მეოთხე ", "ბაგრატ მეხუთე"],
    to: ["ალექსანდრე პირველი დიდი", "გიორგი მერვე", "ვახტანგ მეოთხე", "ბაგრატ მეხუთე"],
  },
  { id: "426", field: "options", from: ["1500 წელს ", "1490 წელს", "1510 წელს", "1496 წელს"], to: ["1500 წელს", "1490 წელს", "1510 წელს", "1496 წელს"] },
  {
    id: "426", field: "question",
    from: "ამ წელს საქართველო დაიშალა  ქართლის, კახეთის, იმერეთის სამეფოებად და სამცხის სამთავროდ.",
    to: "ამ წელს საქართველო დაიშალა ქართლის, კახეთის, იმერეთის სამეფოებად და სამცხის სამთავროდ.",
  },
];

admin.initializeApp({ credential: admin.credential.cert(require(KEY)) });
const db = admin.firestore();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Read-only: check every ticket actually in Firestore (some exist only there, not in data.json).
const scan = async () => {
  const local = new Map(require(path.join(__dirname, "../data.json")).map((q) => [String(q.id), q]));
  const snap = await db.collection("tickets").get();
  const problems = [];
  let onlyInFirestore = 0;
  let differFromLocal = 0;
  for (const doc of snap.docs) {
    const q = doc.data();
    const p = [];
    if (!["easy", "medium", "hard"].includes(q.difficulty)) p.push(`difficulty=${q.difficulty}`);
    if (typeof q.question !== "string" || !q.question.trim()) p.push("empty question");
    if (!Array.isArray(q.options)) p.push("no options");
    else {
      if (q.options.length !== 4) p.push(`${q.options.length} options`);
      if (new Set(q.options).size !== q.options.length) p.push("duplicate options");
      if (q.options.some((o) => typeof o !== "string" || o !== o.trim() || !o)) p.push("option empty/spaces");
      if (!q.options.includes(q.correctAnswer)) p.push("correctAnswer not in options");
    }
    if (typeof q.randomField !== "number") p.push("no randomField");
    if (p.length) problems.push({ id: doc.id, problems: p, correctAnswer: q.correctAnswer, options: q.options, question: q.question });
    const l = local.get(doc.id);
    if (!l) onlyInFirestore += 1;
    else if (l.question !== q.question || l.correctAnswer !== q.correctAnswer || JSON.stringify(l.options) !== JSON.stringify(q.options)) differFromLocal += 1;
  }
  const missing = [...local.keys()].filter((id) => !snap.docs.some((d) => d.id === id)).length;
  console.log(`Firestore tickets: ${snap.size} | only in Firestore: ${onlyInFirestore} | differ from data.json: ${differFromLocal} | in data.json but not Firestore: ${missing}`);
  console.log(`Tickets with problems: ${problems.length}`);
  for (const item of problems) console.log(JSON.stringify(item));
  process.exit(0);
};

(async () => {
  if (process.argv.includes("--scan")) return scan();
  let toWrite = 0;
  for (const fix of FIXES) {
    const ref = db.collection("tickets").doc(fix.id);
    const current = (await ref.get()).get(fix.field);
    let status;
    if (same(current, fix.to)) status = "already fixed";
    else if (!same(current, fix.from)) status = `SKIPPED, unexpected value: ${JSON.stringify(current)}`;
    else {
      toWrite += 1;
      if (APPLY) await ref.update({ [fix.field]: fix.to });
      status = APPLY ? "FIXED" : "would fix";
    }
    console.log(`ticket ${fix.id}.${fix.field}: ${status}`);
  }
  console.log(APPLY ? `\nWrote ${toWrite} field(s).` : `\nDry run: ${toWrite} field(s) would change. Re-run with --apply.`);
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
