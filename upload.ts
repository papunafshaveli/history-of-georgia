import { collection, doc, getDocs, query, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { QuizQuestion } from "./src/types/quizQuestion";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const data = require("./data.json");

async function uploadData() {
  const q = query(collection(db, "tickets"));
  const existingDocs = await getDocs(q);
  const docIds = existingDocs.docs.map((item) => Number(item.id));

  for (const doc1 of data as QuizQuestion[]) {
    if (docIds.includes(doc1.id)) {
      continue;
    }

    const questionData: QuizQuestion = {
      ...doc1,
      randomField: Math.random(),
    };
    const docRef = doc(db, "tickets", String(doc1.id));
    await setDoc(docRef, questionData);
  }
}

uploadData();
