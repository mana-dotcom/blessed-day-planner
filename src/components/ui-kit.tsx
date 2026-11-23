import { Link } from "@tanstack/react-router";
import { Home, Sparkles, CalendarHeart, User, Check, Trash2, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

export function Page({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-xl px-5 pb-32 pt-10">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 font-display text-5xl leading-none text-primary">{title}</h1>
      {subtitle && <p className="mt-3 font-serif text-xl italic text-muted-foreground">{subtitle}</p>}
      <div className="mt-5 h-px w-16 bg-border" />
      <div className="mt-6 space-y-5">{children}</div>
      <BottomNav />
    </div>
  );
}

export function Card({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="glass rounded-3xl p-5">
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-primary">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function CheckRow({ label, sub, done, onToggle, onDelete }: { label: string; sub?: string; done: boolean; onToggle: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card/70 px-3 py-3">
      <button aria-label={done ? "Décocher" : "Cocher"} onClick={onToggle}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition ${done ? "border-accent-strong bg-accent-strong text-primary-foreground" : "border-border"}`}>
        {done && <Check className="h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-serif text-lg ${done ? "text-muted-foreground line-through" : ""}`}>{label}</p>
        {sub && <p className="eyebrow text-[10px]">{sub}</p>}
      </div>
      {onDelete && (
        <button aria-label="Supprimer" onClick={onDelete} className="shrink-0 p-2 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function AddInput({ placeholder, onAdd, withTime }: { placeholder: string; onAdd: (v: string, time: string) => void; withTime?: boolean }) {
  const [v, setV] = useState("");
  const [t, setT] = useState("");
  return (
    <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!v.trim()) return; onAdd(v.trim(), t); setV(""); setT(""); }}>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder}
        className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2.5 font-serif text-lg outline-none focus:border-accent-strong" />
      {withTime && <input type="time" value={t} onChange={(e) => setT(e.target.value)} className="w-24 shrink-0 rounded-full border border-border bg-card px-2 text-sm" />}
      <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Ajouter"><Plus className="h-5 w-5" /></button>
    </form>
  );
}

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/routines", label: "Routines", icon: Sparkles },
  { to: "/today", label: "Today", icon: CalendarHeart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function BottomNav() {
  return (
    <nav className="glass fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md justify-around rounded-full p-2">
      {tabs.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} activeOptions={{ exact: true }}
          className="flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[11px] uppercase tracking-widest text-muted-foreground"
          activeProps={{ className: "bg-primary !text-primary-foreground" }}>
          <Icon className="h-5 w-5" />{label}
        </Link>
      ))}
    </nav>
  );
}
