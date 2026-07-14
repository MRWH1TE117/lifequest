import { buildPersonalizationSignals, scorePersonalization, type PersonalizationSignals } from "./personalization";
import { filterRecoveryTemplates, isRecoveryMode, RECOVERY_TEMPLATES, type RecoveryTemplate } from "./recovery";
import { getWeeklyPlanForDate, selectDailyGoalSteps } from "./weeklyPlanning";
import { getActiveExperiment, isExperimentScheduledForDate } from "./experiments";
import { RECOVERY_ACTIVITIES, type DailyPlan, type DayIntensity, type DayState, type DevelopmentExperiment, type GeneratedTask, type Goal, type Habit, type HabitCategory, type HabitPillar, type QuestCompletion, type Settings, type WeeklyPlan, type WeeklyStep } from "./model";

type GenerateDailyPlanInput = {
  habits: Habit[];
  localDate: string;
  intensity: DayIntensity;
  completions: QuestCompletion[];
  dayStates: DayState[];
  settings?: Settings;
  previousPlans?: DailyPlan[];
  excludedHabitIds?: string[];
  excludedWeeklyStepIds?: string[];
  goals?: Goal[];
  weeklyPlans?: WeeklyPlan[];
  experiments?: DevelopmentExperiment[];
};

const TARGET_COUNTS: Record<DayIntensity, number> = {
  light: 4,
  normal: 5,
  strong: 6
};

const CATEGORY_PRIORITY: HabitCategory[] = ["Energia", "Finanse", "Rozwoj", "Skupienie", "Cialo", "Relacje", "Porzadek", "Umysl"];

export function generateDailyPlan(input: GenerateDailyPlanInput): DailyPlan {
  const settings = input.settings ?? {
    dataVersion: 4,
    priorityCategories: [],
    recoveryActivities: [...RECOVERY_ACTIVITIES]
  };
  const recentLightDays = countRecentLightDays(input.dayStates, input.localDate);
  const recoveryMode = isRecoveryMode(input.dayStates, input.localDate);
  const effectiveIntensity = recentLightDays >= 4 && input.intensity !== "light" ? "light" : input.intensity;
  const targetCount = recoveryMode ? 3 : TARGET_COUNTS[effectiveIntensity];
  const goals = input.goals ?? [];
  const currentWeeklyPlan = getWeeklyPlanForDate(input.weeklyPlans ?? [], input.localDate);
  const excludedWeeklyStepIds = new Set(input.excludedWeeklyStepIds ?? []);
  const goalSteps = currentWeeklyPlan
    ? selectDailyGoalSteps(currentWeeklyPlan, goals, input.completions, input.localDate, effectiveIntensity, recoveryMode)
        .filter((step) => !excludedWeeklyStepIds.has(step.id))
    : [];
  const goalsById = new Map(goals.map((goal) => [goal.id, goal]));
  const goalTasks = goalSteps
    .map((step, index) => goalStepToTask(step, goalsById.get(step.goalId), input.localDate, recoveryMode, index))
    .filter((task): task is GeneratedTask => Boolean(task));
  const activeExperiment = getActiveExperiment(input.experiments ?? []);
  const experimentAlreadyHandled = input.completions.some((item) => item.experimentId === activeExperiment?.id && item.localDate === input.localDate) ||
    (input.previousPlans ?? []).some((plan) => plan.localDate === input.localDate && plan.tasks.some((task) => task.experimentId === activeExperiment?.id));
  const experimentTask = activeExperiment && !experimentAlreadyHandled && goalTasks.length < targetCount && isExperimentScheduledForDate(activeExperiment, input.localDate)
    ? experimentToTask(activeExperiment, input.localDate, recoveryMode)
    : undefined;
  const experimentTasks = experimentTask ? [experimentTask] : [];
  const habitTargetCount = Math.max(0, targetCount - goalTasks.length - experimentTasks.length);
  const neglectedCategories = getNeglectedCategories(input.completions);
  const skippedHabitIds = getRecentlySkippedHabitIds(input.previousPlans ?? [], input.localDate);
  const recentlyPlannedHabitIds = getRecentlyPlannedHabitIds(input.previousPlans ?? [], input.localDate);
  const excludedHabitIds = new Set(input.excludedHabitIds ?? []);
  const signals = buildPersonalizationSignals({
    localDate: input.localDate,
    priorityCategories: settings.priorityCategories,
    completions: input.completions,
    previousPlans: input.previousPlans ?? []
  });
  const enabledHabits = input.habits.filter((habit) => habit.enabled);
  const candidates = enabledHabits
    .filter((habit) => !excludedHabitIds.has(habit.id))
    .filter((habit) => effectiveIntensity !== "light" || habit.difficulty !== "strong")
    .sort((a, b) => compareHabits(a, b, neglectedCategories, skippedHabitIds, recentlyPlannedHabitIds, effectiveIntensity, input.localDate, signals));

  const rotationPool = candidates.filter((habit) => !recentlyPlannedHabitIds.has(habit.id));
  const selected = selectBalanced(rotationPool.length >= habitTargetCount ? rotationPool : candidates, habitTargetCount, neglectedCategories, settings.priorityCategories);
  const habitTasks = recoveryMode
    ? selectRecoveryTasks(input.localDate, settings, rotationPool, candidates, recentlyPlannedHabitIds, signals, habitTargetCount)
    : selected.map((habit, index) => toGeneratedTask(habit, input.localDate, index + goalTasks.length + experimentTasks.length, neglectedCategories, skippedHabitIds, effectiveIntensity, signals));
  const tasks = [...goalTasks, ...experimentTasks, ...habitTasks].slice(0, targetCount);
  const insights = [
    ...(recentLightDays >= 4 ? ["Ostatnio często wybierasz lżejszy plan. Sprawdź sen, obciążenie i największe źródło stresu."] : []),
    ...(recoveryMode ? ["Po kilku lżejszych dniach plan skupia się na regeneracji."] : [])
  ];
  const nowIso = `${input.localDate}T12:00:00.000Z`;

  return {
    id: `plan-${input.localDate}`,
    localDate: input.localDate,
    intensity: input.intensity,
    mode: recoveryMode ? "recovery" : "standard",
    tasks,
    insights,
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

function compareHabits(
  a: Habit,
  b: Habit,
  neglectedCategories: Set<HabitCategory>,
  skippedHabitIds: Set<string>,
  recentlyPlannedHabitIds: Set<string>,
  intensity: DayIntensity,
  localDate: string,
  signals: PersonalizationSignals
): number {
  const scoreDifference =
    scoreHabit(b, neglectedCategories, skippedHabitIds, recentlyPlannedHabitIds, intensity, signals) -
    scoreHabit(a, neglectedCategories, skippedHabitIds, recentlyPlannedHabitIds, intensity, signals);
  if (scoreDifference !== 0) return scoreDifference;
  return stableHash(`${localDate}-${a.id}`) - stableHash(`${localDate}-${b.id}`);
}

function scoreHabit(
  habit: Habit,
  neglectedCategories: Set<HabitCategory>,
  skippedHabitIds: Set<string>,
  recentlyPlannedHabitIds: Set<string>,
  intensity: DayIntensity,
  signals: PersonalizationSignals
): number {
  let score = neglectedCategories.has(habit.category) ? 100 : 0;
  score += CATEGORY_PRIORITY.length - CATEGORY_PRIORITY.indexOf(habit.category);
  if (skippedHabitIds.has(habit.id)) score -= 80;
  if (recentlyPlannedHabitIds.has(habit.id)) score -= 45;
  if (intensity === "light" && habit.difficulty === "light") score += 30;
  if (intensity === "light" && habit.estimatedMinutes <= 10) score += 15;
  if (intensity === "normal" && habit.difficulty !== "strong") score += 20;
  if (intensity === "strong" && habit.difficulty === "strong") score += 25;
  score += scorePersonalization(habit, signals);
  return score;
}

function selectBalanced(
  habits: Habit[],
  targetCount: number,
  neglectedCategories: Set<HabitCategory>,
  priorityCategories: HabitCategory[]
): Habit[] {
  const selected: Habit[] = [];
  const usedCategories = new Set<HabitCategory>();
  const categoryOrder = [...new Set([...priorityCategories, ...CATEGORY_PRIORITY])];

  for (const category of categoryOrder) {
    if (selected.length >= targetCount) break;
    const habit = habits.find((item) => item.category === category && !selected.includes(item));
    if (habit) {
      selected.push(habit);
      usedCategories.add(category);
    }
  }

  if (neglectedCategories.size > 0 && !selected.some((habit) => neglectedCategories.has(habit.category))) {
    const neglectedHabit = habits.find((habit) => neglectedCategories.has(habit.category));
    if (neglectedHabit) selected.unshift(neglectedHabit);
  }

  for (const habit of habits) {
    if (selected.length >= targetCount) break;
    if (!selected.includes(habit) && (!usedCategories.has(habit.category) || selected.length >= CATEGORY_PRIORITY.length)) {
      selected.push(habit);
      usedCategories.add(habit.category);
    }
  }

  return selected.slice(0, targetCount);
}

function toGeneratedTask(
  habit: Habit,
  localDate: string,
  index: number,
  neglectedCategories: Set<HabitCategory>,
  skippedHabitIds: Set<string>,
  effectiveIntensity: DayIntensity,
  signals: PersonalizationSignals
): GeneratedTask {
  return {
    id: `${localDate}-${habit.id}`,
    habitId: habit.id,
    origin: "habit",
    title: effectiveIntensity === "light" && habit.minimumVersion ? habit.title : habit.title,
    description: effectiveIntensity === "light" && habit.minimumVersion ? habit.minimumVersion : habit.description,
    category: habit.category,
    trackKey: habit.trackKey,
    pillar: habit.pillar,
    difficulty: effectiveIntensity === "light" && habit.difficulty === "strong" ? "normal" : habit.difficulty,
    estimatedMinutes: effectiveIntensity === "light" ? Math.min(habit.estimatedMinutes, 15) : habit.estimatedMinutes,
    xp: habit.xp,
    sourceName: habit.sourceName,
    sourceUrl: habit.sourceUrl,
    sourceNote: habit.sourceNote,
    expectedEffect: habit.expectedEffect,
    reason: buildReason(habit, index, neglectedCategories, skippedHabitIds, effectiveIntensity, signals),
    edited: false
  };
}

function buildReason(
  habit: Habit,
  index: number,
  neglectedCategories: Set<HabitCategory>,
  skippedHabitIds: Set<string>,
  effectiveIntensity: DayIntensity,
  signals: PersonalizationSignals
): string {
  if (index === 0 && skippedHabitIds.size > 0 && !skippedHabitIds.has(habit.id)) return "Wybrane jako łatwiejszy zamiennik po ostatnio pomijanej aktywności.";
  if (hasRecentNoTimeSkip(signals) && habit.estimatedMinutes <= 10) return "Wybrane jako krótsza propozycja po ostatnim braku czasu.";
  if (neglectedCategories.has(habit.category)) return `Wybrane, bo ${habit.category} było słabszym obszarem w ostatnich dniach.`;
  if (effectiveIntensity === "light") return "Wybrane jako lekki krok na dzień o niższej energii.";
  if (index === 0) return `Wybrane z bazy ${habit.sourceName}.`;
  return `Wspiera cel: ${habit.expectedEffect}.`;
}

function selectRecoveryTasks(
  localDate: string,
  settings: Settings,
  rotationPool: Habit[],
  candidates: Habit[],
  recentlyPlannedHabitIds: Set<string>,
  signals: PersonalizationSignals,
  targetCount: number
): GeneratedTask[] {
  const preferredTemplates = filterRecoveryTemplates(RECOVERY_TEMPLATES, settings.recoveryActivities).sort(
    (a, b) => stableHash(`${localDate}-${a.id}`) - stableHash(`${localDate}-${b.id}`)
  );
  const primaryLightHabits = eligibleRecoveryHabits(rotationPool);
  const backfillLightHabits = eligibleRecoveryHabits(candidates);
  const nonRecentTemplates = preferredTemplates.filter((template) => !recentlyPlannedHabitIds.has(template.id));
  const templatePool = nonRecentTemplates.length > 0 || primaryLightHabits.length >= targetCount ? nonRecentTemplates : preferredTemplates;
  const templateTasks = templatePool.slice(0, 1).map((template) => recoveryTemplateToTask(template, localDate));
  const usedHabitIds = new Set(templateTasks.map((task) => task.habitId));
  const habitTasks = [
    ...primaryLightHabits.filter((habit) => !usedHabitIds.has(habit.id)),
    ...backfillLightHabits.filter((habit) => !usedHabitIds.has(habit.id) && !primaryLightHabits.includes(habit))
  ]
    .slice(0, targetCount - templateTasks.length)
    .map((habit, index) => toGeneratedTask(habit, localDate, index + templateTasks.length, new Set(), new Set(), "light", signals));

  return [...templateTasks, ...habitTasks].slice(0, targetCount);
}

function eligibleRecoveryHabits(habits: Habit[]): Habit[] {
  return habits.filter((habit) => habit.difficulty === "light" && habit.estimatedMinutes <= 20);
}

function recoveryTemplateToTask(template: RecoveryTemplate, localDate: string): GeneratedTask {
  return {
    ...template,
    id: `${localDate}-${template.id}`,
    habitId: template.id,
    origin: "recovery",
    reason: "Łagodniejsza propozycja po kilku trudniejszych dniach.",
    edited: false
  };
}

function goalStepToTask(
  step: WeeklyStep,
  goal: Goal | undefined,
  localDate: string,
  recoveryMode: boolean,
  index: number
): GeneratedTask | null {
  if (!goal) return null;
  const useMinimum = recoveryMode && Boolean(step.minimumVersion) && typeof step.minimumEstimatedMinutes === "number";
  const estimatedMinutes = useMinimum ? step.minimumEstimatedMinutes! : step.estimatedMinutes;
  return {
    id: `${localDate}-goal-step-${step.id}`,
    habitId: `goal-step:${step.id}`,
    origin: "goalStep",
    goalId: goal.id,
    weeklyStepId: step.id,
    title: step.title,
    description: useMinimum ? step.minimumVersion! : "Krok zaplanowany w priorytetach tego tygodnia.",
    category: goal.lifeStat,
    trackKey: `goal-step:${step.id}`,
    pillar: lifeStatToPillar(goal.lifeStat),
    difficulty: useMinimum || estimatedMinutes <= 10 ? "light" : estimatedMinutes >= 40 ? "strong" : "normal",
    estimatedMinutes,
    xp: estimatedMinutes <= 10 ? 10 : estimatedMinutes <= 30 ? 20 : 30,
    sourceName: "Plan tygodnia",
    sourceUrl: "",
    sourceNote: "Krok zdefiniowany przez użytkownika.",
    expectedEffect: "Postęp w wybranym priorytecie tygodnia.",
    reason: `Krok priorytetu tygodnia: ${goal.title}.${index > 0 ? " Drugi krok mocnego dnia." : ""}`,
    edited: false
  };
}

function experimentToTask(experiment: DevelopmentExperiment, localDate: string, recoveryMode: boolean): GeneratedTask {
  const useMinimum = recoveryMode && Boolean(experiment.minimumVersion) && typeof experiment.minimumEstimatedMinutes === "number" && experiment.minimumEstimatedMinutes <= 10;
  const estimatedMinutes = useMinimum ? experiment.minimumEstimatedMinutes! : experiment.estimatedMinutes;
  const fullXp = experiment.estimatedMinutes <= 10 ? 10 : experiment.estimatedMinutes <= 30 ? 20 : 30;
  return {
    id: `experiment-${experiment.id}-${localDate}`,
    habitId: `experiment:${experiment.id}`,
    origin: "experiment",
    experimentId: experiment.id,
    goalId: experiment.linkedGoalId,
    weeklyStepId: experiment.linkedWeeklyStepId,
    title: experiment.title,
    description: useMinimum ? experiment.minimumVersion! : experiment.description,
    category: experiment.lifeStat,
    trackKey: `experiment:${experiment.id}`,
    pillar: lifeStatToPillar(experiment.lifeStat),
    difficulty: estimatedMinutes <= 10 ? "light" : estimatedMinutes >= 40 ? "strong" : "normal",
    estimatedMinutes,
    xp: fullXp,
    minimumVersion: experiment.minimumVersion,
    minimumEstimatedMinutes: experiment.minimumEstimatedMinutes,
    sourceName: "Eksperyment rozwojowy",
    sourceUrl: "",
    sourceNote: "Eksperyment zdefiniowany przez użytkownika.",
    expectedEffect: "Ocena wykonalności wybranego zachowania.",
    reason: `Zaplanowana próba w kontekście: ${experiment.contextCue}`,
    edited: false
  };
}

function lifeStatToPillar(stat: Goal["lifeStat"]): HabitPillar {
  if (stat === "Finanse") return "finance";
  if (stat === "Energia" || stat === "Cialo") return "energy";
  if (stat === "Relacje") return "relationships";
  if (stat === "Skupienie") return "order";
  if (stat === "Umysl") return "learning";
  return "career";
}

function hasRecentNoTimeSkip(signals: PersonalizationSignals): boolean {
  return [...signals.skipEffectsByHabitId.values()].some((effects) => effects.has("noTime"));
}

function getNeglectedCategories(completions: QuestCompletion[]): Set<HabitCategory> {
  const completed = new Set(completions.map((completion) => completion.lifeStat));
  return new Set(CATEGORY_PRIORITY.filter((category) => !completed.has(category as QuestCompletion["lifeStat"])));
}

function countRecentLightDays(dayStates: DayState[], localDate: string): number {
  return dayStates
    .filter((state) => state.localDate < localDate)
    .sort((a, b) => a.localDate.localeCompare(b.localDate))
    .slice(-7)
    .filter((state) => state.intensity === "light").length;
}

function getRecentlySkippedHabitIds(previousPlans: DailyPlan[], localDate: string): Set<string> {
  return new Set(
    previousPlans
      .filter((plan) => plan.localDate < localDate)
      .sort((a, b) => b.localDate.localeCompare(a.localDate))
      .slice(0, 7)
      .flatMap((plan) => plan.tasks)
      .filter((task) => task.skippedAt)
      .map((task) => task.habitId)
  );
}

function getRecentlyPlannedHabitIds(previousPlans: DailyPlan[], localDate: string): Set<string> {
  return new Set(
    previousPlans
      .filter((plan) => plan.localDate < localDate)
      .sort((a, b) => b.localDate.localeCompare(a.localDate))
      .slice(0, 1)
      .flatMap((plan) => plan.tasks)
      .map((task) => task.habitId)
  );
}

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
