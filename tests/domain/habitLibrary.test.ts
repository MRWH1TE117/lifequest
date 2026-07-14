import { describe, expect, it } from "vitest";
import { createHabitLibrary, filterHabits, getHabitCategoryCounts } from "../../src/domain/habitLibrary";

describe("habit library", () => {
  it("creates exactly 100 source-backed enabled habits", () => {
    const habits = createHabitLibrary("2026-07-07T12:00:00.000Z");

    expect(habits).toHaveLength(100);
    expect(habits.every((habit) => habit.enabled)).toBe(true);
    expect(habits.every((habit) => habit.sourceName.length > 2)).toBe(true);
    expect(habits.every((habit) => habit.sourceUrl.startsWith("https://"))).toBe(true);
    expect(habits.every((habit) => habit.sourceNote.length > 20)).toBe(true);
    expect(habits.every((habit) => habit.expectedEffect.length > 5)).toBe(true);
  });

  it("returns exact category counts for the core catalog", () => {
    const habits = createHabitLibrary("2026-07-07T12:00:00.000Z");
    const counts = getHabitCategoryCounts(habits);

    expect(counts).toEqual({
      Energia: 13,
      Cialo: 13,
      Umysl: 12,
      Skupienie: 13,
      Rozwoj: 12,
      Finanse: 12,
      Relacje: 13,
      Porzadek: 12
    });
    expect(counts.Energia + counts.Cialo).toBe(26);
  });

  it("adds v0.3.0 analytics metadata to every built-in habit", () => {
    const habits = createHabitLibrary("2026-07-08T12:00:00.000Z");

    expect(habits.every((habit) => habit.pillar.length > 2)).toBe(true);
    expect(habits.filter((habit) => habit.pack === "v0.3-core")).toHaveLength(60);
    expect(habits.filter((habit) => habit.pack === "v0.5-balanced")).toHaveLength(40);
    expect(habits.every((habit) => habit.trackKey.length > 4)).toBe(true);
    expect(new Set(habits.map((habit) => habit.trackKey)).size).toBe(habits.length);
  });

  it("uses Polish diacritics in user-visible habit content", () => {
    const habits = createHabitLibrary("2026-07-08T12:00:00.000Z");
    const visibleText = habits
      .map((habit) =>
        [
          habit.title,
          habit.description,
          habit.minimumVersion ?? "",
          habit.sourceNote,
          habit.expectedEffect
        ].join(" ")
      )
      .join(" ");

    expect(visibleText).not.toMatch(
      /\b(?:Zrob|zrob|Sprawdz|sprawdz|Przeglad|przeglad|Piec|piec|Krotk|krotk|maly|mala|ktory|ktora|wazny|wazna|nastepny|dzien|bled|bledach|latwiejsz|wiecej|porzadek|oszczed|platnosc|budzet|miesiac|powtorek|pojec|slowek|pamietywanie|swiatlo|lozku|wode|balaganu|zaleglosc|zamkniecia|lagodny|jakosc|porown|finansow)\b/
    );
  });

  it("filters habits by category, difficulty, duration, and enabled state", () => {
    const habits = createHabitLibrary("2026-07-08T12:00:00.000Z");
    const disabledId = "money-scan";
    const locallyDisabledHabits = habits.map((habit) =>
      habit.id === disabledId ? { ...habit, enabled: false } : habit
    );

    const enabledFinanceHabits = filterHabits(locallyDisabledHabits, {
      category: "Finanse",
      difficulty: "light",
      maxMinutes: 10,
      enabled: true
    });

    expect(enabledFinanceHabits.length).toBeGreaterThan(0);
    expect(enabledFinanceHabits.every((habit) => habit.category === "Finanse")).toBe(true);
    expect(enabledFinanceHabits.every((habit) => habit.difficulty === "light")).toBe(true);
    expect(enabledFinanceHabits.every((habit) => habit.estimatedMinutes <= 10)).toBe(true);
    expect(enabledFinanceHabits.every((habit) => habit.enabled)).toBe(true);
    expect(enabledFinanceHabits.map((habit) => habit.id)).not.toContain(disabledId);

    const disabledFinanceHabits = filterHabits(locallyDisabledHabits, {
      category: "Finanse",
      difficulty: "light",
      maxMinutes: 10,
      enabled: false
    });

    expect(disabledFinanceHabits.map((habit) => habit.id)).toContain(disabledId);
  });
});
