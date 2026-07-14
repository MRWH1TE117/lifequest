import type { HabitCategory, RecoveryActivity, Settings } from "../domain/model";

const PRIORITY_OPTIONS: Array<{ value: HabitCategory; label: string }> = [
  { value: "Energia", label: "Energia" },
  { value: "Cialo", label: "Ciało" },
  { value: "Umysl", label: "Umysł" },
  { value: "Skupienie", label: "Skupienie" },
  { value: "Rozwoj", label: "Rozwój" },
  { value: "Finanse", label: "Finanse" },
  { value: "Relacje", label: "Relacje" },
  { value: "Porzadek", label: "Porządek" }
];

const RECOVERY_OPTIONS: Array<{ value: RecoveryActivity; label: string }> = [
  { value: "walk", label: "Spacer lub lekki ruch" },
  { value: "screenBreak", label: "Przerwa od ekranu" },
  { value: "calmHobby", label: "Spokojne hobby lub muzyka" },
  { value: "socialContact", label: "Krótki kontakt społeczny" },
  { value: "breathing", label: "Oddech i wyciszenie" },
  { value: "sleepRoutine", label: "Rutyna snu" },
  { value: "outdoors", label: "Czas na zewnątrz" }
];

const MAX_PRIORITY_CATEGORIES = 3;

export function PersonalizationSettings(props: {
  settings: Settings;
  onChange: (settings: Settings) => void;
}) {
  function togglePriority(category: HabitCategory) {
    const selected = props.settings.priorityCategories.includes(category);
    const priorityCategories = selected
      ? props.settings.priorityCategories.filter((item) => item !== category)
      : [...props.settings.priorityCategories, category].slice(0, MAX_PRIORITY_CATEGORIES);

    props.onChange({
      ...props.settings,
      priorityCategories
    });
  }

  function toggleRecoveryActivity(activity: RecoveryActivity) {
    const selected = props.settings.recoveryActivities.includes(activity);
    const recoveryActivities = selected
      ? props.settings.recoveryActivities.filter((item) => item !== activity)
      : [...props.settings.recoveryActivities, activity];

    props.onChange({
      ...props.settings,
      recoveryActivities
    });
  }

  return (
    <section className="screen personalization-settings">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Generator</p>
          <h2>Personalizacja planu</h2>
        </div>
      </header>

      <fieldset className="settings-fieldset">
        <legend>Priorytetowe obszary</legend>
        <p className="supporting-copy">{props.settings.priorityCategories.length}/3 wybrane</p>
        <div className="settings-checkbox-grid">
          {PRIORITY_OPTIONS.map((option) => {
            const checked = props.settings.priorityCategories.includes(option.value);
            const disabled = !checked && props.settings.priorityCategories.length >= MAX_PRIORITY_CATEGORIES;

            return (
              <label className="settings-checkbox" key={option.value}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => togglePriority(option.value)}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="settings-fieldset">
        <legend>Preferowana regeneracja</legend>
        <div className="settings-checkbox-grid">
          {RECOVERY_OPTIONS.map((option) => (
            <label className="settings-checkbox" key={option.value}>
              <input
                type="checkbox"
                checked={props.settings.recoveryActivities.includes(option.value)}
                onChange={() => toggleRecoveryActivity(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
