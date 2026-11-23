import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Droplets, RotateCcw, Salad, Dumbbell, Shuffle, Check } from "lucide-react";
import { Page, Card } from "@/components/ui-kit";
import { useStore, update } from "@/lib/store";
import { recipes, type Recipe } from "@/lib/content";

export const Route = createFileRoute("/health")({
  head: () => ({ meta: [
    { title: "Health — Eau, repas healthy & sport | Blessings" },
    { name: "description", content: "Suivi de l'hydratation, rappels healthy food et sport, idées de recettes saines." },
    { property: "og:title", content: "Health — Blessings" },
    { property: "og:description", content: "Hydratation, recettes healthy et sport du jour." },
  ] }),
  component: Health,
});

const tags: ("Tous" | Recipe["tag"])[] = ["Tous", "Petit-déj", "Déjeuner", "Dîner", "Snack"];

function Water() {
  const [s] = useStore();
  const w = s.water;
  const ml = w.glasses * w.glassMl;
  const pct = Math.min(100, Math.round((ml / w.goalMl) * 100));
  const hour = new Date().getHours();
  const expected = Math.min(1, Math.max(0, (hour - 8) / 13)) * w.goalMl;
  const set = (fn: (x: typeof w) => typeof w) => update((st) => ({ ...st, water: fn(st.water) }));
  return (
    <Card title="Drinking Water" right={<button onClick={() => set((x) => ({ ...x, glasses: 0 }))} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs uppercase tracking-widest text-secondary-foreground"><RotateCcw className="h-3.5 w-3.5" />Reset</button>}>
      <div className="flex items-center gap-5">
        <div className="relative h-32 w-20 overflow-hidden rounded-b-3xl rounded-t-lg border-2 border-accent-strong/50 bg-card/60">
          <div className="absolute inset-x-0 bottom-0 bg-accent-strong/70 transition-all" style={{ height: `${pct}%` }} />
          <Droplets className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-primary" />
        </div>
        <div>
          <p className="font-display text-4xl text-primary">{(ml / 1000).toFixed(2)} L</p>
          <p className="eyebrow mt-1">{w.glasses} verres · objectif {(w.goalMl / 1000).toFixed(1)} L</p>
          <p className="mt-2 font-serif italic text-muted-foreground">
            {ml >= w.goalMl ? "Objectif atteint, bravo ♡" : ml < expected - w.glassMl ? "Petit rappel : un verre d'eau ? 💧" : "Tu es dans le rythme ♡"}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => set((x) => ({ ...x, glasses: x.glasses + 1 }))} className="rounded-full bg-primary py-2.5 text-sm uppercase tracking-widest text-primary-foreground">+1 verre</button>
        <button onClick={() => set((x) => ({ ...x, glasses: Math.max(0, x.glasses - 1) }))} className="rounded-full border border-border py-2.5 text-sm uppercase tracking-widest">−1 verre</button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="eyebrow">Objectif</span>
        {[1500, 2000, 2500, 3000].map((g) => (
          <button key={g} onClick={() => set((x) => ({ ...x, goalMl: g }))} className={`rounded-full px-3 py-1 text-xs ${w.goalMl === g ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{g / 1000} L</button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="eyebrow">Verre</span>
        {[200, 250, 330].map((g) => (
          <button key={g} onClick={() => set((x) => ({ ...x, glassMl: g }))} className={`rounded-full px-3 py-1 text-xs ${w.glassMl === g ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{g} ml</button>
        ))}
      </div>
    </Card>
  );
}

function Reminder({ k, title, text, icon }: { k: "food" | "sport"; title: string; text: string; icon: React.ReactNode }) {
  const [s] = useStore();
  const done = s.health[k];
  return (
    <button onClick={() => update((st) => ({ ...st, health: { ...st.health, [k]: !st.health[k] } }))}
      className={`glass flex w-full items-center gap-4 rounded-3xl p-5 text-left transition ${done ? "ring-2 ring-accent-strong" : ""}`}>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-accent-strong">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl text-primary">{title}</p>
        <p className="font-serif italic text-muted-foreground">{text}</p>
      </div>
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${done ? "border-accent-strong bg-accent-strong text-primary-foreground" : "border-border"}`}>{done && <Check className="h-4 w-4" />}</span>
    </button>
  );
}

function Recipes() {
  const [tag, setTag] = useState<(typeof tags)[number]>("Tous");
  const [pick, setPick] = useState<Recipe | null>(null);
  const list = recipes.filter((r) => tag === "Tous" || r.tag === tag);
  return (
    <Card title="Healthy Recipes" right={
      <button onClick={() => setPick(list[Math.floor(Math.random() * list.length)] ?? null)} className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs uppercase tracking-widest text-primary-foreground"><Shuffle className="h-3.5 w-3.5" />Idée</button>}>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <button key={t} onClick={() => { setTag(t); setPick(null); }} className={`rounded-full px-3 py-1 text-xs ${tag === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{t}</button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {(pick ? [pick] : list).map((r) => (
          <div key={r.name} className="rounded-2xl bg-card/70 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-serif text-lg font-medium">{r.name}</p>
              <span className="eyebrow shrink-0 text-[10px]">{r.time}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{r.ingredients}</p>
          </div>
        ))}
        {pick && <button onClick={() => setPick(null)} className="eyebrow mt-1 underline">Voir toutes les recettes</button>}
      </div>
    </Card>
  );
}

function Health() {
  return (
    <Page eyebrow="Bien-être" title="Health." subtitle="Ton corps est une amana, prends-en soin.">
      <Water />
      <Reminder k="food" title="Healthy Food" text="Un repas équilibré aujourd'hui : légumes, protéines, fibres." icon={<Salad className="h-6 w-6" />} />
      <Reminder k="sport" title="Sport" text="Bouge au moins 20 min : marche, yoga ou séance." icon={<Dumbbell className="h-6 w-6" />} />
      <Recipes />
    </Page>
  );
}
