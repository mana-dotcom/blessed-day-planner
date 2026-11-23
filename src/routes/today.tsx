import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Check } from "lucide-react";
import { Page, Card, CheckRow, AddInput } from "@/components/ui-kit";
import { useStore, update, newItem } from "@/lib/store";

export const Route = createFileRoute("/today")({
  head: () => ({ meta: [
    { title: "Today — Salat, Athkar & Time Block" },
    { name: "description", content: "Suivez vos 5 prières, vos athkar et vos blocs de temps du jour." },
    { property: "og:title", content: "Today — Salat, Athkar & Time Block" },
    { property: "og:description", content: "Prières, compteur d'athkar et tâches du jour." },
  ] }),
  component: Today,
});

function Today() {
  const [s] = useStore();
  const a = s.athkar;
  const resetBtn = (fn: () => void) => (
    <button onClick={fn} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs uppercase tracking-widest text-secondary-foreground"><RotateCcw className="h-3.5 w-3.5" />Reset</button>
  );
  return (
    <Page eyebrow="Aujourd'hui" title="Today." subtitle="Ta journée, avec intention.">
      <Card title="Salat" right={resetBtn(() => update((st) => ({ ...st, prayers: st.prayers.map((p) => ({ ...p, done: false })) })))}>
        <div className="space-y-2">
          {s.prayers.map((p) => (
            <CheckRow key={p.name} label={p.name} sub={p.time} done={p.done}
              onToggle={() => update((st) => ({ ...st, prayers: st.prayers.map((x) => (x.name === p.name ? { ...x, done: !x.done } : x)) }))} />
          ))}
        </div>
      </Card>

      <Card title="Athkar" right={resetBtn(() => update((st) => ({ ...st, athkar: { ...st.athkar, count: 0, done: false } })))}>
        <div className="flex flex-col items-center">
          <button onClick={() => update((st) => ({ ...st, athkar: { ...st.athkar, count: st.athkar.count + 1 } }))}
            className="hero-card grid h-40 w-40 place-items-center rounded-full text-primary-foreground transition active:scale-95" aria-label="+1">
            <span><span className="block font-display text-6xl leading-none">{a.count}</span><span className="eyebrow !text-primary-foreground/80">+1 · / {a.goal}</span></span>
          </button>
          <div className="mt-4 flex gap-2">
            {[33, 99, 100].map((g) => (
              <button key={g} onClick={() => update((st) => ({ ...st, athkar: { ...st.athkar, goal: g } }))}
                className={`rounded-full px-3 py-1 text-xs ${a.goal === g ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{g}</button>
            ))}
          </div>
          <button onClick={() => update((st) => ({ ...st, athkar: { ...st.athkar, done: !st.athkar.done } }))}
            className={`mt-4 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm uppercase tracking-widest ${a.done ? "bg-accent-strong text-primary-foreground" : "border border-border"}`}>
            <Check className="h-4 w-4" />{a.done ? "Validé" : "Valider"}
          </button>
        </div>
      </Card>

      <Card title="Time Block">
        <div className="space-y-2">
          {s.blocks.length === 0 && <p className="font-serif italic text-muted-foreground">Aucun bloc pour l'instant.</p>}
          {[...s.blocks].sort((x, y) => x.time.localeCompare(y.time)).map((b) => (
            <CheckRow key={b.id} label={b.label} sub={b.time || "Sans heure"} done={b.done}
              onToggle={() => update((st) => ({ ...st, blocks: st.blocks.map((x) => (x.id === b.id ? { ...x, done: !x.done } : x)) }))}
              onDelete={() => update((st) => ({ ...st, blocks: st.blocks.filter((x) => x.id !== b.id) }))} />
          ))}
        </div>
        <AddInput withTime placeholder="Ajouter une tâche…" onAdd={(v, time) => update((st) => ({ ...st, blocks: [...st.blocks, { ...newItem(v), time }] }))} />
      </Card>
    </Page>
  );
}
