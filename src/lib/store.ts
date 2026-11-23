import { useEffect, useState } from "react";

export type Item = { id: string; label: string; done: boolean };
export type Prayer = { name: string; time: string; done: boolean };
export type State = {
  day: string;
  name: string;
  prayers: Prayer[];
  athkar: { count: number; goal: number; done: boolean };
  morning: Item[];
  evening: Item[];
  blocks: (Item & { time: string })[];
};

const KEY = "blessings-v1";
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);
const mk = (labels: string[]): Item[] => labels.map((label) => ({ id: uid(), label, done: false }));

const initial = (): State => ({
  day: today(),
  name: "",
  prayers: [
    ["Fajr", "Aube"], ["Dhuhr", "Midi"], ["Asr", "Après-midi"], ["Maghrib", "Coucher"], ["Isha", "Nuit"],
  ].map(([name, time]) => ({ name: name!, time: time!, done: false })),
  athkar: { count: 0, goal: 33, done: false },
  morning: mk(["Nettoyant doux", "Tonique", "Sérum vitamine C", "Hydratant", "Écran solaire"]),
  evening: mk(["Démaquillant", "Nettoyant", "Sérum", "Crème de nuit"]),
  blocks: [],
});

// New day: keep the user's steps and tasks list structure, uncheck everything.
function rollover(s: State): State {
  if (s.day === today()) return s;
  const off = <T extends { done: boolean }>(a: T[]) => a.map((x) => ({ ...x, done: false }));
  return {
    ...s, day: today(),
    prayers: off(s.prayers), morning: off(s.morning), evening: off(s.evening),
    athkar: { ...s.athkar, count: 0, done: false }, blocks: [],
  };
}

let state: State = initial();
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = rollover({ ...initial(), ...JSON.parse(raw) });
  } catch { /* ignore corrupt storage */ }
}

export function update(fn: (s: State) => State) {
  state = fn(state);
  localStorage.setItem(KEY, JSON.stringify(state));
  subs.forEach((f) => f());
}

export function useStore(): [State, boolean] {
  const [, force] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    load();
    setReady(true);
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  return [state, ready];
}

export function progress(s: State) {
  const all = [...s.prayers, ...s.morning, ...s.evening, ...s.blocks, s.athkar];
  if (!all.length) return 0;
  return Math.round((all.filter((x) => x.done).length / all.length) * 100);
}

export const newItem = (label: string): Item => ({ id: uid(), label, done: false });
