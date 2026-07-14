import { Beaker, Check, Square } from "lucide-react";
import { useState } from "react";
import type { AppState, DevelopmentExperiment, ExperimentDecision, ExperimentReview } from "../domain/model";
import {
  buildExperimentSummary,
  createExperimentFromHabit,
  createExperimentFromWeeklyStep,
  getExperimentEndDate,
  getOpenExperiment,
  validateExperiment
} from "../domain/experiments";
import { getWeeklyPlanForDate } from "../domain/weeklyPlanning";

const WEEKDAYS = [
  { value: 1, label: "Pn" }, { value: 2, label: "Wt" }, { value: 3, label: "Śr" },
  { value: 4, label: "Cz" }, { value: 5, label: "Pt" }, { value: 6, label: "Sb" }, { value: 0, label: "Nd" }
];

export function ExperimentView(props: {
  state: AppState;
  today: string;
  onSave: (experiment: DevelopmentExperiment) => void;
  onActivate: (id: string) => void;
  onFinish: (id: string, stopped: boolean) => void;
  onSaveReview: (review: ExperimentReview) => void;
}) {
  const open = getOpenExperiment(props.state.experiments);
  const currentPlan = getWeeklyPlanForDate(props.state.weeklyPlans, props.today);
  const [errors, setErrors] = useState<string[]>([]);

  function beginFromHabit(habitId: string) {
    const habit = props.state.habits.find((item) => item.id === habitId && item.enabled);
    if (habit) props.onSave(createExperimentFromHabit(habit, props.today, new Date().toISOString()));
  }

  function beginFromStep(stepId: string) {
    const step = currentPlan?.status === "confirmed" ? currentPlan.steps.find((item) => item.id === stepId) : undefined;
    const goal = step ? props.state.goals.find((item) => item.id === step.goalId) : undefined;
    if (step && goal) props.onSave(createExperimentFromWeeklyStep(step, goal.lifeStat, props.today, new Date().toISOString()));
  }

  function activate(experiment: DevelopmentExperiment) {
    const nextErrors = validateExperiment(experiment);
    setErrors(nextErrors);
    if (!nextErrors.length) props.onActivate(experiment.id);
  }

  const history = props.state.experiments.filter((item) => item.status === "completed" || item.status === "stopped");

  return (
    <section className="screen experiment-screen">
      <div className="screen-header"><div><p className="eyebrow">Rozwój przez praktykę</p><h2>Eksperyment</h2></div></div>
      <section className="panel experiment-intro">
        <Beaker size={24} />
        <div><h3>Sprawdź jedno zachowanie przez 7 albo 14 dni</h3><p className="muted">Wybierz istniejący habit lub krok tygodnia. LifeQuest pokaże mierzalne wykonania, bez analizowania treści Twoich prywatnych notatek.</p></div>
      </section>

      {!open ? (
        <section className="panel">
          <h3>Wybierz punkt wyjścia</h3>
          <p className="muted">W danym momencie możesz mieć tylko jeden szkic lub aktywny eksperyment.</p>
          <div className="source-grid">
            <div><h4>Aktywne habity</h4>{props.state.habits.filter((item) => item.enabled).map((habit) => (
              <button className="source-button" type="button" key={habit.id} onClick={() => beginFromHabit(habit.id)}><strong>{habit.title}</strong><span>{habit.estimatedMinutes} min · {habit.category}</span></button>
            ))}</div>
            <div><h4>Kroki bieżącego tygodnia</h4>{currentPlan?.status === "confirmed" ? currentPlan.steps.map((step) => (
              <button className="source-button" type="button" key={step.id} onClick={() => beginFromStep(step.id)}><strong>{step.title}</strong><span>{step.estimatedMinutes} min</span></button>
            )) : <p className="muted">Najpierw zatwierdź plan bieżącego tygodnia.</p>}</div>
          </div>
        </section>
      ) : open.status === "draft" ? (
        <ExperimentEditor experiment={open} errors={errors} onChange={props.onSave} onActivate={() => activate(open)} onCancel={() => props.onFinish(open.id, true)} />
      ) : (
        <ActiveExperiment experiment={open} state={props.state} today={props.today} onFinish={props.onFinish} />
      )}

      {history.length > 0 ? <section className="panel"><h3>Historia i przegląd</h3><div className="experiment-history">{history.map((experiment) => {
        const summary = buildExperimentSummary(experiment, props.state.completions, props.state.dailyPlans);
        const review = props.state.experimentReviews.find((item) => item.experimentId === experiment.id);
        return <article className="experiment-history-card" key={experiment.id}>
          <div className="panel-heading compact-heading"><div><h4>{experiment.title}</h4><p className="muted">{experiment.startDate} – {experiment.endedAt?.slice(0, 10) ?? getExperimentEndDate(experiment)}</p></div><span>{experiment.status === "stopped" ? "Zatrzymany" : "Zakończony"}</span></div>
          <Summary summary={summary} />
          {review ? <p><strong>Decyzja:</strong> {decisionLabel(review.decision)}</p> : <ReviewForm experimentId={experiment.id} onSave={props.onSaveReview} />}
        </article>;
      })}</div></section> : null}
    </section>
  );
}

function ExperimentEditor(props: { experiment: DevelopmentExperiment; errors: string[]; onChange: (value: DevelopmentExperiment) => void; onActivate: () => void; onCancel: () => void }) {
  const item = props.experiment;
  const update = (changes: Partial<DevelopmentExperiment>) => props.onChange({ ...item, ...changes, updatedAt: new Date().toISOString() });
  return <section className="panel experiment-editor">
    <div className="panel-heading"><div><h3>Ustaw próbę</h3><p className="muted">Źródło jest zapisane jako migawka — późniejsze zmiany habitu nie zmienią historii.</p></div></div>
    <div className="form-grid">
      <label className="field"><span>Nazwa</span><input value={item.title} onChange={(e) => update({ title: e.target.value })} /></label>
      <label className="field"><span>Co dokładnie wykonasz</span><input value={item.description} onChange={(e) => update({ description: e.target.value })} /></label>
      <label className="field"><span>Start</span><input type="date" value={item.startDate} onChange={(e) => update({ startDate: e.target.value })} /></label>
      <label className="field"><span>Czas trwania</span><select value={item.durationDays} onChange={(e) => update({ durationDays: Number(e.target.value) as 7 | 14 })}><option value={7}>7 dni</option><option value={14}>14 dni</option></select></label>
      <label className="field"><span>Pełna wersja (min)</span><input type="number" min={1} value={item.estimatedMinutes} onChange={(e) => update({ estimatedMinutes: Number(e.target.value) })} /></label>
      <label className="field"><span>Kontekst: kiedy / po czym</span><input value={item.contextCue} onChange={(e) => update({ contextCue: e.target.value })} placeholder="Np. po śniadaniu przy biurku" /></label>
      <label className="field"><span>Minimalna wersja (opcjonalnie)</span><input value={item.minimumVersion ?? ""} onChange={(e) => update({ minimumVersion: e.target.value || undefined })} /></label>
      <label className="field"><span>Minimum (1–10 min)</span><input type="number" min={1} max={10} value={item.minimumEstimatedMinutes ?? ""} onChange={(e) => update({ minimumEstimatedMinutes: e.target.value ? Number(e.target.value) : undefined })} /></label>
      <label className="field"><span>Przeszkoda (prywatne)</span><input value={item.obstacle ?? ""} onChange={(e) => update({ obstacle: e.target.value || undefined })} /></label>
      <label className="field"><span>Plan jeżeli–to (prywatne)</span><input value={item.ifThenPlan ?? ""} onChange={(e) => update({ ifThenPlan: e.target.value || undefined })} /></label>
    </div>
    <fieldset className="weekday-field"><legend>Dni wykonania</legend><div>{WEEKDAYS.map((day) => <label key={day.value}><input type="checkbox" checked={item.scheduledWeekdays.includes(day.value)} onChange={(e) => update({ scheduledWeekdays: e.target.checked ? [...item.scheduledWeekdays, day.value] : item.scheduledWeekdays.filter((value) => value !== day.value) })} /><span>{day.label}</span></label>)}</div></fieldset>
    {props.errors.length ? <div className="field-error" role="alert">{props.errors.map((error) => <p key={error}>{error}</p>)}</div> : null}
    <div className="button-row"><button className="secondary-button" type="button" onClick={props.onCancel}>Usuń szkic</button><button className="primary-button" type="button" onClick={props.onActivate}>Rozpocznij eksperyment</button></div>
  </section>;
}

function ActiveExperiment(props: { experiment: DevelopmentExperiment; state: AppState; today: string; onFinish: (id: string, stopped: boolean) => void }) {
  const summary = buildExperimentSummary(props.experiment, props.state.completions, props.state.dailyPlans);
  const canComplete = props.today >= getExperimentEndDate(props.experiment);
  return <section className="panel active-experiment"><div className="panel-heading"><div><p className="eyebrow">Aktywny</p><h3>{props.experiment.title}</h3><p>{props.experiment.description}</p></div><span>do {getExperimentEndDate(props.experiment)}</span></div>
    <p><strong>Kontekst:</strong> {props.experiment.contextCue}</p><Summary summary={summary} />
    {!canComplete ? <p className="muted">Podsumowanie będzie dostępne po pełnych {props.experiment.durationDays} dniach. Wcześniej możesz jedynie zatrzymać próbę.</p> : null}
    <div className="button-row"><button className="secondary-button" type="button" onClick={() => props.onFinish(props.experiment.id, true)}><Square size={16} />Zatrzymaj wcześniej</button>{canComplete ? <button className="primary-button" type="button" onClick={() => props.onFinish(props.experiment.id, false)}><Check size={16} />Zakończ i podsumuj</button> : null}</div>
  </section>;
}

function Summary({ summary }: { summary: ReturnType<typeof buildExperimentSummary> }) {
  return <dl className="experiment-summary"><div><dt>Zaplanowane</dt><dd>{summary.scheduled}</dd></div><div><dt>Pełne</dt><dd>{summary.full}</dd></div><div><dt>Minimum</dt><dd>{summary.minimum}</dd></div><div><dt>Pominięte</dt><dd>{summary.skipped}</dd></div><div><dt>Wykonanie</dt><dd>{summary.completionRate}%</dd></div></dl>;
}

function ReviewForm(props: { experimentId: string; onSave: (review: ExperimentReview) => void }) {
  const [decision, setDecision] = useState<ExperimentDecision>("continue"); const [note, setNote] = useState("");
  return <div className="review-form"><label className="field"><span>Co dalej</span><select value={decision} onChange={(e) => setDecision(e.target.value as ExperimentDecision)}><option value="continue">Kontynuuj</option><option value="simplify">Uprość</option><option value="changeContext">Zmień kontekst</option><option value="stop">Zakończ</option></select></label><label className="field"><span>Notatka prywatna (opcjonalnie)</span><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></label><button className="primary-button" type="button" onClick={() => { const now = new Date().toISOString(); props.onSave({ id: crypto.randomUUID(), experimentId: props.experimentId, decision, note: note || undefined, createdAt: now, updatedAt: now }); }}>Zapisz przegląd</button></div>;
}

function decisionLabel(decision: ExperimentDecision): string { return ({ continue: "kontynuuj", simplify: "uprość", changeContext: "zmień kontekst", stop: "zakończ" })[decision]; }
