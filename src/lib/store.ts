import { useEffect, useState } from "react";

export type Item = { id: string; label: string; done: boolean };
export type Prayer = { name: string; time: string; done: boolean };
export type StudyBlock = Item & { minutes: number; spent: number };
export type DaySummary = {
  progress: number; prayers: number; prayersTotal?: number; routines: number; routinesTotal: number;
  tasks: number; tasksTotal: number; studyMin: number; waterMl: number; waterGoalMl: number;
  food: boolean; sport: boolean; topic: boolean;
};
export type Walk = { id: string; day: string; seconds: number; at: number };
export type Plot = { id: string; plant: string | null; progress: number };
export type Farm = {
  stars: number; water: number; waterDay: string; maxWater: number; plots: Plot[];
  seeds: Record<string, number>; unlocked: string[]; harvest: Record<string, number>;
  bouquets: number[]; decor: string[];
};
export type State = {
  sports: (Item & { time: string })[];
  walks: Walk[];
  walkTimer: { startedAt: number | null; accumulated: number };
  farm: Farm;
  day: string;
  name: string;
  theme: "light" | "dark";
  prayers: Prayer[];
  athkar: { count: number; goal: number; done: boolean };
  morning: Item[];
  evening: Item[];
  blocks: (Item & { time: string })[];
  water: { glasses: number; goalMl: number; glassMl: number };
  study: StudyBlock[];
  health: { food: boolean; sport: boolean };
  topic: { offset: number; explored: boolean };
  history: Record<string, DaySummary>;
  garden: { blooms: number; lastBloom: string };
};

export const PRAYERS: [string, string][] = [
  ["Fajr", "Aube"], ["Duha", "Matinée"], ["Dhuhr", "Midi"], ["Asr", "Après-midi"],
  ["Maghrib", "Coucher"], ["Isha", "Nuit"], ["Qiyam al-Layl", "Fin de nuit"],
];

// Keeps saved done-flags while adding any prayer missing from older saves, in canonical order.
function normalizePrayers(saved: Prayer[] | undefined): Prayer[] {
  const byName = new Map((saved ?? []).map((p) => [p.name, p]));
  return PRAYERS.map(([name, time]) => ({ name, time, done: byName.get(name)?.done ?? false }));
}

const KEY = "blessings-v1";
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const uid = () => Math.random().toString(36).slice(2, 9);
const mk = (labels: string[]): Item[] => labels.map((label) => ({ id: uid(), label, done: false }));

const initial = (): State => ({
  day: dayKey(),
  name: "",
  theme: "light",
  prayers: normalizePrayers(undefined),
  athkar: { count: 0, goal: 33, done: false },
  morning: mk(["Nettoyant doux", "Tonique", "Sérum vitamine C", "Hydratant", "Écran solaire"]),
  evening: mk(["Démaquillant", "Nettoyant", "Sérum", "Crème de nuit"]),
  blocks: [],
  water: { glasses: 0, goalMl: 2000, glassMl: 250 },
  study: [],
  health: { food: false, sport: false },
  topic: { offset: 0, explored: false },
  history: {},
  garden: { blooms: 0, lastBloom: "" },
  sports: ["Marche", "Yoga", "Stretching"].map((label) => ({ id: uid(), label, done: false, time: "" })),
  walks: [],
  walkTimer: { startedAt: null, accumulated: 0 },
  farm: {
    stars: 10, water: 10, waterDay: dayKey(), maxWater: 10,
    plots: Array.from({ length: 4 }, () => ({ id: uid(), plant: null, progress: 0 })),
    seeds: { tulipe: 2, radis: 2, marguerite: 1 }, unlocked: ["tulipe", "marguerite", "radis"],
    harvest: {}, bouquets: [], decor: [],
  },
});

// Watering cans refill once per calendar day.
const refillFarm = (s: State): State =>
  s.farm.waterDay === dayKey() ? s : { ...s, farm: { ...s.farm, water: s.farm.maxWater, waterDay: dayKey() } };

const n = (a: { done: boolean }[]) => a.filter((x) => x.done).length;

export function progress(s: State) {
  const all = [...s.prayers, ...s.morning, ...s.evening, ...s.blocks, ...s.study, s.athkar,
    { done: s.water.glasses * s.water.glassMl >= s.water.goalMl }, { done: s.health.food }, { done: s.health.sport }];
  return Math.round((n(all) / all.length) * 100);
}

export function summarize(s: State): DaySummary {
  return {
    progress: progress(s), prayers: n(s.prayers), prayersTotal: s.prayers.length,
    routines: n(s.morning) + n(s.evening), routinesTotal: s.morning.length + s.evening.length,
    tasks: n(s.blocks), tasksTotal: s.blocks.length,
    studyMin: s.study.reduce((t, b) => t + (b.done ? Math.max(b.spent, b.minutes) : b.spent), 0),
    waterMl: s.water.glasses * s.water.glassMl, waterGoalMl: s.water.goalMl,
    food: s.health.food, sport: s.health.sport, topic: s.topic.explored,
  };
}

// New day: archive yesterday in history, keep lists, uncheck everything.
function rollover(s: State): State {
  if (s.day === dayKey()) return s;
  const off = <T extends { done: boolean }>(a: T[]) => a.map((x) => ({ ...x, done: false }));
  return {
    ...s, day: dayKey(), history: { ...s.history, [s.day]: summarize(s) },
    prayers: off(s.prayers), morning: off(s.morning), evening: off(s.evening),
    athkar: { ...s.athkar, count: 0, done: false }, blocks: [], sports: off(s.sports),
    water: { ...s.water, glasses: 0 }, study: s.study.filter((b) => !b.done).map((b) => ({ ...b, spent: 0 })),
    health: { food: false, sport: false }, topic: { offset: 0, explored: false },
  };
}

let state: State = initial();
let loaded = false;
const subs = new Set<() => void>();

function applyTheme() {
  document.documentElement.classList.toggle("dark", state.theme === "dark");
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const base = initial();
      state = refillFarm(rollover({ ...base, ...p, water: { ...base.water, ...p.water }, health: { ...base.health, ...p.health }, topic: { ...base.topic, ...p.topic }, garden: { ...base.garden, ...p.garden }, prayers: normalizePrayers(p.prayers),
        walkTimer: { ...base.walkTimer, ...p.walkTimer }, farm: { ...base.farm, ...p.farm } }));
    }
  } catch { /* ignore corrupt storage */ }
  applyTheme();
}

export function update(fn: (s: State) => State) {
  state = refillFarm(rollover(fn(state)));
  const today = summarize(state);
  state = { ...state, history: { ...state.history, [state.day]: today } };
  if (today.progress === 100 && state.garden.lastBloom !== state.day) {
    state = { ...state, garden: { blooms: state.garden.blooms + 1, lastBloom: state.day } };
  }
  localStorage.setItem(KEY, JSON.stringify(state));
  applyTheme();
  subs.forEach((f) => f());
}

export function useStore(): [State, boolean] {
  const [, force] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    load();
    setReady(true);
    const f = () => force((x) => x + 1);
    subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  return [state, ready];
}

export const newItem = (label: string): Item => ({ id: uid(), label, done: false });
