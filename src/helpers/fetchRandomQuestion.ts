import {
  collection,
  getDocs,
  query,
  orderBy,
  startAt,
  limit,
  where,
  QueryConstraint,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "@/firebase";

import { Difficulty, QuizQuestion } from "@/src/types/quizQuestion";

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

export const fetchRandomQuestion = async (
  difficulty?: Difficulty,
): Promise<QuizQuestion | null> => {
  try {
    const random = Math.random();

    const questionsRef = collection(db, "tickets");

    const constraints: QueryConstraint[] = [];
    if (difficulty) {
      constraints.push(where("difficulty", "==", difficulty));
    }
    constraints.push(orderBy("randomField"), startAt(random), limit(1));

    const q = query(questionsRef, ...constraints);

    let snapshot = await getDocs(q);

    if (snapshot.empty) {
      const fallbackConstraints: QueryConstraint[] = [];
      if (difficulty) {
        fallbackConstraints.push(where("difficulty", "==", difficulty));
      }
      fallbackConstraints.push(orderBy("randomField"), limit(1));

      const fallbackQ = query(questionsRef, ...fallbackConstraints);
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
        difficulty: data.difficulty,
      };

      cacheQuestion(question);
      return question;
    }

    return null;
  } catch (error) {
    if (__DEV__) {
      console.error("fetchRandomQuestion error:", error);
    }
    return getRandomCachedQuestion();
  }
};
