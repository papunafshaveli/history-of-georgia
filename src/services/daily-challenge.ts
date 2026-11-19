import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/firebase";
import {
  DAILY_COLLECTION,
  DAILY_QUESTION_COUNT,
  DAILY_SET_PREFIX,
  dailySetKey,
} from "@/src/constants/daily";
import { logger } from "@/src/helpers/logger";
import type { DailyChallenge, DailySet, QuizQuestion } from "@/src/types";
import { addDaysToDate } from "@/src/utils/tbilisiDate";

const TICKETS_COLLECTION = "tickets";
// With a cached copy in hand, a slow network shouldn't hold the player on a spinner.
const CACHED_NETWORK_TIMEOUT_MS = 4000;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(id);
        resolve(value);
      },
      (error) => {
        clearTimeout(id);
        reject(error);
      },
    );
  });

const readCached = async (date: string): Promise<DailySet | null> => {
  try {
    const raw = await AsyncStorage.getItem(dailySetKey(date));
    return raw ? (JSON.parse(raw) as DailySet) : null;
  } catch {
    return null;
  }
};

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, i) => id === b[i]);

// One read for the day doc; the 10 tickets are re-read only when the cache doesn't match it.
const fetchSet = async (
  date: string,
  cached: DailySet | null,
): Promise<DailySet | null> => {
  const snap = await getDoc(doc(db, DAILY_COLLECTION, date));
  if (!snap.exists()) return null;
  const { ticketIds } = snap.data() as DailyChallenge;
  if (cached && sameIds(cached.ticketIds, ticketIds)) return cached;
  const tickets = await getDocs(
    query(
      collection(db, TICKETS_COLLECTION),
      where(documentId(), "in", ticketIds),
    ),
  );
  const byId = new Map(
    tickets.docs.map((d) => [d.id, d.data() as QuizQuestion]),
  );
  const questions = ticketIds
    .map((id) => byId.get(id))
    .filter((q): q is QuizQuestion => !!q);
  if (questions.length !== DAILY_QUESTION_COUNT) return null;
  return { date, ticketIds, questions };
};

type LoadOptions = {
  // An attempt already started must keep its exact questions, even if the day was overridden since.
  preferCache?: boolean;
};

// Network first so a manual override reaches everyone; the cache covers offline play.
export const loadDailySet = async (
  date: string,
  { preferCache = false }: LoadOptions = {},
): Promise<DailySet | null> => {
  const cached = await readCached(date);
  if (preferCache && cached) return cached;
  try {
    const request = fetchSet(date, cached);
    const fresh = cached
      ? await withTimeout(request, CACHED_NETWORK_TIMEOUT_MS)
      : await request;
    if (!fresh) return cached;
    if (fresh !== cached) {
      await AsyncStorage.setItem(dailySetKey(date), JSON.stringify(fresh));
    }
    return fresh;
  } catch (error) {
    logger.warn("loadDailySet: network failed, using cache", error);
    return cached;
  }
};

// Fetched once; when tomorrow becomes today, loadDailySet re-checks it against the day doc.
export const prefetchTomorrow = async (today: string): Promise<void> => {
  const tomorrow = addDaysToDate(today, 1);
  if (await readCached(tomorrow)) return;
  await loadDailySet(tomorrow);
};

export const pruneOldDailySets = async (today: string): Promise<void> => {
  const keep = new Set([
    dailySetKey(today),
    dailySetKey(addDaysToDate(today, 1)),
  ]);
  const keys = await AsyncStorage.getAllKeys();
  const stale = keys.filter(
    (k) => k.startsWith(DAILY_SET_PREFIX) && !keep.has(k),
  );
  if (stale.length) await AsyncStorage.multiRemove(stale);
};
