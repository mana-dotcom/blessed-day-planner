import { createPersisted } from "./persisted";
import { dayKey } from "./store";

export type QuranState = {
  bookmark: { surah: number; ayah: number } | null;
  wird: { goal: number; unit: "pages" | "sourates"; doneDay: string };
};
export const quran = createPersisted<QuranState>("quran-space-v1",
  () => ({ bookmark: null, wird: { goal: 2, unit: "pages", doneDay: "" } }),
  (r) => ({ bookmark: r.bookmark ?? null, wird: { goal: 2, unit: "pages", doneDay: "", ...r.wird } }));

export const wirdDoneToday = (s: QuranState) => s.wird.doneDay === dayKey();
export const audioUrl = (n: number) => `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${n}.mp3`;
// Next surah, wrapping 114 -> 1 and 1 -> 114.
export const stepSurah = (n: number, dir: 1 | -1) => ((n - 1 + dir + 114) % 114) + 1;
