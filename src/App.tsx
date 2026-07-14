import { useEffect, useMemo, useRef, useState } from "react";
import type { AppState, DailyCheckIn, DayIntensity, DevelopmentExperiment, ExperimentCompletionVariant, ExperimentReview, GeneratedTask, Habit, HabitCategory, LifeStat, Quest, SkipReason } from "./domain/model";
import { getDefaultXp, getLevelFromXp } from "./domain/xp";
import { calculateLifeStats } from "./domain/stats";
import { getMondayWeekRange, millisecondsUntilNextLocalDay, toLocalDateString } from "./domain/dates";
import { generateDailyPlan } from "./domain/dailyGenerator";
import { loadState, replaceState, saveState, type SaveStateFailureCode } from "./storage/storage";
import { AppShell } from "./components/AppShell";
import { TodayView } from "./components/TodayView";
import { CharacterSheet } from "./components/CharacterSheet";
import { QuestEditor } from "./components/QuestEditor";
import { ProgressDashboard } from "./components/ProgressDashboard";
import { DataPortability } from "./components/DataPortability";
import { HabitLibrary } from "./components/HabitLibrary";
import { PersonalizationSettings } from "./components/PersonalizationSettings";
import { GoalsView } from "./components/GoalsView";
import { resolveGoalForAction, transitionGoalStatus } from "./domain/goals";
import { createCarryOverDraft, getWeeklyPlanForDate } from "./domain/weeklyPlanning";
import type { Goal, GoalStatus, WeeklyPlan } from "./domain/model";
import type { WeeklyReview } from "./domain/model";
import { applyWeeklyReviewDecisions } from "./domain/goalInsights";
import { exportAppState } from "./domain/exportImport";
import { createDailySnapshotIfNeeded, createIndexedDbSnapshotRepository } from "./storage/snapshotRepository";
import { ExperimentView } from "./components/ExperimentView";
import { activateExperiment, completeExperiment, saveExperimentReview, stopExperiment } from "./domain/experiments";

export type ViewKey = "today" | "goals" | "experiment" | "habits" | "character" | "quests" | "review" | "settings" | "data";

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [view, setView] = useState<ViewKey>("today");
  const [today, setToday] = useState(() => toLocalDateString(new Date()));
  const [saveFailure, setSaveFailure] = useState<SaveStateFailureCode>();
  const initialState = useRef(state);
  const snapshotRepository = useMemo(() => createIndexedDbSnapshotRepository(), []);

  useEffect(() => {
    void createDailySnapshotIfNeeded(snapshotRepository, initialState.current, new Date()).catch(() => undefined);
  }, [snapshotRepository]);

  useEffect(() => {
    const now = new Date();
    const timeoutId = window.setTimeout(() => {
      setToday(toLocalDateString(new Date()));
    }, millisecondsUntilNextLocalDay(now));
    return () => window.clearTimeout(timeoutId);
  }, [today]);

  useEffect(() => {
    const result = saveState(state);
    setSaveFailure(result.ok ? undefined : result.code);
  }, [state]);

  useEffect(() => {
    if (state.dailyPlans.some((plan) => plan.localDate === today)) return;
    setState((current) => {
      if (current.dailyPlans.some((plan) => plan.localDate === today)) return current;
      const existingDayState = current.dayStates.find((item) => item.localDate === today);
      const intensity = existingDayState?.intensity ?? "normal";
      const plan = generateDailyPlan({
        habits: current.habits,
        localDate: today,
        intensity,
        completions: current.completions,
        dayStates: current.dayStates,
        previousPlans: current.dailyPlans,
        settings: current.settings,
        goals: current.goals,
        weeklyPlans: current.weeklyPlans,
        experiments: current.experiments
      });
      return {
        ...current,
        dailyPlans: [...current.dailyPlans, plan],
        dayStates: upsertByDate(current.dayStates, {
          localDate: today,
          intensity,
          energyNote: existingDayState?.energyNote ?? "",
          generatedPlanId: plan.id,
          updatedAt: new Date().toISOString()
        })
      };
    });
  }, [state.completions, state.dailyPlans, state.dayStates, state.experiments, state.goals, state.habits, state.settings, state.weeklyPlans, today]);

  useEffect(() => {
    const currentWeekStart = getMondayWeekRange(today).weekStart;
    if (state.weeklyPlans.some((plan) => plan.weekStart === currentWeekStart)) return;
    const previousPlan = [...state.weeklyPlans]
      .filter((plan) => plan.weekStart < currentWeekStart && plan.status === "confirmed")
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
    if (!previousPlan) return;
    setState((current) => {
      if (current.weeklyPlans.some((plan) => plan.weekStart === currentWeekStart)) return current;
      const draft = createCarryOverDraft(previousPlan, currentWeekStart, current.goals, current.completions, new Date().toISOString());
      return { ...current, weeklyPlans: [...current.weeklyPlans, draft] };
    });
  }, [state.weeklyPlans, state.goals, state.completions, today]);

  const stats = useMemo(() => calculateLifeStats(state.completions), [state.completions]);
  const level = getLevelFromXp(state.profile.totalXp);

  function completeQuest(quest: Quest) {
    const alreadyCompleted = state.completions.some((item) => item.questId === quest.id && item.localDate === today);
    if (alreadyCompleted) return;
    setState((current) => {
      const weeklyPlan = getWeeklyPlanForDate(current.weeklyPlans, today);
      const goal = resolveGoalForAction(current.goals, weeklyPlan, { questId: quest.id });
      return {
        ...current,
        profile: { ...current.profile, totalXp: current.profile.totalXp + quest.xp },
        completions: [
          ...current.completions,
          {
            questId: quest.id,
            completedAt: new Date().toISOString(),
            localDate: today,
            xpAwarded: quest.xp,
            lifeStat: quest.lifeStat,
            goalId: goal?.id
          }
        ]
      };
    });
  }

  function completeGeneratedTask(task: GeneratedTask, variant?: ExperimentCompletionVariant) {
    const alreadyCompleted = state.completions.some((item) => item.questId === task.id && item.localDate === today);
    if (alreadyCompleted) return;
    const xp = task.origin === "experiment" && variant === "minimum" ? Math.max(1, Math.round(task.xp * 0.5)) : task.xp;
    setState((current) => ({
      ...current,
      profile: { ...current.profile, totalXp: current.profile.totalXp + xp },
      completions: [
        ...current.completions,
        {
          questId: task.id,
          completedAt: new Date().toISOString(),
          localDate: today,
          xpAwarded: xp,
          lifeStat: categoryToLifeStat(task.category),
          goalId: task.goalId,
          weeklyStepId: task.weeklyStepId,
          experimentId: task.experimentId,
          experimentVariant: task.origin === "experiment" ? (variant ?? "full") : undefined
        }
      ]
    }));
  }

  function upsertCheckIn(checkIn: DailyCheckIn) {
    setState((current) => ({
      ...current,
      checkIns: [...current.checkIns.filter((item) => item.localDate !== checkIn.localDate), checkIn]
    }));
  }

  function saveQuest(quest: Quest) {
    setState((current) => ({
      ...current,
      quests: current.quests.some((item) => item.id === quest.id)
        ? current.quests.map((item) => (item.id === quest.id ? quest : item))
        : [...current.quests, quest]
    }));
  }

  function deleteQuest(id: string) {
    setState((current) => ({
      ...current,
      quests: current.quests.filter((quest) => quest.id !== id)
    }));
  }

  function saveGoal(goal: Goal) {
    setState((current) => ({
      ...current,
      goals: current.goals.some((item) => item.id === goal.id)
        ? current.goals.map((item) => item.id === goal.id ? goal : item)
        : [...current.goals, goal]
    }));
  }

  function changeGoalStatus(goalId: string, status: GoalStatus) {
    const nowIso = new Date().toISOString();
    setState((current) => ({
      ...current,
      goals: current.goals.map((goal) => goal.id === goalId ? transitionGoalStatus(goal, status, nowIso) : goal)
    }));
  }

  function saveWeeklyPlan(weeklyPlan: WeeklyPlan) {
    setState((current) => {
      const weeklyPlans = [
        ...current.weeklyPlans.filter((plan) => plan.weekStart !== weeklyPlan.weekStart),
        weeklyPlan
      ];
      const currentPlan = current.dailyPlans.find((plan) => plan.localDate === today);
      if (!currentPlan || weeklyPlan.status !== "confirmed") return { ...current, weeklyPlans };
      const retainedTasks = currentPlan.tasks.filter(
        (task) =>
          task.edited ||
          Boolean(task.skippedAt) ||
          current.completions.some((completion) => completion.questId === task.id && completion.localDate === today)
      );
      const intensity = current.dayStates.find((item) => item.localDate === today)?.intensity ?? "normal";
      const generated = generateDailyPlan({
        habits: current.habits,
        localDate: today,
        intensity,
        completions: current.completions,
        dayStates: current.dayStates,
        previousPlans: current.dailyPlans,
        excludedHabitIds: currentPlan.tasks.flatMap((task) => task.origin === "goalStep" ? [] : [task.habitId]),
        settings: current.settings,
        goals: current.goals,
        weeklyPlans,
        experiments: current.experiments
      });
      const refreshedPlan = {
        ...generated,
        tasks: [...retainedTasks, ...generated.tasks.filter((task) => !retainedTasks.some((retained) => retained.id === task.id))].slice(0, currentPlan.tasks.length),
        createdAt: currentPlan.createdAt,
        updatedAt: new Date().toISOString()
      };
      return { ...current, weeklyPlans, dailyPlans: upsertPlan(current.dailyPlans, refreshedPlan) };
    });
  }

  function saveWeeklyReview(weeklyReview: WeeklyReview) {
    const nowIso = new Date().toISOString();
    setState((current) => ({
      ...current,
      goals: applyWeeklyReviewDecisions(current.goals, weeklyReview, nowIso),
      weeklyReviews: [
        ...current.weeklyReviews.filter((review) => review.weekStart !== weeklyReview.weekStart),
        weeklyReview
      ]
    }));
  }

  function saveDayIntensity(intensity: DayIntensity) {
    setState((current) => {
      const plan = generateDailyPlan({
        habits: current.habits,
        localDate: today,
        intensity,
        completions: current.completions,
        dayStates: current.dayStates,
        previousPlans: current.dailyPlans,
        settings: current.settings,
        goals: current.goals,
        weeklyPlans: current.weeklyPlans,
        experiments: current.experiments
      });
      return {
        ...current,
        dailyPlans: upsertPlan(current.dailyPlans, plan),
        dayStates: upsertByDate(current.dayStates, {
          localDate: today,
          intensity,
          energyNote: current.dayStates.find((item) => item.localDate === today)?.energyNote ?? "",
          generatedPlanId: plan.id,
          updatedAt: new Date().toISOString()
        })
      };
    });
  }

  function regenerateDailyPlan() {
    setState((current) => {
      const currentPlan = current.dailyPlans.find((plan) => plan.localDate === today);
      const intensity = current.dayStates.find((item) => item.localDate === today)?.intensity ?? "normal";
      const retainedTasks = currentPlan?.tasks.filter(
        (task) =>
          task.edited ||
          Boolean(task.skippedAt) ||
          current.completions.some((completion) => completion.questId === task.id && completion.localDate === today)
      ) ?? [];
      const generatedPlan = generateDailyPlan({
        habits: current.habits,
        localDate: today,
        intensity,
        completions: current.completions,
        dayStates: current.dayStates,
        previousPlans: current.dailyPlans,
        excludedHabitIds: currentPlan?.tasks.map((task) => task.habitId) ?? [],
        excludedWeeklyStepIds: currentPlan?.tasks.flatMap((task) => task.weeklyStepId ? [task.weeklyStepId] : []) ?? [],
        settings: current.settings,
        goals: current.goals,
        weeklyPlans: current.weeklyPlans,
        experiments: current.experiments
      });
      const targetCount = currentPlan?.tasks.length ?? generatedPlan.tasks.length;
      const plan = {
        ...generatedPlan,
        tasks: [...retainedTasks, ...generatedPlan.tasks].slice(0, targetCount),
        createdAt: currentPlan?.createdAt ?? generatedPlan.createdAt,
        updatedAt: new Date().toISOString()
      };

      return {
        ...current,
        dailyPlans: upsertPlan(current.dailyPlans, plan)
      };
    });
  }

  function editGeneratedTask(task: GeneratedTask) {
    setState((current) => ({
      ...current,
      dailyPlans: current.dailyPlans.map((plan) =>
        plan.localDate === today
          ? {
              ...plan,
              tasks: plan.tasks.map((item) => (item.id === task.id ? { ...task, edited: true } : item)),
              updatedAt: new Date().toISOString()
            }
          : plan
      )
    }));
  }

  function skipGeneratedTask(task: GeneratedTask, skipReason: SkipReason) {
    setState((current) => {
      const now = new Date().toISOString();
      let changed = false;
      const dailyPlans = current.dailyPlans.map((plan) => {
        if (plan.localDate !== today) return plan;

        let planChanged = false;
        const tasks = plan.tasks.map((item) => {
          const completedToday = current.completions.some((completion) => completion.questId === item.id && completion.localDate === today);
          if (item.id !== task.id || item.skippedAt || completedToday) return item;

          changed = true;
          planChanged = true;
          return { ...item, skippedAt: now, skipReason };
        });

        return planChanged ? { ...plan, tasks, updatedAt: now } : plan;
      });

      if (!changed) return current;

      return {
        ...current,
        dailyPlans
      };
    });
  }

  function toggleHabit(id: string, enabled: boolean) {
    setState((current) => ({
      ...current,
      habits: current.habits.map((habit) => (habit.id === id ? { ...habit, enabled } : habit))
    }));
  }

  function createQuestDraft(): Quest {
    const type = "daily" as const;
    const difficulty = "easy" as const;
    return {
      id: crypto.randomUUID(),
      name: "Nowe zadanie",
      description: "",
      lifeStat: "Rozwoj",
      type,
      difficulty,
      xp: getDefaultXp(difficulty, type),
      active: true,
      createdAt: new Date().toISOString()
    };
  }

  function replaceImportedState(nextState: AppState) {
    setState(replaceState(exportAppState(nextState)));
  }

  function saveExperiment(experiment: DevelopmentExperiment) {
    setState((current) => ({ ...current, experiments: current.experiments.some((item) => item.id === experiment.id)
      ? current.experiments.map((item) => item.id === experiment.id ? experiment : item)
      : [...current.experiments, experiment] }));
  }

  function activateExperimentById(id: string) {
    const now = new Date().toISOString();
    setState((current) => {
      const experiments = current.experiments.map((item) => item.id === id ? activateExperiment(item, now) : item);
      const currentPlan = current.dailyPlans.find((plan) => plan.localDate === today);
      if (!currentPlan) return { ...current, experiments };
      const retained = currentPlan.tasks.filter((task) => task.edited || task.skippedAt || current.completions.some((completion) => completion.questId === task.id && completion.localDate === today));
      const generated = generateDailyPlan({
        habits: current.habits, localDate: today,
        intensity: current.dayStates.find((item) => item.localDate === today)?.intensity ?? "normal",
        completions: current.completions, dayStates: current.dayStates,
        previousPlans: current.dailyPlans.filter((plan) => plan.localDate !== today), settings: current.settings,
        goals: current.goals, weeklyPlans: current.weeklyPlans, experiments
      });
      const tasks = [...retained, ...generated.tasks.filter((task) => !retained.some((item) => item.id === task.id))].slice(0, currentPlan.tasks.length);
      return { ...current, experiments, dailyPlans: upsertPlan(current.dailyPlans, { ...generated, tasks, createdAt: currentPlan.createdAt, updatedAt: now }) };
    });
  }

  function finishExperiment(id: string, stopped: boolean) {
    const now = new Date().toISOString();
    setState((current) => {
      const target = current.experiments.find((item) => item.id === id);
      if (!target) return current;
      if (target.status === "draft" && stopped) return { ...current, experiments: current.experiments.filter((item) => item.id !== id) };
      return { ...current, experiments: current.experiments.map((item) => item.id === id ? (stopped ? stopExperiment(item, now) : completeExperiment(item, now)) : item) };
    });
  }

  function storeExperimentReview(review: ExperimentReview) {
    setState((current) => ({ ...current, experimentReviews: saveExperimentReview(current.experimentReviews, review) }));
  }

  return (
    <AppShell
      currentView={view}
      onViewChange={setView}
      storageAlert={saveFailure ? storageFailureCopy(saveFailure) : undefined}
      onOpenData={() => setView("data")}
    >
      {view === "today" && (
        <TodayView
          state={state}
          today={today}
          onCompleteGeneratedTask={completeGeneratedTask}
          onCompleteQuest={completeQuest}
          onEditGeneratedTask={editGeneratedTask}
          onRegenerateDailyPlan={regenerateDailyPlan}
          onSaveCheckIn={upsertCheckIn}
          onSaveDayIntensity={saveDayIntensity}
          onSkipGeneratedTask={skipGeneratedTask}
          onOpenProgress={() => setView("review")}
        />
      )}
      {view === "goals" && (
        <GoalsView
          state={state}
          today={today}
          onSaveGoal={saveGoal}
          onSaveWeeklyPlan={saveWeeklyPlan}
          onSaveWeeklyReview={saveWeeklyReview}
          onTransitionGoal={changeGoalStatus}
        />
      )}
      {view === "experiment" && <ExperimentView state={state} today={today} onSave={saveExperiment} onActivate={activateExperimentById} onFinish={finishExperiment} onSaveReview={storeExperimentReview} />}
      {view === "habits" && <HabitLibrary habits={state.habits} onToggleHabit={toggleHabit} />}
      {view === "character" && <CharacterSheet profile={state.profile} level={level} stats={stats} checkIns={state.checkIns} />}
      {view === "quests" && <QuestEditor quests={state.quests} onCreateDraft={createQuestDraft} onSaveQuest={saveQuest} onDeleteQuest={deleteQuest} />}
      {view === "review" && <ProgressDashboard state={state} today={today} />}
      {view === "settings" && (
        <PersonalizationSettings
          settings={state.settings}
          onChange={(settings) => setState((current) => ({ ...current, settings }))}
        />
      )}
      {view === "data" && <DataPortability state={state} onReplaceState={replaceImportedState} snapshotRepository={snapshotRepository} />}
    </AppShell>
  );
}

function storageFailureCopy(code: SaveStateFailureCode): string {
  if (code === "quota") return "Zmiany nie są zapisywane: magazyn przeglądarki jest pełny.";
  if (code === "blocked") return "Zmiany nie są zapisywane: przeglądarka zablokowała lokalny magazyn.";
  return "Zmiany nie są zapisywane w przeglądarce.";
}

function upsertByDate<T extends { localDate: string }>(items: T[], next: T): T[] {
  return [...items.filter((item) => item.localDate !== next.localDate), next];
}

function upsertPlan(plans: AppState["dailyPlans"], next: AppState["dailyPlans"][number]): AppState["dailyPlans"] {
  return [...plans.filter((plan) => plan.localDate !== next.localDate), next];
}

function categoryToLifeStat(category: HabitCategory): LifeStat {
  return category === "Porzadek" ? "Skupienie" : category;
}
