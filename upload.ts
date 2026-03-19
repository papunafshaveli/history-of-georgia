import * as admin from "firebase-admin";
import { QuizQuestion } from "./src/types/quizQuestion";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require("./android-service-account-key/history-of-georgia-43551-firebase-adminsdk-s9u1w-b00923ff6d.json");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const data = require("./data.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function uploadData() {
  const existingDocs = await db.collection("tickets").get();
  const docIds = existingDocs.docs.map((item) => Number(item.id));

  let newCount = 0;
  let updatedCount = 0;

  for (const doc1 of data as QuizQuestion[]) {
    if (docIds.includes(doc1.id)) {
      const updateData: Record<string, unknown> = {
        question: doc1.question,
        options: doc1.options,
        correctAnswer: doc1.correctAnswer,
        hint: doc1.hint,
      };
      if (doc1.difficulty) {
        updateData.difficulty = doc1.difficulty;
      }
      await db.collection("tickets").doc(String(doc1.id)).update(updateData);
      updatedCount++;
      continue;
    }

    const questionData: QuizQuestion = {
      ...doc1,
      randomField: Math.random(),
    };
    await db.collection("tickets").doc(String(doc1.id)).set(questionData);
    newCount++;
  }

  console.log(`Done: ${newCount} new, ${updatedCount} updated`);
}

uploadData();
