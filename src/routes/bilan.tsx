import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Page, Card } from "@/components/ui-kit";
import { useStore, dayKey, type DaySummary } from "@/lib/store";

export const Route = createFileRoute("/bilan")({
  head: () => ({ meta: [
    { title: "Bilan & Calendrier — Blessings" },
    { name: "description", content: "Calendrier de tes progrès, bilan de fin de journée et de fin de semaine." },
    { property: "og:title", content: "Bilan & Calendrier — Blessings" },
    { property: "og:description", content: "Ton récap du jour et de la semaine." },
  ] }),
  component: Bilan,
});

const WEEK = ["L", "M", "M", "J", "V", "S", "D"];

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-baseline justify-between border-b border-border/60 py-2 last:border-0"><span className="font-serif text-lg">{label}</span><span className="eyebrow">{value}</span></div>;
}

function DayRecap({ d }: { d: DaySummary | undefined }) {
  if (!d) return <p className="font-serif italic text-muted-foreground">Aucune donnée pour ce jour.</p>;
  return (
    <div>
      <p className="font-display text-5xl text-accent-strong">{d.progress}%</p>
      <div className="mt-3">
        <Row label="Prières" value={`${d.prayers}/5`} />
        <Row label="Routines skincare" value={`${d.routines}/${d.routinesTotal}`} />
        <Row label="Tâches" value={`${d.tasks}/${d.tasksTotal}`} />
        <Row label="Étude" value={`${d.studyMin} min`} />
        <Row label="Hydratation" value={`${(d.waterMl / 1000).toFixed(2)} / ${(d.waterGoalMl / 1000).toFixed(1)} L`} />
        <Row label="Healthy food · Sport" value={`${d.food ? "✓" : "–"} · ${d.sport ? "✓" : "–"}`} />
        <Row label="Sujet Islam exploré" value={d.topic ? "✓" : "–"} />
      </div>
    </div>
  );
}

function Bilan() {
  const [s, ready] = useStore();
  const now = new Date();
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [sel, setSel] = useState(dayKey(now));
  const h = ready ? s.history : {};

  const first = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];

  // Current week, Monday → Sunday
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return { d, s: h[dayKey(d)] }; });
  const logged = week.filter((w) => w.s);
  const active = logged.filter((w) => w.s!.progress > 0);
  const sum = (f: (x: DaySummary) => number) => logged.reduce((t, w) => t + f(w.s!), 0);
  const best = [...logged].sort((a, b) => b.s!.progress - a.s!.progress)[0];
  const highlights = [
    sum((x) => x.prayers) >= 30 && "Prières très régulières ♡",
    sum((x) => x.studyMin) >= 300 && "Plus de 5 h d'étude !",
    logged.filter((w) => w.s!.waterMl >= w.s!.waterGoalMl).length >= 4 && "Belle hydratation",
    sum((x) => (x.sport ? 1 : 0)) >= 3 && "Sport au moins 3 fois",
  ].filter(Boolean) as string[];

  return (
    <Page eyebrow="Récap" title="Bilan." subtitle="Regarde le chemin parcouru, alhamdulillah.">
      <Card title={month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} right={
        <div className="flex gap-1">
          <button aria-label="Mois précédent" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid h-8 w-8 place-items-center rounded-full bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
          <button aria-label="Mois suivant" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid h-8 w-8 place-items-center rounded-full bg-secondary"><ChevronRight className="h-4 w-4" /></button>
        </div>}>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEK.map((w, i) => <span key={i} className="eyebrow text-[10px]">{w}</span>)}
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const k = dayKey(d); const p = h[k]?.progress ?? 0;
            return (
              <button key={i} onClick={() => setSel(k)}
                className={`relative aspect-square rounded-xl text-sm transition ${sel === k ? "ring-2 ring-accent-strong" : ""}`}
                style={{ background: p ? `color-mix(in oklab, var(--accent-strong) ${15 + p * 0.7}%, transparent)` : undefined }}>
                <span className={k === dayKey(now) ? "font-bold text-primary" : ""}>{d.getDate()}</span>
              </button>
            );
          })}
        </div>
        <p className="eyebrow mt-3 text-[10px]">Plus la case est foncée, plus la journée a été remplie.</p>
      </Card>

      <Card title={sel === dayKey(now) ? "Bilan du jour" : new Date(sel + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}>
        <DayRecap d={h[sel]} />
      </Card>

      <Card title="Bilan de la semaine">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-card/70 p-3"><p className="font-display text-3xl text-primary">{active.length}/7</p><p className="eyebrow text-[9px]">jours actifs</p></div>
          <div className="rounded-2xl bg-card/70 p-3"><p className="font-display text-3xl text-primary">{sum((x) => x.prayers)}</p><p className="eyebrow text-[9px]">prières</p></div>
          <div className="rounded-2xl bg-card/70 p-3"><p className="font-display text-3xl text-primary">{Math.round(sum((x) => x.studyMin) / 6) / 10}h</p><p className="eyebrow text-[9px]">étude</p></div>
        </div>
        <div className="mt-3">
          <Row label="Routines complétées" value={`${sum((x) => x.routines)} étapes`} />
          <Row label="Tâches terminées" value={`${sum((x) => x.tasks)}`} />
          <Row label="Eau bue" value={`${(sum((x) => x.waterMl) / 1000).toFixed(1)} L`} />
          <Row label="Séances de sport" value={`${sum((x) => (x.sport ? 1 : 0))}`} />
          {best && <Row label="Meilleure journée" value={`${best.d.toLocaleDateString("fr-FR", { weekday: "long" })} · ${best.s!.progress}%`} />}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(highlights.length ? highlights : ["Chaque petit pas compte ♡"]).map((x) => <span key={x} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">{x}</span>)}
        </div>
      </Card>
    </Page>
  );
}
