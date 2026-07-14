import { describe, expect, it } from "vitest";
import { createEmptyState, exportAppState, importAppState } from "../../src/domain/exportImport";
import { createHabitLibrary } from "../../src/domain/habitLibrary";
import { createStarterQuests } from "../../src/domain/starterQuests";

describe("app state export and import", () => {
  it("round-trips a complete state bundle", () => {
    const state = createEmptyState("Tester", "2026-07-07T10:00:00.000Z");
    const exported = exportAppState(state);
    const imported = importAppState(exported);

    expect(imported.profile.name).toBe("Tester");
    expect(imported.settings.dataVersion).toBe(4);
    expect(imported.quests).toEqual([]);
    expect(imported.habits.length).toBeGreaterThan(0);
    expect(imported.dailyPlans).toEqual([]);
    expect(imported.dayStates).toEqual([]);
    expect(imported.goals).toEqual([]);
    expect(imported.weeklyPlans).toEqual([]);
    expect(imported.weeklyReviews).toEqual([]);
    expect(imported.experiments).toEqual([]);
    expect(imported.experimentReviews).toEqual([]);
  });

  it("migrates a version-2 bundle to version-4 collections", () => {
    const state = createEmptyState("Tester", "2026-07-13T10:00:00.000Z");
    const raw = JSON.stringify({
      ...state,
      goals: undefined,
      weeklyPlans: undefined,
      weeklyReviews: undefined,
      settings: {
        dataVersion: 2,
        priorityCategories: ["Rozwoj"],
        recoveryActivities: ["walk", "outdoors"]
      }
    });

    const imported = importAppState(raw);

    expect(imported.settings).toEqual({
      dataVersion: 4,
      priorityCategories: ["Rozwoj"],
      recoveryActivities: ["walk", "outdoors"]
    });
    expect(imported.goals).toEqual([]);
    expect(imported.weeklyPlans).toEqual([]);
    expect(imported.weeklyReviews).toEqual([]);
  });

  it("normalizes version-3 goal links and removes missing weekly references", () => {
    const state = createEmptyState("Tester", "2026-07-13T10:00:00.000Z");
    state.quests = [{ id: "q1", name: "Zadanie", description: "", lifeStat: "Rozwoj", type: "weekly", difficulty: "easy", xp: 20, active: true, createdAt: state.profile.createdAt }];
    state.goals = [{
      id: "g1",
      kind: "direction",
      title: "Cel",
      outcome: "Wynik",
      reason: "Powód",
      lifeStat: "Rozwoj",
      status: "active",
      linkedHabitIds: [state.habits[0].id, "missing-habit", state.habits[0].id],
      linkedQuestIds: ["q1", "missing-quest"],
      createdAt: state.profile.createdAt,
      updatedAt: state.profile.createdAt
    }];
    state.weeklyPlans = [{
      id: "week-2026-07-13",
      weekStart: "2026-07-13",
      priorityGoalIds: ["g1", "missing-goal"],
      steps: [
        { id: "s1", goalId: "g1", title: "Krok", scheduledWeekdays: [], targetCount: 1, estimatedMinutes: 20, linkedHabitId: "missing-habit", createdAt: state.profile.createdAt, updatedAt: state.profile.createdAt },
        { id: "bad", goalId: "missing-goal", title: "Błędny", scheduledWeekdays: [], targetCount: 1, estimatedMinutes: 20, createdAt: state.profile.createdAt, updatedAt: state.profile.createdAt }
      ],
      status: "confirmed",
      createdAt: state.profile.createdAt,
      updatedAt: state.profile.createdAt
    }];

    const imported = importAppState(JSON.stringify({
      ...state,
      experiments: undefined,
      experimentReviews: undefined,
      settings: { ...state.settings, dataVersion: 3 }
    }));

    expect(imported.goals[0].linkedHabitIds).toEqual([state.habits[0].id]);
    expect(imported.goals[0].linkedQuestIds).toEqual(["q1"]);
    expect(imported.weeklyPlans[0].priorityGoalIds).toEqual(["g1"]);
    expect(imported.weeklyPlans[0].steps.map((step) => step.id)).toEqual(["s1"]);
    expect(imported.weeklyPlans[0].steps[0].linkedHabitId).toBeUndefined();
    expect(imported.settings.dataVersion).toBe(4);
    expect(imported.experiments).toEqual([]);
    expect(imported.experimentReviews).toEqual([]);
  });

  it("rejects invalid bundles", () => {
    expect(() => importAppState("{\"bad\":true}")).toThrow("Nieprawidlowy plik danych LifeQuest");
  });

  it("removes unchanged legacy starter tasks but preserves customized tasks", () => {
    const state = createEmptyState("Tester", "2026-07-07T10:00:00.000Z");
    const starters = createStarterQuests(state.profile.createdAt);
    const raw = JSON.stringify({
      ...state,
      quests: [...starters.slice(0, 7), { ...starters[7], name: "Mój ważny cel" }]
    });

    const imported = importAppState(raw);

    expect(imported.quests).toHaveLength(1);
    expect(imported.quests[0].name).toBe("Mój ważny cel");
  });

  it("removes historical starter copy that differs only by Polish diacritics", () => {
    const state = createEmptyState("Tester", "2026-07-07T10:00:00.000Z");
    const learning = createStarterQuests(state.profile.createdAt).find((quest) => quest.id === "learn-20m")!;
    const raw = JSON.stringify({
      ...state,
      quests: [{ ...learning, description: "Czytaj, cwicz albo kontynuuj kurs." }]
    });

    expect(importAppState(raw).quests).toEqual([]);
  });

  it("migrates older bundles without habit generator fields", () => {
    const oldState = createEmptyState("Tester", "2026-07-07T10:00:00.000Z");
    const raw = JSON.stringify({
      profile: oldState.profile,
      quests: oldState.quests,
      completions: oldState.completions,
      checkIns: oldState.checkIns,
      settings: oldState.settings
    });

    const imported = importAppState(raw);

    expect(imported.habits.length).toBeGreaterThan(0);
    expect(imported.dailyPlans).toEqual([]);
    expect(imported.dayStates).toEqual([]);
  });

  it("migrates version-1 settings to version-4 personalization defaults", () => {
    const oldState = createEmptyState("Tester", "2026-07-07T10:00:00.000Z");
    const raw = JSON.stringify({
      ...oldState,
      settings: {
        dataVersion: 1
      }
    });

    const imported = importAppState(raw);

    expect(imported.settings).toEqual({
      dataVersion: 4,
      priorityCategories: [],
      recoveryActivities: ["walk", "screenBreak", "calmHobby", "socialContact", "breathing", "sleepRoutine", "outdoors"]
    });
  });

  it("round-trips version-4 priority categories and recovery activities", () => {
    const state = createEmptyState("Tester", "2026-07-07T10:00:00.000Z");
    state.settings = {
      dataVersion: 4,
      priorityCategories: ["Energia", "Finanse", "Porzadek"],
      recoveryActivities: ["walk", "breathing", "outdoors"]
    };

    const imported = importAppState(exportAppState(state));

    expect(imported.settings).toEqual({
      dataVersion: 4,
      priorityCategories: ["Energia", "Finanse", "Porzadek"],
      recoveryActivities: ["walk", "breathing", "outdoors"]
    });
  });

  it("removes invalid and duplicate version-2 settings values during import", () => {
    const state = createEmptyState("Tester", "2026-07-07T10:00:00.000Z");
    const raw = JSON.stringify({
      ...state,
      settings: {
        dataVersion: 2,
        priorityCategories: ["Energia", "Unknown", "Energia", "Finanse", "Porzadek", "Relacje"],
        recoveryActivities: ["walk", "unknown", "walk", "breathing", "sleepRoutine"]
      }
    });

    const imported = importAppState(raw);

    expect(imported.settings).toEqual({
      dataVersion: 4,
      priorityCategories: ["Energia", "Finanse", "Porzadek"],
      recoveryActivities: ["walk", "breathing", "sleepRoutine"]
    });
  });

  it("normalizes malformed version-2 settings field shapes during import", () => {
    const state = createEmptyState("Tester", "2026-07-07T10:00:00.000Z");
    const raw = JSON.stringify({
      ...state,
      settings: {
        dataVersion: 2,
        priorityCategories: {},
        recoveryActivities: 123
      }
    });

    const imported = importAppState(raw);

    expect(imported.settings).toEqual({
      dataVersion: 4,
      priorityCategories: [],
      recoveryActivities: ["walk", "screenBreak", "calmHobby", "socialContact", "breathing", "sleepRoutine", "outdoors"]
    });
  });

  it("preserves v0.3.0 habit metadata and skipped generated task fields", () => {
    const state = createEmptyState("Tester", "2026-07-08T10:00:00.000Z");
    const habit = state.habits[0];
    const withPlan = {
      ...state,
      dailyPlans: [
        {
          id: "plan-2026-07-08",
          localDate: "2026-07-08",
          intensity: "normal" as const,
          tasks: [
            {
              id: "2026-07-08-task",
              habitId: habit.id,
              trackKey: habit.trackKey,
              pillar: habit.pillar,
              title: habit.title,
              description: habit.description,
              category: habit.category,
              difficulty: habit.difficulty,
              estimatedMinutes: habit.estimatedMinutes,
              xp: habit.xp,
              sourceName: habit.sourceName,
              sourceUrl: habit.sourceUrl,
              sourceNote: habit.sourceNote,
              expectedEffect: habit.expectedEffect,
              reason: "Wybrane z testu.",
              edited: false,
              skippedAt: "2026-07-08T18:00:00.000Z",
              skipReason: "tooMuchToday" as const
            }
          ],
          insights: [],
          createdAt: "2026-07-08T10:00:00.000Z",
          updatedAt: "2026-07-08T18:00:00.000Z"
        }
      ]
    };

    const imported = importAppState(exportAppState(withPlan));

    expect(imported.habits[0].pack).toBe("v0.3-core");
    expect(imported.dailyPlans[0].tasks[0].trackKey).toBe(habit.trackKey);
    expect(imported.dailyPlans[0].tasks[0].skipReason).toBe("tooMuchToday");
    expect(imported.dailyPlans[0].tasks[0].skippedAt).toBe("2026-07-08T18:00:00.000Z");
  });

  it("defaults imported daily plans without mode to standard", () => {
    const state = createEmptyState("Tester", "2026-07-08T10:00:00.000Z");
    const habit = state.habits[0];
    const raw = JSON.stringify({
      ...state,
      dailyPlans: [
        {
          id: "plan-2026-07-08",
          localDate: "2026-07-08",
          intensity: "normal",
          tasks: [
            {
              id: "2026-07-08-task",
              habitId: habit.id,
              trackKey: habit.trackKey,
              pillar: habit.pillar,
              title: habit.title,
              description: habit.description,
              category: habit.category,
              difficulty: habit.difficulty,
              estimatedMinutes: habit.estimatedMinutes,
              xp: habit.xp,
              sourceName: habit.sourceName,
              sourceUrl: habit.sourceUrl,
              sourceNote: habit.sourceNote,
              expectedEffect: habit.expectedEffect,
              reason: "Wybrane z testu.",
              edited: false
            }
          ],
          insights: [],
          createdAt: "2026-07-08T10:00:00.000Z",
          updatedAt: "2026-07-08T10:00:00.000Z"
        }
      ]
    });

    const imported = importAppState(raw);

    expect(imported.dailyPlans[0].mode).toBe("standard");
  });

  it("fills missing v0.3.0 habit fields from the default catalog", () => {
    const oldState = createEmptyState("Tester", "2026-07-08T10:00:00.000Z");
    const defaultHabit = createHabitLibrary(oldState.profile.createdAt)[0];
    const oldHabit = { ...oldState.habits[0] };
    delete (oldHabit as Partial<typeof oldHabit>).pillar;
    delete (oldHabit as Partial<typeof oldHabit>).pack;
    delete (oldHabit as Partial<typeof oldHabit>).trackKey;
    const raw = JSON.stringify({
      ...oldState,
      habits: [oldHabit]
    });

    const imported = importAppState(raw);

    expect(imported.habits[0].pillar).toBe(oldState.habits[0].pillar);
    expect(imported.habits[0].pack).toBe("v0.3-core");
    expect(imported.habits[0].trackKey).toBe(defaultHabit.trackKey);
  });

  it("adds new built-in habits when importing a state with an older partial habit library", () => {
    const oldState = createEmptyState("Tester", "2026-07-08T10:00:00.000Z");
    const partialHabits = oldState.habits.slice(0, 11).map((habit, index) => ({
      ...habit,
      enabled: index !== 0
    }));
    const raw = JSON.stringify({
      ...oldState,
      habits: partialHabits
    });

    const imported = importAppState(raw);

    expect(imported.habits).toHaveLength(100);
    expect(imported.habits[0].id).toBe(partialHabits[0].id);
    expect(imported.habits[0].enabled).toBe(false);
    expect(imported.habits.some((habit) => habit.id === "weekly-win-review")).toBe(true);
  });

  it("refreshes built-in habit copy during import while preserving user settings", () => {
    const oldState = createEmptyState("Tester", "2026-07-08T10:00:00.000Z");
    const oldHabit = {
      ...oldState.habits[0],
      title: "Skan wydatkow 10 minut",
      description: "Przejrzyj ostatnie wydatki i zapisz jedna obserwacje.",
      enabled: false
    };
    const raw = JSON.stringify({
      ...oldState,
      habits: [oldHabit]
    });

    const imported = importAppState(raw);

    expect(imported.habits[0].title).toBe("Skan wydatków 10 minut");
    expect(imported.habits[0].description).toBe("Przejrzyj ostatnie wydatki i zapisz jedną obserwację.");
    expect(imported.habits[0].enabled).toBe(false);
  });

  it("refreshes unedited generated task copy from the canonical habit catalog", () => {
    const oldState = createEmptyState("Tester", "2026-07-08T10:00:00.000Z");
    const raw = JSON.stringify({
      ...oldState,
      dailyPlans: [
        {
          id: "plan-2026-07-08",
          localDate: "2026-07-08",
          intensity: "normal",
          tasks: [
            {
              ...oldState.dailyPlans[0]?.tasks[0],
              id: "2026-07-08-money-scan",
              habitId: "money-scan",
              title: "Skan wydatkow 10 minut",
              description: "Przejrzyj ostatnie wydatki i zapisz jedna obserwacje.",
              category: "Finanse",
              difficulty: "light",
              estimatedMinutes: 10,
              xp: 20,
              sourceName: "CFPB Financial Education",
              sourceUrl: "https://www.consumerfinance.gov/consumer-tools/educator-tools/adult-financial-education/tools-and-resources/",
              sourceNote: "CFPB udostępnia narzędzia do planowania wydatków, rachunków, oszczędzania i decyzji finansowych.",
              expectedEffect: "mniejszy chaos finansowy",
              reason: "Wybrane z bazy CFPB Financial Education.",
              edited: false
            }
          ],
          insights: [],
          createdAt: "2026-07-08T10:00:00.000Z",
          updatedAt: "2026-07-08T10:00:00.000Z"
        }
      ]
    });

    const imported = importAppState(raw);

    expect(imported.dailyPlans[0].tasks[0].title).toBe("Skan wydatków 10 minut");
    expect(imported.dailyPlans[0].tasks[0].description).toBe("Przejrzyj ostatnie wydatki i zapisz jedną obserwację.");
  });

  it("fills missing v0.3.0 habit fields for unknown custom habits", () => {
    const oldState = createEmptyState("Tester", "2026-07-08T10:00:00.000Z");
    const customHabit = {
      ...oldState.habits[0],
      id: "custom-focus",
      title: "Custom focus block",
      description: "Protect a custom deep work block.",
      category: "Skupienie" as const
    };
    delete (customHabit as Partial<typeof customHabit>).pillar;
    delete (customHabit as Partial<typeof customHabit>).pack;
    delete (customHabit as Partial<typeof customHabit>).trackKey;
    const raw = JSON.stringify({
      ...oldState,
      habits: [customHabit]
    });

    const imported = importAppState(raw);
    const importedCustomHabit = imported.habits.find((habit) => habit.id === "custom-focus");

    expect(importedCustomHabit?.pillar).toBe("confidence");
    expect(importedCustomHabit?.pack).toBe("v0.3-core");
    expect(importedCustomHabit?.trackKey).toBe("custom-focus");
    expect(importedCustomHabit?.title).toBe("Custom focus block");
    expect(importedCustomHabit?.description).toBe("Protect a custom deep work block.");
    expect(importedCustomHabit?.category).toBe("Skupienie");
  });
});
