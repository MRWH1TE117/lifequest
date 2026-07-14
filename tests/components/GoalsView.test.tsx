import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GoalsView } from "../../src/components/GoalsView";
import { createEmptyState } from "../../src/domain/exportImport";
import type { Goal } from "../../src/domain/model";

function goal(id: string): Goal {
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

describe("GoalsView", () => {
  it("creates a direction goal without requiring a target date", async () => {
    const user = userEvent.setup();
    const onSaveGoal = vi.fn();
    render(
      <GoalsView
        state={createEmptyState("Tester", "2026-07-13T08:00:00.000Z")}
        today="2026-07-13"
        onSaveGoal={onSaveGoal}
        onSaveWeeklyPlan={vi.fn()}
        onSaveWeeklyReview={vi.fn()}
        onTransitionGoal={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Rodzaj celu"), { target: { value: "direction" } });
    fireEvent.change(screen.getByLabelText("Nazwa celu"), { target: { value: "Regularna nauka" } });
    fireEvent.change(screen.getByLabelText("Oczekiwany wynik"), { target: { value: "Uczę się trzy razy w tygodniu" } });
    fireEvent.change(screen.getByLabelText("Dlaczego to ważne"), { target: { value: "Chcę systematycznie rozwijać kompetencje" } });
    await user.click(screen.getByRole("button", { name: "Zapisz cel" }));

    expect(onSaveGoal).toHaveBeenCalledWith(expect.objectContaining({
      kind: "direction",
      title: "Regularna nauka",
      targetDate: undefined,
      status: "active"
    }));
  }, 10000);

  it("shows validation when an outcome goal has no target date", async () => {
    const user = userEvent.setup();
    const onSaveGoal = vi.fn();
    render(
      <GoalsView
        state={createEmptyState("Tester", "2026-07-13T08:00:00.000Z")}
        today="2026-07-13"
        onSaveGoal={onSaveGoal}
        onSaveWeeklyPlan={vi.fn()}
        onSaveWeeklyReview={vi.fn()}
        onTransitionGoal={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText("Nazwa celu"), { target: { value: "Portfolio" } });
    fireEvent.change(screen.getByLabelText("Oczekiwany wynik"), { target: { value: "Trzy projekty online" } });
    fireEvent.change(screen.getByLabelText("Dlaczego to ważne"), { target: { value: "Zmiana pracy" } });
    await user.click(screen.getByRole("button", { name: "Zapisz cel" }));

    expect(screen.getByText("Podaj datę docelową dla celu wynikowego.")).toBeVisible();
    expect(onSaveGoal).not.toHaveBeenCalled();
  });

  it("disables a fourth weekly priority after selecting three", async () => {
    const user = userEvent.setup();
    const state = createEmptyState("Tester", "2026-07-13T08:00:00.000Z");
    state.goals = [goal("1"), goal("2"), goal("3"), goal("4")];
    render(
      <GoalsView
        state={state}
        today="2026-07-13"
        onSaveGoal={vi.fn()}
        onSaveWeeklyPlan={vi.fn()}
        onSaveWeeklyReview={vi.fn()}
        onTransitionGoal={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Priorytet Cel 1"));
    await user.click(screen.getByLabelText("Priorytet Cel 2"));
    await user.click(screen.getByLabelText("Priorytet Cel 3"));

    expect(screen.getByLabelText("Priorytet Cel 4")).toBeDisabled();
  });
});
