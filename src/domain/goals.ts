import type { Goal, GoalStatus, WeeklyPlan } from "./model";

export type GoalFieldError = "title" | "outcome" | "reason" | "targetDate";

export function validateGoal(goal: Goal): GoalFieldError[] {
  const errors: GoalFieldError[] = [];
  if (!goal.title.trim()) errors.push("title");
  if (!goal.outcome.trim()) errors.push("outcome");
  if (!goal.reason.trim()) errors.push("reason");
  if (goal.kind === "outcome" && goal.status === "active" && !isValidLocalDate(goal.targetDate)) errors.push("targetDate");
  return errors;
}

export function transitionGoalStatus(goal: Goal, status: GoalStatus, nowIso: string): Goal {
  return {
    ...goal,
    status,
    updatedAt: nowIso,
    completedAt: status === "completed" ? nowIso : undefined
  };
}

export function normalizeGoalLinks(goal: Goal, validHabitIds: Set<string>, validQuestIds: Set<string>): Goal {
  return {
    ...goal,
    linkedHabitIds: [...new Set(goal.linkedHabitIds)].filter((id) => validHabitIds.has(id)),
    linkedQuestIds: [...new Set(goal.linkedQuestIds)].filter((id) => validQuestIds.has(id))
  };
}

export function resolveGoalForAction(
  goals: Goal[],
  weeklyPlan: WeeklyPlan | undefined,
  action: { habitId?: string; questId?: string }
): Goal | null {
  if (!weeklyPlan || weeklyPlan.status !== "confirmed") return null;
  const goalsById = new Map(goals.map((goal) => [goal.id, goal]));

  for (const goalId of weeklyPlan.priorityGoalIds) {
    const goal = goalsById.get(goalId);
    if (!goal || goal.status !== "active") continue;
    if (action.habitId && goal.linkedHabitIds.includes(action.habitId)) return goal;
    if (action.questId && goal.linkedQuestIds.includes(action.questId)) return goal;
  }

  return null;
}

function isValidLocalDate(value: string | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` === value;
}
