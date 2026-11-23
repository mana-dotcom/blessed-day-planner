import { createPersisted, uid } from "@/lib/persisted";
import { dayKey } from "@/lib/store";

export const FLOWS = ["spotting", "léger", "moyen", "abondant"] as const;
export type Flow = (typeof FLOWS)[number];
export const SYMPTOMS = ["Crampes", "Ballonnements", "Maux de tête", "Fatigue", "Acné", "Seins sensibles", "Dos", "Envies", "Nausées", "Insomnie"];
export const MOODS = ["Sereine", "Joyeuse", "Sensible", "Irritable", "Anxieuse", "Triste", "Énergique"];

export type Period = { id: string; start: string; end?: string | undefined };
export type DayLog = { flow?: Flow | undefined; symptoms: string[]; mood?: string | undefined; note: string };
export type CycleData = { periods: Period[]; logs: Record<string, DayLog>; cycleLength: number; periodLength: number };

const KEY = "blessings-cycle-v1";
const LUTEAL = 14;
const clampInt = (v: unknown, lo: number, hi: number, d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= lo && n <= hi ? n : d;
};
const isKey = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

const initial = (): CycleData => ({ periods: [], logs: {}, cycleLength: 28, periodLength: 5 });

const cycle = createPersisted<CycleData>(KEY, initial, (p) => ({
  periods: (p.periods ?? []).filter((x) => x && isKey(x.start)).map((x) => ({ id: x.id || uid(), start: x.start, end: isKey(x.end) && x.end >= x.start ? x.end : undefined })),
  logs: Object.fromEntries(Object.entries(p.logs ?? {}).filter(([k, v]) => isKey(k) && v).map(([k, v]) => [k, {
    flow: FLOWS.includes(v.flow as Flow) ? v.flow : undefined,
    symptoms: Array.isArray(v.symptoms) ? v.symptoms.filter((s) => typeof s === "string") : [],
    mood: typeof v.mood === "string" ? v.mood : undefined,
    note: typeof v.note === "string" ? v.note : "",
  }])),
  cycleLength: clampInt(p.cycleLength, 18, 60, 28),
  periodLength: clampInt(p.periodLength, 1, 12, 5),
}));

export const useCycle = cycle.use;
export const updateCycle = cycle.update;
export { uid };

const toDate = (k: string) => new Date(k + "T12:00");
export const addDays = (k: string, n: number) => { const d = toDate(k); d.setDate(d.getDate() + n); return dayKey(d); };
export const diffDays = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000);
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

export const sortedPeriods = (c: CycleData) => [...c.periods].sort((a, b) => a.start.localeCompare(b.start));

/** Lengths between consecutive period starts, ignoring implausible gaps (missed logs). */
export const cycleLengths = (c: CycleData) => {
  const ps = sortedPeriods(c);
  return ps.slice(1).map((p, i) => diffDays(ps[i]!.start, p.start)).filter((n) => n >= 18 && n <= 60);
};

export function averages(c: CycleData) {
  const lens = cycleLengths(c).slice(-6);
  const durs = sortedPeriods(c).filter((p) => p.end).slice(-6).map((p) => diffDays(p.start, p.end!) + 1);
  return {
    cycle: lens.length ? Math.round(mean(lens)) : c.cycleLength,
    period: durs.length ? Math.round(mean(durs)) : c.periodLength,
    measured: lens.length,
    measuredPeriods: durs.length,
  };
}

/** Last day of a period; open periods are assumed to last the average duration. */
export const periodEnd = (p: Period, avgPeriod: number) => p.end ?? addDays(p.start, avgPeriod - 1);

export type Phase = "règles" | "folliculaire" | "fertile" | "ovulation" | "lutéale" | "retard";

export function insights(c: CycleData, today = dayKey()) {
  const avg = averages(c);
  const past = sortedPeriods(c).filter((p) => p.start <= today);
  const last = past.at(-1);
  if (!last) return { avg, last: undefined, cycleDay: undefined, nextStart: undefined, daysUntilNext: undefined, ovulation: undefined, fertile: undefined, phase: undefined, ongoing: undefined } as const;
  const cycleDay = diffDays(last.start, today) + 1;
  const nextStart = addDays(last.start, avg.cycle);
  const ovulation = addDays(nextStart, -LUTEAL);
  const fertile = { start: addDays(ovulation, -5), end: addDays(ovulation, 1) };
  const ongoing = !last.end && today <= periodEnd(last, avg.period) ? last : undefined;
  const phase: Phase =
    today <= periodEnd(last, avg.period) ? "règles"
      : today >= nextStart ? "retard"
      : today === ovulation ? "ovulation"
      : today >= fertile.start && today <= fertile.end ? "fertile"
      : today < fertile.start ? "folliculaire" : "lutéale";
  return { avg, last, cycleDay, nextStart, daysUntilNext: diffDays(today, nextStart), ovulation, fertile, phase, ongoing } as const;
}

export type DayKind = { period: boolean; predicted: boolean; fertile: boolean; ovulation: boolean };

/** Classify every day: logged period days plus predicted cycles reaching ~3 months past today. */
export function dayMap(c: CycleData, today = dayKey()) {
  const avg = averages(c);
  const map = new Map<string, DayKind>();
  const mark = (k: string, f: Partial<DayKind>) => map.set(k, { ...(map.get(k) ?? { period: false, predicted: false, fertile: false, ovulation: false }), ...f });
  const ps = sortedPeriods(c);
  for (const p of ps) {
    const end = periodEnd(p, avg.period);
    for (let k = p.start; k <= end; k = addDays(k, 1)) mark(k, { period: true });
  }
  const last = ps.at(-1);
  if (!last) return map;
  const horizon = addDays(today, 90);
  for (let i = 1; i <= 36; i++) {
    const start = addDays(last.start, avg.cycle * i);
    if (start > horizon) break;
    const ov = addDays(start, -LUTEAL);
    for (let k = addDays(ov, -5); k <= addDays(ov, 1); k = addDays(k, 1)) if (!map.get(k)?.period) mark(k, { fertile: true });
    mark(ov, { ovulation: true });
    for (let d = 0; d < avg.period; d++) { const k = addDays(start, d); if (!map.get(k)?.period) mark(k, { predicted: true, fertile: false }); }
  }
  return map;
}

/** Returns the existing period that would overlap [start, end], if any. */
export function overlapping(c: CycleData, start: string, end: string | undefined, ignoreId?: string) {
  const avg = averages(c);
  const e = end ?? start;
  return c.periods.find((p) => p.id !== ignoreId && start <= periodEnd(p, avg.period) && e >= p.start);
}
