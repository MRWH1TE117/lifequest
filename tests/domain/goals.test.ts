import { describe, expect, it } from "vitest";
import { normalizeGoalLinks, resolveGoalForAction, transitionGoalStatus, validateGoal } from "../../src/domain/goals";
import type { Goal, WeeklyPlan } from "../../src/domain/model";

const now = "2026-07-13T10:00:00.000Z";

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    kind: "outcome",
    title: "Zbudować portfolio",
    outcome: "Opublikowane trzy projekty",
    reason: "Chcę zmienić kierunek kariery",
    lifeStat: "Rozwoj",
    targetDate: "2026-12-31",
    status: "active",
    linkedHabitIds: ["learn-20m"],
    linkedQuestIds: ["portfolio-task"],
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

describe("goals", () => {
  it("requires common fields and a target date for outcome goals", () => {
    expect(validateGoal(goal({ title: "", outcome: "", reason: "", targetDate: undefined }))).toEqual([
      "title",
      "outcome",
      "reason",
      "targetDate"
    ]);
  });

  it("allows a direction goal without a target date", () => {
    expect(validateGoal(goal({ kind: "direction", targetDate: undefined }))).toEqual([]);
  });

  it("sets and clears completion timestamps predictably", () => {
    const completed = transitionGoalStatus(goal(), "completed", "2026-07-14T12:00:00.000Z");
    expect(completed.completedAt).toBe("2026-07-14T12:00:00.000Z");
    expect(transitionGoalStatus(completed, "active", "2026-07-15T12:00:00.000Z").completedAt).toBeUndefined();
  });

  it("deduplicates links and removes missing targets", () => {
    const normalized = normalizeGoalLinks(
      goal({ linkedHabitIds: ["h1", "missing", "h1"], linkedQuestIds: ["q1", "q1", "missing"] }),
      new Set(["h1"]),
      new Set(["q1"])
    );
    expect(normalized.linkedHabitIds).toEqual(["h1"]);
    expect(normalized.linkedQuestIds).toEqual(["q1"]);
  });

  it("attributes an action to the first matching confirmed weekly priority only", () => {
    const first = goal({ id: "first", linkedHabitIds: ["shared"] });
    const second = goal({ id: "second", linkedHabitIds: ["shared"] });
    const plan: WeeklyPlan = {
      id: "week-2026-07-13",
      weekStart: "2026-07-13",
      priorityGoalIds: ["second", "first"],
      steps: [],
      status: "confirmed",
      createdAt: now,
      updatedAt: now
    };

    expect(resolveGoalForAction([first, second], plan, { habitId: "shared" })?.id).toBe("second");
    expect(resolveGoalForAction([first, second], { ...plan, status: "draft" }, { habitId: "shared" })).toBeNull();
  });
});
