import { LIFE_STATS, type DailyCheckIn, type LifeStat, type QuestCompletion } from "./model";
import { getMondayWeekRange, isLocalDateInRange } from "./dates";
import { calculateLifeStats } from "./stats";
import { areaLabel } from "./labels";

export type WeeklyReview = {
  weekStart: string;
  weekEnd: string;
  totalXp: number;
  completedQuestCount: number;
  checkInCount: number;
  bestStat: LifeStat;
  weakestStat: LifeStat;
  suggestedFocus: string;
};

export function buildWeeklyReview(input: {
  weekAnchorDate: string;
  completions: QuestCompletion[];
  checkIns: DailyCheckIn[];
}): WeeklyReview {
  const { weekStart, weekEnd } = getMondayWeekRange(input.weekAnchorDate);
  const completions = input.completions.filter((item) => isLocalDateInRange(item.localDate, weekStart, weekEnd));
  const checkIns = input.checkIns.filter((item) => isLocalDateInRange(item.localDate, weekStart, weekEnd));
  const stats = calculateLifeStats(completions);
  const bestStat = LIFE_STATS.reduce((best, stat) => (stats[stat] > stats[best] ? stat : best), LIFE_STATS[0]);
  const weakestStat = LIFE_STATS.reduce((weakest, stat) => (stats[stat] < stats[weakest] ? stat : weakest), LIFE_STATS[0]);

  return {
    weekStart,
    weekEnd,
    totalXp: completions.reduce((sum, item) => sum + item.xpAwarded, 0),
    completedQuestCount: completions.length,
    checkInCount: checkIns.length,
    bestStat,
    weakestStat,
    suggestedFocus: `W kolejnym okresie zwróć więcej uwagi na obszar: ${areaLabel(weakestStat)}.`
  };
}
