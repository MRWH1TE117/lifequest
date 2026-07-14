import { RECOVERY_ACTIVITIES, type AppState, type HabitCategory, type RecoveryActivity, type Settings } from "./model";
import { createHabitLibrary } from "./habitLibrary";
import { createStarterQuests } from "./starterQuests";
import { normalizeGoalLinks, validateGoal } from "./goals";
import { normalizeExperimentReviews, normalizeExperiments } from "./experiments";

const DEFAULT_RECOVERY_ACTIVITIES: RecoveryActivity[] = [...RECOVERY_ACTIVITIES];

type ImportedSettings = {
  dataVersion?: number;
  priorityCategories?: unknown[];
  recoveryActivities?: unknown[];
};

export function createEmptyState(profileName: string, nowIso: string): AppState {
  return {
    profile: {
      name: profileName,
      totalXp: 0,
      createdAt: nowIso
    },
    quests: [],
    habits: createHabitLibrary(nowIso),
    dailyPlans: [],
    dayStates: [],
    completions: [],
    checkIns: [],
    goals: [],
    weeklyPlans: [],
    weeklyReviews: [],
    experiments: [],
    experimentReviews: [],
    settings: normalizeSettings({
      dataVersion: 4
    })
  };
}

function normalizeQuests(quests: AppState["quests"], createdAt: string): AppState["quests"] {
  const startersById = new Map(createStarterQuests(createdAt).map((quest) => [quest.id, quest]));
  return quests.filter((quest) => {
    const starter = startersById.get(quest.id);
    if (!starter) return true;
    return !(
      normalizeCopy(quest.name) === normalizeCopy(starter.name) &&
      normalizeCopy(quest.description) === normalizeCopy(starter.description) &&
      quest.lifeStat === starter.lifeStat &&
      quest.type === starter.type &&
      quest.difficulty === starter.difficulty &&
      quest.xp === starter.xp &&
      quest.active === starter.active
    );
  });
}

function normalizeCopy(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L");
}

function normalizeSettings(settings: ImportedSettings): Settings {
  const validCategories = new Set<HabitCategory>([
    "Energia",
    "Cialo",
    "Umysl",
    "Skupienie",
    "Rozwoj",
    "Finanse",
    "Relacje",
    "Porzadek"
  ]);
  const validRecovery = new Set<RecoveryActivity>(RECOVERY_ACTIVITIES);
  const importedPriorityCategories = Array.isArray(settings.priorityCategories) ? settings.priorityCategories : [];
  const importedRecoveryActivities = Array.isArray(settings.recoveryActivities)
    ? settings.recoveryActivities
    : DEFAULT_RECOVERY_ACTIVITIES;
  const priorityCategories = [...new Set(importedPriorityCategories)]
    .filter((value): value is HabitCategory => validCategories.has(value as HabitCategory))
    .slice(0, 3);
  const recoveryActivities =
    settings.dataVersion === 1
      ? DEFAULT_RECOVERY_ACTIVITIES
      : [...new Set(importedRecoveryActivities)].filter((value): value is RecoveryActivity =>
          validRecovery.has(value as RecoveryActivity)
        );

  return { dataVersion: 4, priorityCategories, recoveryActivities };
}

export function exportAppState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

function normalizeHabits(habits: AppState["habits"] | undefined, createdAt: string): AppState["habits"] {
  const defaultHabits = createHabitLibrary(createdAt);
  if (!Array.isArray(habits)) return defaultHabits;

  const defaultsById = new Map(defaultHabits.map((habit) => [habit.id, habit]));
  const normalizedImported = habits.map((habit) => {
    const defaultHabit = defaultsById.get(habit.id);
    if (defaultHabit) {
      return {
        ...defaultHabit,
        enabled: habit.enabled,
        createdAt: habit.createdAt ?? defaultHabit.createdAt
      };
    }

    return {
      ...habit,
      pillar: habit.pillar ?? "confidence",
      pack: habit.pack ?? "v0.3-core",
      trackKey: habit.trackKey ?? habit.id
    };
  });
  const importedById = new Map(normalizedImported.map((habit) => [habit.id, habit]));
  const mergedBuiltIns = defaultHabits.map((habit) => importedById.get(habit.id) ?? habit);
  const customHabits = normalizedImported.filter((habit) => !defaultsById.has(habit.id));

  return [...mergedBuiltIns, ...customHabits];
}

function normalizeDailyPlans(dailyPlans: AppState["dailyPlans"] | undefined, habits: AppState["habits"]): AppState["dailyPlans"] {
  if (!Array.isArray(dailyPlans)) return [];

  const habitsById = new Map(habits.map((habit) => [habit.id, habit]));
  return dailyPlans.map((plan) => ({
    ...plan,
    mode: plan.mode ?? "standard",
    tasks: plan.tasks.map((task) => {
      const normalizedTask = {
        ...task,
        origin: task.origin ?? (task.habitId.startsWith("recovery-") ? "recovery" as const : "habit" as const)
      };
      const habit = habitsById.get(task.habitId);
      if (!habit || task.edited) return normalizedTask;

      return {
        ...normalizedTask,
        title: habit.title,
        description: habit.description,
        category: habit.category,
        trackKey: habit.trackKey,
        pillar: habit.pillar,
        difficulty: habit.difficulty,
        estimatedMinutes: habit.estimatedMinutes,
        xp: habit.xp,
        sourceName: habit.sourceName,
        sourceUrl: habit.sourceUrl,
        sourceNote: habit.sourceNote,
        expectedEffect: habit.expectedEffect
      };
    })
  }));
}

function normalizeGoals(
  goals: AppState["goals"] | undefined,
  habits: AppState["habits"],
  quests: AppState["quests"]
): AppState["goals"] {
  if (!Array.isArray(goals)) return [];
  const habitIds = new Set(habits.map((habit) => habit.id));
  const questIds = new Set(quests.map((quest) => quest.id));
  const validLifeStats = new Set(["Energia", "Cialo", "Umysl", "Skupienie", "Rozwoj", "Finanse", "Relacje"]);
  return goals
    .filter((goal) =>
      goal &&
      typeof goal.id === "string" &&
      (goal.kind === "outcome" || goal.kind === "direction") &&
      validLifeStats.has(goal.lifeStat) &&
      ["active", "paused", "completed", "archived"].includes(goal.status) &&
      Array.isArray(goal.linkedHabitIds) &&
      Array.isArray(goal.linkedQuestIds) &&
      validateGoal(goal).length === 0
    )
    .map((goal) => normalizeGoalLinks(goal, habitIds, questIds));
}

function normalizeWeeklyPlans(
  weeklyPlans: AppState["weeklyPlans"] | undefined,
  goals: AppState["goals"],
  habits: AppState["habits"],
  quests: AppState["quests"]
): AppState["weeklyPlans"] {
  if (!Array.isArray(weeklyPlans)) return [];
  const activeGoalIds = new Set(goals.filter((goal) => goal.status === "active").map((goal) => goal.id));
  const habitIds = new Set(habits.map((habit) => habit.id));
  const questIds = new Set(quests.map((quest) => quest.id));
  return weeklyPlans
    .filter((plan) => plan && typeof plan.id === "string" && isValidLocalDate(plan.weekStart) && (plan.status === "draft" || plan.status === "confirmed") && Array.isArray(plan.priorityGoalIds) && Array.isArray(plan.steps))
    .map((plan) => {
      const priorityGoalIds = [...new Set(plan.priorityGoalIds)].filter((id) => activeGoalIds.has(id)).slice(0, 3);
      const prioritySet = new Set(priorityGoalIds);
      const steps = plan.steps
        .filter((step) =>
          step &&
          typeof step.id === "string" &&
          prioritySet.has(step.goalId) &&
          typeof step.title === "string" &&
          step.title.trim().length > 0 &&
          Array.isArray(step.scheduledWeekdays) &&
          step.scheduledWeekdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
          Number.isFinite(step.targetCount) &&
          step.targetCount >= 1 &&
          Number.isFinite(step.estimatedMinutes) &&
          step.estimatedMinutes >= 1
        )
        .map((step) => ({
          ...step,
          scheduledWeekdays: [...new Set(step.scheduledWeekdays)],
          linkedHabitId: step.linkedHabitId && habitIds.has(step.linkedHabitId) ? step.linkedHabitId : undefined,
          linkedQuestId: step.linkedQuestId && questIds.has(step.linkedQuestId) ? step.linkedQuestId : undefined
        }));
      return { ...plan, priorityGoalIds, steps };
    })
    .filter((plan) => plan.status === "draft" || plan.priorityGoalIds.length > 0);
}

function normalizeWeeklyReviews(
  weeklyReviews: AppState["weeklyReviews"] | undefined,
  goals: AppState["goals"]
): AppState["weeklyReviews"] {
  if (!Array.isArray(weeklyReviews)) return [];
  const goalIds = new Set(goals.map((goal) => goal.id));
  return weeklyReviews
    .filter((review) => review && typeof review.id === "string" && isValidLocalDate(review.weekStart) && Array.isArray(review.goalReviews))
    .map((review) => ({
      ...review,
      goalReviews: review.goalReviews.filter((item) =>
        goalIds.has(item.goalId) &&
        ["onTrack", "needsChange", "completed"].includes(item.status) &&
        ["continue", "reduce", "change", "pause", "complete"].includes(item.decision)
      )
    }));
}

function normalizeCompletions(
  completions: AppState["completions"],
  goals: AppState["goals"],
  weeklyPlans: AppState["weeklyPlans"],
  experiments: AppState["experiments"]
): AppState["completions"] {
  const goalIds = new Set(goals.map((goal) => goal.id));
  const stepIds = new Set(weeklyPlans.flatMap((plan) => plan.steps.map((step) => step.id)));
  const experimentIds = new Set(experiments.map((item) => item.id));
  return completions.map((completion) => ({
    ...completion,
    goalId: completion.goalId && goalIds.has(completion.goalId) ? completion.goalId : undefined,
    weeklyStepId: completion.weeklyStepId && stepIds.has(completion.weeklyStepId) ? completion.weeklyStepId : undefined,
    experimentId: completion.experimentId && experimentIds.has(completion.experimentId) ? completion.experimentId : undefined,
    experimentVariant: completion.experimentId && experimentIds.has(completion.experimentId) && (completion.experimentVariant === "full" || completion.experimentVariant === "minimum") ? completion.experimentVariant : undefined
  }));
}

function isValidLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime());
}

export function importAppState(rawJson: string): AppState {
  const parsed = JSON.parse(rawJson) as Partial<AppState>;
  const settings = parsed.settings as ImportedSettings | undefined;
  if (
    !parsed.profile ||
    typeof parsed.profile.name !== "string" ||
    typeof parsed.profile.totalXp !== "number" ||
    !Array.isArray(parsed.quests) ||
    !Array.isArray(parsed.completions) ||
    !Array.isArray(parsed.checkIns) ||
    !settings ||
    (settings.dataVersion !== 1 && settings.dataVersion !== 2 && settings.dataVersion !== 3 && settings.dataVersion !== 4)
  ) {
    throw new Error("Nieprawidlowy plik danych LifeQuest");
  }

  const createdAt = parsed.profile.createdAt || new Date().toISOString();
  const habits = normalizeHabits(parsed.habits, createdAt);
  const quests = normalizeQuests(parsed.quests, createdAt);
  const goals = normalizeGoals(parsed.goals, habits, quests);
  const weeklyPlans = normalizeWeeklyPlans(parsed.weeklyPlans, goals, habits, quests);
  const experiments = normalizeExperiments(parsed.experiments, { habits, goals, weeklyPlans });
  return {
    ...(parsed as AppState),
    quests,
    habits,
    dailyPlans: normalizeDailyPlans(parsed.dailyPlans, habits),
    dayStates: Array.isArray(parsed.dayStates) ? parsed.dayStates : [],
    completions: normalizeCompletions(parsed.completions, goals, weeklyPlans, experiments),
    goals,
    weeklyPlans,
    weeklyReviews: normalizeWeeklyReviews(parsed.weeklyReviews, goals),
    experiments,
    experimentReviews: normalizeExperimentReviews(parsed.experimentReviews, experiments),
    settings: normalizeSettings(settings)
  };
}
