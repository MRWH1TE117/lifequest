import { transitionGoalStatus } from "./goals";
import { buildWeeklyStepProgress } from "./weeklyPlanning";
import type { Goal, QuestCompletion, WeeklyPlan, WeeklyReview } from "./model";

export type GoalProgressInsight = {
  goalId: string;
  completed: number;
  target: number;
  body: string;
};

export function buildGoalProgressInsights(
  plan: WeeklyPlan,
  completions: QuestCompletion[]
): GoalProgressInsight[] {
  const progress = buildWeeklyStepProgress(plan, completions);
  return plan.priorityGoalIds.map((goalId) => {
    const steps = plan.steps.filter((step) => step.goalId === goalId);
    const completed = steps.reduce((sum, step) => sum + (progress.get(step.id)?.completed ?? 0), 0);
    const target = steps.reduce((sum, step) => sum + step.targetCount, 0);
    return {
      goalId,
      completed,
      target,
      body: `Wykonano ${completed} z ${target} zaplanowanych kroków.`
    };
  });
}

export function applyWeeklyReviewDecisions(
  goals: Goal[],
  review: WeeklyReview,
  nowIso: string
): Goal[] {
  const decisions = new Map(review.goalReviews.map((item) => [item.goalId, item.decision]));
  return goals.map((goal) => {
    const decision = decisions.get(goal.id);
    if (decision === "pause") return transitionGoalStatus(goal, "paused", nowIso);
    if (decision === "complete") return transitionGoalStatus(goal, "completed", nowIso);
    return goal;
  });
}
