import { useEffect, useState } from "react";

// Small localStorage-backed store, kept separate from the main day planner state.
export function createPersisted<T>(key: string, initial: () => T, normalize: (raw: Partial<T>) => T) {
  let state = initial();
  let loaded = false;
  const subs = new Set<() => void>();

  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = localStorage.getItem(key);
      if (raw) state = normalize(JSON.parse(raw));
    } catch { /* ignore corrupt storage */ }
  };

  // Returns false (and keeps the previous state) when storage is full.
  const update = (fn: (s: T) => T): boolean => {
    load();
    const next = fn(state);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      return false;
    }
    state = next;
    subs.forEach((f) => f());
    return true;
  };

  const use = (): [T, boolean] => {
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
  };

  return { use, update };
}

export const uid = () => Math.random().toString(36).slice(2, 9);
