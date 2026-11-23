import { createFileRoute, Link } from "@tanstack/react-router";
import { Moon, Sparkles, ListChecks, HandHeart } from "lucide-react";
import { Page, Card } from "@/components/ui-kit";
import { useStore, progress } from "@/lib/store";

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
    { to: "/today", label: "Salat", icon: Moon, info: `${s.prayers.filter((x) => x.done).length}/5` },
    { to: "/today", label: "Athkar", icon: HandHeart, info: `${s.athkar.count}/${s.athkar.goal}` },
    { to: "/routines", label: "Routines", icon: Sparkles, info: `${[...s.morning, ...s.evening].filter((x) => x.done).length}/${s.morning.length + s.evening.length}` },
    { to: "/today", label: "Time Block", icon: ListChecks, info: `${s.blocks.filter((x) => x.done).length}/${s.blocks.length}` },
  ] as const;
  return (
    <Page eyebrow={date} title="Today's Blessings." subtitle={s.name ? `Bismillah, ${s.name} ♡` : "Un petit pas après l'autre ♡"}>
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
      <Card><p className="font-serif text-lg italic text-muted-foreground">« Certes, avec la difficulté vient la facilité. » — 94:6</p></Card>
    </Page>
  );
}
