import type { AppState, Goal, GoalStatus, WeeklyPlan, WeeklyReview } from "../domain/model";
import { getWeeklyPlanForDate } from "../domain/weeklyPlanning";
import { areaLabel } from "../domain/labels";
import { GoalEditor } from "./GoalEditor";
import { WeeklyPlanner } from "./WeeklyPlanner";
import { WeeklyReviewPanel } from "./WeeklyReview";

export function GoalsView(props: {
  state: AppState;
  today: string;
  onSaveGoal: (goal: Goal) => void;
  onSaveWeeklyPlan: (plan: WeeklyPlan) => void;
  onTransitionGoal: (goalId: string, status: GoalStatus) => void;
  onSaveWeeklyReview: (review: WeeklyReview) => void;
}) {
  const active = props.state.goals.filter((goal) => goal.status === "active");
  const inactive = props.state.goals.filter((goal) => goal.status !== "active");
  const currentPlan = getWeeklyPlanForDate(props.state.weeklyPlans, props.today);
  const currentReview = currentPlan ? props.state.weeklyReviews.find((review) => review.weekStart === currentPlan.weekStart) : undefined;
  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">Cele i plan tygodnia</p>
          <h2>Kierunek działania</h2>
          <p className="muted">Połącz większy cel z konkretnym krokiem na bieżący tydzień.</p>
        </div>
      </div>
      <WeeklyPlanner goals={props.state.goals} weeklyPlans={props.state.weeklyPlans} today={props.today} onSave={props.onSaveWeeklyPlan} />
      {currentPlan?.status === "confirmed" ? (
        <WeeklyReviewPanel
          plan={currentPlan}
          goals={props.state.goals}
          completions={props.state.completions}
          existing={currentReview}
          onSave={props.onSaveWeeklyReview}
        />
      ) : null}
      <div className="layout-grid goals-layout">
        <section className="panel wide">
          <div className="panel-heading"><h3>Aktywne cele</h3><span>{active.length}</span></div>
          {active.length === 0 ? <p className="muted">Nie masz jeszcze aktywnych celów.</p> : (
            <div className="goal-list">
              {active.map((goal) => (
                <article className="goal-card" key={goal.id}>
                  <div><span className="goal-kind">{goal.kind === "outcome" ? "Wynik" : "Kierunek"}</span><h4>{goal.title}</h4></div>
                  <p>{goal.outcome}</p>
                  <div className="meta-line"><span>{areaLabel(goal.lifeStat)}</span>{goal.targetDate ? <span>do {goal.targetDate}</span> : null}</div>
                  <div className="button-row">
                    <button className="secondary-button" type="button" onClick={() => props.onTransitionGoal(goal.id, "paused")}>Wstrzymaj</button>
                    <button className="primary-button" type="button" onClick={() => props.onTransitionGoal(goal.id, "completed")}>Zakończ</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading"><h3>Wstrzymane i zakończone</h3><span>{inactive.length}</span></div>
          {inactive.length === 0 ? <p className="muted">Brak nieaktywnych celów.</p> : inactive.map((goal) => (
            <article className="goal-archive-row" key={goal.id}>
              <div><strong>{goal.title}</strong><small>{goal.status === "completed" ? "Zakończony" : goal.status === "paused" ? "Wstrzymany" : "Archiwum"}</small></div>
              {goal.status !== "archived" ? <button className="secondary-button" type="button" onClick={() => props.onTransitionGoal(goal.id, "active")}>Wznów</button> : null}
            </article>
          ))}
        </section>
      </div>
      <GoalEditor habits={props.state.habits} quests={props.state.quests} onSave={props.onSaveGoal} />
    </section>
  );
}
