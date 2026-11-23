import { createPersisted, uid } from "@/lib/persisted";
import { dayKey } from "@/lib/store";

export type TxType = "income" | "expense";
export type Transaction = { id: string; type: TxType; label: string; amount: number; category: string; date: string; paid: boolean };
export type Bill = { id: string; label: string; amount: number; due: string; category: string; paid: boolean; paidAt?: string | undefined };
export type Goal = { id: string; label: string; target: number; saved: number };
export type Budget = { currency: string; categories: string[]; transactions: Transaction[]; bills: Bill[]; goals: Goal[] };

export const DEFAULT_CATEGORIES = ["Logement", "Alimentation", "Transport", "Shopping", "Factures", "Autre"];
export const INCOME_CATEGORY = "Revenu";
export const FALLBACK_CATEGORY = "Autre";
export const CURRENCIES = ["€", "$", "£", "MAD", "AED"];

const KEY = "blessings-budget-v1";

const initial = (): Budget => ({ currency: "€", categories: [...DEFAULT_CATEGORIES], transactions: [], bills: [], goals: [] });

const budget = createPersisted<Budget>(KEY, initial, (p) => {
  const base = initial();
  return {
    ...base,
    ...p,
    categories: [...new Set([...DEFAULT_CATEGORIES, ...(p.categories ?? [])])],
    transactions: p.transactions ?? [],
    bills: p.bills ?? [],
    goals: p.goals ?? [],
  };
});

export const useBudget = budget.use;
export const updateBudget = budget.update;
export { uid };

const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
const round2 = (x: number) => Math.round(x * 100) / 100;

// Paid expense transactions and paid bills, as dated amounts per category.
export function spending(b: Budget) {
  return [
    ...b.transactions.filter((t) => t.type === "expense" && t.paid).map((t) => ({ amount: t.amount, category: t.category, date: t.date })),
    ...b.bills.filter((x) => x.paid).map((x) => ({ amount: x.amount, category: x.category, date: x.paidAt ?? x.due })),
  ];
}

export function totals(b: Budget) {
  const income = round2(sum(b.transactions.filter((t) => t.type === "income" && t.paid).map((t) => t.amount)));
  const expenses = round2(sum(spending(b).map((x) => x.amount)));
  const savings = round2(sum(b.goals.map((g) => g.saved)));
  return { income, expenses, savings, balance: round2(income - expenses - savings) };
}

export function byCategory(b: Budget) {
  const map = new Map<string, number>();
  for (const x of spending(b)) map.set(x.category, (map.get(x.category) ?? 0) + x.amount);
  return [...map.entries()].map(([category, amount]) => ({ category, amount: round2(amount) })).sort((a, b) => b.amount - a.amount);
}

const mondayOf = (d: Date) => {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
};

// Income vs spending for the last `count` weeks (Mon→Sun) or months, oldest first.
export function trend(b: Budget, period: "week" | "month", count: number, now = new Date()) {
  const buckets = Array.from({ length: count }, (_, i) => {
    const back = count - 1 - i;
    if (period === "week") {
      const start = mondayOf(now);
      start.setDate(start.getDate() - back * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return { start: dayKey(start), end: dayKey(end), label: start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "") };
    }
    const start = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - back + 1, 1);
    return { start: dayKey(start), end: dayKey(end), label: start.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "") };
  });
  const spent = spending(b);
  const income = b.transactions.filter((t) => t.type === "income" && t.paid);
  return buckets.map(({ start, end, label }) => ({
    label,
    expenses: round2(sum(spent.filter((x) => x.date >= start && x.date < end).map((x) => x.amount))),
    income: round2(sum(income.filter((x) => x.date >= start && x.date < end).map((x) => x.amount))),
  }));
}

export const formatMoney = (amount: number, currency: string) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(amount)} ${currency}`;
