import { describe, expect, it } from "vitest";
import type { DailyPlan, GeneratedTask, Habit, QuestCompletion } from "../../src/domain/model";
import { buildPersonalizationSignals, scorePersonalization } from "../../src/domain/personalization";

describe("personalization scoring", () => {
  it("scores priority categories above otherwise similar habits while staying bounded", () => {
    const financeHabit = habit({ id: "money-scan", category: "Finanse", pillar: "finance" });
    const energyHabit = habit({ id: "energy-scan", category: "Energia", pillar: "energy" });
    const signals = buildPersonalizationSignals({
      localDate: "2026-07-15",
      priorityCategories: ["Finanse"],
      completions: [completionFor("2026-07-14-money-scan", "2026-07-14")],
      previousPlans: [planWithTask("money-scan", "2026-07-14")]
    });

    expect(scorePersonalization(financeHabit, signals)).toBeGreaterThan(scorePersonalization(energyHabit, signals));
    expect(scorePersonalization(financeHabit, signals)).toBeLessThan(100);
  });

  it("gives no completion bonus after fifteen days and more bonus for yesterday than ten days ago", () => {
    const recentHabit = habit({ id: "recent-habit" });
    const olderHabit = habit({ id: "older-habit" });
    const staleHabit = habit({ id: "stale-habit" });
    const signals = buildPersonalizationSignals({
      localDate: "2026-07-15",
      priorityCategories: [],
      completions: [
        completionFor("2026-07-14-recent-habit", "2026-07-14"),
        completionFor("2026-07-05-older-habit", "2026-07-05"),
        completionFor("2026-06-30-stale-habit", "2026-06-30")
      ],
      previousPlans: [
        planWithTask("recent-habit", "2026-07-14"),
        planWithTask("older-habit", "2026-07-05"),
        planWithTask("stale-habit", "2026-06-30")
      ]
    });

    expect(scorePersonalization(staleHabit, signals)).toBe(0);
    expect(scorePersonalization(recentHabit, signals)).toBeGreaterThan(scorePersonalization(olderHabit, signals));
  });

  it("prefers shorter habits after no-time skips", () => {
    const shortHabit = habit({ id: "short-habit", estimatedMinutes: 10 });
    const longHabit = habit({ id: "long-habit", estimatedMinutes: 25 });
    const noTimeSignals = buildPersonalizationSignals({
      localDate: "2026-07-15",
      priorityCategories: [],
      completions: [],
      previousPlans: [planWithTasks("2026-07-14", [skippedTaskFor(shortHabit, "2026-07-14", "noTime"), skippedTaskFor(longHabit, "2026-07-14", "noTime")])]
    });

    expect(scorePersonalization(longHabit, noTimeSignals)).toBeLessThan(scorePersonalization(shortHabit, noTimeSignals));
    expect(scorePersonalization(shortHabit, noTimeSignals)).toBe(18);
    expect(scorePersonalization(longHabit, noTimeSignals)).toBe(-20);
  });

  it("prefers lighter habits after too-hard skips", () => {
    const lightHabit = habit({ id: "light-habit", difficulty: "light" });
    const strongHabit = habit({ id: "strong-habit", difficulty: "strong" });
    const tooHardSignals = buildPersonalizationSignals({
      localDate: "2026-07-15",
      priorityCategories: [],
      completions: [],
      previousPlans: [planWithTasks("2026-07-14", [skippedTaskFor(lightHabit, "2026-07-14", "tooHard"), skippedTaskFor(strongHabit, "2026-07-14", "tooHard")])]
    });

    expect(scorePersonalization(strongHabit, tooHardSignals)).toBeLessThan(scorePersonalization(lightHabit, tooHardSignals));
    expect(scorePersonalization(lightHabit, tooHardSignals)).toBe(18);
    expect(scorePersonalization(strongHabit, tooHardSignals)).toBe(-25);
  });

  it("strongly penalizes recently skipped not-relevant habits", () => {
    const skippedHabit = habit({ id: "not-relevant-habit" });
    const notRelevantSignals = buildPersonalizationSignals({
      localDate: "2026-07-15",
      priorityCategories: [],
      completions: [],
      previousPlans: [planWithTasks("2026-07-14", [skippedTaskFor(skippedHabit, "2026-07-14", "notRelevant")])]
    });

    expect(scorePersonalization(skippedHabit, notRelevantSignals)).toBeLessThan(-40);
    expect(scorePersonalization(skippedHabit, notRelevantSignals)).toBe(-60);
  });

  it("keeps an active not-relevant penalty when a newer weaker skip also exists", () => {
    const skippedHabit = habit({ id: "mixed-skip-habit", estimatedMinutes: 10 });
    const mixedSignals = buildPersonalizationSignals({
      localDate: "2026-07-15",
      priorityCategories: [],
      completions: [],
      previousPlans: [
        planWithTasks("2026-06-25", [skippedTaskFor(skippedHabit, "2026-06-25", "notRelevant")]),
        planWithTasks("2026-07-14", [skippedTaskFor(skippedHabit, "2026-07-14", "noTime")])
      ]
    });

    expect(scorePersonalization(skippedHabit, mixedSignals)).toBeLessThan(-40);
  });

  it("does not permanently penalize too-much-today skips after seven days", () => {
    const heavyHabit = habit({ id: "heavy-habit", estimatedMinutes: 20 });
    const recentSignals = buildPersonalizationSignals({
      localDate: "2026-07-15",
      priorityCategories: [],
      completions: [],
      previousPlans: [planWithTasks("2026-07-09", [skippedTaskFor(heavyHabit, "2026-07-09", "tooMuchToday")])]
    });
    const staleSignals = buildPersonalizationSignals({
      localDate: "2026-07-15",
      priorityCategories: [],
      completions: [],
      previousPlans: [planWithTasks("2026-07-08", [skippedTaskFor(heavyHabit, "2026-07-08", "tooMuchToday")])]
    });

    expect(scorePersonalization(heavyHabit, recentSignals)).toBeLessThan(0);
    expect(scorePersonalization(heavyHabit, recentSignals)).toBe(-12);
    expect(scorePersonalization(heavyHabit, staleSignals)).toBe(0);
  });
});

function habit(overrides: Partial<Habit>): Habit {
  return {
    id: "test-habit",
    title: "Test habit",
    description: "Test description",
    category: "Energia",
    pillar: "energy",
    pack: "test",
    trackKey: "test",
    type: "habit",
    difficulty: "normal",
    estimatedMinutes: 10,
    frequency: "daily",
    xp: 10,
    enabled: true,
    sourceName: "Test",
    sourceUrl: "https://example.com",
    sourceNote: "Test note",
    expectedEffect: "Test effect",
    createdAt: "2026-07-01T08:00:00.000Z",
    ...overrides
  };
}

function completionFor(questId: string, localDate: string): QuestCompletion {
  return {
    questId,
    completedAt: `${localDate}T18:00:00.000Z`,
    localDate,
    xpAwarded: 10,
    lifeStat: "Energia"
  };
}

function planWithTask(habitId: string, localDate: string): DailyPlan {
  return planWithTasks(localDate, [taskFor(habitId, localDate)]);
}

function planWithTasks(localDate: string, tasks: GeneratedTask[]): DailyPlan {
  return {
    id: `plan-${localDate}`,
    localDate,
    intensity: "normal",
    tasks,
    insights: [],
    createdAt: `${localDate}T08:00:00.000Z`,
    updatedAt: `${localDate}T08:00:00.000Z`
  };
}

function skippedTaskFor(habit: Habit, localDate: string, skipReason: GeneratedTask["skipReason"]): GeneratedTask {
  return {
    ...taskFor(habit.id, localDate),
    difficulty: habit.difficulty,
    estimatedMinutes: habit.estimatedMinutes,
    skippedAt: `${localDate}T19:00:00.000Z`,
    skipReason
  };
}

function taskFor(habitId: string, localDate: string): GeneratedTask {
  return {
    id: `${localDate}-${habitId}`,
    habitId,
    title: "Task",
    description: "Task description",
    category: "Energia",
    trackKey: "test",
    pillar: "energy",
    difficulty: "normal",
    estimatedMinutes: 10,
    xp: 10,
    sourceName: "Test",
    sourceUrl: "https://example.com",
    sourceNote: "Test note",
    expectedEffect: "Test effect",
    reason: "Test reason",
    edited: false
  };
}
