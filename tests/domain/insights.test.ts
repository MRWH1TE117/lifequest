import { describe, expect, it } from "vitest";
import type { DailyPlan, GeneratedTask } from "../../src/domain/model";
import { buildInsights } from "../../src/domain/insights";

describe("insights", () => {
  it("identifies weakest and strongest categories from local completions", () => {
    const insights = buildInsights({
      today: "2026-07-08",
      completions: [
        {
          questId: "q1",
          completedAt: "2026-07-07T10:00:00.000Z",
          localDate: "2026-07-07",
          xpAwarded: 50,
          lifeStat: "Rozwoj"
        },
        {
          questId: "q2",
          completedAt: "2026-07-07T11:00:00.000Z",
          localDate: "2026-07-07",
          xpAwarded: 20,
          lifeStat: "Finanse"
        },
        {
          questId: "q3",
          completedAt: "2026-07-01T11:00:00.000Z",
          localDate: "2026-07-01",
          xpAwarded: 500,
          lifeStat: "Finanse"
        }
      ],
      dayStates: [],
      dailyPlans: []
    });

    expect(insights.some((insight) => insight.kind === "strength" && insight.body.includes("Rozwój"))).toBe(true);
    expect(insights.some((insight) => insight.kind === "weakness" && insight.body.includes("Energia"))).toBe(true);
  });

  it("uses clear no-data copy when there are no completions", () => {
    const insights = buildInsights({
      today: "2026-07-08",
      completions: [],
      dayStates: [],
      dailyPlans: []
    });

    const strength = insights.find((insight) => insight.kind === "strength");
    const weakness = insights.find((insight) => insight.kind === "weakness");

    expect(strength?.body).toMatch(/Za mało danych|Brak danych/);
    expect(weakness?.body).toMatch(/Za mało danych|Brak danych/);
    expect(strength?.body).not.toContain("obszar Energia");
    expect(weakness?.body).not.toContain("obszar Energia");
  });

  it("excludes future completions when identifying the strongest category", () => {
    const insights = buildInsights({
      today: "2026-07-08",
      completions: [
        {
          questId: "q1",
          completedAt: "2026-07-07T10:00:00.000Z",
          localDate: "2026-07-07",
          xpAwarded: 30,
          lifeStat: "Rozwoj"
        },
        {
          questId: "q2",
          completedAt: "2026-07-09T10:00:00.000Z",
          localDate: "2026-07-09",
          xpAwarded: 999,
          lifeStat: "Finanse"
        }
      ],
      dayStates: [],
      dailyPlans: []
    });

    const strength = insights.find((insight) => insight.kind === "strength");

    expect(strength?.body).toContain("Rozwój");
    expect(strength?.body).not.toContain("Finanse");
  });

  it("counts skipped tasks only from daily plans inside the 7-day window", () => {
    const withoutWindowSkips = buildInsights({
      today: "2026-07-08",
      completions: [],
      dayStates: [],
      dailyPlans: [
        makePlan("2026-06-30", 3),
        makePlan("2026-07-09", 3)
      ]
    });
    const withWindowSkips = buildInsights({
      today: "2026-07-08",
      completions: [],
      dayStates: [],
      dailyPlans: [
        makePlan("2026-06-30", 3),
        makePlan("2026-07-02", 3),
        makePlan("2026-07-09", 3)
      ]
    });

    expect(withoutWindowSkips.find((insight) => insight.kind === "recommendation")?.body).not.toContain("pominięto");
    expect(withWindowSkips.find((insight) => insight.kind === "recommendation")?.body).toContain("pominięto 3 zadania");
  });

  it("counts light normal and strong day states for 7 and 30 days", () => {
    const insights = buildInsights({
      today: "2026-07-08",
      completions: [],
      dayStates: [
        {
          localDate: "2026-07-02",
          intensity: "light",
          energyNote: "",
          generatedPlanId: null,
          updatedAt: "2026-07-02T12:00:00.000Z"
        },
        {
          localDate: "2026-07-03",
          intensity: "normal",
          energyNote: "",
          generatedPlanId: null,
          updatedAt: "2026-07-03T12:00:00.000Z"
        },
        {
          localDate: "2026-07-04",
          intensity: "strong",
          energyNote: "",
          generatedPlanId: null,
          updatedAt: "2026-07-04T12:00:00.000Z"
        },
        {
          localDate: "2026-07-09",
          intensity: "strong",
          energyNote: "",
          generatedPlanId: null,
          updatedAt: "2026-07-09T12:00:00.000Z"
        },
        {
          localDate: "2026-06-30",
          intensity: "light",
          energyNote: "",
          generatedPlanId: null,
          updatedAt: "2026-06-30T12:00:00.000Z"
        },
        {
          localDate: "2026-06-29",
          intensity: "normal",
          energyNote: "",
          generatedPlanId: null,
          updatedAt: "2026-06-29T12:00:00.000Z"
        },
        {
          localDate: "2026-06-08",
          intensity: "strong",
          energyNote: "",
          generatedPlanId: null,
          updatedAt: "2026-06-08T12:00:00.000Z"
        }
      ],
      dailyPlans: []
    });

    const dayStateInsight = insights.find((insight) => insight.kind === "dayState");

    expect(dayStateInsight?.body).toContain("Ostatnie 7 dni: lekki: 1, normalny: 1, mocny: 1");
    expect(dayStateInsight?.body).toContain("Ostatnie 30 dni: lekki: 2, normalny: 2, mocny: 1");
  });
});

function makePlan(localDate: string, skippedTaskCount: number): DailyPlan {
  return {
    id: `plan-${localDate}`,
    localDate,
    intensity: "normal",
    tasks: Array.from({ length: skippedTaskCount }, (_, index) => makeSkippedTask(localDate, index)),
    insights: [],
    createdAt: `${localDate}T08:00:00.000Z`,
    updatedAt: `${localDate}T08:00:00.000Z`
  };
}

function makeSkippedTask(localDate: string, index: number): GeneratedTask {
  return {
    id: `task-${localDate}-${index}`,
    habitId: `habit-${index}`,
    title: "Task",
    description: "Task description",
    category: "Energia",
    trackKey: "energy",
    pillar: "energy",
    difficulty: "normal",
    estimatedMinutes: 10,
    xp: 10,
    sourceName: "Test",
    sourceUrl: "https://example.com",
    sourceNote: "Test note",
    expectedEffect: "Test effect",
    reason: "Test reason",
    edited: false,
    skippedAt: `${localDate}T09:00:00.000Z`,
    skipReason: "noTime"
  };
}
