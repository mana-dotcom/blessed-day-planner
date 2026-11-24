import { createFileRoute, Link } from "@tanstack/react-router";
import { Moon, Sparkles, ListChecks, HandHeart, Droplets, BookOpen, SkipForward, Check, Sprout, Star } from "lucide-react";
import { Page, Card } from "@/components/ui-kit";
import { GardenBox } from "@/components/garden-box";
import { WeeklyCurve } from "@/components/weekly-curve";
import { useStore, progress, update } from "@/lib/store";
import { topicFor } from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Today's Blessings — Ma journée" },
    { name: "description", content: "Organisez vos prières, athkar, routines skincare et tâches du jour." },
    { property: "og:title", content: "Today's Blessings" },
    { property: "og:description", content: "Prières, athkar, skincare et journée en un seul endroit." },
  ] }),
  component: Index,
});

function Index() {
  const [s, ready] = useStore();
  const p = ready ? progress(s) : 0;
  const date = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const short = [
    { to: "/today", label: "Salat", icon: Moon, info: `${s.prayers.filter((x) => x.done).length}/${s.prayers.length}` },
    { to: "/today", label: "Athkar", icon: HandHeart, info: `${s.athkar.count}/${s.athkar.goal}` },
    { to: "/routines", label: "Routines", icon: Sparkles, info: `${[...s.morning, ...s.evening].filter((x) => x.done).length}/${s.morning.length + s.evening.length}` },
    { to: "/today", label: "Time Block", icon: ListChecks, info: `${s.blocks.filter((x) => x.done).length}/${s.blocks.length}` },
    { to: "/health", label: "Water", icon: Droplets, info: `${((s.water.glasses * s.water.glassMl) / 1000).toFixed(2)} L` },
    { to: "/study", label: "Study", icon: BookOpen, info: `${s.study.reduce((t, b) => t + b.spent, 0)} min` },
  ] as const;
  return (
    <Page eyebrow={date} title="Today's Blessings." subtitle={s.name ? `Bismillah, ${s.name} ♡` : "Un petit pas après l'autre ♡"}>
      <GardenBox />
      <Link to="/jeux" className="glass flex items-center gap-4 rounded-3xl p-5 transition hover:-translate-y-0.5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-accent-strong"><Sprout className="h-6 w-6" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl text-primary">Jeux</p>
          <p className="font-serif italic text-muted-foreground">Jardin cozy · Sudoku.exe</p>
        </div>
        <span className="eyebrow flex shrink-0 items-center gap-1"><Star className="h-3.5 w-3.5 fill-current" />{ready ? s.farm.stars : 0}</span>
      </Link>
      <section className="hero-card rounded-3xl p-6 text-primary-foreground">
        <p className="eyebrow !text-primary-foreground/80">Progression du jour</p>
        <div className="mt-2 flex items-end gap-3">
          <span className="font-display text-7xl leading-none">{p}%</span>
          <span className="pb-2 font-serif text-lg italic">{p === 100 ? "Alhamdulillah !" : "continue, tu brilles"}</span>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-primary-foreground/25">
          <div className="h-full rounded-full bg-primary-foreground transition-all" style={{ width: `${p}%` }} />
        </div>
      </section>
      <div className="grid grid-cols-2 gap-4">
        {short.map(({ to, label, icon: Icon, info }) => (
          <Link key={label} to={to} className="glass rounded-3xl p-5 transition hover:-translate-y-0.5">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-accent-strong"><Icon className="h-5 w-5" /></div>
            <p className="mt-4 font-display text-xl text-primary">{label}</p>
            <p className="eyebrow mt-1">{info}</p>
          </Link>
        ))}
      </div>
      <WeeklyCurve />
      <TopicCard />
      <Card><p className="font-serif text-lg italic text-muted-foreground">« Certes, avec la difficulté vient la facilité. » — 94:6</p></Card>
    </Page>
  );
}

function TopicCard() {
  const [s, ready] = useStore();
  const t = topicFor(new Date(), ready ? s.topic.offset : 0);
  const done = ready && s.topic.explored;
  return (
    <Card title="Sujet du jour" right={<span className="eyebrow">Islam</span>}>
      <p className="font-display text-2xl text-accent-strong">{t.title}</p>
      <p className="mt-1 font-serif text-lg italic text-muted-foreground">{t.hint}</p>
      <div className="mt-4 flex gap-2">
        <button onClick={() => update((st) => ({ ...st, topic: { ...st.topic, explored: !st.topic.explored } }))}
          className={`flex items-center gap-1 rounded-full px-4 py-2 text-xs uppercase tracking-widest ${done ? "bg-accent-strong text-primary-foreground" : "bg-primary text-primary-foreground"}`}>
          <Check className="h-4 w-4" />{done ? "Exploré" : "Marquer exploré"}
        </button>
        <button onClick={() => update((st) => ({ ...st, topic: { offset: st.topic.offset + 1, explored: false } }))}
          className="flex items-center gap-1 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest">
          <SkipForward className="h-4 w-4" />Suivant
        </button>
      </div>
    </Card>
  );
}
