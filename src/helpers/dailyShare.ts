import { formatClock } from "./stopwatch";

type ShareInput = {
  date: string;
  answers: boolean[];
  elapsedMs: number;
  streak: number;
  link: string;
};

// Only the score, time and marks leave the app — never a question or an answer.
export const buildDailyShare = (template: string, input: ShareInput): string => {
  const [, month, day] = input.date.split("-");
  return template
    .replace("{date}", `${day}.${month}`)
    .replace("{n}", String(input.answers.filter(Boolean).length))
    .replace("{time}", formatClock(input.elapsedMs))
    .replace("{marks}", input.answers.map((ok) => (ok ? "✅" : "❌")).join(""))
    .replace("{streak}", String(input.streak))
    .replace("{link}", input.link);
};
