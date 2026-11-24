import { describe, it, expect } from "vitest";
import { moveUnfinished, getDay } from "@/lib/stage";
import { stepSurah } from "@/lib/quran";

describe("stage planner", () => {
  it("moves only unfinished tasks to the next day", () => {
    const s = { days: { 3: { ...getDay({ days: {} }, 3), todos: [{ id: "a", label: "A", done: true }, { id: "b", label: "B", done: false }] } } };
    const r = moveUnfinished(s, 3);
    expect(getDay(r, 3).todos.map((t) => t.id)).toEqual(["a"]);
    expect(getDay(r, 4).todos.map((t) => t.id)).toEqual(["b"]);
  });
  it("does not move past day 30", () => {
    const s = { days: { 30: { ...getDay({ days: {} }, 30), todos: [{ id: "b", label: "B", done: false }] } } };
    expect(moveUnfinished(s, 30)).toBe(s);
  });
});
describe("quran", () => {
  it("wraps surahs", () => { expect(stepSurah(114, 1)).toBe(1); expect(stepSurah(1, -1)).toBe(114); });
});
