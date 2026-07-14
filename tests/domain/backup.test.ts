import { describe, expect, it } from "vitest";
import {
  analyzeImport,
  buildBackupFileName,
  buildDataSummary,
  createBackupEnvelope,
  serializeBackup
} from "../../src/domain/backup";
import { createEmptyState } from "../../src/domain/exportImport";

describe("LifeQuest backups", () => {
  it("creates and serializes a versioned backup envelope", () => {
    const state = createEmptyState("Tester", "2026-07-13T10:00:00.000Z");
    const backup = createBackupEnvelope(state, "0.8.0", "2026-07-13T11:45:30.000Z");

    expect(backup).toEqual({
      format: "lifequest-backup",
      formatVersion: 1,
      exportedAt: "2026-07-13T11:45:30.000Z",
      appVersion: "0.8.0",
      dataVersion: 4,
      state
    });
    expect(JSON.parse(serializeBackup(backup))).toEqual(backup);
  });

  it("builds a Windows-safe sortable file name", () => {
    const name = buildBackupFileName("2026-07-13T11:45:30.000Z");
    expect(name).toBe("lifequest-backup-2026-07-13-114530.json");
    expect(name).not.toMatch(/[:*?"<>|]/);
  });

  it("builds a structural summary and activity range", () => {
    const state = createEmptyState("Prywatna nazwa", "2026-07-01T10:00:00.000Z");
    state.dailyPlans = [{ id: "d1", localDate: "2026-07-05", intensity: "normal", mode: "standard", tasks: [], insights: [], createdAt: "2026-07-05T08:00:00.000Z", updatedAt: "2026-07-05T08:00:00.000Z" }];
    state.checkIns = [{ localDate: "2026-07-13", sleepHours: 7, energy: 4, mood: 4, reflection: "Prywatna notatka", updatedAt: "2026-07-13T20:00:00.000Z" }];
    state.completions = [{ questId: "q1", completedAt: "2026-07-10T12:00:00.000Z", localDate: "2026-07-10", xpAwarded: 10, lifeStat: "Rozwoj" }];
    state.experiments = [{
      id: "e1", sourceKind: "habit", linkedHabitId: state.habits[0].id, title: "Prywatny eksperyment", description: "Prywatny opis",
      lifeStat: "Rozwoj", startDate: "2026-07-06", durationDays: 7, scheduledWeekdays: [1], estimatedMinutes: 10,
      contextCue: "Prywatny kontekst", obstacle: "Prywatna przeszkoda", ifThenPlan: "Prywatny plan", status: "completed",
      createdAt: "2026-07-06T08:00:00.000Z", updatedAt: "2026-07-13T08:00:00.000Z", endedAt: "2026-07-13T08:00:00.000Z"
    }];

    expect(buildDataSummary(state)).toEqual({
      goals: 0,
      weeklyPlans: 0,
      weeklyReviews: 0,
      quests: 0,
      habits: 100,
      completions: 1,
      checkIns: 1,
      dailyPlans: 1,
      experiments: 1,
      experimentReviews: 0,
      earliestActivityDate: "2026-07-05",
      latestActivityDate: "2026-07-13"
    });
    expect(JSON.stringify(buildDataSummary(state))).not.toContain("Prywatna");
  });

  it("analyzes backup v1 without mutating its state", () => {
    const state = createEmptyState("Tester", "2026-07-13T10:00:00.000Z");
    const raw = serializeBackup(createBackupEnvelope(state, "0.8.0", "2026-07-13T11:45:30.000Z"));
    const preview = analyzeImport(raw);

    expect(preview.sourceFormat).toBe("backup-v1");
    expect(preview.exportedAt).toBe("2026-07-13T11:45:30.000Z");
    expect(preview.appVersion).toBe("0.8.0");
    expect(preview.sourceDataVersion).toBe(4);
    expect(preview.normalizedState).toEqual(state);
    expect(preview.warnings).toEqual(["noActivity"]);
  });

  it("analyzes a legacy state and reports migration", () => {
    const state = createEmptyState("Tester", "2026-07-13T10:00:00.000Z");
    const legacy = {
      ...state,
      goals: undefined,
      weeklyPlans: undefined,
      weeklyReviews: undefined,
      settings: { dataVersion: 2, priorityCategories: [], recoveryActivities: [] }
    };
    const preview = analyzeImport(JSON.stringify(legacy));

    expect(preview.sourceFormat).toBe("legacy-state");
    expect(preview.sourceDataVersion).toBe(2);
    expect(preview.normalizedState.settings.dataVersion).toBe(4);
    expect(preview.warnings).toEqual(["legacyFormat", "dataMigration", "noActivity"]);
  });

  it("rejects unknown backup versions", () => {
    expect(() => analyzeImport(JSON.stringify({ format: "lifequest-backup", formatVersion: 99, state: {} })))
      .toThrow("Nieobsługiwana wersja kopii LifeQuest");
  });

  it("rejects invalid foreign bundles", () => {
    expect(() => analyzeImport("{\"bad\":true}")).toThrow("Nieprawidlowy plik danych LifeQuest");
  });
});
