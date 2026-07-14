import { useMemo, useState } from "react";
import { buildGoalProgressInsights } from "../domain/goalInsights";
import type { Goal, QuestCompletion, WeeklyGoalDecision, WeeklyGoalReviewStatus, WeeklyPlan, WeeklyReview } from "../domain/model";

export function WeeklyReviewPanel(props: {
  plan: WeeklyPlan;
  goals: Goal[];
  completions: QuestCompletion[];
  existing?: WeeklyReview;
  onSave: (review: WeeklyReview) => void;
}) {
  const insights = useMemo(() => buildGoalProgressInsights(props.plan, props.completions), [props.plan, props.completions]);
  const [statuses, setStatuses] = useState<Record<string, WeeklyGoalReviewStatus>>(() =>
    Object.fromEntries(props.existing?.goalReviews.map((item) => [item.goalId, item.status]) ?? [])
  );
  const [decisions, setDecisions] = useState<Record<string, WeeklyGoalDecision>>(() =>
    Object.fromEntries(props.existing?.goalReviews.map((item) => [item.goalId, item.decision]) ?? [])
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(props.existing?.goalReviews.map((item) => [item.goalId, item.note ?? ""]) ?? [])
  );

  function save() {
    const nowIso = new Date().toISOString();
    props.onSave({
      id: props.existing?.id ?? `review-${props.plan.weekStart}`,
      weekStart: props.plan.weekStart,
      goalReviews: props.plan.priorityGoalIds.map((goalId) => ({
        goalId,
        status: statuses[goalId] ?? "onTrack",
        decision: decisions[goalId] ?? "continue",
        note: notes[goalId]?.trim() || undefined
      })),
      createdAt: props.existing?.createdAt ?? nowIso,
      updatedAt: nowIso
    });
  }

  return (
    <section className="panel weekly-review">
      <div className="panel-heading">
        <div><h3>Przegląd tygodnia</h3><p className="muted">Dane są liczone z wykonanych kroków. Notatki nie są analizowane.</p></div>
        <span>{props.plan.weekStart}</span>
      </div>
      <div className="weekly-review-list">
        {props.plan.priorityGoalIds.map((goalId) => {
          const goal = props.goals.find((item) => item.id === goalId);
          const insight = insights.find((item) => item.goalId === goalId);
          if (!goal || !insight) return null;
          return (
            <article className="weekly-review-row" key={goalId}>
              <div><h4>{goal.title}</h4><p>{insight.body}</p></div>
              <div className="goal-form-grid">
                <label className="field">
                  <span>Status</span>
                  <select value={statuses[goalId] ?? "onTrack"} onChange={(event) => setStatuses((current) => ({ ...current, [goalId]: event.target.value as WeeklyGoalReviewStatus }))}>
                    <option value="onTrack">Na dobrej drodze</option>
                    <option value="needsChange">Wymaga zmiany</option>
                    <option value="completed">Ukończony</option>
                  </select>
                </label>
                <label className="field">
                  <span>Decyzja</span>
                  <select value={decisions[goalId] ?? "continue"} onChange={(event) => setDecisions((current) => ({ ...current, [goalId]: event.target.value as WeeklyGoalDecision }))}>
                    <option value="continue">Kontynuuj</option>
                    <option value="reduce">Zmniejsz krok</option>
                    <option value="change">Zmień krok</option>
                    <option value="pause">Wstrzymaj cel</option>
                    <option value="complete">Zakończ cel</option>
                  </select>
                </label>
                <label className="field goal-form-wide">
                  <span>Notatka opcjonalna</span>
                  <textarea rows={2} value={notes[goalId] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [goalId]: event.target.value }))} />
                </label>
              </div>
            </article>
          );
        })}
      </div>
      <button className="primary-button" type="button" onClick={save}>Zapisz przegląd</button>
    </section>
  );
}
