import { useState } from "react";
import { BookOpen, CheckCircle2, Circle } from "lucide-react";
import { filterHabits, type HabitFilters } from "../domain/habitLibrary";
import { areaLabel } from "../domain/labels";
import type { Habit, HabitCategory, HabitDifficulty } from "../domain/model";

const CATEGORY_OPTIONS: Array<HabitCategory | "all"> = [
  "all",
  "Finanse",
  "Rozwoj",
  "Umysl",
  "Energia",
  "Cialo",
  "Porzadek",
  "Relacje",
  "Skupienie"
];

const DIFFICULTY_OPTIONS: Array<HabitDifficulty | "all"> = ["all", "light", "normal", "strong"];
const MAX_MINUTES_OPTIONS: Array<5 | 10 | 15 | 25 | "all"> = ["all", 5, 10, 15, 25];
const STATUS_OPTIONS = ["all", "enabled", "disabled"] as const;

type HabitFilterState = {
  category: HabitCategory | "all";
  difficulty: HabitDifficulty | "all";
  maxMinutes: 5 | 10 | 15 | 25 | "all";
  enabled: (typeof STATUS_OPTIONS)[number];
};

function difficultyLabel(difficulty: HabitDifficulty): string {
  if (difficulty === "light") return "lekki";
  if (difficulty === "normal") return "normalny";
  return "mocny";
}

export function HabitLibrary(props: {
  habits: Habit[];
  onToggleHabit: (id: string, enabled: boolean) => void;
}) {
  const [filters, setFilters] = useState<HabitFilterState>({
    category: "all",
    difficulty: "all",
    maxMinutes: "all",
    enabled: "all"
  });
  const habitFilters: HabitFilters = {};

  if (filters.category !== "all") habitFilters.category = filters.category;
  if (filters.difficulty !== "all") habitFilters.difficulty = filters.difficulty;
  if (filters.maxMinutes !== "all") habitFilters.maxMinutes = filters.maxMinutes;
  if (filters.enabled !== "all") habitFilters.enabled = filters.enabled === "enabled";

  const visibleHabits = filterHabits(props.habits, habitFilters);
  const enabledCount = props.habits.filter((habit) => habit.enabled).length;
  const selectedCategoryEnabledCount =
    filters.category === "all"
      ? undefined
      : props.habits.filter((habit) => habit.category === filters.category && habit.enabled).length;

  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">Baza rekomendacji</p>
          <h2>Habity</h2>
        </div>
        <div className="xp-badge">
          <BookOpen size={18} />
          <span>{enabledCount}/{props.habits.length} aktywne</span>
        </div>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Profesjonalna biblioteka</h3>
            <p className="muted">Aktywne habity mogą trafiać do automatycznego planu dnia.</p>
          </div>
        </div>
        <p className="muted">
          Pokazuje {visibleHabits.length} z {props.habits.length} habitów.
          {filters.category !== "all" && selectedCategoryEnabledCount !== undefined
            ? ` W kategorii ${areaLabel(filters.category)} łącznie aktywne: ${selectedCategoryEnabledCount}.`
            : ""}
        </p>
        <div className="filter-bar">
          <label>
            <span>Kategoria habitów</span>
            <select
              aria-label="Kategoria habitów"
              value={filters.category}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  category: event.target.value as HabitFilterState["category"]
                }))
              }
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "Wszystkie" : areaLabel(category)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Trudność habitów</span>
            <select
              aria-label="Trudność habitów"
              value={filters.difficulty}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  difficulty: event.target.value as HabitFilterState["difficulty"]
                }))
              }
            >
              {DIFFICULTY_OPTIONS.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty === "all" ? "Wszystkie" : difficultyLabel(difficulty)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Maksymalny czas habitów</span>
            <select
              aria-label="Maksymalny czas habitów"
              value={filters.maxMinutes}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  maxMinutes:
                    event.target.value === "all"
                      ? "all"
                      : (Number(event.target.value) as HabitFilterState["maxMinutes"])
                }))
              }
            >
              {MAX_MINUTES_OPTIONS.map((maxMinutes) => (
                <option key={maxMinutes} value={maxMinutes}>
                  {maxMinutes === "all" ? "Dowolny" : `${maxMinutes} min`}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Status habitów</span>
            <select
              aria-label="Status habitów"
              value={filters.enabled}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  enabled: event.target.value as HabitFilterState["enabled"]
                }))
              }
            >
              <option value="all">Wszystkie</option>
              <option value="enabled">Aktywne</option>
              <option value="disabled">Wyłączone</option>
            </select>
          </label>
        </div>
        <div className="habit-grid">
          {visibleHabits.map((habit) => (
            <article className="habit-card" key={habit.id}>
              <div className="habit-card-main">
                <button
                  className={habit.enabled ? "icon-toggle active" : "icon-toggle"}
                  type="button"
                  onClick={() => props.onToggleHabit(habit.id, !habit.enabled)}
                  aria-label={habit.enabled ? "Wyłącz habit" : "Włącz habit"}
                  title={habit.enabled ? "Wyłącz habit" : "Włącz habit"}
                >
                  {habit.enabled ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div>
                  <h3>{habit.title}</h3>
                  <p>{habit.description}</p>
                  <div className="meta-line">
                    <span>{areaLabel(habit.category)}</span>
                    <span>{difficultyLabel(habit.difficulty)}</span>
                    <span>{habit.estimatedMinutes} min</span>
                    <span>{habit.xp} XP</span>
                  </div>
                </div>
              </div>
              <div className="source-box">
                <strong>{habit.sourceName}</strong>
                <p>{habit.sourceNote}</p>
                <a href={habit.sourceUrl} target="_blank" rel="noreferrer">
                  Źródło
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
