import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PersonalizationSettings } from "../../src/components/PersonalizationSettings";
import type { Settings } from "../../src/domain/model";

const defaultSettings: Settings = {
  dataVersion: 4,
  priorityCategories: [],
  recoveryActivities: []
};

function ControlledSettings(props: { onChange: (settings: Settings) => void }) {
  const [settings, setSettings] = useState(defaultSettings);

  return (
    <PersonalizationSettings
      settings={settings}
      onChange={(nextSettings) => {
        setSettings(nextSettings);
        props.onChange(nextSettings);
      }}
    />
  );
}

describe("PersonalizationSettings", () => {
  it("limits priority areas to three and saves recovery preferences immediately", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ControlledSettings onChange={onChange} />);

    await user.click(screen.getByLabelText("Energia"));
    await user.click(screen.getByLabelText("Finanse"));
    await user.click(screen.getByLabelText("Relacje"));

    expect(screen.getByLabelText("Rozwój")).toBeDisabled();

    await user.click(screen.getByLabelText("Relacje"));

    expect(screen.getByLabelText("Rozwój")).toBeEnabled();

    await user.click(screen.getByLabelText("Spokojne hobby lub muzyka"));

    expect(onChange).toHaveBeenLastCalledWith({
      dataVersion: 4,
      priorityCategories: ["Energia", "Finanse"],
      recoveryActivities: ["calmHobby"]
    });
  });
});
