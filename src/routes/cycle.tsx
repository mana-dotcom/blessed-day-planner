import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Check, ChevronLeft, ChevronRight, Droplet, Pencil, Plus, Trash2, X } from "lucide-react";
import { Page, Card } from "@/components/ui-kit";
import { dayKey } from "@/lib/store";
import {
  useCycle, updateCycle, uid, insights, dayMap, averages, sortedPeriods, overlapping, addDays, diffDays, periodEnd,
  FLOWS, SYMPTOMS, MOODS, type CycleData, type DayLog, type Period, type Phase,
} from "@/lib/cycle";

export const Route = createFileRoute("/cycle")({
  head: () => ({ meta: [
    { title: "Cycle — Blessings" },
    { name: "description", content: "Suis tes règles, ton cycle et ta fenêtre fertile en douceur." },
    { property: "og:title", content: "Cycle — Blessings" },
    { property: "og:description", content: "Calendrier du cycle, prévisions et journal des symptômes." },
  ] }),
  component: CyclePage,
});

const small = "min-w-0 rounded-full border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent-strong";
const dateField = "block w-full min-w-0 rounded-full border border-border bg-card px-2 py-2 text-sm normal-case tracking-normal text-foreground outline-none focus:border-accent-strong";
const pill = (on: boolean) => `rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest transition ${on ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`;
const fmt = (k: string, o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) => new Date(k + "T12:00").toLocaleDateString("fr-FR", o);
const plural = (n: number, w: string) => `${n} ${w}${Math.abs(n) > 1 ? "s" : ""}`;
const WEEK = ["L", "M", "M", "J", "V", "S", "D"];
const PHASES: Record<Phase, string> = {
  "règles": "Règles", folliculaire: "Phase folliculaire", fertile: "Fenêtre fertile", ovulation: "Ovulation estimée", "lutéale": "Phase lutéale", retard: "Règles en retard",
};
const emptyLog = (): DayLog => ({ symptoms: [], note: "" });
const hasLog = (l?: DayLog) => !!l && (!!l.flow || !!l.mood || l.symptoms.length > 0 || l.note.trim() !== "");

function setLog(key: string, fn: (l: DayLog) => DayLog) {
  updateCycle((s) => {
    const next = fn(s.logs[key] ?? emptyLog());
    const logs = { ...s.logs };
    if (hasLog(next)) logs[key] = next; else delete logs[key];
    return { ...s, logs };
  });
}

function Hero({ c, today }: { c: CycleData; today: string }) {
  const i = insights(c, today);
  if (!i.last) {
    return (
      <section className="hero-card rounded-3xl p-6 text-primary-foreground">
        <p className="eyebrow !text-primary-foreground/80">Bienvenue</p>
        <p className="mt-2 font-display text-4xl leading-none">Ton cycle, en douceur.</p>
        <p className="mt-2 font-serif text-lg italic">Note le premier jour de tes dernières règles pour commencer les prévisions.</p>
        <button onClick={() => startPeriod(c, today)} className="mt-4 rounded-full bg-primary-foreground px-4 py-2 text-xs uppercase tracking-widest text-primary">Mes règles ont commencé aujourd'hui</button>
      </section>
    );
  }
  const d = i.daysUntilNext!;
  return (
    <section className="hero-card rounded-3xl p-6 text-primary-foreground">
      <p className="eyebrow !text-primary-foreground/80">{PHASES[i.phase!]}</p>
      <p className="mt-2 font-display text-6xl leading-none">Jour {i.cycleDay}</p>
      <p className="mt-2 font-serif text-lg italic">
        {d > 0 ? `Prochaines règles dans ${plural(d, "jour")} · ${fmt(i.nextStart!, { weekday: "long", day: "numeric", month: "long" })}`
          : d === 0 ? "Tes règles sont attendues aujourd'hui"
          : `Règles attendues depuis ${plural(-d, "jour")}`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {i.ongoing
          ? <button onClick={() => endPeriod(c, today)} className="rounded-full bg-primary-foreground px-4 py-2 text-xs uppercase tracking-widest text-primary">Mes règles sont finies aujourd'hui</button>
          : i.phase === "règles" ? null
          : <button onClick={() => startPeriod(c, today)} className="rounded-full bg-primary-foreground px-4 py-2 text-xs uppercase tracking-widest text-primary">Mes règles ont commencé aujourd'hui</button>}
      </div>
    </section>
  );
}

function Summary({ c, today }: { c: CycleData; today: string }) {
  const i = insights(c, today);
  const cards = [
    { label: "Jour du cycle", value: i.cycleDay ? `J${i.cycleDay}` : "—", sub: i.phase ? PHASES[i.phase] : "à commencer" },
    { label: "Cycle moyen", value: plural(i.avg.cycle, "jour"), sub: i.avg.measured ? `sur ${plural(i.avg.measured, "cycle")}` : "par défaut" },
    { label: "Règles moyennes", value: plural(i.avg.period, "jour"), sub: i.avg.measuredPeriods ? `sur ${plural(i.avg.measuredPeriods, "règle")} terminée${i.avg.measuredPeriods > 1 ? "s" : ""}` : "par défaut" },
    { label: "Prochaines règles", value: i.nextStart ? fmt(i.nextStart) : "—", sub: i.fertile ? `fertile ${fmt(i.fertile.start)} – ${fmt(i.fertile.end)}` : "estimation" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((x) => (
        <div key={x.label} className="glass rounded-3xl p-4">
          <p className="eyebrow !text-[9px] !tracking-[0.2em]">{x.label}</p>
          <p className="mt-1 truncate font-display text-2xl text-primary">{x.value}</p>
          <p className="truncate font-serif text-sm italic text-muted-foreground">{x.sub}</p>
        </div>
      ))}
    </div>
  );
}

function startPeriod(c: CycleData, day: string): string | undefined {
  if (overlapping(c, day, undefined)) return "Ce jour fait déjà partie de règles enregistrées.";
  updateCycle((s) => ({ ...s, periods: [...s.periods, { id: uid(), start: day }] }));
  return undefined;
}

function endPeriod(c: CycleData, day: string): string | undefined {
  const p = sortedPeriods(c).filter((x) => x.start <= day).at(-1);
  if (!p || diffDays(p.start, day) > 14) return "Aucun début de règles récent avant ce jour.";
  if (overlapping(c, p.start, day, p.id)) return "Ces dates chevauchent d'autres règles.";
  updateCycle((s) => ({ ...s, periods: s.periods.map((x) => (x.id === p.id ? { ...x, end: day } : x)) }));
  return undefined;
}

function Calendar({ c, today, selected, onSelect }: { c: CycleData; today: string; selected: string; onSelect: (k: string) => void }) {
  const [cursor, setCursor] = useState(() => selected.slice(0, 7));
  const [y, m] = cursor.split("-").map(Number) as [number, number];
  const first = new Date(y, m - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(y, m, 0).getDate();
  const map = dayMap(c, today);
  const shift = (n: number) => setCursor(dayKey(new Date(y, m - 1 + n, 1)).slice(0, 7));
  const days = Array.from({ length: count }, (_, i) => dayKey(new Date(y, m - 1, i + 1)));
  return (
    <Card title={first.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} right={
      <div className="flex gap-1">
        <button aria-label="Mois précédent" onClick={() => shift(-1)} className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-accent-strong"><ChevronLeft className="h-4 w-4" /></button>
        <button aria-label="Mois suivant" onClick={() => shift(1)} className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-accent-strong"><ChevronRight className="h-4 w-4" /></button>
      </div>
    }>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEK.map((d, i) => <span key={i} className="eyebrow pb-1 !text-[10px]">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`x${i}`} />)}
        {days.map((k) => {
          const kind = map.get(k);
          const cls = kind?.period ? "cycle-period" : kind?.predicted ? "cycle-predicted" : kind?.fertile ? "cycle-fertile" : "";
          return (
            <button key={k} onClick={() => onSelect(k)} aria-label={fmt(k, { day: "numeric", month: "long" })} aria-pressed={k === selected}
              className={`cycle-day relative grid aspect-square place-items-center rounded-full font-serif text-base transition ${cls} ${kind?.ovulation ? "cycle-ovulation" : ""} ${k === today ? "font-bold underline underline-offset-4" : ""} ${k === selected ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}>
              {Number(k.slice(8))}
              {hasLog(c.logs[k]) && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-current" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="cycle-period h-3 w-3 rounded-full" />Règles</span>
        <span className="flex items-center gap-1.5"><span className="cycle-predicted h-3 w-3 rounded-full" />Prévues</span>
        <span className="flex items-center gap-1.5"><span className="cycle-fertile h-3 w-3 rounded-full" />Fenêtre fertile</span>
        <span className="flex items-center gap-1.5"><span className="cycle-ovulation h-3 w-3 rounded-full" />Ovulation</span>
      </div>
    </Card>
  );
}

function DayPanel({ c, day, today }: { c: CycleData; day: string; today: string }) {
  const [error, setError] = useState<string>();
  const log = c.logs[day] ?? emptyLog();
  const kind = dayMap(c, today).get(day);
  const avg = averages(c);
  const inPeriod = sortedPeriods(c).find((p) => day >= p.start && day <= periodEnd(p, avg.period));
  const status = kind?.period ? `Règles · jour ${diffDays(inPeriod?.start ?? day, day) + 1}` : kind?.predicted ? "Règles prévues" : kind?.ovulation ? "Ovulation estimée" : kind?.fertile ? "Fenêtre fertile" : "";
  const act = (msg: string | undefined) => setError(msg);
  return (
    <Card title={fmt(day, { weekday: "long", day: "numeric", month: "long" })} right={status && <span className="eyebrow text-right">{status}</span>}>
      <div className="flex flex-wrap gap-2">
        {inPeriod ? (
          <>
            {inPeriod.start !== day && <button onClick={() => act(endPeriod(c, day))} className={pill(inPeriod.end === day)}>Fin des règles ici</button>}
            <button onClick={() => updateCycle((s) => ({ ...s, periods: s.periods.filter((p) => p.id !== inPeriod.id) }))} className="rounded-full bg-secondary px-3 py-1.5 text-[10px] uppercase tracking-widest text-destructive">Supprimer ces règles</button>
          </>
        ) : (
          <>
            <button onClick={() => act(startPeriod(c, day))} className={pill(false)}>Début des règles ici</button>
            <button onClick={() => act(endPeriod(c, day))} className={pill(false)}>Fin des règles ici</button>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <p className="eyebrow mt-5 text-[10px]">Flux</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {FLOWS.map((f) => (
          <button key={f} onClick={() => setLog(day, (l) => ({ ...l, flow: l.flow === f ? undefined : f }))} className={`${pill(log.flow === f)} flex items-center gap-1`}>
            <Droplet className="h-3 w-3" fill={log.flow === f ? "currentColor" : "none"} />{f}
          </button>
        ))}
      </div>

      <p className="eyebrow mt-5 text-[10px]">Symptômes</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SYMPTOMS.map((x) => {
          const on = log.symptoms.includes(x);
          return <button key={x} onClick={() => setLog(day, (l) => ({ ...l, symptoms: on ? l.symptoms.filter((y) => y !== x) : [...l.symptoms, x] }))} className={pill(on)}>{x}</button>;
        })}
      </div>

      <p className="eyebrow mt-5 text-[10px]">Humeur</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {MOODS.map((x) => <button key={x} onClick={() => setLog(day, (l) => ({ ...l, mood: l.mood === x ? undefined : x }))} className={pill(log.mood === x)}>{x}</button>)}
      </div>

      <label htmlFor="cycle-note" className="eyebrow mt-5 block text-[10px]">Notes</label>
      <textarea id="cycle-note" value={log.note} onChange={(e) => setLog(day, (l) => ({ ...l, note: e.target.value }))} rows={3} maxLength={500}
        placeholder="Comment te sens-tu aujourd'hui ?" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 font-serif text-lg outline-none focus:border-accent-strong" />
      {hasLog(log) && (
        <button onClick={() => updateCycle((s) => { const logs = { ...s.logs }; delete logs[day]; return { ...s, logs }; })}
          className="mt-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive">Effacer le journal du jour</button>
      )}
    </Card>
  );
}

function PeriodRow({ p, next, c }: { p: Period; next?: Period | undefined; c: CycleData }) {
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(p.start);
  const [end, setEnd] = useState(p.end ?? "");
  const [error, setError] = useState<string>();
  const avg = averages(c);
  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!start) return;
    if (end && end < start) return setError("La fin doit suivre le début.");
    if (overlapping(c, start, end || undefined, p.id)) return setError("Ces dates chevauchent d'autres règles.");
    updateCycle((s) => ({ ...s, periods: s.periods.map((x) => (x.id === p.id ? { ...x, start, end: end || undefined } : x)) }));
    setError(undefined); setEditing(false);
  };
  if (editing) {
    return (
      <form onSubmit={save} className="space-y-2 rounded-2xl bg-card/70 px-3 py-3">
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Début" className={dateField} />
          <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} aria-label="Fin" className={dateField} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" aria-label="Annuler" onClick={() => { setEditing(false); setError(undefined); setStart(p.start); setEnd(p.end ?? ""); }} className="grid h-9 w-9 place-items-center rounded-full bg-secondary"><X className="h-4 w-4" /></button>
          <button aria-label="Enregistrer" className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-4 w-4" /></button>
        </div>
      </form>
    );
  }
  const len = diffDays(p.start, periodEnd(p, avg.period)) + 1;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card/70 px-3 py-3">
      <span className="cycle-period grid h-9 w-9 shrink-0 place-items-center rounded-full"><Droplet className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-lg">{fmt(p.start)} → {p.end ? fmt(p.end) : "en cours"}</p>
        <p className="eyebrow !tracking-[0.15em] text-[10px]">
          {p.end ? plural(len, "jour") : `~${plural(len, "jour")} estimés`}{next ? ` · cycle de ${plural(diffDays(p.start, next.start), "jour")}` : ""}
        </p>
      </div>
      <button aria-label="Modifier" onClick={() => setEditing(true)} className="shrink-0 p-1.5 text-muted-foreground hover:text-accent-strong"><Pencil className="h-4 w-4" /></button>
      <button aria-label="Supprimer" onClick={() => updateCycle((s) => ({ ...s, periods: s.periods.filter((x) => x.id !== p.id) }))} className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function History({ c, today }: { c: CycleData; today: string }) {
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string>();
  const ps = sortedPeriods(c);
  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!start) return;
    if (end && end < start) return setError("La fin doit suivre le début.");
    if (overlapping(c, start, end || undefined)) return setError("Ces dates chevauchent d'autres règles.");
    updateCycle((s) => ({ ...s, periods: [...s.periods, { id: uid(), start, end: end || undefined }] }));
    setError(undefined); setEnd("");
  };
  const setDefault = (k: "cycleLength" | "periodLength", v: string, lo: number, hi: number) => {
    const n = Math.round(Number(v));
    if (n >= lo && n <= hi) updateCycle((s) => ({ ...s, [k]: n }));
  };
  return (
    <Card title="Mes cycles" right={<span className="eyebrow">{plural(ps.length, "règle")}</span>}>
      <div className="space-y-2">
        {ps.length === 0 && <p className="font-serif italic text-muted-foreground">Aucun cycle enregistré pour l'instant.</p>}
        {ps.map((p, i) => ({ p, next: ps[i + 1] })).reverse().map(({ p, next }) => <PeriodRow key={`${p.id}-${p.start}-${p.end ?? ""}`} p={p} next={next} c={c} />)}
      </div>
      <form onSubmit={add} className="mt-3 space-y-2">
        <p className="eyebrow text-[10px]">Ajouter des règles passées</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="eyebrow !text-[9px]">Début<input type="date" value={start} max={today} onChange={(e) => setStart(e.target.value)} aria-label="Date de début" className={`${dateField} mt-1`} /></label>
          <label className="eyebrow !text-[9px]">Fin (optionnel)<input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} aria-label="Date de fin" className={`${dateField} mt-1`} /></label>
        </div>
        <button aria-label="Ajouter les règles" className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs uppercase tracking-widest text-primary-foreground"><Plus className="h-4 w-4" />Ajouter</button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
      <div className="mt-5 border-t border-border/60 pt-4">
        <p className="eyebrow text-[10px]">Valeurs par défaut (cycle : avant 2 règles · durée : avant une règle terminée)</p>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2">Cycle
            <input type="number" min={18} max={60} defaultValue={c.cycleLength} onChange={(e) => setDefault("cycleLength", e.target.value, 18, 60)} className={`${small} w-20`} /> j
          </label>
          <label className="flex items-center gap-2">Règles
            <input type="number" min={1} max={12} defaultValue={c.periodLength} onChange={(e) => setDefault("periodLength", e.target.value, 1, 12)} className={`${small} w-20`} /> j
          </label>
        </div>
      </div>
    </Card>
  );
}

function CyclePage() {
  const [c, ready] = useCycle();
  const today = dayKey();
  const [selected, setSelected] = useState(today);
  return (
    <Page eyebrow="Cycle" title="Mon cycle." subtitle="Écoute ton corps, c'est une amana.">
      {ready && (
        <>
          <Hero c={c} today={today} />
          <Summary c={c} today={today} />
          <Calendar c={c} today={today} selected={selected} onSelect={setSelected} />
          <DayPanel key={selected} c={c} day={selected} today={today} />
          <History c={c} today={today} />
          <p className="px-2 text-center font-serif text-sm italic text-muted-foreground">Prévisions indicatives basées sur tes cycles passés — pas une méthode de contraception.</p>
        </>
      )}
    </Page>
  );
}
