import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, Save, Footprints, Trash2 } from "lucide-react";
import { Card, CheckRow, AddInput } from "@/components/ui-kit";
import { useStore, update, newItem, dayKey } from "@/lib/store";

const QUICK = ["Marche", "Course", "Vélo", "Natation", "Pilates", "Musculation", "Danse"];
const fmt = (sec: number) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = sec % 60;
  const mmss = `${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}`;
  return h ? `${h}:${mmss}` : mmss;
};

export function SportsList() {
  const [s] = useStore();
  const add = (label: string, time = "") => update((st) => ({ ...st, sports: [...st.sports, { ...newItem(label), time }] }));
  return (
    <Card title="Sports">
      <div className="space-y-2">
        {s.sports.length === 0 && <p className="font-serif italic text-muted-foreground">Aucun sport pour l'instant.</p>}
        {[...s.sports].sort((x, y) => x.time.localeCompare(y.time)).map((b) => (
          <CheckRow key={b.id} label={b.label} sub={b.time || "Sans heure"} done={b.done}
            onToggle={() => update((st) => ({ ...st, sports: st.sports.map((x) => (x.id === b.id ? { ...x, done: !x.done } : x)),
              health: !b.done ? { ...st.health, sport: true } : st.health }))}
            onEdit={(v) => update((st) => ({ ...st, sports: st.sports.map((x) => (x.id === b.id ? { ...x, label: v } : x)) }))}
            onDelete={() => update((st) => ({ ...st, sports: st.sports.filter((x) => x.id !== b.id) }))} />
        ))}
      </div>
      <AddInput withTime placeholder="Ajouter un sport…" onAdd={add} />
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.filter((q) => !s.sports.some((x) => x.label === q)).map((q) => (
          <button key={q} onClick={() => add(q)} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">+ {q}</button>
        ))}
      </div>
    </Card>
  );
}

export function WalkTimer() {
  const [s, ready] = useStore();
  const t = s.walkTimer;
  const running = t.startedAt != null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = ready ? Math.floor((t.accumulated + (running ? Math.max(0, now - t.startedAt!) : 0)) / 1000) : 0;
  const setTimer = (walkTimer: typeof t) => update((st) => ({ ...st, walkTimer }));
  const today = dayKey();
  const todays = s.walks.filter((w) => w.day === today);
  const weekAgo = Date.now() - 7 * 864e5;
  const weekSec = s.walks.filter((w) => w.at >= weekAgo).reduce((a, w) => a + w.seconds, 0);

  const save = () => {
    if (elapsed < 1) return;
    update((st) => ({
      ...st,
      walks: [...st.walks, { id: newItem("").id, day: today, seconds: elapsed, at: Date.now() }].slice(-300),
      walkTimer: { startedAt: null, accumulated: 0 },
      sports: st.sports.map((x) => (x.label === "Marche" ? { ...x, done: true } : x)),
      health: { ...st.health, sport: true },
    }));
  };

  return (
    <Card title="Chrono Marche" right={<Footprints className="h-6 w-6 text-accent-strong" aria-hidden="true" />}>
      <div className="hero-card rounded-3xl py-6 text-center text-primary-foreground">
        <p className="font-display text-6xl leading-none tabular-nums" aria-live="off">{fmt(elapsed)}</p>
        <p className="eyebrow mt-2 !text-primary-foreground/80">{running ? "En marche…" : elapsed ? "En pause" : "Prête à marcher"}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button onClick={() => setTimer(running ? { startedAt: null, accumulated: t.accumulated + (Date.now() - t.startedAt!) } : { ...t, startedAt: Date.now() })}
          className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-xs uppercase tracking-widest text-primary-foreground">
          {running ? <><Pause className="h-4 w-4" />Pause</> : <><Play className="h-4 w-4" />{elapsed ? "Reprendre" : "Start"}</>}
        </button>
        <button onClick={() => setTimer({ startedAt: null, accumulated: 0 })} disabled={!elapsed}
          className="flex items-center justify-center gap-1.5 rounded-full border border-border py-2.5 text-xs uppercase tracking-widest disabled:opacity-40">
          <RotateCcw className="h-4 w-4" />Reset
        </button>
        <button onClick={save} disabled={!elapsed}
          className="flex items-center justify-center gap-1.5 rounded-full bg-accent-strong py-2.5 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-40">
          <Save className="h-4 w-4" />Enregistrer
        </button>
      </div>
      <div className="mt-4 flex justify-between gap-2">
        <p className="eyebrow">Aujourd'hui · {fmt(todays.reduce((a, w) => a + w.seconds, 0))}</p>
        <p className="eyebrow">7 jours · {fmt(weekSec)}</p>
      </div>
      {todays.length > 0 && (
        <ul className="mt-3 space-y-2">
          {[...todays].reverse().map((w) => (
            <li key={w.id} className="flex items-center gap-3 rounded-2xl bg-card/70 px-3 py-2">
              <Footprints className="h-4 w-4 text-accent-strong" aria-hidden="true" />
              <span className="flex-1 font-serif text-lg">{fmt(w.seconds)}</span>
              <span className="eyebrow text-[10px]">{new Date(w.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
              <button aria-label="Supprimer la session" onClick={() => update((st) => ({ ...st, walks: st.walks.filter((x) => x.id !== w.id) }))}
                className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
