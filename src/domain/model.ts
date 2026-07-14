export const LIFE_STATS = [
  "Energia",
  "Cialo",
  "Umysl",
  "Skupienie",
  "Rozwoj",
  "Finanse",
  "Relacje"
] as const;

export type LifeStat = (typeof LIFE_STATS)[number];
export type HabitCategory = LifeStat | "Porzadek";
export type QuestType = "daily" | "weekly" | "boss";
export type QuestDifficulty = "easy" | "medium" | "hard" | "boss";
export type HabitType = "habit" | "daily" | "weekly" | "recovery" | "challenge";
export type HabitDifficulty = "light" | "normal" | "strong";
export type HabitFrequency = "daily" | "weekdays" | "weekly" | "twoPerWeek";
export type DayIntensity = "light" | "normal" | "strong";
export type DailyPlanMode = "standard" | "recovery";
export type HabitPillar = "finance" | "career" | "learning" | "energy" | "order" | "relationships" | "confidence";
export type SkipReason = "tooMuchToday" | "notRelevant" | "tooHard" | "noTime";
export type GoalKind = "outcome" | "direction";
export type GoalStatus = "active" | "paused" | "completed" | "archived";
export type WeeklyPlanStatus = "draft" | "confirmed";
export type WeeklyGoalReviewStatus = "onTrack" | "needsChange" | "completed";
export type WeeklyGoalDecision = "continue" | "reduce" | "change" | "pause" | "complete";
export type ExperimentSourceKind = "habit" | "weeklyStep";
export type ExperimentStatus = "draft" | "active" | "completed" | "stopped";
export type ExperimentCompletionVariant = "full" | "minimum";
export type ExperimentDecision = "continue" | "simplify" | "changeContext" | "stop";

export const RECOVERY_ACTIVITIES = [
  "walk",
  "screenBreak",
  "calmHobby",
  "socialContact",
  "breathing",
  "sleepRoutine",
  "outdoors"
] as const;

export type RecoveryActivity = (typeof RECOVERY_ACTIVITIES)[number];

export type Habit = {
  id: string;
  title: string;
  description: string;
  category: HabitCategory;
  pillar: HabitPillar;
  pack: string;
  trackKey: string;
  type: HabitType;
  difficulty: HabitDifficulty;
  estimatedMinutes: number;
  frequency: HabitFrequency;
  xp: number;
  enabled: boolean;
  sourceName: string;
  sourceUrl: string;
  sourceNote: string;
  expectedEffect: string;
  minimumVersion?: string;
  createdAt: string;
};

export type GeneratedTask = {
  id: string;
  habitId: string;
  origin?: "habit" | "recovery" | "goalStep" | "experiment";
  goalId?: string;
  weeklyStepId?: string;
  experimentId?: string;
  minimumVersion?: string;
  minimumEstimatedMinutes?: number;
  title: string;
  description: string;
  category: HabitCategory;
  trackKey: string;
  pillar: HabitPillar;
  difficulty: HabitDifficulty;
  estimatedMinutes: number;
  xp: number;
  sourceName: string;
  sourceUrl: string;
  sourceNote: string;
  expectedEffect: string;
  reason: string;
  edited: boolean;
  skippedAt?: string;
  skipReason?: SkipReason;
};

export type InsightKind = "strength" | "weakness" | "dayState" | "taskShape" | "recommendation" | "habitAdjustment";

export type Insight = {
  id: string;
  kind: InsightKind;
  title: string;
  body: string;
  metricLabel?: string;
  metricValue?: string;
};

export type DailyPlan = {
  id: string;
  localDate: string;
  intensity: DayIntensity;
  mode?: DailyPlanMode;
  tasks: GeneratedTask[];
  insights: string[];
  createdAt: string;
  updatedAt: string;
};

export type DayState = {
  localDate: string;
  intensity: DayIntensity;
  energyNote: string;
  generatedPlanId: string | null;
  updatedAt: string;
};

export type Quest = {
  id: string;
  name: string;
  description: string;
  lifeStat: LifeStat;
  type: QuestType;
  difficulty: QuestDifficulty;
  xp: number;
  active: boolean;
  createdAt: string;
};

export type QuestCompletion = {
  questId: string;
  completedAt: string;
  localDate: string;
  xpAwarded: number;
  lifeStat: LifeStat;
  goalId?: string;
  weeklyStepId?: string;
  experimentId?: string;
  experimentVariant?: ExperimentCompletionVariant;
};

export type DevelopmentExperiment = {
  id: string;
  sourceKind: ExperimentSourceKind;
  linkedHabitId?: string;
  linkedGoalId?: string;
  linkedWeeklyStepId?: string;
  title: string;
  description: string;
  lifeStat: LifeStat;
  startDate: string;
  durationDays: 7 | 14;
  scheduledWeekdays: number[];
  estimatedMinutes: number;
  minimumVersion?: string;
  minimumEstimatedMinutes?: number;
  contextCue: string;
  obstacle?: string;
  ifThenPlan?: string;
  status: ExperimentStatus;
  createdAt: string;
  updatedAt: string;
  endedAt?: string;
};

export type ExperimentReview = {
  id: string;
  experimentId: string;
  decision: ExperimentDecision;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type Goal = {
  id: string;
  kind: GoalKind;
  title: string;
  outcome: string;
  reason: string;
  lifeStat: LifeStat;
  targetDate?: string;
  status: GoalStatus;
  linkedHabitIds: string[];
  linkedQuestIds: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type WeeklyStep = {
  id: string;
  goalId: string;
  title: string;
  scheduledWeekdays: number[];
  targetCount: number;
  estimatedMinutes: number;
  minimumVersion?: string;
  minimumEstimatedMinutes?: number;
  obstacle?: string;
  ifThenPlan?: string;
  linkedHabitId?: string;
  linkedQuestId?: string;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyPlan = {
  id: string;
  weekStart: string;
  priorityGoalIds: string[];
  steps: WeeklyStep[];
  status: WeeklyPlanStatus;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyGoalReview = {
  goalId: string;
  status: WeeklyGoalReviewStatus;
  obstacleCategory?: string;
  note?: string;
  decision: WeeklyGoalDecision;
};

export type WeeklyReview = {
  id: string;
  weekStart: string;
  goalReviews: WeeklyGoalReview[];
  createdAt: string;
  updatedAt: string;
};

export type DailyCheckIn = {
  localDate: string;
  sleepHours: number | null;
  energy: number | null;
  mood: number | null;
  reflection: string;
  updatedAt: string;
};

export type Profile = {
  name: string;
  totalXp: number;
  createdAt: string;
};

export type Settings = {
  dataVersion: 4;
  priorityCategories: HabitCategory[];
  recoveryActivities: RecoveryActivity[];
};

export type AppState = {
  profile: Profile;
  quests: Quest[];
  habits: Habit[];
  dailyPlans: DailyPlan[];
  dayStates: DayState[];
  completions: QuestCompletion[];
  checkIns: DailyCheckIn[];
  goals: Goal[];
  weeklyPlans: WeeklyPlan[];
  weeklyReviews: WeeklyReview[];
  experiments: DevelopmentExperiment[];
  experimentReviews: ExperimentReview[];
  settings: Settings;
};
