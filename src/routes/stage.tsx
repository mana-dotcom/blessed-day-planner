import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Trash2, Plus, ArrowRight, FileText, Copy, X } from "lucide-react";
import { Page, Card } from "@/components/ui-kit";
import { stage, getDay, newTodo, moveUnfinished, summary, DAYS, HOURS, type StageDay } from "@/lib/stage";

export const Route = createFileRoute("/stage")({
  head: () => ({ meta: [
    { title: "My Stage Planner — Blessings" },
    { name: "description", content: "Planner de stage sur 30 jours : priorités, journal, to-do, planning et résumé pour le rapport." },
    { property: "og:title", content: "My Stage Planner" },
    { property: "og:description", content: "Organise ton mois de stage jour après jour." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: StagePage,
});

const box = "w-full rounded-2xl border border-border bg-card px-3 py-2 outline-none focus:border-accent-strong";

function StagePage() {
  const [s] = stage.use();
  const [day, setDay] = useState(1);
  const [showSum, setShowSum] = useState(false);
  const d = getDay(s, day);
  const week = Math.ceil(day / 7) > 4 ? 4 : Math.ceil(day / 7);
  const set = (fn: (x: StageDay) => StageDay) => stage.update((st) => ({ days: { ...st.days, [day]: fn(getDay(st, day)) } }));
  const [todo, setTodo] = useState("");

  return (
    <Page eyebrow="Internship" title="My Stage Planner." subtitle="tiny steps, big progress ♡">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((w) => (
          <button key={w} onClick={() => setDay((w - 1) * 7 + 1)}
            className={`flex-1 rounded-full px-3 py-2 text-xs uppercase tracking-widest ${week === w ? "bg-primary text-primary-foreground" : "glass"}`}>Sem. {w}</button>
        ))}
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {Array.from({ length: DAYS }, (_, i) => i + 1).map((n) => (
          <button key={n} onClick={() => setDay(n)} aria-label={`Jour ${n}`}
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-planner text-lg ${n === day ? "bg-primary text-primary-foreground" : s.days[n] ? "bg-secondary text-accent-strong" : "glass"}`}>{n}</button>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow">Jour</p><p className="font-planner text-5xl leading-none text-primary">{day}<span className="text-xl text-muted-foreground"> / {DAYS}</span></p></div>
          <input type="date" value={d.date} onChange={(e) => set((x) => ({ ...x, date: e.target.value }))} className="rounded-full border border-border bg-card px-3 py-2 text-sm" />
        </div>
        <button onClick={() => setShowSum(true)} className="mt-4 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs uppercase tracking-widest text-primary-foreground"><FileText className="h-4 w-4" />Résumé semaine / mois</button>
      </Card>

      <Card title="Top 3 priorités">
        <div className="space-y-2">
          {d.priorities.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <button aria-label="Cocher" onClick={() => set((x) => ({ ...x, priorities: x.priorities.map((q, j) => (j === i ? { ...q, done: !q.done } : q)) }))}
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${p.done ? "border-accent-strong bg-accent-strong text-primary-foreground" : "border-border"}`}>{p.done && <Check className="h-4 w-4" />}</button>
              <input value={p.text} placeholder={`Priorité ${i + 1}`} onChange={(e) => set((x) => ({ ...x, priorities: x.priorities.map((q, j) => (j === i ? { ...q, text: e.target.value } : q)) }))}
                className={`${box} font-serif text-lg ${p.done ? "line-through text-muted-foreground" : ""}`} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Ce que j'ai fait aujourd'hui">
        <textarea value={d.log} onChange={(e) => set((x) => ({ ...x, log: e.target.value }))} rows={7} placeholder="Tâches réalisées, compétences apprises, observations…"
          className="lined w-full resize-y rounded-2xl border border-border bg-card px-4 font-serif text-lg outline-none focus:border-accent-strong" />
      </Card>

      <Card title="To-do du jour" right={<span className="eyebrow">{d.todos.filter((t) => t.done).length}/{d.todos.length}</span>}>
        <div className="space-y-2">
          {d.todos.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-card/70 px-3 py-2">
              <button aria-label="Cocher" onClick={() => set((x) => ({ ...x, todos: x.todos.map((y) => (y.id === t.id ? { ...y, done: !y.done } : y)) }))}
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${t.done ? "border-accent-strong bg-accent-strong text-primary-foreground" : "border-border"}`}>{t.done && <Check className="h-3.5 w-3.5" />}</button>
              <p className={`min-w-0 flex-1 truncate font-serif text-lg ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.label}</p>
              <button aria-label="Supprimer" onClick={() => set((x) => ({ ...x, todos: x.todos.filter((y) => y.id !== t.id) }))} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!todo.trim()) return; set((x) => ({ ...x, todos: [...x.todos, newTodo(todo.trim())] })); setTodo(""); }}>
          <input value={todo} onChange={(e) => setTodo(e.target.value)} placeholder="Ajouter une tâche…" className={`${box} rounded-full font-serif text-lg`} />
          <button aria-label="Ajouter" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="h-5 w-5" /></button>
        </form>
      </Card>

      <Card title="Plan pour demain">
        <textarea value={d.tomorrow} onChange={(e) => set((x) => ({ ...x, tomorrow: e.target.value }))} rows={4} placeholder="Objectifs, tâches et horaires de demain…" className={`${box} font-serif text-lg`} />
        {day < DAYS && (
          <button onClick={() => stage.update((st) => moveUnfinished(st, day))} className="mt-3 flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest">
            <ArrowRight className="h-4 w-4" />Reporter les tâches non faites à demain
          </button>
        )}
      </Card>

      <Card title="Planning 8h – 18h">
        <div className="space-y-1.5">
          {HOURS.map((h) => (
            <div key={h} className="flex items-center gap-2">
              <span className="eyebrow w-10 shrink-0">{h}h</span>
              <input value={d.schedule[h] ?? ""} onChange={(e) => set((x) => ({ ...x, schedule: { ...x.schedule, [h]: e.target.value } }))} className={`${box} py-1.5 text-sm`} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Notes & réflexions">
        <textarea value={d.notes} onChange={(e) => set((x) => ({ ...x, notes: e.target.value }))} rows={5} placeholder="Ce que je retiens, ce que je ressens…" className={`${box} font-serif text-lg`} />
      </Card>

      {showSum && <SummaryModal week={week} onClose={() => setShowSum(false)} />}
    </Page>
  );
}

function SummaryModal({ week, onClose }: { week: number; onClose: () => void }) {
  const [s] = stage.use();
  const [scope, setScope] = useState<"week" | "month">("week");
  const text = scope === "week" ? summary(s, (week - 1) * 7 + 1, week === 4 ? 30 : week * 7) : summary(s);
  const [copied, setCopied] = useState(false);
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-foreground/40 p-4" onClick={onClose}>
      <div className="glass flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl bg-background p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-planner text-2xl text-primary">Résumé</h2>
          <button aria-label="Fermer" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-3 flex gap-2">
          {(["week", "month"] as const).map((k) => (
            <button key={k} onClick={() => setScope(k)} className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-widest ${scope === k ? "bg-primary text-primary-foreground" : "border border-border"}`}>{k === "week" ? `Semaine ${week}` : "30 jours"}</button>
          ))}
        </div>
        <pre className="mt-3 flex-1 overflow-auto whitespace-pre-wrap rounded-2xl bg-card p-3 text-sm">{text}</pre>
        <button onClick={() => { void navigator.clipboard.writeText(text).then(() => setCopied(true)); }} className="mt-3 flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs uppercase tracking-widest text-primary-foreground">
          <Copy className="h-4 w-4" />{copied ? "Copié !" : "Copier"}
        </button>
      </div>
    </div>
  );
}
