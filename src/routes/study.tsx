import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Pause, Check, Trash2, Plus } from "lucide-react";
import { Page, Card } from "@/components/ui-kit";
import { useStore, update, newItem, type StudyBlock } from "@/lib/store";

export const Route = createFileRoute("/study")({
  head: () => ({ meta: [
    { title: "Study Time — 9rayti | Blessings" },
    { name: "description", content: "Planifie tes séances de révision par matière avec chronomètre intégré." },
    { property: "og:title", content: "Study Time — Blessings" },
    { property: "og:description", content: "Blocs de révision et chronomètre pour mieux étudier." },
  ] }),
  component: Study,
});

const fmt = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
const setBlocks = (fn: (l: StudyBlock[]) => StudyBlock[]) => update((st) => ({ ...st, study: fn(st.study) }));

function Timer({ blocks }: { blocks: StudyBlock[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sec, setSec] = useState(0);
  const active = blocks.find((b) => b.id === activeId);
  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(() => setSec((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [activeId]);
  const stop = () => {
    if (activeId && sec >= 60) setBlocks((l) => l.map((b) => (b.id === activeId ? { ...b, spent: b.spent + Math.floor(sec / 60) } : b)));
    setActiveId(null); setSec(0);
  };
  return (
    <section className="hero-card rounded-3xl p-6 text-center text-primary-foreground">
      <p className="eyebrow !text-primary-foreground/80">{active ? active.label : "Chronomètre"}</p>
      <p className="mt-2 font-display text-6xl leading-none">{fmt(sec)}</p>
      {active && <p className="mt-2 font-serif italic">objectif {active.minutes} min · déjà {active.spent} min</p>}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {activeId ? (
          <button onClick={stop} className="flex items-center gap-2 rounded-full bg-primary-foreground px-5 py-2.5 text-sm uppercase tracking-widest text-primary"><Pause className="h-4 w-4" />Stop</button>
        ) : blocks.filter((b) => !b.done).length === 0 ? (
          <p className="font-serif italic">Ajoute une séance ci-dessous pour démarrer.</p>
        ) : (
          blocks.filter((b) => !b.done).map((b) => (
            <button key={b.id} onClick={() => { setActiveId(b.id); setSec(0); }} className="flex items-center gap-1 rounded-full bg-primary-foreground/20 px-3 py-1.5 text-xs uppercase tracking-widest"><Play className="h-3.5 w-3.5" />{b.label}</button>
          ))
        )}
      </div>
    </section>
  );
}

function Study() {
  const [s] = useStore();
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState(45);
  const total = s.study.reduce((t, b) => t + b.spent, 0);
  return (
    <Page eyebrow="9rayti" title="Study Time." subtitle="« Rabbi zidni ilma » — Seigneur, accrois ma science.">
      <Timer blocks={s.study} />
      <Card title="Séances" right={<span className="eyebrow">{total} min étudiées</span>}>
        <div className="space-y-2">
          {s.study.length === 0 && <p className="font-serif italic text-muted-foreground">Aucune séance. Ajoute une matière ou une tâche.</p>}
          {s.study.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-card/70 px-3 py-3">
              <button aria-label="Terminer" onClick={() => setBlocks((l) => l.map((x) => (x.id === b.id ? { ...x, done: !x.done } : x)))}
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${b.done ? "border-accent-strong bg-accent-strong text-primary-foreground" : "border-border"}`}>{b.done && <Check className="h-4 w-4" />}</button>
              <div className="min-w-0 flex-1">
                <p className={`truncate font-serif text-lg ${b.done ? "text-muted-foreground line-through" : ""}`}>{b.label}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-accent-strong" style={{ width: `${Math.min(100, (b.done ? 100 : (b.spent / b.minutes) * 100))}%` }} />
                </div>
                <p className="eyebrow mt-1 text-[10px]">{b.spent}/{b.minutes} min</p>
              </div>
              <button aria-label="Supprimer" onClick={() => setBlocks((l) => l.filter((x) => x.id !== b.id))} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!label.trim()) return; setBlocks((l) => [...l, { ...newItem(label.trim()), minutes, spent: 0 }]); setLabel(""); }}>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Matière / tâche…" className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2.5 font-serif text-lg outline-none focus:border-accent-strong" />
          <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-20 shrink-0 rounded-full border border-border bg-card px-2 text-sm">
            {[25, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
          <button aria-label="Ajouter" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="h-5 w-5" /></button>
        </form>
      </Card>
    </Page>
  );
}
