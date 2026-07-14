import { describe, expect, it } from "vitest";
import {
  activateExperiment,
  buildExperimentSummary,
  getExperimentEndDate,
  isExperimentScheduledForDate,
  normalizeExperiments,
  validateExperiment
} from "../../src/domain/experiments";
import type { DevelopmentExperiment, Habit } from "../../src/domain/model";

const now = "2026-07-14T08:00:00.000Z";
const habit: Habit = {
  id: "h1", title: "Czytanie", description: "Czytam rozdział.", category: "Rozwoj", pillar: "learning",
  pack: "test", trackKey: "h1", type: "habit", difficulty: "normal", estimatedMinutes: 20,
  frequency: "daily", xp: 20, enabled: true, sourceName: "Test", sourceUrl: "", sourceNote: "Test",
  expectedEffect: "Test", minimumVersion: "Jedna strona", createdAt: now
};

function experiment(overrides: Partial<DevelopmentExperiment> = {}): DevelopmentExperiment {
  return {
    id: "e1", sourceKind: "habit", linkedHabitId: "h1", title: "Czytanie rano", description: "Czytam rozdział",
    lifeStat: "Rozwoj", startDate: "2026-07-13", durationDays: 7, scheduledWeekdays: [1, 3, 5],
    estimatedMinutes: 20, minimumVersion: "Jedna strona", minimumEstimatedMinutes: 5,
    contextCue: "Po śniadaniu", status: "draft", createdAt: now, updatedAt: now, ...overrides
  };
}

describe("development experiments", () => {
  it("validates activation fields and the minimum-version limit", () => {
    expect(validateExperiment(experiment())).toEqual([]);
    expect(validateExperiment(experiment({ contextCue: "", minimumEstimatedMinutes: 11 }))).toEqual([
      "Podaj konkretny kontekst wykonania.",
      "Minimalna wersja musi trwać od 1 do 10 minut."
    ]);
    expect(activateExperiment(experiment(), now).status).toBe("active");
  });

  it("uses an inclusive 7-day range and selected weekdays", () => {
    const active = experiment({ status: "active" });
    expect(getExperimentEndDate(active)).toBe("2026-07-19");
    expect(isExperimentScheduledForDate(active, "2026-07-13")).toBe(true);
    expect(isExperimentScheduledForDate(active, "2026-07-14")).toBe(false);
    expect(isExperimentScheduledForDate(active, "2026-07-20")).toBe(false);
  });

  it("keeps at most one open experiment while preserving history", () => {
    const normalized = normalizeExperiments(
      [experiment(), experiment({ id: "e2" }), experiment({ id: "e3", status: "completed", endedAt: now })],
      { habits: [habit], goals: [], weeklyPlans: [] }
    );
    expect(normalized.map((item) => item.id)).toEqual(["e1", "e3"]);
  });

  it("summarizes only structural and numeric outcomes", () => {
    const active = experiment({ status: "active" });
    const summary = buildExperimentSummary(active, [
      { questId: "q1", completedAt: now, localDate: "2026-07-13", xpAwarded: 20, lifeStat: "Rozwoj", experimentId: "e1", experimentVariant: "full" },
      { questId: "q2", completedAt: now, localDate: "2026-07-15", xpAwarded: 10, lifeStat: "Rozwoj", experimentId: "e1", experimentVariant: "minimum" }
    ], [{ id: "p", localDate: "2026-07-17", intensity: "normal", tasks: [{
      id: "q3", habitId: "experiment:e1", origin: "experiment", experimentId: "e1", title: "x", description: "x",
      category: "Rozwoj", trackKey: "x", pillar: "learning", difficulty: "normal", estimatedMinutes: 20, xp: 20,
      sourceName: "x", sourceUrl: "", sourceNote: "x", expectedEffect: "x", reason: "x", edited: false,
      skippedAt: now, skipReason: "noTime"
    }], insights: [], createdAt: now, updatedAt: now }]);
    expect(summary).toEqual({ scheduled: 3, full: 1, minimum: 1, skipped: 1, completionRate: 67 });
  });
});
