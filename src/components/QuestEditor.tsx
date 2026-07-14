import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { LIFE_STATS, type LifeStat, type Quest, type QuestDifficulty, type QuestType } from "../domain/model";
import { getDefaultXp } from "../domain/xp";
import { areaLabel } from "../domain/labels";

export function QuestEditor(props: {
  quests: Quest[];
  onCreateDraft: () => Quest;
  onSaveQuest: (quest: Quest) => void;
  onDeleteQuest: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Quest | null>(props.quests[0] ?? null);

  function updateDraft(changes: Partial<Quest>) {
    setDraft((current) => {
      if (!current) return null;
      const next = { ...current, ...changes };
      if (changes.type || changes.difficulty) {
        next.xp = getDefaultXp(next.difficulty, next.type);
      }
      return next;
    });
  }

  function createQuest() {
    setDraft(props.onCreateDraft());
  }

  function saveQuest() {
    if (draft) props.onSaveQuest(draft);
  }

  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">Własne zadania</p>
          <h2>Zarządzaj własnymi zadaniami</h2>
        </div>
        <button className="primary-button" type="button" onClick={createQuest}>
          <Plus size={17} />
          <span>Nowe zadanie</span>
        </button>
      </div>

      <div className="layout-grid">
        <section className="panel wide">
          <div className="panel-heading">
            <h3>Lista własnych zadań</h3>
            <span>{props.quests.length} zadań</span>
          </div>
          <div className="quest-list compact">
            {props.quests.map((quest) => (
              <button className="quest-select" key={quest.id} type="button" onClick={() => setDraft(quest)}>
                <strong>{quest.name}</strong>
                <span>{areaLabel(quest.lifeStat)} / {quest.type} / {quest.xp} XP</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h3>Edytuj zadanie</h3>
            <span>{draft?.active ? "Aktywne" : "Nieaktywne"}</span>
          </div>
          {draft ? (
            <div className="form-stack">
              <label className="field">
                <span>Nazwa</span>
                <input value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} />
              </label>
              <label className="field">
                <span>Opis</span>
                <textarea value={draft.description} onChange={(event) => updateDraft({ description: event.target.value })} rows={4} />
              </label>
              <label className="field">
                <span>Obszar</span>
                <select value={draft.lifeStat} onChange={(event) => updateDraft({ lifeStat: event.target.value as LifeStat })}>
                  {LIFE_STATS.map((stat) => <option key={stat} value={stat}>{areaLabel(stat)}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Typ</span>
                <select value={draft.type} onChange={(event) => updateDraft({ type: event.target.value as QuestType })}>
                  <option value="daily">Dzienne</option>
                  <option value="weekly">Tygodniowe</option>
                  <option value="boss">Cel główny</option>
                </select>
              </label>
              <label className="field">
                <span>Trudność</span>
                <select value={draft.difficulty} onChange={(event) => updateDraft({ difficulty: event.target.value as QuestDifficulty })}>
                  <option value="easy">Łatwe</option>
                  <option value="medium">Średnie</option>
                  <option value="hard">Trudne</option>
                  <option value="boss">Cel główny</option>
                </select>
              </label>
              <div className="button-row">
                <button className="primary-button" type="button" onClick={saveQuest}>
                  <Save size={17} />
                  <span>Zapisz</span>
                </button>
                <button className="danger-button" type="button" onClick={() => props.onDeleteQuest(draft.id)}>
                  <Trash2 size={17} />
                  <span>Usuń</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="muted">Utwórz albo wybierz zadanie.</p>
          )}
        </section>
      </div>
    </section>
  );
}
