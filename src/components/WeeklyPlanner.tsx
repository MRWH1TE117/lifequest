import { useEffect, useMemo, useState } from "react";
import { getMondayWeekRange } from "../domain/dates";
import { getWeeklyPlanForDate } from "../domain/weeklyPlanning";
import type { Goal, WeeklyPlan } from "../domain/model";

const WEEKDAYS = [
  { value: 1, label: "Pon" },
  { value: 2, label: "Wt" },
  { value: 3, label: "Śr" },
  { value: 4, label: "Czw" },
  { value: 5, label: "Pt" },
  { value: 6, label: "Sob" },
  { value: 0, label: "Niedz" }
] as const;

export function WeeklyPlanner(props: {
  goals: Goal[];
  weeklyPlans: WeeklyPlan[];
  today: string;
  onSave: (plan: WeeklyPlan) => void;
}) {
  const existing = getWeeklyPlanForDate(props.weeklyPlans, props.today);
  const [priorityGoalIds, setPriorityGoalIds] = useState<string[]>(existing?.priorityGoalIds ?? []);
  const [stepTitles, setStepTitles] = useState<Record<string, string>>(() =>
    Object.fromEntries(existing?.steps.map((step) => [step.goalId, step.title]) ?? [])
  );
  const [scheduledDays, setScheduledDays] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(existing?.steps.map((step) => [step.goalId, step.scheduledWeekdays]) ?? [])
  );
  const [targetCounts, setTargetCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(existing?.steps.map((step) => [step.goalId, step.targetCount]) ?? [])
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState<Record<string, number>>(() =>
    Object.fromEntries(existing?.steps.map((step) => [step.goalId, step.estimatedMinutes]) ?? [])
  );
  const [minimumVersions, setMinimumVersions] = useState<Record<string, string>>(() =>
    Object.fromEntries(existing?.steps.map((step) => [step.goalId, step.minimumVersion ?? ""]) ?? [])
  );
  const [minimumMinutes, setMinimumMinutes] = useState<Record<string, number>>(() =>
    Object.fromEntries(existing?.steps.map((step) => [step.goalId, step.minimumEstimatedMinutes ?? 5]) ?? [])
  );
  const [obstacles, setObstacles] = useState<Record<string, string>>(() =>
    Object.fromEntries(existing?.steps.map((step) => [step.goalId, step.obstacle ?? ""]) ?? [])
  );
  const [ifThenPlans, setIfThenPlans] = useState<Record<string, string>>(() =>
    Object.fromEntries(existing?.steps.map((step) => [step.goalId, step.ifThenPlan ?? ""]) ?? [])
  );
  const activeGoals = useMemo(() => props.goals.filter((goal) => goal.status === "active"), [props.goals]);

  useEffect(() => {
    if (!existing) return;
    setPriorityGoalIds(existing.priorityGoalIds);
    setStepTitles(Object.fromEntries(existing.steps.map((step) => [step.goalId, step.title])));
    setScheduledDays(Object.fromEntries(existing.steps.map((step) => [step.goalId, step.scheduledWeekdays])));
    setTargetCounts(Object.fromEntries(existing.steps.map((step) => [step.goalId, step.targetCount])));
    setEstimatedMinutes(Object.fromEntries(existing.steps.map((step) => [step.goalId, step.estimatedMinutes])));
    setMinimumVersions(Object.fromEntries(existing.steps.map((step) => [step.goalId, step.minimumVersion ?? ""])));
    setMinimumMinutes(Object.fromEntries(existing.steps.map((step) => [step.goalId, step.minimumEstimatedMinutes ?? 5])));
    setObstacles(Object.fromEntries(existing.steps.map((step) => [step.goalId, step.obstacle ?? ""])));
    setIfThenPlans(Object.fromEntries(existing.steps.map((step) => [step.goalId, step.ifThenPlan ?? ""])));
  }, [existing?.id, existing?.updatedAt]);

  function toggle(goalId: string) {
    setPriorityGoalIds((current) => current.includes(goalId) ? current.filter((id) => id !== goalId) : [...current, goalId].slice(0, 3));
  }

  function toggleWeekday(goalId: string, weekday: number) {
    setScheduledDays((current) => {
      const days = current[goalId] ?? [];
      return { ...current, [goalId]: days.includes(weekday) ? days.filter((day) => day !== weekday) : [...days, weekday] };
    });
  }

  function save(status: WeeklyPlan["status"]) {
    const nowIso = new Date().toISOString();
    const weekStart = getMondayWeekRange(props.today).weekStart;
    const oldStepsByGoal = new Map(existing?.steps.map((step) => [step.goalId, step]) ?? []);
    props.onSave({
      id: existing?.id ?? `week-${weekStart}`,
      weekStart,
      priorityGoalIds,
      steps: priorityGoalIds.flatMap((goalId) => {
        const title = stepTitles[goalId]?.trim();
        if (!title) return [];
        const previous = oldStepsByGoal.get(goalId);
        return [{
          id: previous?.id ?? crypto.randomUUID(),
          goalId,
          title,
          scheduledWeekdays: scheduledDays[goalId] ?? [],
          targetCount: Math.max(1, targetCounts[goalId] ?? 1),
          estimatedMinutes: Math.max(1, estimatedMinutes[goalId] ?? 20),
          minimumVersion: minimumVersions[goalId]?.trim() || undefined,
          minimumEstimatedMinutes: minimumVersions[goalId]?.trim() ? Math.min(10, Math.max(1, minimumMinutes[goalId] ?? 5)) : undefined,
          obstacle: obstacles[goalId]?.trim() || undefined,
          ifThenPlan: ifThenPlans[goalId]?.trim() || undefined,
          createdAt: previous?.createdAt ?? nowIso,
          updatedAt: nowIso
        }];
      }),
      status,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso
    });
  }

  return (
    <section className="panel weekly-planner">
      <div className="panel-heading">
        <div>
          <h3>Kierunek tygodnia</h3>
          <p className="muted">Wybierz od jednego do trzech celów i zapisz konkretny następny krok.</p>
        </div>
        <span>{existing?.status === "confirmed" ? "Zatwierdzony" : "Szkic"}</span>
      </div>
      {activeGoals.length === 0 ? <p className="muted">Najpierw dodaj aktywny cel.</p> : (
        <div className="weekly-priority-list">
          {activeGoals.map((goal) => {
            const selected = priorityGoalIds.includes(goal.id);
            const disabled = !selected && priorityGoalIds.length >= 3;
            return (
              <div className={selected ? "weekly-priority selected" : "weekly-priority"} key={goal.id}>
                <label>
                  <input
                    aria-label={`Priorytet ${goal.title}`}
                    type="checkbox"
                    checked={selected}
                    disabled={disabled}
                    onChange={() => toggle(goal.id)}
                  />
                  <span><strong>{goal.title}</strong><small>{goal.outcome}</small></span>
                </label>
                {selected ? (
                  <div className="weekly-step-fields">
                    <label className="field goal-form-wide">
                      <span>Następny krok</span>
                      <input
                        aria-label={`Następny krok dla ${goal.title}`}
                        value={stepTitles[goal.id] ?? ""}
                        onChange={(event) => setStepTitles((current) => ({ ...current, [goal.id]: event.target.value }))}
                        placeholder="Co konkretnie zrobisz w tym tygodniu?"
                      />
                    </label>
                    <fieldset className="weekday-field goal-form-wide">
                      <legend>Planowane dni (brak wyboru = dowolny dzień)</legend>
                      <div className="weekday-options">
                        {WEEKDAYS.map((day) => (
                          <label key={day.value}><input type="checkbox" checked={(scheduledDays[goal.id] ?? []).includes(day.value)} onChange={() => toggleWeekday(goal.id, day.value)} />{day.label}</label>
                        ))}
                      </div>
                    </fieldset>
                    <label className="field"><span>Liczba wykonań</span><input type="number" min="1" max="7" value={targetCounts[goal.id] ?? 1} onChange={(event) => setTargetCounts((current) => ({ ...current, [goal.id]: Number(event.target.value) }))} /></label>
                    <label className="field"><span>Szacowany czas (min)</span><input type="number" min="1" value={estimatedMinutes[goal.id] ?? 20} onChange={(event) => setEstimatedMinutes((current) => ({ ...current, [goal.id]: Number(event.target.value) }))} /></label>
                    <label className="field"><span>Wersja minimalna</span><input value={minimumVersions[goal.id] ?? ""} onChange={(event) => setMinimumVersions((current) => ({ ...current, [goal.id]: event.target.value }))} placeholder="Np. wykonaj tylko 5 minut" /></label>
                    <label className="field"><span>Czas wersji minimalnej</span><input type="number" min="1" max="10" value={minimumMinutes[goal.id] ?? 5} onChange={(event) => setMinimumMinutes((current) => ({ ...current, [goal.id]: Number(event.target.value) }))} /></label>
                    <label className="field goal-form-wide"><span>Możliwa przeszkoda</span><input value={obstacles[goal.id] ?? ""} onChange={(event) => setObstacles((current) => ({ ...current, [goal.id]: event.target.value }))} /></label>
                    <label className="field goal-form-wide"><span>Plan jeśli–to</span><input value={ifThenPlans[goal.id] ?? ""} onChange={(event) => setIfThenPlans((current) => ({ ...current, [goal.id]: event.target.value }))} placeholder="Jeśli pojawi się przeszkoda, to…" /></label>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <div className="button-row">
        <button className="secondary-button" type="button" disabled={priorityGoalIds.length === 0} onClick={() => save("draft")}>Zapisz szkic</button>
        <button className="primary-button" type="button" disabled={priorityGoalIds.length === 0 || priorityGoalIds.some((id) => !stepTitles[id]?.trim())} onClick={() => save("confirmed")}>Zatwierdź tydzień</button>
      </div>
    </section>
  );
}
