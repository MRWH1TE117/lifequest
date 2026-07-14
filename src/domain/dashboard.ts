import { getMondayWeekRange, toLocalDateString } from "./dates";
import { areaLabel } from "./labels";
import { LIFE_STATS, type AppState, type HabitCategory, type LifeStat } from "./model";

export type DashboardPeriod = "7d" | "30d" | "90d" | "365d";

export type DashboardRange = {
  start: string;
  end: string;
};

export type DashboardSummary = {
  planCompletionPercent: number | null;
  activeDays: number;
  totalXp: number;
  currentStreak: number;
};

export type DashboardTrendPoint = {
  localDate: string;
  planned: number;
  completed: number;
  percent: number | null;
};

export type DashboardAreaRow = {
  stat: LifeStat;
  planned: number;
  completed: number;
  completionPercent: number | null;
  completionSharePercent: number;
};

export type DashboardManualSummary = {
  completed: number;
  totalXp: number;
};

export type DashboardInsight = {
  id: string;
  title: string;
  body: string;
};

export type DashboardGoalRow = {
  goalId: string;
  title: string;
  planned: number;
  completed: number;
};

export type ProgressDashboardModel = {
  period: DashboardPeriod;
  range: DashboardRange;
  summary: DashboardSummary;
  trend: DashboardTrendPoint[];
  trendGranularity: "day" | "week";
  areas: DashboardAreaRow[];
  manual: DashboardManualSummary;
  skippedCount: number;
  attentionArea: LifeStat | null;
  insights: DashboardInsight[];
  recommendation: DashboardInsight | null;
  goals: DashboardGoalRow[];
};

const PERIOD_DAYS: Record<DashboardPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365
};

export function getDashboardRange(period: DashboardPeriod, today: string): DashboardRange {
  const end = new Date(`${today}T12:00:00`);
  const start = new Date(end);
  start.setDate(end.getDate() - (PERIOD_DAYS[period] - 1));
  return { start: toLocalDateString(start), end: today };
}

export function buildProgressDashboard(
  state: AppState,
  today: string,
  period: DashboardPeriod
): ProgressDashboardModel {
  const range = getDashboardRange(period, today);
  const periodPlans = state.dailyPlans.filter((plan) => isInRange(plan.localDate, range));
  const periodCompletions = state.completions.filter((item) => isInRange(item.localDate, range));
  const completedAutomaticIds = getCompletedAutomaticIds(periodPlans, periodCompletions);
  const dailyTrend = buildDailyTrend(periodPlans, completedAutomaticIds);
  const trendGranularity = period === "90d" || period === "365d" ? "week" : "day";
  const trend = trendGranularity === "week" ? aggregateTrendByWeek(dailyTrend) : dailyTrend;
  const plannedCount = dailyTrend.reduce((sum, point) => sum + point.planned, 0);
  const completedCount = dailyTrend.reduce((sum, point) => sum + point.completed, 0);
  const planCompletionPercent = percent(completedCount, plannedCount);
  const manualQuestIds = new Set(state.quests.map((quest) => quest.id));
  const manualCompletions = periodCompletions.filter((item) => manualQuestIds.has(item.questId));
  const activeDates = getActiveDates(state, range);
  const areas = buildAreaRows(periodPlans, completedAutomaticIds, completedCount);
  const skippedCount = periodPlans.flatMap((plan) => plan.tasks).filter((task) => task.skippedAt).length;
  const insights = buildDashboardInsights(plannedCount, completedCount, planCompletionPercent, activeDates.size, skippedCount);
  const goals = buildGoalRows(state, range);
  const weakestArea = areas
    .filter((row) => row.planned > 0)
    .sort(
      (a, b) =>
        (a.completionPercent ?? 0) - (b.completionPercent ?? 0) ||
        a.completed - b.completed ||
        LIFE_STATS.indexOf(a.stat) - LIFE_STATS.indexOf(b.stat)
    )[0];

  return {
    period,
    range,
    summary: {
      planCompletionPercent,
      activeDays: activeDates.size,
      totalXp: periodCompletions.reduce((sum, item) => sum + item.xpAwarded, 0),
      currentStreak: calculateCurrentStreak(state, today)
    },
    trend,
    trendGranularity,
    areas,
    manual: {
      completed: manualCompletions.length,
      totalXp: manualCompletions.reduce((sum, item) => sum + item.xpAwarded, 0)
    },
    skippedCount,
    attentionArea: weakestArea?.stat ?? null,
    insights,
    recommendation: weakestArea
      ? {
          id: "next-step",
          title: "Następny krok",
          body: `${areaLabel(weakestArea.stat)}: wykonano ${weakestArea.completed} z ${weakestArea.planned} zaplanowanych zadań. Wybierz jeden lekki krok w tym obszarze.`
        }
      : null,
    goals
  };
}

function buildGoalRows(state: AppState, range: DashboardRange): DashboardGoalRow[] {
  const goalsById = new Map(state.goals.map((goal) => [goal.id, goal]));
  const plannedByGoal = new Map<string, number>();
  for (const plan of state.weeklyPlans) {
    if (plan.status !== "confirmed") continue;
    const planRange = getMondayWeekRange(plan.weekStart);
    if (planRange.weekEnd < range.start || planRange.weekStart > range.end) continue;
    for (const step of plan.steps) {
      plannedByGoal.set(step.goalId, (plannedByGoal.get(step.goalId) ?? 0) + step.targetCount);
    }
  }
  const completedByGoal = new Map<string, number>();
  const seen = new Set<string>();
  for (const completion of state.completions) {
    if (!completion.goalId || !completion.weeklyStepId || !isInRange(completion.localDate, range) || seen.has(completion.questId)) continue;
    seen.add(completion.questId);
    completedByGoal.set(completion.goalId, (completedByGoal.get(completion.goalId) ?? 0) + 1);
  }
  const goalIds = [...new Set([...plannedByGoal.keys(), ...completedByGoal.keys()])];
  return goalIds.flatMap((goalId) => {
    const goal = goalsById.get(goalId);
    if (!goal) return [];
    return [{
      goalId,
      title: goal.title,
      planned: plannedByGoal.get(goalId) ?? 0,
      completed: completedByGoal.get(goalId) ?? 0
    }];
  });
}

function isInRange(localDate: string, range: DashboardRange): boolean {
  return localDate >= range.start && localDate <= range.end;
}

function getCompletedAutomaticIds(
  plans: AppState["dailyPlans"],
  completions: AppState["completions"]
): Set<string> {
  const plannedIds = new Set(plans.flatMap((plan) => plan.tasks.map((task) => task.id)));
  return new Set(completions.filter((item) => plannedIds.has(item.questId)).map((item) => item.questId));
}

function buildDailyTrend(
  plans: AppState["dailyPlans"],
  completedIds: Set<string>
): DashboardTrendPoint[] {
  return [...plans]
    .filter((plan) => plan.tasks.length > 0)
    .sort((a, b) => a.localDate.localeCompare(b.localDate))
    .map((plan) => {
      const completed = plan.tasks.filter((task) => completedIds.has(task.id)).length;
      return {
        localDate: plan.localDate,
        planned: plan.tasks.length,
        completed,
        percent: percent(completed, plan.tasks.length)
      };
    });
}

function aggregateTrendByWeek(points: DashboardTrendPoint[]): DashboardTrendPoint[] {
  const buckets = new Map<string, { planned: number; completed: number }>();

  for (const point of points) {
    const weekStart = getMondayWeekRange(point.localDate).weekStart;
    const bucket = buckets.get(weekStart) ?? { planned: 0, completed: 0 };
    bucket.planned += point.planned;
    bucket.completed += point.completed;
    buckets.set(weekStart, bucket);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([localDate, bucket]) => ({
      localDate,
      planned: bucket.planned,
      completed: bucket.completed,
      percent: percent(bucket.completed, bucket.planned)
    }));
}

function getActiveDates(state: AppState, range?: DashboardRange): Set<string> {
  const dates = new Set<string>();
  for (const completion of state.completions) {
    if (!range || isInRange(completion.localDate, range)) dates.add(completion.localDate);
  }
  for (const checkIn of state.checkIns) {
    if (!range || isInRange(checkIn.localDate, range)) dates.add(checkIn.localDate);
  }
  return dates;
}

function calculateCurrentStreak(state: AppState, today: string): number {
  const activeDates = getActiveDates(state);
  const cursor = new Date(`${today}T12:00:00`);
  if (!activeDates.has(today)) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (activeDates.has(toLocalDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function buildAreaRows(
  plans: AppState["dailyPlans"],
  completedIds: Set<string>,
  completedCount: number
): DashboardAreaRow[] {
  const planned = emptyStatCounts();
  const completed = emptyStatCounts();

  for (const task of plans.flatMap((plan) => plan.tasks)) {
    const stat = categoryToLifeStat(task.category);
    planned[stat] += 1;
    if (completedIds.has(task.id)) completed[stat] += 1;
  }

  return LIFE_STATS.map((stat) => ({
    stat,
    planned: planned[stat],
    completed: completed[stat],
    completionPercent: percent(completed[stat], planned[stat]),
    completionSharePercent: completedCount > 0 ? Math.round((completed[stat] / completedCount) * 100) : 0
  }));
}

function buildDashboardInsights(
  plannedCount: number,
  completedCount: number,
  planCompletionPercent: number | null,
  activeDays: number,
  skippedCount: number
): DashboardInsight[] {
  if (plannedCount === 0 && activeDays === 0) return [];

  const insights: DashboardInsight[] = [];
  if (plannedCount > 0) {
    insights.push({
      id: "plan-completion",
      title: "Realizacja planu",
      body: `Wykonano ${completedCount} z ${plannedCount} zaplanowanych zadań (${planCompletionPercent}%).`
    });
  }
  if (skippedCount > 0) {
    insights.push({
      id: "skipped-tasks",
      title: "Pominięte zadania",
      body: `Pominięto ${skippedCount} z ${plannedCount} zaplanowanych zadań.`
    });
  }
  insights.push({
    id: "active-days",
    title: "Regularność",
    body: `Aktywność zapisano w ${activeDays} dniach wybranego okresu.`
  });
  return insights.slice(0, 3);
}

function emptyStatCounts(): Record<LifeStat, number> {
  return Object.fromEntries(LIFE_STATS.map((stat) => [stat, 0])) as Record<LifeStat, number>;
}

function categoryToLifeStat(category: HabitCategory): LifeStat {
  return category === "Porzadek" ? "Skupienie" : category;
}

function percent(value: number, total: number): number | null {
  return total > 0 ? Math.round((value / total) * 100) : null;
}
