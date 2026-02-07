import {
  collection,
  getDocs,
  query,
  orderBy,
  startAt,
  limit,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "@/firebase";

import { QuizQuestion } from "@/src/types/quizQuestion";

const CACHE_KEY = "cachedQuestions";
const MAX_CACHED = 50;

const cacheQuestion = async (question: QuizQuestion) => {
  try {
    const stored = await AsyncStorage.getItem(CACHE_KEY);
    const cached: QuizQuestion[] = stored ? JSON.parse(stored) : [];

    if (cached.some((q) => q.id === question.id)) return;

    const updated = [...cached, question].slice(-MAX_CACHED);
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  } catch {
    // Cache write failure is non-critical
  }
};

const getRandomCachedQuestion = async (): Promise<QuizQuestion | null> => {
  try {
    const stored = await AsyncStorage.getItem(CACHE_KEY);
    if (!stored) return null;

    const cached: QuizQuestion[] = JSON.parse(stored);
    if (cached.length === 0) return null;

    return cached[Math.floor(Math.random() * cached.length)];
  } catch {
    return null;
  }
};

export const fetchRandomQuestion = async (): Promise<QuizQuestion | null> => {
  try {
    const random = Math.random();

    const questionsRef = collection(db, "tickets");
    const q = query(
      questionsRef,
      orderBy("randomField"),
      startAt(random),
      limit(1)
    );

    let snapshot = await getDocs(q);

    if (snapshot.empty) {
      const fallbackQ = query(questionsRef, orderBy("randomField"), limit(1));
      snapshot = await getDocs(fallbackQ);
    }

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data() as QuizQuestion;

      const question: QuizQuestion = {
        id: Number(doc.id),
        question: data.question,
        options: data.options,
        correctAnswer: data.correctAnswer,
        hint: data.hint,
        randomField: data.randomField,
      };

      cacheQuestion(question);
      return question;
    }

    return null;
  } catch {
    // Network error — fall back to cached questions
    return getRandomCachedQuestion();
  }
};
