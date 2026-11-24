import { createPersisted, uid } from "./persisted";

export type Todo = { id: string; label: string; done: boolean };
export type StageDay = {
  date: string; priorities: { text: string; done: boolean }[]; log: string;
  todos: Todo[]; tomorrow: string; schedule: Record<string, string>; notes: string;
};
export type StageState = { days: Record<number, StageDay> };

export const DAYS = 30;
export const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i);
export const emptyDay = (): StageDay => ({
  date: "", priorities: [0, 1, 2].map(() => ({ text: "", done: false })), log: "",
  todos: [], tomorrow: "", schedule: {}, notes: "",
});
export const getDay = (s: StageState, d: number): StageDay => ({ ...emptyDay(), ...s.days[d] });

export const stage = createPersisted<StageState>("stage-planner-v1", () => ({ days: {} }), (r) => ({ days: r.days ?? {} }));

export const newTodo = (label: string): Todo => ({ id: uid(), label, done: false });

// Unchecked to-dos leave day d and are appended to day d+1.
export function moveUnfinished(s: StageState, d: number): StageState {
  if (d >= DAYS) return s;
  const today = getDay(s, d), next = getDay(s, d + 1);
  const left = today.todos.filter((t) => !t.done);
  if (!left.length) return s;
  return { days: { ...s.days, [d]: { ...today, todos: today.todos.filter((t) => t.done) }, [d + 1]: { ...next, todos: [...next.todos, ...left] } } };
}

export function summary(s: StageState, from = 1, to = DAYS): string {
  const out: string[] = [];
  for (let d = from; d <= to; d++) {
    const x = s.days[d];
    if (!x) continue;
    const day = getDay(s, d);
    const lines = [`=== Jour ${d}${day.date ? ` (${day.date})` : ""} ===`];
    const pr = day.priorities.filter((p) => p.text);
    if (pr.length) lines.push("Priorités :", ...pr.map((p) => `- [${p.done ? "x" : " "}] ${p.text}`));
    if (day.log.trim()) lines.push("Ce que j'ai fait :", day.log.trim());
    if (day.todos.length) lines.push("To-do :", ...day.todos.map((t) => `- [${t.done ? "x" : " "}] ${t.label}`));
    const sch = HOURS.filter((h) => day.schedule[h]?.trim());
    if (sch.length) lines.push("Planning :", ...sch.map((h) => `${h}h – ${day.schedule[h]}`));
    if (day.notes.trim()) lines.push("Notes :", day.notes.trim());
    if (day.tomorrow.trim()) lines.push("Plan pour demain :", day.tomorrow.trim());
    if (lines.length > 1) out.push(lines.join("\n"));
  }
  return out.join("\n\n") || "Rien d'écrit pour l'instant.";
}
