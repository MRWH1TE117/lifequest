import { describe, expect, it } from "vitest";
import type { DayIntensity, DayState } from "../../src/domain/model";
import { filterRecoveryTemplates, isRecoveryMode, RECOVERY_TEMPLATES } from "../../src/domain/recovery";

describe("recovery mode", () => {
  it("activates after three light days in the previous five local dates", () => {
    expect(isRecoveryMode(dayStates("light", "light", "normal", "light", "strong"), "2026-07-10")).toBe(true);
    expect(isRecoveryMode(dayStates("light", "normal", "normal", "light", "strong"), "2026-07-10")).toBe(false);
    expect(isRecoveryMode(dayStates("light", "light", "light", "normal", "normal"), "2026-07-20")).toBe(false);
  });

  it("counts unique prior local dates and excludes today plus the sixth prior day", () => {
    const states = [
      dayState("2026-07-04", "light"),
      dayState("2026-07-05", "light"),
      dayState("2026-07-05", "light"),
      dayState("2026-07-06", "light"),
      dayState("2026-07-10", "light"),
      dayState("2026-07-09", "normal")
    ];

    expect(isRecoveryMode(states, "2026-07-10")).toBe(false);
  });

  it("defines seven unique source-backed recovery templates", () => {
    const catalogSummary = RECOVERY_TEMPLATES.map(({ id, activity, sourceName }) => ({
      id,
      activity,
      sourceName
    }));

    expect(RECOVERY_TEMPLATES).toHaveLength(7);
    expect(new Set(RECOVERY_TEMPLATES.map((template) => template.id)).size).toBe(7);
    expect(catalogSummary).toEqual([
      { id: "recovery-walk", activity: "walk", sourceName: "CDC Physical Activity" },
      { id: "recovery-screen-break", activity: "screenBreak", sourceName: "CDC NIOSH Work From Home" },
      { id: "recovery-calm-hobby", activity: "calmHobby", sourceName: "NIMH Caring for Your Mental Health" },
      { id: "recovery-social-contact", activity: "socialContact", sourceName: "HHS Social Connection" },
      { id: "recovery-breathing", activity: "breathing", sourceName: "NCCIH Stress" },
      { id: "recovery-sleep-routine", activity: "sleepRoutine", sourceName: "NHLBI Healthy Sleep" },
      { id: "recovery-outdoors", activity: "outdoors", sourceName: "CDC NIOSH Work From Home" }
    ]);
    expect(RECOVERY_TEMPLATES.every((template) => template.sourceUrl.startsWith("https://"))).toBe(true);
    expect(RECOVERY_TEMPLATES.every((template) => /[ąćęłńóśźż]/i.test(template.sourceNote))).toBe(true);
    expect(RECOVERY_TEMPLATES.every((template) => template.difficulty === "light")).toBe(true);
    expect(RECOVERY_TEMPLATES.every((template) => template.estimatedMinutes >= 5 && template.estimatedMinutes <= 20)).toBe(true);
  });

  it("filters recovery templates by preferred activity", () => {
    const filtered = filterRecoveryTemplates(RECOVERY_TEMPLATES, ["walk", "breathing"]);

    expect(filtered.map((template) => template.activity)).toEqual(["walk", "breathing"]);
  });

  it("returns no recovery templates when all activities are disabled", () => {
    expect(filterRecoveryTemplates(RECOVERY_TEMPLATES, [])).toEqual([]);
  });
});

function dayStates(...intensities: DayIntensity[]): DayState[] {
  return intensities.map((intensity, index) => {
    const day = String(index + 5).padStart(2, "0");

    return dayState(`2026-07-${day}`, intensity);
  });
}

function dayState(localDate: string, intensity: DayIntensity): DayState {
  return {
    localDate,
    intensity,
    energyNote: "",
    generatedPlanId: null,
    updatedAt: `${localDate}T08:00:00.000Z`
  };
}
