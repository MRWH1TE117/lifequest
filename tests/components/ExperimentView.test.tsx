import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExperimentView } from "../../src/components/ExperimentView";
import { createEmptyState } from "../../src/domain/exportImport";
import type { DevelopmentExperiment } from "../../src/domain/model";

describe("ExperimentView", () => {
  it("creates a draft only from an enabled habit", () => {
    const state = createEmptyState("Tester", "2026-07-14T08:00:00.000Z");
    state.habits = state.habits.slice(0, 2).map((habit, index) => ({ ...habit, enabled: index === 0 }));
    const onSave = vi.fn();
    render(<ExperimentView state={state} today="2026-07-14" onSave={onSave} onActivate={vi.fn()} onFinish={vi.fn()} onSaveReview={vi.fn()} />);
    expect(screen.getAllByRole("button").filter((button) => button.classList.contains("source-button"))).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(state.habits[0].title) }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ sourceKind: "habit", linkedHabitId: state.habits[0].id, status: "draft" }));
  });

  it("blocks activation until a concrete context is supplied", () => {
    const state = createEmptyState("Tester", "2026-07-14T08:00:00.000Z");
    const draft: DevelopmentExperiment = {
      id: "e1", sourceKind: "habit", linkedHabitId: state.habits[0].id, title: "Próba", description: "Działanie",
      lifeStat: "Rozwoj", startDate: "2026-07-14", durationDays: 7, scheduledWeekdays: [2], estimatedMinutes: 10,
      contextCue: "", status: "draft", createdAt: "2026-07-14T08:00:00.000Z", updatedAt: "2026-07-14T08:00:00.000Z"
    };
    state.experiments = [draft];
    const onActivate = vi.fn();
    render(<ExperimentView state={state} today="2026-07-14" onSave={vi.fn()} onActivate={onActivate} onFinish={vi.fn()} onSaveReview={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Rozpocznij eksperyment" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Podaj konkretny kontekst wykonania");
    expect(onActivate).not.toHaveBeenCalled();
  });
});
