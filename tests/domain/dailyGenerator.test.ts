import { describe, expect, it } from "vitest";
import type { DayState, DevelopmentExperiment, GeneratedTask, Goal, Habit, QuestCompletion, Settings, WeeklyPlan, WeeklyStep } from "../../src/domain/model";
import { generateDailyPlan } from "../../src/domain/dailyGenerator";
import { createHabitLibrary } from "../../src/domain/habitLibrary";

const habits = createHabitLibrary("2026-07-07T12:00:00.000Z");
const settings: Settings = {
  dataVersion: 4,
  priorityCategories: ["Finanse"],
  recoveryActivities: ["walk", "breathing"]
};

describe("daily generator", () => {
  it("returns task counts for light, normal, and strong days", () => {
    expect(generateDailyPlan({ habits, localDate: "2026-07-07", intensity: "light", completions: [], dayStates: [] }).tasks).toHaveLength(4);
    expect(generateDailyPlan({ habits, localDate: "2026-07-07", intensity: "normal", completions: [], dayStates: [] }).tasks).toHaveLength(5);
    expect(generateDailyPlan({ habits, localDate: "2026-07-07", intensity: "strong", completions: [], dayStates: [] }).tasks).toHaveLength(6);
  });

  it("balances categories instead of returning one-area plans", () => {
    const plan = generateDailyPlan({ habits, localDate: "2026-07-07", intensity: "normal", completions: [], dayStates: [] });
    const categories = new Set(plan.tasks.map((task) => task.category));

    expect(categories.size).toBeGreaterThanOrEqual(4);
  });

  it("is deterministic for the same date and state", () => {
    const first = generateDailyPlan({ habits, localDate: "2026-07-07", intensity: "normal", completions: [], dayStates: [] });
    const second = generateDailyPlan({ habits, localDate: "2026-07-07", intensity: "normal", completions: [], dayStates: [] });

    expect(second.tasks.map((task) => task.habitId)).toEqual(first.tasks.map((task) => task.habitId));
  });

  it("generates a different same-day set when current habits are excluded", () => {
    const first = generateDailyPlan({ habits, localDate: "2026-07-07", intensity: "normal", completions: [], dayStates: [] });
    const regenerated = generateDailyPlan({
      habits,
      localDate: "2026-07-07",
      intensity: "normal",
      completions: [],
      dayStates: [],
      excludedHabitIds: first.tasks.map((task) => task.habitId)
    });

    expect(regenerated.tasks).toHaveLength(first.tasks.length);
    expect(regenerated.tasks.every((task) => !first.tasks.some((current) => current.habitId === task.habitId))).toBe(true);
  });

  it("rotates away from yesterday's plan while keeping the same date stable", () => {
    const todayPlan = generateDailyPlan({ habits, localDate: "2026-07-07", intensity: "normal", completions: [], dayStates: [] });
    const nextDayPlan = generateDailyPlan({
      habits,
      localDate: "2026-07-08",
      intensity: "normal",
      completions: [],
      dayStates: [],
      previousPlans: [todayPlan]
    });
    const repeatedNextDayPlan = generateDailyPlan({
      habits,
      localDate: "2026-07-08",
      intensity: "normal",
      completions: [],
      dayStates: [],
      previousPlans: [todayPlan]
    });
    const repeatedHabitCount = nextDayPlan.tasks.filter((task) => todayPlan.tasks.some((previous) => previous.habitId === task.habitId)).length;

    expect(repeatedNextDayPlan.tasks.map((task) => task.habitId)).toEqual(nextDayPlan.tasks.map((task) => task.habitId));
    expect(repeatedHabitCount).toBe(0);
  });

  it("prefers weak or neglected areas from recent completions", () => {
    const completions: QuestCompletion[] = [
      completion("walk-10m", "Cialo"),
      completion("strength-session", "Cialo"),
      completion("skill-repetition", "Umysl"),
      completion("learn-something", "Rozwoj"),
      completion("social-touchpoint", "Relacje")
    ];

    const plan = generateDailyPlan({ habits, localDate: "2026-07-07", intensity: "normal", completions, dayStates: [] });

    expect(plan.tasks.some((task) => task.category === "Finanse")).toBe(true);
  });

  it("reduces difficulty after many recent light days", () => {
    const dayStates: DayState[] = [
      dayState("2026-07-01"),
      dayState("2026-07-02"),
      dayState("2026-07-03"),
      dayState("2026-07-04"),
      dayState("2026-07-05")
    ];

    const plan = generateDailyPlan({ habits, localDate: "2026-07-07", intensity: "normal", completions: [], dayStates });

    expect(plan.tasks.every((task) => task.difficulty !== "strong")).toBe(true);
    expect(plan.insights.some((insight) => insight.includes("lżejszy plan"))).toBe(true);
  });

  it("avoids repeatedly skipped tasks when alternatives exist", () => {
    const previousTask = generateDailyPlan({ habits, localDate: "2026-07-09", intensity: "normal", completions: [], dayStates: [] }).tasks[0];
    const plan = generateDailyPlan({
      habits,
      localDate: "2026-07-10",
      intensity: "normal",
      completions: [],
      dayStates: [],
      previousPlans: [
        {
          id: "plan-2026-07-09",
          localDate: "2026-07-09",
          intensity: "normal",
          tasks: [{ ...previousTask, skippedAt: "2026-07-09T18:00:00.000Z", skipReason: "tooHard" }],
          insights: [],
          createdAt: "2026-07-09T12:00:00.000Z",
          updatedAt: "2026-07-09T18:00:00.000Z"
        }
      ]
    });

    expect(plan.tasks.some((task) => task.skipReason)).toBe(false);
    expect(plan.tasks[0].habitId).not.toBe(previousTask.habitId);
    expect(plan.tasks[0].reason).toMatch(/pomijanej|łatwiejszy|słabszym/);
  });

  it("sorts day states before reducing normal-day task count after repeated light days", () => {
    const dayStates: DayState[] = [
      dayState("2026-07-01"),
      dayState("2026-07-02"),
      dayState("2026-07-03"),
      dayState("2026-07-04"),
      { ...dayState("2026-06-20"), intensity: "normal" },
      { ...dayState("2026-06-21"), intensity: "strong" },
      { ...dayState("2026-06-22"), intensity: "normal" },
      { ...dayState("2026-06-23"), intensity: "strong" },
      { ...dayState("2026-06-24"), intensity: "normal" },
      { ...dayState("2026-06-25"), intensity: "strong" },
      { ...dayState("2026-06-26"), intensity: "normal" }
    ];

    const plan = generateDailyPlan({ habits, localDate: "2026-07-08", intensity: "normal", completions: [], dayStates, previousPlans: [] });

    expect(plan.tasks).toHaveLength(4);
    expect(plan.tasks.every((task) => task.estimatedMinutes <= 15)).toBe(true);
  });

  it("ignores stale old light days when newer non-light day states exist out of order", () => {
    const dayStates: DayState[] = [
      dayState("2026-06-20"),
      { ...dayState("2026-07-01"), intensity: "normal" },
      dayState("2026-06-21"),
      { ...dayState("2026-07-02"), intensity: "strong" },
      dayState("2026-06-22"),
      { ...dayState("2026-07-03"), intensity: "normal" },
      dayState("2026-06-23"),
      { ...dayState("2026-07-04"), intensity: "strong" },
      { ...dayState("2026-07-05"), intensity: "normal" },
      { ...dayState("2026-07-06"), intensity: "strong" }
    ];

    const plan = generateDailyPlan({ habits, localDate: "2026-07-08", intensity: "normal", completions: [], dayStates, previousPlans: [] });

    expect(plan.tasks).toHaveLength(5);
  });

  it("uses personalization settings while preserving balanced normal plans and rotation", () => {
    const yesterdayPlan = generateDailyPlan({ habits, localDate: "2026-07-07", intensity: "normal", completions: [], dayStates: [], settings });
    const plan = generateDailyPlan({
      habits,
      localDate: "2026-07-08",
      intensity: "normal",
      completions: [],
      dayStates: [],
      previousPlans: [yesterdayPlan],
      settings
    });
    const categories = new Set(plan.tasks.map((task) => task.category));

    expect(plan.mode).toBe("standard");
    expect(plan.tasks.some((task) => task.category === "Finanse")).toBe(true);
    expect(categories.size).toBeGreaterThanOrEqual(4);
    expect(plan.tasks.some((task) => yesterdayPlan.tasks.some((previous) => previous.habitId === task.habitId))).toBe(false);
  });

  it("includes lower-order priority categories in balanced normal plans", () => {
    const prioritySettings: Settings = {
      dataVersion: 4,
      priorityCategories: ["Porzadek"],
      recoveryActivities: ["walk", "breathing"]
    };
    const plan = generateDailyPlan({
      habits,
      localDate: "2026-07-08",
      intensity: "normal",
      completions: [],
      dayStates: [],
      previousPlans: [],
      settings: prioritySettings
    });
    const categories = new Set(plan.tasks.map((task) => task.category));

    expect(plan.tasks.some((task) => task.category === "Porzadek")).toBe(true);
    expect(categories.size).toBeGreaterThanOrEqual(4);
  });

  it("explains shorter replacements after recent no-time skips", () => {
    const skippedTask = generateDailyPlan({ habits, localDate: "2026-07-07", intensity: "normal", completions: [], dayStates: [], settings }).tasks[0];
    const plan = generateDailyPlan({
      habits,
      localDate: "2026-07-08",
      intensity: "normal",
      completions: [],
      dayStates: [],
      previousPlans: [
        {
          id: "plan-2026-07-07",
          localDate: "2026-07-07",
          intensity: "normal",
          tasks: [{ ...skippedTask, skippedAt: "2026-07-07T18:00:00.000Z", skipReason: "noTime" }],
          insights: [],
          createdAt: "2026-07-07T12:00:00.000Z",
          updatedAt: "2026-07-07T18:00:00.000Z"
        }
      ],
      settings
    });

    expect(plan.tasks.some((task) => task.reason.includes("krótsza"))).toBe(true);
  });

  it("switches to a capped recovery plan after three recent light days", () => {
    const plan = generateDailyPlan({
      habits,
      localDate: "2026-07-08",
      intensity: "normal",
      completions: [],
      dayStates: [dayState("2026-07-03"), dayState("2026-07-05"), dayState("2026-07-07")],
      previousPlans: [],
      settings
    });
    const recoveryTemplateIds = new Set(["recovery-walk", "recovery-breathing"]);
    const generatedRecoveryTasks = plan.tasks.filter((task) => task.habitId.startsWith("recovery-"));

    expect(plan.mode).toBe("recovery");
    expect(plan.tasks).toHaveLength(3);
    expect(generatedRecoveryTasks.length).toBeGreaterThanOrEqual(1);
    expect(generatedRecoveryTasks.every((task) => recoveryTemplateIds.has(task.habitId))).toBe(true);
    expect(plan.insights).toContain("Po kilku lżejszych dniach plan skupia się na regeneracji.");
  });

  it("does not use recovery templates when recovery activities are disabled", () => {
    const plan = generateDailyPlan({
      habits,
      localDate: "2026-07-08",
      intensity: "normal",
      completions: [],
      dayStates: recoveryDayStates(),
      previousPlans: [],
      settings: {
        dataVersion: 4,
        priorityCategories: [],
        recoveryActivities: []
      }
    });

    expect(plan.mode).toBe("recovery");
    expect(plan.tasks).toHaveLength(3);
    expect(plan.tasks.every((task) => !task.habitId.startsWith("recovery-"))).toBe(true);
    expect(plan.tasks.every((task) => task.difficulty === "light" && task.estimatedMinutes <= 20)).toBe(true);
  });

  it("uses rotation-filtered fallback habits first in consecutive recovery plans", () => {
    const fallbackHabits = [
      testHabit("finance-light", "Finanse"),
      testHabit("focus-light", "Skupienie"),
      testHabit("relationship-light", "Relacje"),
      testHabit("order-light", "Porzadek")
    ];
    const yesterdayFallback = fallbackHabits[0];
    const plan = generateDailyPlan({
      habits: fallbackHabits,
      localDate: "2026-07-08",
      intensity: "normal",
      completions: [],
      dayStates: recoveryDayStates(),
      previousPlans: [
        recoveryPlanWithTasks("2026-07-07", [
          {
            ...taskFromHabit(yesterdayFallback, "2026-07-07"),
            reason: "Fallback z poprzedniego dnia."
          }
        ])
      ],
      settings: {
        dataVersion: 4,
        priorityCategories: [],
        recoveryActivities: []
      }
    });

    expect(plan.tasks).toHaveLength(3);
    expect(plan.tasks.some((task) => task.habitId === yesterdayFallback.id)).toBe(false);
  });

  it("avoids repeating a single preferred recovery template when fallback alternatives exist", () => {
    const singleActivitySettings: Settings = {
      dataVersion: 4,
      priorityCategories: [],
      recoveryActivities: ["walk"]
    };
    const plan = generateDailyPlan({
      habits,
      localDate: "2026-07-08",
      intensity: "normal",
      completions: [],
      dayStates: recoveryDayStates(),
      previousPlans: [
        recoveryPlanWithTasks("2026-07-07", [
          {
            id: "2026-07-07-recovery-walk",
            habitId: "recovery-walk",
            title: "Spokojny spacer",
            description: "Spacer z poprzedniego dnia.",
            category: "Cialo",
            trackKey: "recovery-walk",
            pillar: "energy",
            difficulty: "light",
            estimatedMinutes: 15,
            xp: 8,
            sourceName: "CDC Physical Activity",
            sourceUrl: "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html",
            sourceNote: "Test.",
            expectedEffect: "Test.",
            reason: "Łagodniejsza propozycja po kilku trudniejszych dniach.",
            edited: false
          }
        ])
      ],
      settings: singleActivitySettings
    });

    expect(plan.tasks).toHaveLength(3);
    expect(plan.tasks.some((task) => task.habitId === "recovery-walk")).toBe(false);
    expect(plan.tasks.every((task) => task.difficulty === "light" && task.estimatedMinutes <= 20)).toBe(true);
  });

  it("keeps standard mode before the recovery threshold", () => {
    const plan = generateDailyPlan({
      habits,
      localDate: "2026-07-08",
      intensity: "normal",
      completions: [],
      dayStates: [dayState("2026-07-05"), dayState("2026-07-07")],
      previousPlans: [],
      settings
    });

    expect(plan.mode).toBe("standard");
  });

  it("adds one due weekly goal step to a normal plan without changing its size", () => {
    const goalPlan = weeklyPlan([weeklyStep("step-1", "goal-1")], ["goal-1"]);
    const plan = generateDailyPlan({
      habits,
      goals: [testGoal("goal-1")],
      weeklyPlans: [goalPlan],
      localDate: "2026-07-13",
      intensity: "normal",
      completions: [],
      dayStates: []
    });

    expect(plan.tasks).toHaveLength(5);
    expect(plan.tasks.filter((task) => task.origin === "goalStep")).toHaveLength(1);
    expect(plan.tasks.find((task) => task.origin === "goalStep")).toMatchObject({
      goalId: "goal-1",
      weeklyStepId: "step-1"
    });
  });

  it("adds two strong-day steps only when they belong to different goals", () => {
    const goalPlan = weeklyPlan(
      [weeklyStep("a", "goal-1"), weeklyStep("b", "goal-1"), weeklyStep("c", "goal-2")],
      ["goal-1", "goal-2"]
    );
    const plan = generateDailyPlan({
      habits,
      goals: [testGoal("goal-1"), testGoal("goal-2")],
      weeklyPlans: [goalPlan],
      localDate: "2026-07-13",
      intensity: "strong",
      completions: [],
      dayStates: []
    });

    expect(plan.tasks).toHaveLength(6);
    expect(plan.tasks.filter((task) => task.origin === "goalStep").map((task) => task.goalId)).toEqual(["goal-1", "goal-2"]);
  });

  it("uses only a short minimum goal step in recovery mode", () => {
    const goalPlan = weeklyPlan([
      weeklyStep("short", "goal-1", { estimatedMinutes: 30, minimumVersion: "Zrób 5 minut", minimumEstimatedMinutes: 5 }),
      weeklyStep("long", "goal-2", { estimatedMinutes: 30 })
    ], ["goal-1", "goal-2"]);
    const plan = generateDailyPlan({
      habits,
      goals: [testGoal("goal-1"), testGoal("goal-2")],
      weeklyPlans: [goalPlan],
      localDate: "2026-07-13",
      intensity: "normal",
      completions: [],
      dayStates: [dayState("2026-07-09"), dayState("2026-07-10"), dayState("2026-07-12")]
    });

    expect(plan.mode).toBe("recovery");
    expect(plan.tasks).toHaveLength(3);
    expect(plan.tasks.find((task) => task.origin === "goalStep")).toMatchObject({
      weeklyStepId: "short",
      description: "Zrób 5 minut",
      estimatedMinutes: 5
    });
  });

  it("reserves one slot for a scheduled active experiment after a goal step", () => {
    const plan = generateDailyPlan({
      habits,
      goals: [testGoal("goal-1")],
      weeklyPlans: [weeklyPlan([weeklyStep("step-1", "goal-1", { scheduledWeekdays: [1] })], ["goal-1"])],
      experiments: [testExperiment()],
      localDate: "2026-07-13",
      intensity: "normal",
      completions: [],
      dayStates: []
    });
    expect(plan.tasks).toHaveLength(5);
    expect(plan.tasks.slice(0, 2).map((task) => task.origin)).toEqual(["goalStep", "experiment"]);
    expect(plan.tasks[1]).toMatchObject({ id: "experiment-experiment-1-2026-07-13", experimentId: "experiment-1", xp: 20 });
  });

  it("uses the experiment minimum only in recovery mode and only up to ten minutes", () => {
    const plan = generateDailyPlan({
      habits, experiments: [testExperiment()], localDate: "2026-07-13", intensity: "normal", completions: [],
      dayStates: [dayState("2026-07-09"), dayState("2026-07-10"), dayState("2026-07-12")]
    });
    expect(plan.tasks.find((task) => task.origin === "experiment")).toMatchObject({ description: "Przeczytaj jedną stronę", estimatedMinutes: 5 });
  });
});

function completion(questId: string, lifeStat: QuestCompletion["lifeStat"]): QuestCompletion {
  return {
    questId,
    completedAt: "2026-07-06T12:00:00.000Z",
    localDate: "2026-07-06",
    xpAwarded: 20,
    lifeStat
  };
}

function dayState(localDate: string): DayState {
  return {
    localDate,
    intensity: "light",
    energyNote: "",
    generatedPlanId: null,
    updatedAt: `${localDate}T12:00:00.000Z`
  };
}

function recoveryDayStates(): DayState[] {
  return [dayState("2026-07-03"), dayState("2026-07-05"), dayState("2026-07-07")];
}

function testHabit(id: string, category: Habit["category"]): Habit {
  return {
    id,
    title: id,
    description: `Test habit ${id}.`,
    category,
    pillar: "confidence",
    pack: "test",
    trackKey: id,
    type: "habit",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "daily",
    xp: 10,
    enabled: true,
    sourceName: "Test",
    sourceUrl: "https://example.com",
    sourceNote: "Test.",
    expectedEffect: "Test.",
    createdAt: "2026-07-07T12:00:00.000Z"
  };
}

function taskFromHabit(habit: Habit, localDate: string): GeneratedTask {
  return {
    id: `${localDate}-${habit.id}`,
    habitId: habit.id,
    title: habit.title,
    description: habit.description,
    category: habit.category,
    trackKey: habit.trackKey,
    pillar: habit.pillar,
    difficulty: habit.difficulty,
    estimatedMinutes: habit.estimatedMinutes,
    xp: habit.xp,
    sourceName: habit.sourceName,
    sourceUrl: habit.sourceUrl,
    sourceNote: habit.sourceNote,
    expectedEffect: habit.expectedEffect,
    reason: "Test.",
    edited: false
  };
}

function recoveryPlanWithTasks(localDate: string, tasks: GeneratedTask[]) {
  return {
    id: `plan-${localDate}`,
    localDate,
    intensity: "normal" as const,
    mode: "recovery" as const,
    tasks,
    insights: [],
    createdAt: `${localDate}T12:00:00.000Z`,
    updatedAt: `${localDate}T12:00:00.000Z`
  };
}

function testGoal(id: string): Goal {
  return {
    id,
    kind: "direction",
    title: `Cel ${id}`,
    outcome: `Wynik ${id}`,
    reason: `Powód ${id}`,
    lifeStat: "Rozwoj",
    status: "active",
    linkedHabitIds: [],
    linkedQuestIds: [],
    createdAt: "2026-07-13T08:00:00.000Z",
    updatedAt: "2026-07-13T08:00:00.000Z"
  };
}

function weeklyStep(id: string, goalId: string, overrides: Partial<WeeklyStep> = {}): WeeklyStep {
  return {
    id,
    goalId,
    title: `Krok ${id}`,
    scheduledWeekdays: [],
    targetCount: 1,
    estimatedMinutes: 20,
    createdAt: "2026-07-13T08:00:00.000Z",
    updatedAt: "2026-07-13T08:00:00.000Z",
    ...overrides
  };
}

function weeklyPlan(steps: WeeklyStep[], priorityGoalIds: string[]): WeeklyPlan {
  return {
    id: "week-2026-07-13",
    weekStart: "2026-07-13",
    priorityGoalIds,
    steps,
    status: "confirmed",
    createdAt: "2026-07-13T08:00:00.000Z",
    updatedAt: "2026-07-13T08:00:00.000Z"
  };
}

function testExperiment(): DevelopmentExperiment {
  return {
    id: "experiment-1", sourceKind: "habit", linkedHabitId: "h1", title: "Czytanie", description: "Przeczytaj rozdział",
    lifeStat: "Rozwoj", startDate: "2026-07-13", durationDays: 7, scheduledWeekdays: [1], estimatedMinutes: 20,
    minimumVersion: "Przeczytaj jedną stronę", minimumEstimatedMinutes: 5, contextCue: "Po śniadaniu", status: "active",
    createdAt: "2026-07-13T08:00:00.000Z", updatedAt: "2026-07-13T08:00:00.000Z"
  };
}
