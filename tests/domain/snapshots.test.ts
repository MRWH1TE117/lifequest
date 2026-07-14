import { describe, expect, it } from "vitest";
import { createEmptyState } from "../../src/domain/exportImport";
import {
  createSnapshotRecord,
  retainNewestSnapshots,
  shouldCreateDailySnapshot,
  type SnapshotRecord
} from "../../src/domain/snapshots";

function record(id: string, createdAt: string, reason: SnapshotRecord["reason"] = "manual"): SnapshotRecord {
  return {
    id,
    createdAt,
    localDate: createdAt.slice(0, 10),
    reason,
    stateJson: `state-${id}`,
    dataVersion: 4,
    summary: { goals: 0, weeklyPlans: 0, weeklyReviews: 0, quests: 0, habits: 0, completions: 0, checkIns: 0, dailyPlans: 0, experiments: 0, experimentReviews: 0 }
  };
}

describe("snapshot policy", () => {
  it("creates a complete structural record", () => {
    const state = createEmptyState("Tester", "2026-07-13T10:00:00.000Z");
    const snapshot = createSnapshotRecord({ state, reason: "preImport", nowIso: "2026-07-13T12:00:00.000Z", id: "s1" });
    expect(snapshot.id).toBe("s1");
    expect(snapshot.localDate).toBe("2026-07-13");
    expect(snapshot.reason).toBe("preImport");
    expect(JSON.parse(snapshot.stateJson).profile.name).toBe("Tester");
    expect(snapshot.summary.habits).toBe(100);
  });

  it("allows at most one daily snapshot per date", () => {
    expect(shouldCreateDailySnapshot([], "state", "2026-07-13")).toBe(true);
    expect(shouldCreateDailySnapshot([record("d1", "2026-07-13T08:00:00.000Z", "daily")], "other", "2026-07-13")).toBe(false);
  });

  it("does not create an identical daily snapshot", () => {
    const existing = record("d1", "2026-07-12T08:00:00.000Z", "daily");
    existing.stateJson = "same";
    expect(shouldCreateDailySnapshot([existing], "same", "2026-07-13")).toBe(false);
  });

  it("retains seven newest records without mutating input", () => {
    const records = Array.from({ length: 8 }, (_, index) => record(`s${index}`, `2026-07-${String(index + 1).padStart(2, "0")}T08:00:00.000Z`));
    const retained = retainNewestSnapshots(records);
    expect(retained).toHaveLength(7);
    expect(retained[0].id).toBe("s7");
    expect(retained.at(-1)?.id).toBe("s1");
    expect(records[0].id).toBe("s0");
  });
});
