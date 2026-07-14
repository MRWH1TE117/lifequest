import type {
  AppState,
  DailyPlan,
  DevelopmentExperiment,
  ExperimentReview,
  Habit,
  LifeStat,
  QuestCompletion,
  WeeklyStep
} from "./model";

export type ExperimentSummary = {
  scheduled: number;
  full: number;
  minimum: number;
  skipped: number;
  completionRate: number;
};

export function validateExperiment(experiment: DevelopmentExperiment): string[] {
  const errors: string[] = [];
  if (!experiment.title.trim()) errors.push("Podaj nazwę eksperymentu.");
  if (!experiment.description.trim()) errors.push("Podaj zachowanie do sprawdzenia.");
  if (!experiment.contextCue.trim()) errors.push("Podaj konkretny kontekst wykonania.");
  if (experiment.durationDays !== 7 && experiment.durationDays !== 14) errors.push("Eksperyment musi trwać 7 lub 14 dni.");
  if (!isLocalDate(experiment.startDate)) errors.push("Podaj prawidłową datę rozpoczęcia.");
  if (!experiment.scheduledWeekdays.length || experiment.scheduledWeekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    errors.push("Wybierz co najmniej jeden dzień tygodnia.");
  }
  if (!Number.isFinite(experiment.estimatedMinutes) || experiment.estimatedMinutes < 1) errors.push("Czas pełnej wersji musi wynosić co najmniej minutę.");
  if (experiment.minimumVersion || experiment.minimumEstimatedMinutes !== undefined) {
    if (!experiment.minimumVersion?.trim()) errors.push("Opisz minimalną wersję działania.");
    if (!Number.isFinite(experiment.minimumEstimatedMinutes) || experiment.minimumEstimatedMinutes! < 1 || experiment.minimumEstimatedMinutes! > 10) {
      errors.push("Minimalna wersja musi trwać od 1 do 10 minut.");
    }
  }
  if (experiment.sourceKind === "habit" && !experiment.linkedHabitId) errors.push("Wybierz aktywny habit źródłowy.");
  if (experiment.sourceKind === "weeklyStep" && (!experiment.linkedWeeklyStepId || !experiment.linkedGoalId)) errors.push("Wybierz krok bieżącego planu tygodnia.");
  return errors;
}

export function createExperimentFromHabit(habit: Habit, startDate: string, nowIso: string): DevelopmentExperiment {
  return {
    id: crypto.randomUUID(), sourceKind: "habit", linkedHabitId: habit.id,
    title: habit.title, description: habit.description, lifeStat: toLifeStat(habit.category), startDate,
    durationDays: 7, scheduledWeekdays: [1, 2, 3, 4, 5], estimatedMinutes: habit.estimatedMinutes,
    minimumVersion: habit.minimumVersion, minimumEstimatedMinutes: habit.minimumVersion ? Math.min(10, habit.estimatedMinutes) : undefined,
    contextCue: "", status: "draft", createdAt: nowIso, updatedAt: nowIso
  };
}

export function createExperimentFromWeeklyStep(step: WeeklyStep, lifeStat: LifeStat, startDate: string, nowIso: string): DevelopmentExperiment {
  return {
    id: crypto.randomUUID(), sourceKind: "weeklyStep", linkedGoalId: step.goalId, linkedWeeklyStepId: step.id,
    title: step.title, description: "Krok z bieżącego planu tygodnia.", lifeStat, startDate,
    durationDays: 7, scheduledWeekdays: [...step.scheduledWeekdays], estimatedMinutes: step.estimatedMinutes,
    minimumVersion: step.minimumVersion, minimumEstimatedMinutes: step.minimumEstimatedMinutes,
    contextCue: "", obstacle: step.obstacle, ifThenPlan: step.ifThenPlan,
    status: "draft", createdAt: nowIso, updatedAt: nowIso
  };
}

export function getOpenExperiment(experiments: DevelopmentExperiment[]): DevelopmentExperiment | undefined {
  return experiments.find((item) => item.status === "draft" || item.status === "active");
}

export function getActiveExperiment(experiments: DevelopmentExperiment[]): DevelopmentExperiment | undefined {
  return experiments.find((item) => item.status === "active");
}

export function activateExperiment(experiment: DevelopmentExperiment, nowIso: string): DevelopmentExperiment {
  const errors = validateExperiment(experiment);
  if (errors.length) throw new Error(errors[0]);
  return { ...experiment, status: "active", updatedAt: nowIso, endedAt: undefined };
}

export function stopExperiment(experiment: DevelopmentExperiment, nowIso: string): DevelopmentExperiment {
  return { ...experiment, status: "stopped", endedAt: nowIso, updatedAt: nowIso };
}

export function completeExperiment(experiment: DevelopmentExperiment, nowIso: string): DevelopmentExperiment {
  return { ...experiment, status: "completed", endedAt: nowIso, updatedAt: nowIso };
}

export function saveExperimentReview(reviews: ExperimentReview[], review: ExperimentReview): ExperimentReview[] {
  return [...reviews.filter((item) => item.experimentId !== review.experimentId), review];
}

export function getExperimentEndDate(experiment: DevelopmentExperiment): string {
  return shiftDate(experiment.startDate, experiment.durationDays - 1);
}

export function isExperimentInDateRange(experiment: DevelopmentExperiment, localDate: string): boolean {
  const naturalEnd = getExperimentEndDate(experiment);
  const endedDate = experiment.endedAt?.slice(0, 10);
  const end = endedDate && endedDate < naturalEnd ? endedDate : naturalEnd;
  return localDate >= experiment.startDate && localDate <= end;
}

export function isExperimentScheduledForDate(experiment: DevelopmentExperiment, localDate: string): boolean {
  if (experiment.status !== "active" || !isExperimentInDateRange(experiment, localDate)) return false;
  return experiment.scheduledWeekdays.includes(new Date(`${localDate}T12:00:00`).getDay());
}

export function buildExperimentSummary(
  experiment: DevelopmentExperiment,
  completions: QuestCompletion[],
  dailyPlans: DailyPlan[]
): ExperimentSummary {
  const lastDate = experiment.endedAt?.slice(0, 10) ?? getExperimentEndDate(experiment);
  let scheduled = 0;
  for (let date = experiment.startDate; date <= lastDate && date <= getExperimentEndDate(experiment); date = shiftDate(date, 1)) {
    if (experiment.scheduledWeekdays.includes(new Date(`${date}T12:00:00`).getDay())) scheduled += 1;
  }
  const matching = completions.filter((item) => item.experimentId === experiment.id);
  const full = matching.filter((item) => item.experimentVariant !== "minimum").length;
  const minimum = matching.filter((item) => item.experimentVariant === "minimum").length;
  const skipped = dailyPlans.flatMap((plan) => plan.tasks).filter((task) => task.experimentId === experiment.id && task.skippedAt).length;
  return { scheduled, full, minimum, skipped, completionRate: scheduled ? Math.round(((full + minimum) / scheduled) * 100) : 0 };
}

export function normalizeExperiments(value: unknown, state: Pick<AppState, "habits" | "goals" | "weeklyPlans">): DevelopmentExperiment[] {
  if (!Array.isArray(value)) return [];
  const habitIds = new Set(state.habits.filter((item) => item.enabled).map((item) => item.id));
  const goalIds = new Set(state.goals.map((item) => item.id));
  const stepIds = new Set(state.weeklyPlans.flatMap((plan) => plan.steps.map((step) => step.id)));
  let openKept = false;
  return value.filter((raw): raw is DevelopmentExperiment => {
    const item = raw as DevelopmentExperiment;
    if (!item || typeof item.id !== "string" || !["habit", "weeklyStep"].includes(item.sourceKind) || !["draft", "active", "completed", "stopped"].includes(item.status)) return false;
    if (validateExperiment(item).length) return false;
    const isOpen = item.status === "draft" || item.status === "active";
    if (isOpen && item.sourceKind === "habit" && !habitIds.has(item.linkedHabitId!)) return false;
    if (isOpen && item.sourceKind === "weeklyStep" && (!goalIds.has(item.linkedGoalId!) || !stepIds.has(item.linkedWeeklyStepId!))) return false;
    if (item.status === "draft" || item.status === "active") {
      if (openKept) return false;
      openKept = true;
    }
    item.scheduledWeekdays = [...new Set(item.scheduledWeekdays)];
    return true;
  });
}

export function normalizeExperimentReviews(value: unknown, experiments: DevelopmentExperiment[]): ExperimentReview[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set(experiments.map((item) => item.id));
  return value.filter((raw): raw is ExperimentReview => {
    const item = raw as ExperimentReview;
    return Boolean(item && typeof item.id === "string" && ids.has(item.experimentId) && ["continue", "simplify", "changeContext", "stop"].includes(item.decision));
  });
}

function toLifeStat(category: Habit["category"]): LifeStat { return category === "Porzadek" ? "Skupienie" : category; }
function isLocalDate(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value); }
function shiftDate(localDate: string, days: number): string {
  const date = new Date(`${localDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
