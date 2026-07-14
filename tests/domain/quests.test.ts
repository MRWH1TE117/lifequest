import { describe, expect, it } from "vitest";
import { getDueQuests } from "../../src/domain/quests";
import type { Quest, QuestCompletion } from "../../src/domain/model";

describe("own task schedule", () => {
  it("keeps daily tasks due each day", () => {
    expect(getDueQuests([quest("daily")], [completion("2026-07-08")], "2026-07-09")).toHaveLength(1);
  });

  it("hides a weekly task after completion in the current week", () => {
    expect(getDueQuests([quest("weekly")], [completion("2026-07-07")], "2026-07-09")).toHaveLength(0);
    expect(getDueQuests([quest("weekly")], [completion("2026-07-05")], "2026-07-09")).toHaveLength(1);
  });

  it("keeps a main goal hidden after any completion", () => {
    expect(getDueQuests([quest("boss")], [completion("2026-06-01")], "2026-07-09")).toHaveLength(0);
  });
});

function quest(type: Quest["type"]): Quest {
  return {
    id: "custom",
    name: "Własne zadanie",
    description: "",
    lifeStat: "Rozwoj",
    type,
    difficulty: "easy",
    xp: 10,
    active: true,
    createdAt: "2026-07-01T12:00:00.000Z"
  };
}

function completion(localDate: string): QuestCompletion {
  return {
    questId: "custom",
    localDate,
    completedAt: `${localDate}T18:00:00.000Z`,
    xpAwarded: 10,
    lifeStat: "Rozwoj"
  };
}
