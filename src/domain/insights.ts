import { LIFE_STATS, type DailyPlan, type DayState, type Insight, type LifeStat, type QuestCompletion } from "./model";
import { areaLabel } from "./labels";

type BuildInsightsInput = {
  today: string;
  completions: QuestCompletion[];
  dayStates: DayState[];
  dailyPlans: DailyPlan[];
};

type IntensityCounts = Record<DayState["intensity"], number>;

const EMPTY_COUNTS: IntensityCounts = {
  light: 0,
  normal: 0,
  strong: 0
};

export function buildInsights(input: BuildInsightsInput): Insight[] {
  const sevenDayScores = scoreStats(input.completions, input.today, 7);
  const hasSevenDayCompletionData = Object.values(sevenDayScores).some((score) => score > 0);
  const strongestStat = pickStat(sevenDayScores, "strongest");
  const weakestStat = pickStat(sevenDayScores, "weakest");
  const sevenDayStates = countDayStates(input.dayStates, input.today, 7);
  const thirtyDayStates = countDayStates(input.dayStates, input.today, 30);
  const skippedTaskCount = countSkippedTasks(input.dailyPlans, input.today, 7);

  return [
    {
      id: "insight-strength-7d",
      kind: "strength",
      title: "Najmocniejszy obszar",
      body: hasSevenDayCompletionData
        ? `W ostatnich 7 dniach najwięcej XP z zakończonych zadań ma obszar ${areaLabel(strongestStat)}: ${sevenDayScores[strongestStat]} XP.`
        : "Za mało danych z ostatnich 7 dni, żeby wskazać najmocniejszy obszar.",
      metricLabel: "7 dni",
      metricValue: `${sevenDayScores[strongestStat]} XP`
    },
    {
      id: "insight-weakness-7d",
      kind: "weakness",
      title: "Najsłabszy obszar",
      body: hasSevenDayCompletionData
        ? `W ostatnich 7 dniach najmniej XP z zakończonych zadań ma obszar ${areaLabel(weakestStat)}: ${sevenDayScores[weakestStat]} XP.`
        : "Brak danych o zakończonych zadaniach z ostatnich 7 dni. Zacznij od jednego małego kroku.",
      metricLabel: "7 dni",
      metricValue: `${sevenDayScores[weakestStat]} XP`
    },
    {
      id: "insight-day-states",
      kind: "dayState",
      title: "Rytm dni",
      body: `Ostatnie 7 dni: lekki: ${sevenDayStates.light}, normalny: ${sevenDayStates.normal}, mocny: ${sevenDayStates.strong}. Ostatnie 30 dni: lekki: ${thirtyDayStates.light}, normalny: ${thirtyDayStates.normal}, mocny: ${thirtyDayStates.strong}.`,
      metricLabel: "7 dni",
      metricValue: `${sevenDayStates.light}/${sevenDayStates.normal}/${sevenDayStates.strong}`
    },
    {
      id: "insight-recommendation",
      kind: "recommendation",
      title: "Następny krok",
      body:
        skippedTaskCount > 2
          ? `W ostatnich 7 dniach pominięto ${skippedTaskCount} zadania. Wybierz mniejszy zestaw albo niższą trudność na kolejny plan.`
          : `Dodaj jeden mały krok w obszarze ${areaLabel(weakestStat)}, bo ma najmniej lokalnie zapisanych XP z ostatnich 7 dni.`,
      metricLabel: "Pominięte",
      metricValue: `${skippedTaskCount}`
    }
  ];
}

function scoreStats(completions: QuestCompletion[], today: string, windowDays: number): Record<LifeStat, number> {
  const scores = Object.fromEntries(LIFE_STATS.map((stat) => [stat, 0])) as Record<LifeStat, number>;

  for (const completion of completions) {
    const diff = daysBetween(completion.localDate, today);
    if (isWithinWindow(diff, windowDays)) {
      scores[completion.lifeStat] += completion.xpAwarded;
    }
  }

  return scores;
}

function pickStat(scores: Record<LifeStat, number>, mode: "strongest" | "weakest"): LifeStat {
  return LIFE_STATS.reduce((selected, stat) => {
    if (mode === "strongest") return scores[stat] > scores[selected] ? stat : selected;
    return scores[stat] < scores[selected] ? stat : selected;
  }, LIFE_STATS[0]);
}

function countDayStates(dayStates: DayState[], today: string, windowDays: number): IntensityCounts {
  return dayStates.reduce<IntensityCounts>(
    (counts, state) => {
      const diff = daysBetween(state.localDate, today);
      if (isWithinWindow(diff, windowDays)) counts[state.intensity] += 1;
      return counts;
    },
    { ...EMPTY_COUNTS }
  );
}

function countSkippedTasks(dailyPlans: DailyPlan[], today: string, windowDays: number): number {
  return dailyPlans
    .filter((plan) => {
      const diff = daysBetween(plan.localDate, today);
      return isWithinWindow(diff, windowDays);
    })
    .flatMap((plan) => plan.tasks)
    .filter((task) => task.skippedAt).length;
}

function isWithinWindow(diff: number, days: number): boolean {
  return diff >= 0 && diff < days;
}

function daysBetween(localDate: string, today: string): number {
  const dateMs = Date.parse(`${localDate}T00:00:00.000Z`);
  const todayMs = Date.parse(`${today}T00:00:00.000Z`);
  return Math.floor((todayMs - dateMs) / 86_400_000);
}
