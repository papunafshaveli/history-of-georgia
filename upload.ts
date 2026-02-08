import * as admin from "firebase-admin";
import { QuizQuestion } from "./src/types/quizQuestion";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require("./android-service-account-key/history-of-georgia-43551-a94b0030ba5f-android-key.json");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const data = require("./data.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function uploadData() {
  const existingDocs = await db.collection("tickets").get();
  const docIds = existingDocs.docs.map((item) => Number(item.id));

  for (const doc1 of data as QuizQuestion[]) {
    if (docIds.includes(doc1.id)) {
      continue;
    }

    const questionData: QuizQuestion = {
      ...doc1,
      randomField: Math.random(),
    };
    await db.collection("tickets").doc(String(doc1.id)).set(questionData);
  }
}

uploadData();
