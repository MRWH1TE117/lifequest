import { describe, expect, it } from "vitest";
import { buildAreaProgressRows, buildPeriodSummary, getPeriodRange } from "../../src/domain/periods";

describe("period ranges", () => {
  it("builds day, week, month, quarter, half-year, and year ranges", () => {
    expect(getPeriodRange("day", "2026-07-07")).toEqual({ start: "2026-07-07", end: "2026-07-07" });
    expect(getPeriodRange("week", "2026-07-07")).toEqual({ start: "2026-07-06", end: "2026-07-12" });
    expect(getPeriodRange("month", "2026-07-07")).toEqual({ start: "2026-07-01", end: "2026-07-31" });
    expect(getPeriodRange("quarter", "2026-07-07")).toEqual({ start: "2026-05-01", end: "2026-07-31" });
    expect(getPeriodRange("halfYear", "2026-07-07")).toEqual({ start: "2026-02-01", end: "2026-07-31" });
    expect(getPeriodRange("year", "2026-07-07")).toEqual({ start: "2025-08-01", end: "2026-07-31" });
  });
});

describe("area progress rows", () => {
  it("summarizes XP, completion count, and percentage for each life area", () => {
    const rows = buildAreaProgressRows("week", "2026-07-07", [
      { questId: "q1", completedAt: "2026-07-07T10:00:00.000Z", localDate: "2026-07-07", xpAwarded: 25, lifeStat: "Energia" },
      { questId: "q2", completedAt: "2026-07-08T10:00:00.000Z", localDate: "2026-07-08", xpAwarded: 25, lifeStat: "Energia" },
      { questId: "q3", completedAt: "2026-07-09T10:00:00.000Z", localDate: "2026-07-09", xpAwarded: 50, lifeStat: "Skupienie" },
      { questId: "old", completedAt: "2026-06-30T10:00:00.000Z", localDate: "2026-06-30", xpAwarded: 100, lifeStat: "Rozwoj" }
    ]);

    expect(rows.find((row) => row.stat === "Energia")).toMatchObject({ xp: 50, completed: 2, percent: 50 });
    expect(rows.find((row) => row.stat === "Skupienie")).toMatchObject({ xp: 50, completed: 1, percent: 50 });
    expect(rows.find((row) => row.stat === "Rozwoj")).toMatchObject({ xp: 0, completed: 0, percent: 0 });
  });
});

describe("period summary", () => {
  it("summarizes totals, best area, and weakest active area", () => {
    const summary = buildPeriodSummary("week", "2026-07-07", [
      { questId: "q1", completedAt: "2026-07-07T10:00:00.000Z", localDate: "2026-07-07", xpAwarded: 10, lifeStat: "Energia" },
      { questId: "q2", completedAt: "2026-07-08T10:00:00.000Z", localDate: "2026-07-08", xpAwarded: 50, lifeStat: "Skupienie" },
      { questId: "q3", completedAt: "2026-07-09T10:00:00.000Z", localDate: "2026-07-09", xpAwarded: 25, lifeStat: "Skupienie" },
      { questId: "old", completedAt: "2026-06-30T10:00:00.000Z", localDate: "2026-06-30", xpAwarded: 100, lifeStat: "Rozwoj" }
    ]);

    expect(summary.totalXp).toBe(85);
    expect(summary.completed).toBe(3);
    expect(summary.bestStat).toBe("Skupienie");
    expect(summary.weakestStat).toBe("Energia");
  });

  it("uses empty-state labels when there is no progress", () => {
    const summary = buildPeriodSummary("day", "2026-07-07", []);

    expect(summary.totalXp).toBe(0);
    expect(summary.completed).toBe(0);
    expect(summary.bestStat).toBe("Brak danych");
    expect(summary.weakestStat).toBe("Brak danych");
  });
});
