import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

admin.initializeApp();

const db = admin.firestore();
const expo = new Expo();

/**
 * Triggered when a document is created in the "notifications" collection.
 *
 * To send a notification, add a document to Firestore:
 * Collection: notifications
 * Fields:
 *   title: string  — notification title
 *   body:  string  — notification body
 *   status: "pending"
 *
 * The function will update status to "sent" or "failed" when done.
 */
export const sendPushNotification = onDocumentCreated(
  "notifications/{notificationId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    if (!data || data.status !== "pending") return;

    await snapshot.ref.update({ status: "processing" });

    try {
      const tokensSnapshot = await db.collection("push_tokens").get();
      const validDocs = tokensSnapshot.docs.filter((doc) =>
        Expo.isExpoPushToken(doc.data().token as string),
      );
      const validTokens = validDocs.map((doc) => doc.data().token as string);

      if (validTokens.length === 0) {
        await snapshot.ref.update({
          status: "sent",
          successCount: 0,
          failureCount: 0,
        });
        return;
      }

      const messages: ExpoPushMessage[] = validTokens.map((token) => ({
        to: token,
        title: data.title,
        body: data.body,
        sound: "default",
      }));

      const chunks = expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...chunkTickets);
      }

      // Remove tokens that are no longer registered
      const deletePromises: Promise<unknown>[] = [];
      tickets.forEach((ticket, index) => {
        if (
          ticket.status === "error" &&
          ticket.details?.error === "DeviceNotRegistered"
        ) {
          deletePromises.push(validDocs[index].ref.delete());
        }
      });
      await Promise.all(deletePromises);

      const successCount = tickets.filter((t) => t.status === "ok").length;
      const failureCount = tickets.filter((t) => t.status === "error").length;

      await snapshot.ref.update({
        status: "sent",
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        successCount,
        failureCount,
      });
    } catch (error) {
      await snapshot.ref.update({
        status: "failed",
        error: String(error),
      });
    }
  },
);

// `pruneInactiveUsers` (the scheduled inactive-user cleanup) was deferred
// to v2.1 after seven adversarial-review rounds surfaced cross-cutting
// failure modes that need a deeper redesign than this codebase has time
// for before the v2.0.0 store submission. The schema additions remain in
// place so the v2.1 implementation has telemetry to validate against:
//   - `users/{uid}.lastSeenAt` (touched by `touchLastSeen` on every
//     onAuthStateChanged, throttled per uid).
//   - `push_tokens/{token}.uid` (set by `registerForNotifications` and
//     refreshed by `retagPushToken` on auth-state changes).
//   - Firestore rule constraints on `lastSeenAt` (monotonic + bounded).
// See INFRASTRUCTURE.md §17.3 and the parent plan deferred follow-up #5
// for the v2.1 requirements list distilled from the adversarial reviews
// (Firestore-emulator integration tests, server-trusted lastSeenAt
// writes, migration plan for legacy queue entries, bootstrap edge case
// handling, etc.).
