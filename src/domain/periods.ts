import { LIFE_STATS, type LifeStat, type QuestCompletion } from "./model";
import { getMondayWeekRange, isLocalDateInRange, toLocalDateString } from "./dates";

export type PeriodKey = "day" | "week" | "month" | "quarter" | "halfYear" | "year";

export type PeriodRange = {
  start: string;
  end: string;
};

export type AreaProgressRow = {
  stat: LifeStat;
  xp: number;
  completed: number;
  percent: number;
};

export type PeriodSummary = {
  totalXp: number;
  completed: number;
  bestStat: LifeStat | "Brak danych";
  weakestStat: LifeStat | "Brak danych";
};

function toDate(localDate: string): Date {
  return new Date(`${localDate}T12:00:00`);
}

function monthRange(anchorLocalDate: string, monthsBack: number): PeriodRange {
  const anchor = toDate(anchorLocalDate);
  const start = new Date(anchor.getFullYear(), anchor.getMonth() - monthsBack, 1, 12);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12);
  return {
    start: toLocalDateString(start),
    end: toLocalDateString(end)
  };
}

export function getPeriodRange(period: PeriodKey, anchorLocalDate: string): PeriodRange {
  if (period === "day") return { start: anchorLocalDate, end: anchorLocalDate };
  if (period === "week") {
    const range = getMondayWeekRange(anchorLocalDate);
    return { start: range.weekStart, end: range.weekEnd };
  }
  if (period === "month") return monthRange(anchorLocalDate, 0);
  if (period === "quarter") return monthRange(anchorLocalDate, 2);
  if (period === "halfYear") return monthRange(anchorLocalDate, 5);
  return monthRange(anchorLocalDate, 11);
}

export function buildAreaProgressRows(
  period: PeriodKey,
  anchorLocalDate: string,
  completions: QuestCompletion[]
): AreaProgressRow[] {
  const range = getPeriodRange(period, anchorLocalDate);
  const periodCompletions = completions.filter((item) => isLocalDateInRange(item.localDate, range.start, range.end));
  const totalXp = periodCompletions.reduce((sum, item) => sum + item.xpAwarded, 0);

  return LIFE_STATS.map((stat) => {
    const matching = periodCompletions.filter((item) => item.lifeStat === stat);
    const xp = matching.reduce((sum, item) => sum + item.xpAwarded, 0);
    return {
      stat,
      xp,
      completed: matching.length,
      percent: totalXp > 0 ? Math.round((xp / totalXp) * 100) : 0
    };
  });
}

export function buildPeriodSummary(
  period: PeriodKey,
  anchorLocalDate: string,
  completions: QuestCompletion[]
): PeriodSummary {
  const rows = buildAreaProgressRows(period, anchorLocalDate, completions);
  const activeRows = rows.filter((row) => row.xp > 0 || row.completed > 0);

  if (activeRows.length === 0) {
    return {
      totalXp: 0,
      completed: 0,
      bestStat: "Brak danych",
      weakestStat: "Brak danych"
    };
  }

  const best = activeRows.reduce((current, row) => (row.xp > current.xp ? row : current), activeRows[0]);
  const weakest = activeRows.reduce((current, row) => (row.xp < current.xp ? row : current), activeRows[0]);

  return {
    totalXp: activeRows.reduce((sum, row) => sum + row.xp, 0),
    completed: activeRows.reduce((sum, row) => sum + row.completed, 0),
    bestStat: best.stat,
    weakestStat: weakest.stat
  };
}
