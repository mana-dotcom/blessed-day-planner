import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Check, Pencil, Plus, Trash2, X, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { Page, Card } from "@/components/ui-kit";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { dayKey } from "@/lib/store";
import {
  useBudget, updateBudget, uid, totals, byCategory, trend, formatMoney,
  CURRENCIES, DEFAULT_CATEGORIES, FALLBACK_CATEGORY, INCOME_CATEGORY,
  type Budget, type Transaction, type TxType, type Bill, type Goal,
} from "@/lib/budget";

export const Route = createFileRoute("/budget")({
  head: () => ({ meta: [
    { title: "Budget Tracker — Blessings" },
    { name: "description", content: "Revenus, dépenses, factures à venir et objectifs d'épargne." },
    { property: "og:title", content: "Budget Tracker — Blessings" },
    { property: "og:description", content: "Suis ton budget en douceur : dépenses, factures et épargne." },
  ] }),
  component: BudgetPage,
});

const PALETTE = [
  "oklch(0.42 0.12 5)", "oklch(0.66 0.15 5)", "oklch(0.8 0.09 10)", "oklch(0.55 0.13 340)",
  "oklch(0.72 0.1 35)", "oklch(0.88 0.04 10)", "oklch(0.6 0.09 315)", "oklch(0.5 0.08 25)",
];
const colorFor = (b: Budget, category: string) => {
  const i = b.categories.indexOf(category);
  return PALETTE[(i < 0 ? b.categories.length : i) % PALETTE.length] ?? "var(--accent-strong)";
};

const field = "min-w-0 rounded-full border border-border bg-card px-4 py-2.5 font-serif text-lg outline-none focus:border-accent-strong";
const small = "min-w-0 rounded-full border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent-strong";
const pill = (on: boolean) => `rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest transition ${on ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`;
const parseAmount = (v: string) => Math.round(parseFloat(v.replace(",", ".")) * 100) / 100;
const shortDate = (k: string) => new Date(k + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
const daysUntil = (k: string) => Math.round((new Date(k + "T12:00").getTime() - new Date(dayKey() + "T12:00").getTime()) / 86400000);

function Summary({ b }: { b: Budget }) {
  const t = totals(b);
  const cards = [
    { label: "Revenus", value: t.income, icon: TrendingUp },
    { label: "Dépenses", value: t.expenses, icon: TrendingDown },
    { label: "Épargne", value: t.savings, icon: PiggyBank },
  ];
  return (
    <>
      <section className="hero-card rounded-3xl p-6 text-primary-foreground">
        <p className="eyebrow !text-primary-foreground/80">Solde total</p>
        <p className="mt-2 font-display text-5xl leading-none">{formatMoney(t.balance, b.currency)}</p>
        <p className="mt-2 font-serif text-lg italic">revenus − dépenses − épargne</p>
      </section>
      <div className="grid grid-cols-3 gap-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass rounded-3xl p-4">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-accent-strong"><Icon className="h-4 w-4" /></div>
            <p className="eyebrow mt-3 !text-[9px] !tracking-[0.2em]">{label}</p>
            <p className="mt-1 truncate font-display text-lg text-primary sm:text-xl">{formatMoney(value, b.currency)}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function Overview({ b }: { b: Budget }) {
  const data = byCategory(b);
  const total = data.reduce((s, x) => s + x.amount, 0);
  const [name, setName] = useState("");
  const config = Object.fromEntries(data.map((d) => [d.category, { label: d.category, color: colorFor(b, d.category) }])) satisfies ChartConfig;
  const addCategory = (e: FormEvent) => {
    e.preventDefault();
    const c = name.trim();
    if (!c || b.categories.some((x) => x.toLowerCase() === c.toLowerCase())) return;
    updateBudget((s) => ({ ...s, categories: [...s.categories, c] }));
    setName("");
  };
  const removeCategory = (c: string) => updateBudget((s) => ({
    ...s,
    categories: s.categories.filter((x) => x !== c),
    transactions: s.transactions.map((t) => (t.category === c ? { ...t, category: FALLBACK_CATEGORY } : t)),
    bills: s.bills.map((x) => (x.category === c ? { ...x, category: FALLBACK_CATEGORY } : x)),
  }));
  return (
    <Card title="Répartition" right={<span className="eyebrow">par catégorie</span>}>
      {data.length === 0 ? (
        <p className="font-serif italic text-muted-foreground">Ajoute une dépense pour voir la répartition.</p>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="relative h-40 w-40 shrink-0">
            <ChartContainer config={config} className="aspect-square h-40 w-40">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(v, n) => `${n} · ${formatMoney(Number(v), b.currency)}`} />} />
                <Pie data={data} dataKey="amount" nameKey="category" innerRadius={48} outerRadius={72} paddingAngle={2} strokeWidth={0} isAnimationActive={false}>
                  {data.map((d) => <Cell key={d.category} fill={colorFor(b, d.category)} />)}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div><p className="eyebrow !text-[8px]">Total</p><p className="font-display text-base text-primary">{formatMoney(total, b.currency)}</p></div>
            </div>
          </div>
          <div className="w-full space-y-2">
            {data.map((d) => (
              <div key={d.category}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-2 font-serif text-lg"><span className="h-2.5 w-2.5 rounded-full" style={{ background: colorFor(b, d.category) }} />{d.category}</span>
                  <span className="eyebrow">{formatMoney(d.amount, b.currency)} · {Math.round((d.amount / total) * 100)}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full" style={{ width: `${(d.amount / total) * 100}%`, background: colorFor(b, d.category) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-5 border-t border-border/60 pt-4">
        <p className="eyebrow text-[10px]">Catégories</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {b.categories.map((c) => (
            <span key={c} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: colorFor(b, c) }} />{c}
              {!DEFAULT_CATEGORIES.includes(c) && (
                <button aria-label={`Supprimer ${c}`} onClick={() => removeCategory(c)} className="-mr-1 p-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
              )}
            </span>
          ))}
        </div>
        <form className="mt-3 flex gap-2" onSubmit={addCategory}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle catégorie…" maxLength={24} className={`${field} flex-1`} />
          <button aria-label="Ajouter la catégorie" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="h-5 w-5" /></button>
        </form>
      </div>
    </Card>
  );
}

const trendConfig = {
  expenses: { label: "Dépenses", color: "var(--accent-strong)" },
  income: { label: "Revenus", color: "var(--primary)" },
} satisfies ChartConfig;

function Trend({ b }: { b: Budget }) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const data = trend(b, period, period === "week" ? 8 : 6);
  return (
    <Card title="Tendance" right={
      <div className="flex gap-1">
        <button onClick={() => setPeriod("week")} className={pill(period === "week")}>Semaines</button>
        <button onClick={() => setPeriod("month")} className={pill(period === "month")}>Mois</button>
      </div>}>
      <ChartContainer config={trendConfig} className="aspect-auto h-48 w-full">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="spend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-expenses)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-expenses)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={10} />
          <YAxis tickLine={false} axisLine={false} width={44} fontSize={10} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent formatter={(v, n) => `${trendConfig[n as keyof typeof trendConfig]?.label ?? n} · ${formatMoney(Number(v), b.currency)}`} />} />
          <Area type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" isAnimationActive={false} />
          <Area type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2.5} fill="url(#spend-fill)" dot={{ r: 3, fill: "var(--color-expenses)" }} isAnimationActive={false} />
        </AreaChart>
      </ChartContainer>
      <p className="eyebrow mt-2 text-[10px]">Dépenses payées (trait plein) et revenus (pointillés).</p>
    </Card>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button aria-label={label} onClick={onClick}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition ${on ? "border-accent-strong bg-accent-strong text-primary-foreground" : "border-border"}`}>
      {on && <Check className="h-4 w-4" />}
    </button>
  );
}

function Transactions({ b }: { b: Budget }) {
  const blank = { type: "expense" as TxType, label: "", amount: "", category: b.categories[1] ?? FALLBACK_CATEGORY, date: dayKey() };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | TxType>("all");
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));
  const reset = () => { setForm(blank); setEditing(null); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const amount = parseAmount(form.amount);
    if (!form.label.trim() || !(amount > 0)) return;
    const data = { type: form.type, label: form.label.trim(), amount, date: form.date || dayKey(), category: form.type === "income" ? INCOME_CATEGORY : form.category };
    updateBudget((s) => ({
      ...s,
      transactions: editing
        ? s.transactions.map((t) => (t.id === editing ? { ...t, ...data } : t))
        : [...s.transactions, { id: uid(), paid: true, ...data }],
    }));
    reset();
  };
  const edit = (t: Transaction) => {
    setEditing(t.id);
    setForm({ type: t.type, label: t.label, amount: String(t.amount), category: t.type === "income" ? blank.category : t.category, date: t.date });
  };
  const patch = (id: string, p: Partial<Transaction>) => updateBudget((s) => ({ ...s, transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...p } : t)) }));
  const list = [...b.transactions].filter((t) => filter === "all" || t.type === filter).sort((x, y) => y.date.localeCompare(x.date));

  return (
    <Card title="Transactions" right={<span className="eyebrow">{b.transactions.length}</span>}>
      <form onSubmit={submit} className="space-y-2 rounded-2xl bg-card/60 p-3">
        <div className="flex gap-1">
          <button type="button" onClick={() => set({ type: "expense" })} className={pill(form.type === "expense")}>Dépense</button>
          <button type="button" onClick={() => set({ type: "income" })} className={pill(form.type === "income")}>Revenu</button>
          {editing && <button type="button" onClick={reset} className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">Annuler</button>}
        </div>
        <div className="flex gap-2">
          <input value={form.label} onChange={(e) => set({ label: e.target.value })} placeholder={form.type === "income" ? "Salaire, cadeau…" : "Courses, taxi…"} className={`${field} flex-1`} />
          <input value={form.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0" inputMode="decimal" aria-label="Montant" className={`${field} w-24 shrink-0`} />
        </div>
        <div className="flex gap-2">
          {form.type === "expense" && (
            <select value={form.category} onChange={(e) => set({ category: e.target.value })} aria-label="Catégorie" className={`${small} flex-1`}>
              {b.categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          )}
          <input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} aria-label="Date" className={`${small} w-36 shrink-0`} />
          <button aria-label={editing ? "Enregistrer" : "Ajouter"} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            {editing ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </button>
        </div>
      </form>
      <div className="mt-4 flex gap-1">
        {([["all", "Tout"], ["income", "Revenus"], ["expense", "Dépenses"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={pill(filter === k)}>{l}</button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {list.length === 0 && <p className="font-serif italic text-muted-foreground">Aucune transaction pour l'instant.</p>}
        {list.map((t) => (
          <div key={t.id} className={`flex items-center gap-3 rounded-2xl bg-card/70 px-3 py-3 ${editing === t.id ? "ring-2 ring-accent-strong" : ""}`}>
            <Toggle on={t.paid} onClick={() => patch(t.id, { paid: !t.paid })} label={t.paid ? "Marquer en attente" : "Marquer payé"} />
            <div className="min-w-0 flex-1">
              <p className={`truncate font-serif text-lg ${t.paid ? "" : "text-muted-foreground"}`}>{t.label}</p>
              <p className="eyebrow truncate !tracking-[0.15em] text-[10px]">{t.category} · {shortDate(t.date)}</p>
              {!t.paid && <p className="eyebrow !tracking-[0.15em] text-[10px] !text-accent-strong">en attente</p>}
            </div>
            <span className={`shrink-0 font-display text-base ${t.type === "income" ? "text-primary" : "text-accent-strong"}`}>
              {t.type === "income" ? "+" : "−"}{formatMoney(t.amount, b.currency)}
            </span>
            <button aria-label="Modifier" onClick={() => edit(t)} className="shrink-0 p-1.5 text-muted-foreground hover:text-accent-strong"><Pencil className="h-4 w-4" /></button>
            <button aria-label="Supprimer" onClick={() => { updateBudget((s) => ({ ...s, transactions: s.transactions.filter((x) => x.id !== t.id) })); if (editing === t.id) reset(); }}
              className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function dueLabel(x: Bill) {
  if (x.paid) return `payée${x.paidAt ? ` le ${shortDate(x.paidAt)}` : ""}`;
  const d = daysUntil(x.due);
  if (d < 0) return `en retard de ${-d} j`;
  if (d === 0) return "aujourd'hui";
  return `dans ${d} j`;
}

function Bills({ b }: { b: Budget }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState(dayKey());
  const [category, setCategory] = useState("Factures");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const a = parseAmount(amount);
    if (!label.trim() || !(a > 0) || !due) return;
    updateBudget((s) => ({ ...s, bills: [...s.bills, { id: uid(), label: label.trim(), amount: a, due, category, paid: false }] }));
    setLabel(""); setAmount("");
  };
  const list = [...b.bills].sort((x, y) => Number(x.paid) - Number(y.paid) || x.due.localeCompare(y.due));
  const pending = b.bills.filter((x) => !x.paid).reduce((s, x) => s + x.amount, 0);
  return (
    <Card title="Factures" right={<span className="eyebrow">{formatMoney(pending, b.currency)} à payer</span>}>
      <div className="space-y-2">
        {list.length === 0 && <p className="font-serif italic text-muted-foreground">Aucune facture prévue.</p>}
        {list.map((x) => {
          const late = !x.paid && daysUntil(x.due) < 0;
          return (
            <div key={x.id} className="flex items-center gap-3 rounded-2xl bg-card/70 px-3 py-3">
              <Toggle on={x.paid} label={x.paid ? "Marquer non payée" : "Marquer payée"}
                onClick={() => updateBudget((s) => ({ ...s, bills: s.bills.map((y) => (y.id === x.id ? { ...y, paid: !y.paid, paidAt: y.paid ? undefined : dayKey() } : y)) }))} />
              <div className="min-w-0 flex-1">
                <p className={`truncate font-serif text-lg ${x.paid ? "text-muted-foreground line-through" : ""}`}>{x.label}</p>
                <p className="eyebrow truncate !tracking-[0.15em] text-[10px]">{x.category} · {shortDate(x.due)}</p>
                <p className={`eyebrow !tracking-[0.15em] text-[10px] ${late ? "!text-destructive" : "!text-accent-strong"}`}>{dueLabel(x)}</p>
              </div>
              <span className="shrink-0 font-display text-base text-primary">{formatMoney(x.amount, b.currency)}</span>
              <button aria-label="Supprimer" onClick={() => updateBudget((s) => ({ ...s, bills: s.bills.filter((y) => y.id !== x.id) }))}
                className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
      <form onSubmit={submit} className="mt-3 space-y-2">
        <div className="flex gap-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Loyer, internet…" className={`${field} flex-1`} />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" inputMode="decimal" aria-label="Montant" className={`${field} w-24 shrink-0`} />
        </div>
        <div className="flex gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Catégorie" className={`${small} flex-1`}>
            {b.categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Échéance" className={`${small} w-36 shrink-0`} />
          <button aria-label="Ajouter la facture" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="h-5 w-5" /></button>
        </div>
      </form>
    </Card>
  );
}

function GoalRow({ g, currency }: { g: Goal; currency: string }) {
  const [custom, setCustom] = useState("");
  const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
  const deposit = (a: number) => updateBudget((s) => ({ ...s, goals: s.goals.map((x) => (x.id === g.id ? { ...x, saved: Math.max(0, Math.round((x.saved + a) * 100) / 100) } : x)) }));
  return (
    <div className="rounded-2xl bg-card/70 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-serif text-xl">{g.label}</p>
          <p className="eyebrow text-[10px]">{formatMoney(g.saved, currency)} / {formatMoney(g.target, currency)}</p>
        </div>
        <span className="font-display text-2xl text-accent-strong">{Math.round(pct)}%</span>
        <button aria-label="Supprimer l'objectif" onClick={() => updateBudget((s) => ({ ...s, goals: s.goals.filter((x) => x.id !== g.id) }))}
          className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-accent-strong transition-all" style={{ width: `${pct}%` }} />
      </div>
      {pct >= 100 && <p className="mt-2 font-serif italic text-accent-strong">Objectif atteint, alhamdulillah ♡</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {[10, 50, 100].map((a) => (
          <button key={a} onClick={() => deposit(a)} className="rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">+{a}</button>
        ))}
        <form className="ml-auto flex gap-1" onSubmit={(e) => { e.preventDefault(); const a = parseAmount(custom); if (a) { deposit(a); setCustom(""); } }}>
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Montant" inputMode="decimal" aria-label="Montant à déposer" className={`${small} w-24`} />
          <button aria-label="Déposer" className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="h-4 w-4" /></button>
        </form>
      </div>
    </div>
  );
}

function Goals({ b }: { b: Budget }) {
  const [label, setLabel] = useState("");
  const [target, setTarget] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = parseAmount(target);
    if (!label.trim() || !(t > 0)) return;
    updateBudget((s) => ({ ...s, goals: [...s.goals, { id: uid(), label: label.trim(), target: t, saved: 0 }] }));
    setLabel(""); setTarget("");
  };
  return (
    <Card title="Objectifs d'épargne">
      <div className="space-y-3">
        {b.goals.length === 0 && <p className="font-serif italic text-muted-foreground">Fixe un objectif : voyage, omra, fonds d'urgence…</p>}
        {b.goals.map((g) => <GoalRow key={g.id} g={g} currency={b.currency} />)}
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nouvel objectif…" className={`${field} flex-1`} />
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Cible" inputMode="decimal" aria-label="Montant cible" className={`${field} w-24 shrink-0`} />
        <button aria-label="Ajouter l'objectif" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="h-5 w-5" /></button>
      </form>
    </Card>
  );
}

function BudgetPage() {
  const [b, ready] = useBudget();
  return (
    <Page eyebrow="Budget" title="Budget Tracker." subtitle="Dépense avec intention, épargne avec barakah.">
      <div className="flex items-center justify-end gap-2">
        <span className="eyebrow text-[10px]">Devise</span>
        <select value={b.currency} onChange={(e) => updateBudget((s) => ({ ...s, currency: e.target.value }))} aria-label="Devise" className={small}>
          {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      {ready && (
        <>
          <Summary b={b} />
          <Overview b={b} />
          <Trend b={b} />
          <Transactions b={b} />
          <Bills b={b} />
          <Goals b={b} />
        </>
      )}
    </Page>
  );
}
