import type { DailyPlan, Habit, HabitCategory, QuestCompletion, SkipReason } from "./model";

export type PersonalizationSignals = {
  priorityCategories: Set<HabitCategory>;
  completionAgeByHabitId: Map<string, number>;
  skipEffectsByHabitId: Map<string, Set<SkipReason>>;
};

export type BuildPersonalizationSignalsInput = {
  localDate: string;
  priorityCategories: HabitCategory[];
  completions: QuestCompletion[];
  previousPlans: DailyPlan[];
};

export function buildPersonalizationSignals({
  localDate,
  priorityCategories,
  completions,
  previousPlans
}: BuildPersonalizationSignalsInput): PersonalizationSignals {
  const today = toDayNumber(localDate);
  const taskHabitIds = new Map<string, string>();

  for (const plan of previousPlans) {
    for (const task of plan.tasks) {
      taskHabitIds.set(task.id, task.habitId);
    }
  }

  const completionAgeByHabitId = new Map<string, number>();
  const skipEffectsByHabitId = new Map<string, Set<SkipReason>>();

  for (const completion of completions) {
    const habitId = taskHabitIds.get(completion.questId);
    if (!habitId) continue;

    const age = today - toDayNumber(completion.localDate);
    if (age < 0 || age >= 14) continue;

    const currentAge = completionAgeByHabitId.get(habitId);
    if (currentAge === undefined || age < currentAge) {
      completionAgeByHabitId.set(habitId, age);
    }
  }

  for (const plan of previousPlans) {
    for (const task of plan.tasks) {
      if (!task.skipReason) continue;

      const skipDate = task.skippedAt ? task.skippedAt.slice(0, 10) : plan.localDate;
      const age = today - toDayNumber(skipDate);
      if (age < 0 || age >= skipWindowDays(task.skipReason)) continue;

      const effects = skipEffectsByHabitId.get(task.habitId) ?? new Set<SkipReason>();
      effects.add(task.skipReason);
      skipEffectsByHabitId.set(task.habitId, effects);
    }
  }

  return {
    priorityCategories: new Set(priorityCategories),
    completionAgeByHabitId,
    skipEffectsByHabitId
  };
}

export function scorePersonalization(habit: Habit, signals: PersonalizationSignals): number {
  let score = signals.priorityCategories.has(habit.category) ? 24 : 0;
  const age = signals.completionAgeByHabitId.get(habit.id);
  if (age !== undefined && age < 14) score += Math.max(2, 14 - age);

  const effects = signals.skipEffectsByHabitId.get(habit.id) ?? new Set<SkipReason>();
  if (effects.has("notRelevant")) score -= 60;
  if (effects.has("noTime")) score += habit.estimatedMinutes <= 10 ? 18 : -20;
  if (effects.has("tooHard")) score += habit.difficulty === "light" ? 18 : -25;
  if (effects.has("tooMuchToday") && habit.estimatedMinutes > 15) score -= 12;

  return score;
}

function toDayNumber(localDate: string): number {
  return Date.parse(`${localDate}T00:00:00.000Z`) / 86_400_000;
}

function skipWindowDays(reason: SkipReason): number {
  if (reason === "notRelevant") return 30;
  if (reason === "tooMuchToday") return 7;
  return 14;
}
