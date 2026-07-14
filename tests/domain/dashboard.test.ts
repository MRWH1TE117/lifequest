import { describe, expect, it } from "vitest";
import { buildProgressDashboard, getDashboardRange } from "../../src/domain/dashboard";
import type {
  AppState,
  GeneratedTask,
  HabitCategory,
  LifeStat,
  QuestCompletion
} from "../../src/domain/model";

const emptyState: AppState = {
  profile: { name: "Gracz", totalXp: 0, createdAt: "2026-01-01T12:00:00.000Z" },
  quests: [],
  habits: [],
  dailyPlans: [],
  dayStates: [],
  completions: [],
  checkIns: [],
  goals: [],
  weeklyPlans: [],
  weeklyReviews: [],
  experiments: [],
  experimentReviews: [],
  settings: { dataVersion: 4, priorityCategories: [], recoveryActivities: [] }
};

describe("progress dashboard", () => {
  it.each([
    ["7d", "2026-07-03"],
    ["30d", "2026-06-10"],
    ["90d", "2026-04-11"],
    ["365d", "2025-07-10"]
  ] as const)("builds an inclusive %s range", (period, expectedStart) => {
    expect(getDashboardRange(period, "2026-07-09")).toEqual({
      start: expectedStart,
      end: "2026-07-09"
    });
  });

  it("returns neutral metrics when there is no history", () => {
    const dashboard = buildProgressDashboard(emptyState, "2026-07-09", "7d");

    expect(dashboard.summary.planCompletionPercent).toBeNull();
    expect(dashboard.summary.activeDays).toBe(0);
    expect(dashboard.summary.totalXp).toBe(0);
    expect(dashboard.summary.currentStreak).toBe(0);
    expect(dashboard.insights).toEqual([]);
    expect(dashboard.recommendation).toBeNull();
  });

  it("calculates automatic-plan completion and daily trend", () => {
    const dashboard = buildProgressDashboard(stateWithPlans(), "2026-07-09", "7d");

    expect(dashboard.summary.planCompletionPercent).toBe(67);
    expect(dashboard.trend).toEqual([
      { localDate: "2026-07-08", planned: 2, completed: 1, percent: 50 },
      { localDate: "2026-07-09", planned: 1, completed: 1, percent: 100 }
    ]);
  });

  it("does not turn a day without a plan into zero percent", () => {
    expect(buildProgressDashboard(emptyState, "2026-07-09", "7d").trend).toEqual([]);
  });

  it("counts active days and keeps manual work separate", () => {
    const state = stateWithPlans();
    state.quests = [{
      id: "manual-daily",
      name: "Ręczne zadanie",
      description: "",
      lifeStat: "Skupienie",
      type: "daily",
      difficulty: "easy",
      xp: 15,
      active: true,
      createdAt: "2026-07-01T12:00:00.000Z"
    }];
    state.completions.push(completion("manual-daily", "2026-07-07", "Skupienie", 15));
    state.checkIns.push({
      localDate: "2026-07-06",
      sleepHours: 7,
      energy: 3,
      mood: 3,
      reflection: "",
      updatedAt: "2026-07-06T20:00:00.000Z"
    });

    const dashboard = buildProgressDashboard(state, "2026-07-09", "7d");

    expect(dashboard.summary.activeDays).toBe(4);
    expect(dashboard.summary.totalXp).toBe(45);
    expect(dashboard.manual).toEqual({ completed: 1, totalXp: 15 });
    expect(dashboard.summary.planCompletionPercent).toBe(67);
  });

  it("allows the current streak to end yesterday", () => {
    const state = structuredClone(emptyState);
    state.checkIns = ["2026-07-06", "2026-07-07", "2026-07-08"].map((localDate) => ({
      localDate,
      sleepHours: null,
      energy: null,
      mood: null,
      reflection: "",
      updatedAt: `${localDate}T20:00:00.000Z`
    }));

    expect(buildProgressDashboard(state, "2026-07-09", "7d").summary.currentStreak).toBe(3);
  });

  it("breaks a streak after a fully inactive day", () => {
    const state = structuredClone(emptyState);
    state.checkIns = ["2026-07-05", "2026-07-07"].map((localDate) => ({
      localDate,
      sleepHours: null,
      energy: null,
      mood: null,
      reflection: "",
      updatedAt: `${localDate}T20:00:00.000Z`
    }));

    expect(buildProgressDashboard(state, "2026-07-09", "7d").summary.currentStreak).toBe(0);
  });

  it("reports automatic tasks by area and keeps unplanned areas neutral", () => {
    const dashboard = buildProgressDashboard(stateWithPlans(), "2026-07-09", "7d");

    expect(dashboard.areas.find((row) => row.stat === "Finanse")).toMatchObject({
      planned: 1,
      completed: 1,
      completionPercent: 100,
      completionSharePercent: 50
    });
    expect(dashboard.areas.find((row) => row.stat === "Cialo")).toMatchObject({
      planned: 1,
      completed: 0,
      completionPercent: 0,
      completionSharePercent: 0
    });
    expect(dashboard.areas.find((row) => row.stat === "Relacje")?.completionPercent).toBeNull();
  });

  it("uses numeric evidence and recommends the weakest planned area", () => {
    const state = stateWithPlans();
    state.dailyPlans[0].tasks[1].skippedAt = "2026-07-08T18:00:00.000Z";

    const dashboard = buildProgressDashboard(state, "2026-07-09", "7d");

    expect(dashboard.skippedCount).toBe(1);
    expect(dashboard.insights.length).toBeLessThanOrEqual(3);
    expect(dashboard.insights.every((item) => /\d/.test(item.body))).toBe(true);
    expect(dashboard.attentionArea).toBe("Cialo");
    expect(dashboard.recommendation?.body).toContain("Ciało");
  });

  it("uses weekly trend granularity for long ranges", () => {
    expect(buildProgressDashboard(stateWithPlans(), "2026-07-09", "30d").trendGranularity).toBe("day");
    expect(buildProgressDashboard(stateWithPlans(), "2026-07-09", "90d").trendGranularity).toBe("week");
  });

  it("reports goal-step counts without inventing whole-goal percentages", () => {
    const state = structuredClone(emptyState);
    state.goals = [{
      id: "g1",
      kind: "direction",
      title: "Rozwój portfolio",
      outcome: "Regularny postęp",
      reason: "Prywatny powód",
      lifeStat: "Rozwoj",
      status: "active",
      linkedHabitIds: [],
      linkedQuestIds: [],
      createdAt: "2026-07-07T08:00:00.000Z",
      updatedAt: "2026-07-07T08:00:00.000Z"
    }];
    state.weeklyPlans = [{
      id: "week-2026-07-06",
      weekStart: "2026-07-06",
      priorityGoalIds: ["g1"],
      steps: [{
        id: "s1",
        goalId: "g1",
        title: "Krok",
        scheduledWeekdays: [],
        targetCount: 3,
        estimatedMinutes: 20,
        createdAt: "2026-07-06T08:00:00.000Z",
        updatedAt: "2026-07-06T08:00:00.000Z"
      }],
      status: "confirmed",
      createdAt: "2026-07-06T08:00:00.000Z",
      updatedAt: "2026-07-06T08:00:00.000Z"
    }];
    state.completions = [{
      questId: "2026-07-08-goal-step-s1",
      goalId: "g1",
      weeklyStepId: "s1",
      completedAt: "2026-07-08T18:00:00.000Z",
      localDate: "2026-07-08",
      xpAwarded: 20,
      lifeStat: "Rozwoj"
    }];

    expect(buildProgressDashboard(state, "2026-07-10", "7d").goals).toEqual([{ goalId: "g1", title: "Rozwój portfolio", planned: 3, completed: 1 }]);
  });
});

function stateWithPlans(): AppState {
  const state = structuredClone(emptyState);
  state.dailyPlans = [
    {
      id: "plan-2026-07-08",
      localDate: "2026-07-08",
      intensity: "normal",
      tasks: [
        generatedTask("2026-07-08-finance", "Finanse"),
        generatedTask("2026-07-08-body", "Cialo")
      ],
      insights: [],
      createdAt: "2026-07-08T12:00:00.000Z",
      updatedAt: "2026-07-08T12:00:00.000Z"
    },
    {
      id: "plan-2026-07-09",
      localDate: "2026-07-09",
      intensity: "normal",
      tasks: [generatedTask("2026-07-09-growth", "Rozwoj")],
      insights: [],
      createdAt: "2026-07-09T12:00:00.000Z",
      updatedAt: "2026-07-09T12:00:00.000Z"
    }
  ];
  state.completions = [
    completion("2026-07-08-finance", "2026-07-08", "Finanse", 10),
    completion("2026-07-09-growth", "2026-07-09", "Rozwoj", 20)
  ];
  return state;
}

function generatedTask(id: string, category: HabitCategory): GeneratedTask {
  return {
    id,
    habitId: id.replace(/^\d{4}-\d{2}-\d{2}-/, ""),
    title: `Zadanie ${id}`,
    description: "Opis",
    category,
    trackKey: "test",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 10,
    xp: 10,
    sourceName: "Test",
    sourceUrl: "https://example.com",
    sourceNote: "Źródło testowe",
    expectedEffect: "Efekt testowy",
    reason: "Powód testowy",
    edited: false
  };
}

function completion(
  questId: string,
  localDate: string,
  lifeStat: LifeStat,
  xpAwarded: number
): QuestCompletion {
  return {
    questId,
    localDate,
    lifeStat,
    xpAwarded,
    completedAt: `${localDate}T18:00:00.000Z`
  };
}
