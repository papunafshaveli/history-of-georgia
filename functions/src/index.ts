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
      const allTokens = tokensSnapshot.docs.map(
        (doc) => doc.data().token as string,
      );
      const validTokens = allTokens.filter((token) =>
        Expo.isExpoPushToken(token),
      );

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
          deletePromises.push(
            db.collection("push_tokens").doc(validTokens[index]).delete(),
          );
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
