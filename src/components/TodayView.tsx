import { ArrowRight, Check, HeartPulse, Moon, Pencil, RotateCcw, Smile, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppState, DailyCheckIn, DayIntensity, ExperimentCompletionVariant, GeneratedTask, HabitDifficulty, Quest, SkipReason } from "../domain/model";
import { areaLabel } from "../domain/labels";
import { buildProgressDashboard } from "../domain/dashboard";
import { getDueQuests } from "../domain/quests";
import { buildWeeklyStepProgress, getWeeklyPlanForDate } from "../domain/weeklyPlanning";

function typeLabel(type: Quest["type"]): string {
  if (type === "daily") return "dziennie";
  if (type === "weekly") return "tygodniowo";
  return "cel";
}

function difficultyLabel(difficulty: HabitDifficulty): string {
  if (difficulty === "light") return "lekki";
  if (difficulty === "normal") return "normalny";
  return "mocny";
}

const DAY_INTENSITIES: { key: DayIntensity; label: string }[] = [
  { key: "light", label: "Dzisiaj lekko" },
  { key: "normal", label: "Normalnie" },
  { key: "strong", label: "Mocny dzień" }
];

export function TodayView(props: {
  state: AppState;
  today: string;
  onCompleteGeneratedTask: (task: GeneratedTask, variant?: ExperimentCompletionVariant) => void;
  onCompleteQuest: (quest: Quest) => void;
  onEditGeneratedTask: (task: GeneratedTask) => void;
  onRegenerateDailyPlan: () => void;
  onSaveCheckIn: (checkIn: DailyCheckIn) => void;
  onSaveDayIntensity: (intensity: DayIntensity) => void;
  onSkipGeneratedTask: (task: GeneratedTask, reason: SkipReason) => void;
  onOpenProgress: () => void;
}) {
  const existing = props.state.checkIns.find((item) => item.localDate === props.today);
  const todayPlan = props.state.dailyPlans.find((plan) => plan.localDate === props.today);
  const dayState = props.state.dayStates.find((item) => item.localDate === props.today);
  const [sleepHours, setSleepHours] = useState(existing?.sleepHours?.toString() ?? "");
  const [energy, setEnergy] = useState(existing?.energy?.toString() ?? "3");
  const [mood, setMood] = useState(existing?.mood?.toString() ?? "3");
  const [reflection, setReflection] = useState(existing?.reflection ?? "");
  const [editingTaskIds, setEditingTaskIds] = useState<Set<string>>(() => new Set());
  const [skipReasons, setSkipReasons] = useState<Record<string, SkipReason>>({});

  const activeQuests = getDueQuests(props.state.quests, props.state.completions, props.today);
  const todaysCompletions = props.state.completions.filter((completion) => completion.localDate === props.today);
  const todayXp = todaysCompletions.reduce((sum, completion) => sum + completion.xpAwarded, 0);
  const generatedDoneCount = todayPlan?.tasks.filter((task) => todaysCompletions.some((completion) => completion.questId === task.id)).length ?? 0;
  const progress = useMemo(
    () => buildProgressDashboard(props.state, props.today, "7d"),
    [props.state, props.today]
  );
  const weeklyPlan = getWeeklyPlanForDate(props.state.weeklyPlans, props.today);
  const weeklyProgress = weeklyPlan ? buildWeeklyStepProgress(weeklyPlan, props.state.completions) : new Map();
  const weeklyGoals = weeklyPlan?.status === "confirmed"
    ? weeklyPlan.priorityGoalIds.flatMap((goalId) => {
        const goal = props.state.goals.find((item) => item.id === goalId);
        if (!goal) return [];
        const steps = weeklyPlan.steps.filter((step) => step.goalId === goalId);
        const completed = steps.reduce((sum, step) => sum + (weeklyProgress.get(step.id)?.completed ?? 0), 0);
        const target = steps.reduce((sum, step) => sum + step.targetCount, 0);
        return [{ goal, completed, target }];
      })
    : [];

  function saveCheckIn() {
    props.onSaveCheckIn({
      localDate: props.today,
      sleepHours: sleepHours.trim() ? Number(sleepHours) : null,
      energy: energy.trim() ? Number(energy) : null,
      mood: mood.trim() ? Number(mood) : null,
      reflection,
      updatedAt: new Date().toISOString()
    });
  }

  function toggleGeneratedTaskEdit(taskId: string) {
    setEditingTaskIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">{props.today}</p>
          <h2>Dzisiejsze zadania</h2>
        </div>
        <div className="xp-badge">
          <Zap size={18} />
          <span>{todayXp} XP dzisiaj</span>
        </div>
      </div>

      <button
        className="home-progress-summary"
        type="button"
        aria-label="Otwórz pełne postępy"
        onClick={props.onOpenProgress}
      >
        <span className="home-progress-heading">
          <strong>Podsumowanie 7 dni</strong>
          <ArrowRight size={18} />
        </span>
        <span className="home-progress-metrics">
          <span><small>Wykonanie</small><strong>{progress.summary.planCompletionPercent ?? 0}%</strong></span>
          <span><small>Aktywne dni</small><strong>{progress.summary.activeDays}</strong></span>
          <span><small>Seria</small><strong>{progress.summary.currentStreak} dni</strong></span>
          <span><small>Wymaga uwagi</small><strong>{progress.attentionArea ? areaLabel(progress.attentionArea) : "Brak danych"}</strong></span>
        </span>
      </button>

      {weeklyGoals.length > 0 ? (
        <section className="panel weekly-direction-panel">
          <div className="panel-heading compact-heading">
            <div><h3>Kierunek tygodnia</h3><p className="muted">Postęp w zatwierdzonych krokach.</p></div>
            <span>{weeklyPlan?.weekStart}</span>
          </div>
          <div className="weekly-direction-list">
            {weeklyGoals.map(({ goal, completed, target }) => (
              <div className="weekly-direction-row" key={goal.id}>
                <strong>{goal.title}</strong>
                <span>{completed}/{target} kroków</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel day-plan-panel">
        <div className="panel-heading">
          <div>
            <h3>Plan automatyczny</h3>
            <p className="muted">Automatyczne zadania dobrane z aktywnych habitów do dzisiejszego stanu i historii.</p>
          </div>
          <button className="secondary-button" type="button" onClick={props.onRegenerateDailyPlan}>
            <RotateCcw size={16} />
            <span>Generuj ponownie</span>
          </button>
        </div>
        {todayPlan?.mode === "recovery" && (
          <div className="recovery-mode" role="status">
            <HeartPulse size={18} />
            <div>
              <strong>Tryb regeneracji</strong>
              <span>Łagodniejszy plan po kilku trudniejszych dniach.</span>
            </div>
          </div>
        )}
        <div className="day-state-tabs" aria-label="Stan dnia">
          {DAY_INTENSITIES.map((option) => (
            <button
              key={option.key}
              type="button"
              className={(dayState?.intensity ?? todayPlan?.intensity ?? "normal") === option.key ? "day-state-tab active" : "day-state-tab"}
              onClick={() => props.onSaveDayIntensity(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {todayPlan?.insights.map((insight) => (
          <p className="insight-note" key={insight}>{insight}</p>
        ))}
        <div className="panel-heading compact-heading">
          <h4>Zadania z generatora</h4>
          <span>{generatedDoneCount}/{todayPlan?.tasks.length ?? 0} wykonane</span>
        </div>
        <div className="quest-list">
          {todayPlan?.tasks.map((task) => {
            const done = todaysCompletions.some((completion) => completion.questId === task.id);
            const isEditing = editingTaskIds.has(task.id);
            return (
              <article className={done ? "quest-row generated done" : "quest-row generated"} key={task.id}>
                <div className="generated-task-fields">
                  {isEditing ? (
                    <>
                      <input
                        aria-label="Nazwa wygenerowanego zadania"
                        value={task.title}
                        onChange={(event) => props.onEditGeneratedTask({ ...task, title: event.target.value })}
                      />
                      <textarea
                        aria-label="Opis wygenerowanego zadania"
                        value={task.description}
                        onChange={(event) => props.onEditGeneratedTask({ ...task, description: event.target.value })}
                        rows={2}
                      />
                    </>
                  ) : (
                    <div className="generated-task-summary">
                      <h4>{task.title}</h4>
                      <p>{task.description}</p>
                    </div>
                  )}
                  <p className="reason-line">{task.reason}</p>
                  <div className="meta-line">
                    {task.goalId ? <span>{props.state.goals.find((goal) => goal.id === task.goalId)?.title ?? "Cel tygodnia"}</span> : null}
                    <span>{areaLabel(task.category)}</span>
                    <span>{difficultyLabel(task.difficulty)}</span>
                    <span>{task.estimatedMinutes} min</span>
                    <span>{task.xp} XP</span>
                    <span>{task.sourceName}</span>
                  </div>
                </div>
                <div className="generated-task-actions">
                  <button className="secondary-button" type="button" onClick={() => toggleGeneratedTaskEdit(task.id)}>
                    {isEditing ? <Check size={17} /> : <Pencil size={17} />}
                    <span>{isEditing ? "Gotowe" : "Edytuj"}</span>
                  </button>
                  <label className="compact-select">
                    <span>Powód pominięcia</span>
                    <select
                      aria-label={`Powód pominięcia ${task.title}`}
                      value={skipReasons[task.id] ?? "tooMuchToday"}
                      disabled={done || Boolean(task.skippedAt)}
                      onChange={(event) => setSkipReasons((current) => ({ ...current, [task.id]: event.target.value as SkipReason }))}
                    >
                      <option value="tooMuchToday">Za dużo na dziś</option>
                      <option value="notRelevant">Niepasujące teraz</option>
                      <option value="tooHard">Za trudne</option>
                      <option value="noTime">Brak czasu</option>
                    </select>
                  </label>
                  <button className="secondary-button" type="button" disabled={done || Boolean(task.skippedAt)} onClick={() => props.onSkipGeneratedTask(task, skipReasons[task.id] ?? "tooMuchToday")}>
                    <span>{task.skippedAt ? "Pominięto" : "Pomiń"}</span>
                  </button>
                  {task.origin === "experiment" && task.minimumVersion && task.minimumEstimatedMinutes ? (
                    <>
                      <button className="secondary-button" type="button" disabled={done} onClick={() => props.onCompleteGeneratedTask(task, "minimum")}>
                        <Check size={17} /><span>Minimum ({task.minimumEstimatedMinutes} min)</span>
                      </button>
                      <button className="primary-button" type="button" disabled={done} onClick={() => props.onCompleteGeneratedTask(task, "full")}>
                        <Check size={17} /><span>{done ? "Wykonane" : "Pełna wersja"}</span>
                      </button>
                    </>
                  ) : (
                    <button className="primary-button" type="button" disabled={done} onClick={() => props.onCompleteGeneratedTask(task, task.origin === "experiment" ? "full" : undefined)}>
                      <Check size={17} /><span>{done ? "Wykonane" : "Wykonaj"}</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="layout-grid">
        <section className="panel wide">
          <div className="panel-heading">
            <h3>Własne zadania</h3>
            <span>{activeQuests.length} do wykonania</span>
          </div>
          <div className="quest-list">
            {activeQuests.length === 0 ? <p className="muted">Brak własnych zadań do wykonania.</p> : null}
            {activeQuests.map((quest) => {
              const done = todaysCompletions.some((completion) => completion.questId === quest.id);
              return (
                <article className={done ? "quest-row done" : "quest-row"} key={quest.id}>
                  <div>
                    <h4>{quest.name}</h4>
                    <p>{quest.description || areaLabel(quest.lifeStat)}</p>
                    <div className="meta-line">
                      <span>{areaLabel(quest.lifeStat)}</span>
                      <span>{typeLabel(quest.type)}</span>
                      <span>{quest.xp} XP</span>
                    </div>
                  </div>
                  <button className="primary-button" type="button" disabled={done} onClick={() => props.onCompleteQuest(quest)}>
                    <Check size={17} />
                    <span>{done ? "Wykonane" : "Wykonaj"}</span>
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h3>Dzienny check-in</h3>
            <span>{existing ? "Zapisany" : "Otwarty"}</span>
          </div>
          <label className="field">
            <span><Moon size={16} /> Godziny snu</span>
            <input value={sleepHours} onChange={(event) => setSleepHours(event.target.value)} inputMode="decimal" placeholder="7" />
          </label>
          <label className="field">
            <span><Zap size={16} /> Energia</span>
            <select value={energy} onChange={(event) => setEnergy(event.target.value)}>
              <option value="1">1 - niska</option>
              <option value="2">2</option>
              <option value="3">3 - stabilna</option>
              <option value="4">4</option>
              <option value="5">5 - mocna</option>
            </select>
          </label>
          <label className="field">
            <span><Smile size={16} /> Nastrój</span>
            <select value={mood} onChange={(event) => setMood(event.target.value)}>
              <option value="1">1 - słaby</option>
              <option value="2">2</option>
              <option value="3">3 - neutralny</option>
              <option value="4">4</option>
              <option value="5">5 - dobry</option>
            </select>
          </label>
          <label className="field">
            <span>Refleksja</span>
            <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="Co dzisiaj było ważne?" rows={5} />
          </label>
          <button className="primary-button full" type="button" onClick={saveCheckIn}>
            Zapisz check-in
          </button>
        </section>
      </div>
    </section>
  );
}
