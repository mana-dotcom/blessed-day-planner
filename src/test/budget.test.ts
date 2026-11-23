import { describe, expect, it } from "vitest";
import { totals, byCategory, trend, type Budget } from "@/lib/budget";

const budget = (p: Partial<Budget>): Budget => ({ currency: "€", categories: [], transactions: [], bills: [], goals: [], ...p });

describe("budget calculations", () => {
  const b = budget({
    transactions: [
      { id: "1", type: "income", label: "Salaire", amount: 2000, category: "Revenu", date: "2026-11-02", paid: true },
      { id: "2", type: "expense", label: "Courses", amount: 120.5, category: "Alimentation", date: "2026-11-10", paid: true },
      { id: "3", type: "expense", label: "Taxi", amount: 30, category: "Transport", date: "2026-11-11", paid: false },
    ],
    bills: [
      { id: "b1", label: "Loyer", amount: 800, due: "2026-11-05", category: "Logement", paid: true, paidAt: "2026-11-04" },
      { id: "b2", label: "Internet", amount: 40, due: "2026-12-01", category: "Factures", paid: false },
    ],
    goals: [{ id: "g1", label: "Voyage", target: 1000, saved: 250 }],
  });

  it("counts only paid transactions and bills, and subtracts savings from the balance", () => {
    expect(totals(b)).toEqual({ income: 2000, expenses: 920.5, savings: 250, balance: 829.5 });
  });

  it("groups paid spending by category, largest first", () => {
    expect(byCategory(b)).toEqual([
      { category: "Logement", amount: 800 },
      { category: "Alimentation", amount: 120.5 },
    ]);
  });

  it("buckets spending and income by month", () => {
    const data = trend(b, "month", 2, new Date(2026, 11, 15));
    expect(data.map((d) => [d.expenses, d.income])).toEqual([[920.5, 2000], [0, 0]]);
  });
});
