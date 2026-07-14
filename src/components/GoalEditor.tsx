import { useState } from "react";
import { LIFE_STATS, type Goal, type GoalKind, type Habit, type LifeStat, type Quest } from "../domain/model";
import { validateGoal } from "../domain/goals";
import { areaLabel } from "../domain/labels";

export function GoalEditor(props: { habits: Habit[]; quests: Quest[]; onSave: (goal: Goal) => void }) {
  const [kind, setKind] = useState<GoalKind>("outcome");
  const [title, setTitle] = useState("");
  const [outcome, setOutcome] = useState("");
  const [reason, setReason] = useState("");
  const [lifeStat, setLifeStat] = useState<LifeStat>("Rozwoj");
  const [targetDate, setTargetDate] = useState("");
  const [linkedHabitIds, setLinkedHabitIds] = useState<string[]>([]);
  const [linkedQuestIds, setLinkedQuestIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  function save() {
    const nowIso = new Date().toISOString();
    const goal: Goal = {
      id: crypto.randomUUID(),
      kind,
      title: title.trim(),
      outcome: outcome.trim(),
      reason: reason.trim(),
      lifeStat,
      targetDate: targetDate || undefined,
      status: "active",
      linkedHabitIds,
      linkedQuestIds,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    const nextErrors = validateGoal(goal);
    setErrors(nextErrors);
    if (nextErrors.length > 0) return;
    props.onSave(goal);
    setTitle("");
    setOutcome("");
    setReason("");
    setTargetDate("");
  }

  return (
    <section className="panel goal-editor">
      <div className="panel-heading">
        <div>
          <h3>Nowy cel</h3>
          <p className="muted">Zapisz konkretny wynik albo stały kierunek rozwoju.</p>
        </div>
      </div>
      <div className="goal-form-grid">
        <label className="field">
          <span>Rodzaj celu</span>
          <select aria-label="Rodzaj celu" value={kind} onChange={(event) => setKind(event.target.value as GoalKind)}>
            <option value="outcome">Konkretny wynik</option>
            <option value="direction">Stały kierunek</option>
          </select>
        </label>
        <label className="field">
          <span>Obszar</span>
          <select aria-label="Obszar celu" value={lifeStat} onChange={(event) => setLifeStat(event.target.value as LifeStat)}>
            {LIFE_STATS.map((stat) => <option key={stat} value={stat}>{areaLabel(stat)}</option>)}
          </select>
        </label>
        <label className="field goal-form-wide">
          <span>Nazwa celu</span>
          <input aria-label="Nazwa celu" value={title} onChange={(event) => setTitle(event.target.value)} />
          {errors.includes("title") ? <small className="field-error">Podaj nazwę celu.</small> : null}
        </label>
        <label className="field goal-form-wide">
          <span>Oczekiwany wynik</span>
          <textarea aria-label="Oczekiwany wynik" rows={2} value={outcome} onChange={(event) => setOutcome(event.target.value)} />
          {errors.includes("outcome") ? <small className="field-error">Opisz, po czym poznasz postęp lub osiągnięcie celu.</small> : null}
        </label>
        <label className="field goal-form-wide">
          <span>Dlaczego to ważne</span>
          <textarea aria-label="Dlaczego to ważne" rows={2} value={reason} onChange={(event) => setReason(event.target.value)} />
          {errors.includes("reason") ? <small className="field-error">Zapisz osobisty powód realizacji celu.</small> : null}
        </label>
        {kind === "outcome" ? (
          <label className="field">
            <span>Data docelowa</span>
            <input aria-label="Data docelowa" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
            {errors.includes("targetDate") ? <small className="field-error">Podaj datę docelową dla celu wynikowego.</small> : null}
          </label>
        ) : null}
        <label className="field">
          <span>Powiązane habity</span>
          <select
            aria-label="Powiązane habity"
            multiple
            size={5}
            value={linkedHabitIds}
            onChange={(event) => setLinkedHabitIds([...event.target.selectedOptions].map((option) => option.value))}
          >
            {props.habits.map((habit) => <option key={habit.id} value={habit.id}>{habit.title}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Powiązane własne zadania</span>
          <select
            aria-label="Powiązane własne zadania"
            multiple
            size={5}
            value={linkedQuestIds}
            onChange={(event) => setLinkedQuestIds([...event.target.selectedOptions].map((option) => option.value))}
          >
            {props.quests.map((quest) => <option key={quest.id} value={quest.id}>{quest.name}</option>)}
          </select>
        </label>
      </div>
      <button className="primary-button" type="button" onClick={save}>Zapisz cel</button>
    </section>
  );
}
