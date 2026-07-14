import type { Habit, HabitCategory, HabitDifficulty } from "./model";
import { BALANCED_HABITS } from "./habits/balancedHabits";
import { CORE_HABITS } from "./habits/coreHabits";

export type HabitFilters = {
  category?: HabitCategory;
  difficulty?: HabitDifficulty;
  maxMinutes?: number;
  enabled?: boolean;
};

const HABIT_CATEGORIES: HabitCategory[] = [
  "Energia",
  "Cialo",
  "Umysl",
  "Skupienie",
  "Rozwoj",
  "Finanse",
  "Relacje",
  "Porzadek"
];

export function createHabitLibrary(nowIso: string): Habit[] {
  return [...CORE_HABITS, ...BALANCED_HABITS].map((template) => ({ ...template, createdAt: nowIso }));
}

export function getHabitCategoryCounts(habits: Habit[]): Record<HabitCategory, number> {
  const counts = Object.fromEntries(HABIT_CATEGORIES.map((category) => [category, 0])) as Record<
    HabitCategory,
    number
  >;

  for (const habit of habits) {
    counts[habit.category] += 1;
  }

  return counts;
}

export function filterHabits(habits: Habit[], filters: HabitFilters): Habit[] {
  return habits.filter((habit) => {
    if (filters.category !== undefined && habit.category !== filters.category) {
      return false;
    }

    if (filters.difficulty !== undefined && habit.difficulty !== filters.difficulty) {
      return false;
    }

    if (filters.maxMinutes !== undefined && habit.estimatedMinutes > filters.maxMinutes) {
      return false;
    }

    if (filters.enabled !== undefined && habit.enabled !== filters.enabled) {
      return false;
    }

    return true;
  });
}
