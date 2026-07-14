import { describe, expect, it } from "vitest";
import {
  buildWeeklyStepProgress,
  createCarryOverDraft,
  getDueWeeklySteps,
  selectDailyGoalSteps,
  validateWeeklyPlan
} from "../../src/domain/weeklyPlanning";
import type { Goal, QuestCompletion, WeeklyPlan, WeeklyStep } from "../../src/domain/model";

const now = "2026-07-13T10:00:00.000Z";

function goal(id: string, status: Goal["status"] = "active"): Goal {
  return {
    id,
    kind: "direction",
    title: id,
    outcome: `Wynik ${id}`,
    reason: `Powód ${id}`,
    lifeStat: "Rozwoj",
    status,
    linkedHabitIds: [],
    linkedQuestIds: [],
    createdAt: now,
    updatedAt: now
  };
}

function step(id: string, goalId = "g1", overrides: Partial<WeeklyStep> = {}): WeeklyStep {
  return {
    id,
    goalId,
    title: `Krok ${id}`,
    scheduledWeekdays: [],
    targetCount: 1,
    estimatedMinutes: 20,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function plan(overrides: Partial<WeeklyPlan> = {}): WeeklyPlan {
  return {
    id: "week-2026-07-13",
    weekStart: "2026-07-13",
    priorityGoalIds: ["g1"],
    steps: [step("s1")],
    status: "confirmed",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function completion(stepId: string, localDate = "2026-07-13"): QuestCompletion {
  return {
    questId: `${localDate}-${stepId}`,
    weeklyStepId: stepId,
    goalId: "g1",
    completedAt: `${localDate}T18:00:00.000Z`,
    localDate,
    xpAwarded: 20,
    lifeStat: "Rozwoj"
  };
}

describe("weekly planning", () => {
  it("accepts one to three unique active priorities only", () => {
    const goals = [goal("g1"), goal("g2"), goal("g3"), goal("g4"), goal("paused", "paused")];
    expect(validateWeeklyPlan(plan(), goals)).toEqual([]);
    expect(validateWeeklyPlan(plan({ priorityGoalIds: [] }), goals)).toContain("priorityGoalIds");
    expect(validateWeeklyPlan(plan({ priorityGoalIds: ["g1", "g2", "g3", "g4"] }), goals)).toContain("priorityGoalIds");
    expect(validateWeeklyPlan(plan({ priorityGoalIds: ["g1", "g1"] }), goals)).toContain("priorityGoalIds");
    expect(validateWeeklyPlan(plan({ priorityGoalIds: ["paused"] }), goals)).toContain("priorityGoalIds");
  });

  it("counts canonical weekly-step completions without duplicates outside the week", () => {
    const current = plan({ steps: [step("s1", "g1", { targetCount: 2 })] });
    const progress = buildWeeklyStepProgress(current, [
      completion("s1", "2026-07-13"),
      completion("s1", "2026-07-14"),
      completion("s1", "2026-07-14"),
      completion("s1", "2026-07-20")
    ]);
    expect(progress.get("s1")).toEqual({ completed: 2, target: 2 });
  });

  it("returns steps due on the scheduled weekday until their target is reached", () => {
    const mondayStep = step("monday", "g1", { scheduledWeekdays: [1], targetCount: 1 });
    const current = plan({ steps: [mondayStep] });
    expect(getDueWeeklySteps(current, "2026-07-13", [])).toEqual([mondayStep]);
    expect(getDueWeeklySteps(current, "2026-07-14", [])).toEqual([]);
    expect(getDueWeeklySteps(current, "2026-07-13", [completion("monday")])).toEqual([]);
  });

  it("carries unfinished active priorities into an unconfirmed draft", () => {
    const previous = plan({ priorityGoalIds: ["g1", "g2"], steps: [step("done"), step("open", "g2")] });
    const draft = createCarryOverDraft(previous, "2026-07-20", [goal("g1"), goal("g2")], [completion("done")], now);
    expect(draft.status).toBe("draft");
    expect(draft.weekStart).toBe("2026-07-20");
    expect(draft.priorityGoalIds).toEqual(["g1", "g2"]);
    expect(draft.steps.map((item) => item.id)).toEqual(["open"]);
  });

  it("selects one normal-day step and two strong-day steps from different goals", () => {
    const current = plan({
      priorityGoalIds: ["g1", "g2"],
      steps: [step("a", "g1"), step("b", "g1"), step("c", "g2")]
    });
    const goals = [goal("g1"), goal("g2")];
    expect(selectDailyGoalSteps(current, goals, [], "2026-07-13", "normal", false).map((item) => item.id)).toEqual(["a"]);
    expect(selectDailyGoalSteps(current, goals, [], "2026-07-13", "strong", false).map((item) => item.id)).toEqual(["a", "c"]);
  });

  it("allows only a short minimum version in recovery mode", () => {
    const short = step("short", "g1", { estimatedMinutes: 30, minimumVersion: "Zrób 5 minut", minimumEstimatedMinutes: 5 });
    const long = step("long", "g2", { estimatedMinutes: 30 });
    const current = plan({ priorityGoalIds: ["g1", "g2"], steps: [short, long] });
    expect(selectDailyGoalSteps(current, [goal("g1"), goal("g2")], [], "2026-07-13", "light", true)).toEqual([short]);
  });
});
