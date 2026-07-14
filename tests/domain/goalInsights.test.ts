import { describe, expect, it } from "vitest";
import { applyWeeklyReviewDecisions, buildGoalProgressInsights } from "../../src/domain/goalInsights";
import type { Goal, QuestCompletion, WeeklyPlan, WeeklyReview } from "../../src/domain/model";

const now = "2026-07-13T10:00:00.000Z";
const goal: Goal = {
  id: "g1",
  kind: "direction",
  title: "Prywatny tytuł",
  outcome: "Prywatny wynik",
  reason: "Bardzo prywatny powód",
  lifeStat: "Rozwoj",
  status: "active",
  linkedHabitIds: [],
  linkedQuestIds: [],
  createdAt: now,
  updatedAt: now
};
const plan: WeeklyPlan = {
  id: "week-2026-07-13",
  weekStart: "2026-07-13",
  priorityGoalIds: ["g1"],
  steps: [{
    id: "s1",
    goalId: "g1",
    title: "Prywatny krok",
    scheduledWeekdays: [],
    targetCount: 3,
    estimatedMinutes: 20,
    createdAt: now,
    updatedAt: now
  }],
  status: "confirmed",
  createdAt: now,
  updatedAt: now
};

function completion(localDate: string): QuestCompletion {
  return {
    questId: `${localDate}-s1`,
    weeklyStepId: "s1",
    goalId: "g1",
    completedAt: `${localDate}T18:00:00.000Z`,
    localDate,
    xpAwarded: 20,
    lifeStat: "Rozwoj"
  };
}

describe("goal insights", () => {
  it("reports factual numeric progress without echoing private text", () => {
    const insights = buildGoalProgressInsights(plan, [completion("2026-07-13"), completion("2026-07-14")]);
    expect(insights).toEqual([{ goalId: "g1", completed: 2, target: 3, body: "Wykonano 2 z 3 zaplanowanych kroków." }]);
    expect(JSON.stringify(insights)).not.toContain("Prywatny");
  });

  it("applies pause and complete decisions without losing goals", () => {
    const review: WeeklyReview = {
      id: "review-2026-07-13",
      weekStart: "2026-07-13",
      goalReviews: [{ goalId: "g1", status: "needsChange", decision: "pause", note: "Prywatna notatka" }],
      createdAt: now,
      updatedAt: now
    };
    expect(applyWeeklyReviewDecisions([goal], review, "2026-07-20T10:00:00.000Z")[0].status).toBe("paused");
    const completed = applyWeeklyReviewDecisions(
      [goal],
      { ...review, goalReviews: [{ goalId: "g1", status: "completed", decision: "complete" }] },
      "2026-07-20T10:00:00.000Z"
    )[0];
    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toBe("2026-07-20T10:00:00.000Z");
  });
});
