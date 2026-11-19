// One-off cleanup (2026-11-19): 15 `tickets` exist only in Firestore. They were removed from
// data.json (several are duplicates, one pair disagrees on a year) but upload.ts only adds/updates,
// so they stayed and still appear in the "All" game mode. They have no difficulty, so the daily
// challenge and the easy/medium/hard modes never use them.
//
// Safety: a ticket is deleted only if it still exists, is NOT in data.json, still has no
// difficulty, and no daily_challenges day references it. --apply first writes a full backup
// (every field, incl. randomField) and re-reads it before deleting anything. --restore puts the
// backed-up tickets back exactly. Dry run by default.
//
//   cd functions && node ../scripts/remove-orphan-tickets.cjs            # check only, no writes
//   cd functions && node ../scripts/remove-orphan-tickets.cjs --apply    # backup, then delete
//   cd functions && node ../scripts/remove-orphan-tickets.cjs --restore  # undo from the backup
const fs = require("fs");
const path = require("path");
const admin = require(path.join(process.cwd(), "node_modules/firebase-admin"));

const KEY = path.join(
  __dirname,
  "../android-service-account-key/history-of-georgia-43551-firebase-adminsdk-s9u1w-b00923ff6d.json",
);
const BACKUP = path.join(__dirname, "../tickets-orphans-backup-2026-11-19.json");
const IDS = [
  "1070", "1167", "1257", "237", "272", "291", "463", "556",
  "579", "653", "670", "796", "87", "87777", "958",
];
const APPLY = process.argv.includes("--apply");
const RESTORE = process.argv.includes("--restore");

admin.initializeApp({ credential: admin.credential.cert(require(KEY)) });
const db = admin.firestore();

const restore = async () => {
  const backup = JSON.parse(fs.readFileSync(BACKUP, "utf8"));
  for (const { id, data } of backup) {
    await db.collection("tickets").doc(id).set(data);
    console.log(`restored ticket ${id}`);
  }
  console.log(`\nRestored ${backup.length} ticket(s).`);
};

const run = async () => {
  const localIds = new Set(require(path.join(__dirname, "../data.json")).map((q) => String(q.id)));

  // No daily set may reference a ticket we delete.
  const days = await db.collection("daily_challenges").get();
  const referenced = new Set(days.docs.flatMap((d) => d.get("ticketIds") ?? []));

  const keep = [];
  const remove = [];
  for (const id of IDS) {
    const snap = await db.collection("tickets").doc(id).get();
    let reason = null;
    const plain = (v) =>
      v === null || ["string", "number", "boolean"].includes(typeof v) || (Array.isArray(v) && v.every(plain));
    if (!snap.exists) reason = "already gone";
    else if (!Object.values(snap.data()).every(plain)) reason = "has a non-plain field; the JSON backup could not restore it exactly";
    else if (localIds.has(id)) reason = "it IS in data.json";
    else if (snap.get("difficulty") !== undefined) reason = `it now has difficulty=${snap.get("difficulty")}`;
    else if (referenced.has(id)) reason = "a daily_challenges day uses it";
    if (reason) keep.push({ id, reason });
    else remove.push({ id, data: snap.data() });
  }

  for (const { id, reason } of keep) console.log(`ticket ${id}: SKIPPED (${reason})`);
  for (const { id, data } of remove) {
    console.log(`ticket ${id}: ${APPLY ? "will delete" : "would delete"}  — ${String(data.question).slice(0, 60)}`);
  }
  console.log(`\nChecked ${days.size} daily day(s); ${remove.length} to delete, ${keep.length} skipped.`);

  if (!APPLY) {
    console.log("Dry run: nothing written. Re-run with --apply.");
    return;
  }
  if (!remove.length) return;
  if (fs.existsSync(BACKUP)) throw new Error(`Backup already exists, not overwriting: ${BACKUP}`);

  // Backup first, and prove it is readable and complete before any delete.
  const serialisable = remove.map(({ id, data }) => ({ id, data }));
  fs.writeFileSync(BACKUP, JSON.stringify(serialisable, null, 2));
  const check = JSON.parse(fs.readFileSync(BACKUP, "utf8"));
  if (check.length !== remove.length || check.some((t, i) => t.id !== remove[i].id || !t.data.question)) {
    throw new Error("Backup verification failed; nothing deleted.");
  }
  console.log(`Backup written and verified: ${BACKUP}`);

  for (const { id } of remove) {
    await db.collection("tickets").doc(id).delete();
    console.log(`ticket ${id}: DELETED`);
  }
  console.log(`\nDeleted ${remove.length} ticket(s). Undo with --restore.`);
};

(RESTORE ? restore() : run())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
