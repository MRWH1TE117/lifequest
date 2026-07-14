import { getMondayWeekRange } from "./dates";
import type { DayIntensity, Goal, QuestCompletion, WeeklyPlan, WeeklyStep } from "./model";

export type WeeklyStepProgress = { completed: number; target: number };

export function validateWeeklyPlan(plan: WeeklyPlan, goals: Goal[]): string[] {
  const errors: string[] = [];
  const uniquePriorities = new Set(plan.priorityGoalIds);
  const goalsById = new Map(goals.map((goal) => [goal.id, goal]));
  const prioritiesValid =
    plan.priorityGoalIds.length >= 1 &&
    plan.priorityGoalIds.length <= 3 &&
    uniquePriorities.size === plan.priorityGoalIds.length &&
    plan.priorityGoalIds.every((id) => goalsById.get(id)?.status === "active");
  if (!prioritiesValid) errors.push("priorityGoalIds");
  if (plan.steps.some((step) => !uniquePriorities.has(step.goalId))) errors.push("steps");
  return errors;
}

export function getWeeklyPlanForDate(plans: WeeklyPlan[], localDate: string): WeeklyPlan | undefined {
  const weekStart = getMondayWeekRange(localDate).weekStart;
  return plans.find((plan) => plan.weekStart === weekStart);
}

export function buildWeeklyStepProgress(
  plan: WeeklyPlan,
  completions: QuestCompletion[]
): Map<string, WeeklyStepProgress> {
  const { weekStart, weekEnd } = getMondayWeekRange(plan.weekStart);
  const uniqueCompletionIds = new Set<string>();
  const counts = new Map<string, number>();
  for (const completion of completions) {
    if (!completion.weeklyStepId || completion.localDate < weekStart || completion.localDate > weekEnd) continue;
    if (uniqueCompletionIds.has(completion.questId)) continue;
    uniqueCompletionIds.add(completion.questId);
    counts.set(completion.weeklyStepId, (counts.get(completion.weeklyStepId) ?? 0) + 1);
  }

  return new Map(
    plan.steps.map((step) => [
      step.id,
      { completed: Math.min(counts.get(step.id) ?? 0, step.targetCount), target: step.targetCount }
    ])
  );
}

export function isWeeklyStepComplete(step: WeeklyStep, progress: Map<string, WeeklyStepProgress>): boolean {
  const row = progress.get(step.id);
  return Boolean(row && row.completed >= row.target);
}

export function getDueWeeklySteps(
  plan: WeeklyPlan,
  localDate: string,
  completions: QuestCompletion[]
): WeeklyStep[] {
  if (plan.status !== "confirmed") return [];
  const range = getMondayWeekRange(plan.weekStart);
  if (localDate < range.weekStart || localDate > range.weekEnd) return [];
  const progress = buildWeeklyStepProgress(plan, completions);
  const weekday = new Date(`${localDate}T12:00:00`).getDay();
  return plan.steps.filter(
    (step) =>
      !isWeeklyStepComplete(step, progress) &&
      (step.scheduledWeekdays.length === 0 || step.scheduledWeekdays.includes(weekday))
  );
}

export function createCarryOverDraft(
  previousPlan: WeeklyPlan,
  nextWeekStart: string,
  goals: Goal[],
  completions: QuestCompletion[],
  nowIso: string
): WeeklyPlan {
  const activeGoalIds = new Set(goals.filter((goal) => goal.status === "active").map((goal) => goal.id));
  const priorityGoalIds = previousPlan.priorityGoalIds.filter((id) => activeGoalIds.has(id)).slice(0, 3);
  const progress = buildWeeklyStepProgress(previousPlan, completions);
  const steps = previousPlan.steps
    .filter((step) => priorityGoalIds.includes(step.goalId) && !isWeeklyStepComplete(step, progress))
    .map((step) => ({ ...step, createdAt: nowIso, updatedAt: nowIso }));
  return {
    id: `week-${nextWeekStart}`,
    weekStart: nextWeekStart,
    priorityGoalIds,
    steps,
    status: "draft",
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

export function selectDailyGoalSteps(
  plan: WeeklyPlan,
  goals: Goal[],
  completions: QuestCompletion[],
  localDate: string,
  intensity: DayIntensity,
  recoveryMode: boolean
): WeeklyStep[] {
  const activeGoalIds = new Set(goals.filter((goal) => goal.status === "active").map((goal) => goal.id));
  const priorityIndex = new Map(plan.priorityGoalIds.map((id, index) => [id, index]));
  const candidates = getDueWeeklySteps(plan, localDate, completions)
    .filter((step) => activeGoalIds.has(step.goalId))
    .filter(
      (step) =>
        !recoveryMode ||
        (Boolean(step.minimumVersion?.trim()) &&
          typeof step.minimumEstimatedMinutes === "number" &&
          step.minimumEstimatedMinutes <= 10)
    )
    .sort(
      (a, b) =>
        (priorityIndex.get(a.goalId) ?? Number.MAX_SAFE_INTEGER) -
          (priorityIndex.get(b.goalId) ?? Number.MAX_SAFE_INTEGER) ||
        a.id.localeCompare(b.id)
    );
  const limit = intensity === "strong" && !recoveryMode ? 2 : 1;
  const selected: WeeklyStep[] = [];
  const usedGoalIds = new Set<string>();
  for (const step of candidates) {
    if (selected.length >= limit) break;
    if (usedGoalIds.has(step.goalId)) continue;
    selected.push(step);
    usedGoalIds.add(step.goalId);
  }
  return selected;
}
