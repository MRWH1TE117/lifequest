import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TodayView } from "../../src/components/TodayView";
import type { AppState, DailyPlanMode } from "../../src/domain/model";

const today = "2026-07-10";

function appStateWithPlan(mode: DailyPlanMode): AppState {
  return {
    profile: { name: "Gracz", totalXp: 0, createdAt: "2026-01-01T12:00:00.000Z" },
    quests: [],
    habits: [],
    dailyPlans: [{
      id: "plan-today",
      localDate: today,
      intensity: "normal",
      mode,
      tasks: [],
      insights: [],
      createdAt: "2026-07-10T08:00:00.000Z",
      updatedAt: "2026-07-10T08:00:00.000Z"
    }],
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
}

function renderTodayView(state: AppState) {
  return render(
    <TodayView
      state={state}
      today={today}
      onCompleteGeneratedTask={vi.fn()}
      onCompleteQuest={vi.fn()}
      onEditGeneratedTask={vi.fn()}
      onRegenerateDailyPlan={vi.fn()}
      onSaveCheckIn={vi.fn()}
      onSaveDayIntensity={vi.fn()}
      onSkipGeneratedTask={vi.fn()}
      onOpenProgress={vi.fn()}
    />
  );
}

describe("TodayView", () => {
  it("shows a recovery state only for recovery daily plans", () => {
    const { rerender } = renderTodayView(appStateWithPlan("recovery"));

    expect(screen.getByText("Tryb regeneracji")).toBeVisible();
    expect(screen.getByText(/kilku trudniejszych dniach/i)).toBeVisible();

    rerender(
      <TodayView
        state={appStateWithPlan("standard")}
        today={today}
        onCompleteGeneratedTask={vi.fn()}
        onCompleteQuest={vi.fn()}
        onEditGeneratedTask={vi.fn()}
        onRegenerateDailyPlan={vi.fn()}
        onSaveCheckIn={vi.fn()}
        onSaveDayIntensity={vi.fn()}
        onSkipGeneratedTask={vi.fn()}
        onOpenProgress={vi.fn()}
      />
    );

    expect(screen.queryByText("Tryb regeneracji")).not.toBeInTheDocument();
  });
});
