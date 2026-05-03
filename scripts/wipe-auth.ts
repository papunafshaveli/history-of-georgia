/**
 * scripts/wipe-auth.ts
 *
 * Deletes ALL Firebase Auth users in the configured project.
 * Intended for resetting a dev/test Firebase project before end-to-end smoke tests.
 *
 * Usage:
 *   npx tsc scripts/wipe-auth.ts --esModuleInterop --resolveJsonModule --skipLibCheck \
 *     && node scripts/wipe-auth.js --confirm
 *
 * Safety guards:
 * - Refuses to run without `--confirm` flag.
 * - Prints the resolved project ID before doing anything destructive.
 * - Aborts immediately if the service account JSON file is missing.
 */

import * as admin from "firebase-admin";

const SERVICE_ACCOUNT_PATH =
  "../android-service-account-key/history-of-georgia-43551-firebase-adminsdk-s9u1w-b00923ff6d.json";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

const PAGE_SIZE = 1000; // Firebase Admin SDK cap

const main = async () => {
  if (!process.argv.includes("--confirm")) {
    console.error(
      "Refusing to run without --confirm. This script deletes ALL Firebase Auth users.",
    );
    console.error("Re-run with: node scripts/wipe-auth.js --confirm");
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const projectId = serviceAccount.project_id;
  console.log(`\n=== Wiping Firebase Auth users for project: ${projectId} ===\n`);

  let pageToken: string | undefined = undefined;
  let totalDeleted = 0;
  let totalFailed = 0;
  let pageNumber = 0;

  do {
    pageNumber += 1;
    const result = await admin.auth().listUsers(PAGE_SIZE, pageToken);
    const uids = result.users.map((u) => u.uid);

    if (uids.length === 0) {
      console.log(`Page ${pageNumber}: no users found.`);
      break;
    }

    const batchResult = await admin.auth().deleteUsers(uids);
    totalDeleted += batchResult.successCount;
    totalFailed += batchResult.failureCount;

    console.log(
      `Page ${pageNumber}: requested ${uids.length}, deleted ${batchResult.successCount}, failed ${batchResult.failureCount}`,
    );

    if (batchResult.failureCount > 0) {
      batchResult.errors.forEach((errorInfo) => {
        console.warn(
          `  uid ${uids[errorInfo.index]} failed: ${errorInfo.error.message}`,
        );
      });
    }

    pageToken = result.pageToken;
  } while (pageToken);

  console.log(
    `\n=== Done. Total deleted: ${totalDeleted}. Total failed: ${totalFailed}. ===\n`,
  );

  process.exit(totalFailed === 0 ? 0 : 1);
};

main().catch((err) => {
  console.error("Wipe failed:", err);
  process.exit(1);
});
