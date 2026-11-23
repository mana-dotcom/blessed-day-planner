import { createFileRoute } from "@tanstack/react-router";
import { Sun, Moon } from "lucide-react";
import { Page, Card, CheckRow, AddInput } from "@/components/ui-kit";
import { useStore, update, newItem, type State } from "@/lib/store";

export const Route = createFileRoute("/routines")({
  head: () => ({ meta: [
    { title: "Routines skincare — Blessings" },
    { name: "description", content: "Routines skincare du matin et du soir, étapes personnalisables." },
    { property: "og:title", content: "Routines skincare — Blessings" },
    { property: "og:description", content: "Morning Glow et Evening Calm, à cocher chaque jour." },
  ] }),
  component: Routines,
});

function Routine({ k, title, icon }: { k: "morning" | "evening"; title: string; icon: React.ReactNode }) {
  const [s] = useStore();
  const list = s[k];
  const set = (fn: (l: State["morning"]) => State["morning"]) => update((st) => ({ ...st, [k]: fn(st[k]) }));
  return (
    <Card title={title} right={<span className="flex items-center gap-1 text-accent-strong">{icon}<span className="eyebrow">{list.filter((x) => x.done).length}/{list.length}</span></span>}>
      <div className="space-y-2">
        {list.map((it, i) => (
          <CheckRow key={it.id} label={it.label} sub={`Étape ${i + 1}`} done={it.done}
            onToggle={() => set((l) => l.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)))}
            onEdit={(v) => set((l) => l.map((x) => (x.id === it.id ? { ...x, label: v } : x)))}
            onDelete={() => set((l) => l.filter((x) => x.id !== it.id))} />
        ))}
      </div>
      <AddInput placeholder="Ajouter une étape…" onAdd={(v) => set((l) => [...l, newItem(v)])} />
    </Card>
  );
}

function Routines() {
  return (
    <Page eyebrow="Glow" title="Routines." subtitle="Prendre soin de soi est une forme de gratitude.">
      <Routine k="morning" title="Morning Routine" icon={<Sun className="h-5 w-5" />} />
      <Routine k="evening" title="Night Routine" icon={<Moon className="h-5 w-5" />} />
    </Page>
  );
}
