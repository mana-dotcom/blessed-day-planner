import { describe, expect, it } from "vitest";
import { averages, dayMap, insights, overlapping, type CycleData } from "@/lib/cycle";

const data = (p: Partial<CycleData>): CycleData => ({ periods: [], logs: {}, cycleLength: 28, periodLength: 5, ...p });

describe("cycle predictions", () => {
  const c = data({
    periods: [
      { id: "a", start: "2026-09-01", end: "2026-09-05" },
      { id: "b", start: "2026-09-29", end: "2026-10-04" },
      { id: "c", start: "2026-10-29", end: "2026-11-02" },
    ],
  });

  it("averages measured cycle and period lengths", () => {
    expect(averages(c)).toEqual({ cycle: 29, period: 5, measured: 2 });
  });

  it("falls back to defaults without history", () => {
    expect(averages(data({ cycleLength: 30, periodLength: 4, periods: [{ id: "x", start: "2026-11-01" }] }))).toEqual({ cycle: 30, period: 4, measured: 0 });
  });

  it("computes cycle day, next period and fertile window", () => {
    const i = insights(c, "2026-11-23");
    expect(i.cycleDay).toBe(26);
    expect(i.nextStart).toBe("2026-11-27");
    expect(i.ovulation).toBe("2026-11-13");
    expect(i.fertile).toEqual({ start: "2026-11-08", end: "2026-11-14" });
    expect(i.phase).toBe("lutéale");
    expect(i.daysUntilNext).toBe(4);
  });

  it("flags late periods and ongoing open periods", () => {
    expect(insights(c, "2026-11-30").phase).toBe("retard");
    const open = data({ periods: [{ id: "o", start: "2026-11-21" }] });
    expect(insights(open, "2026-11-23").ongoing?.id).toBe("o");
    expect(insights(open, "2026-11-23").phase).toBe("règles");
  });

  it("marks logged, predicted and fertile days", () => {
    const m = dayMap(c, "2026-11-23");
    expect(m.get("2026-11-01")?.period).toBe(true);
    expect(m.get("2026-11-13")).toMatchObject({ fertile: true, ovulation: true });
    expect(m.get("2026-11-27")?.predicted).toBe(true);
    expect(m.get("2026-12-01")?.predicted).toBe(true);
    expect(m.get("2026-12-02")?.predicted).toBeFalsy();
  });

  it("detects overlapping periods", () => {
    expect(overlapping(c, "2026-10-02", undefined)?.id).toBe("b");
    expect(overlapping(c, "2026-11-20", "2026-11-24")).toBeUndefined();
    expect(overlapping(c, "2026-10-30", "2026-11-03", "c")).toBeUndefined();
  });
});
