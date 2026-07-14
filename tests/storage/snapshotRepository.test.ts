import { describe, expect, it } from "vitest";
import { createEmptyState } from "../../src/domain/exportImport";
import type { SnapshotRecord } from "../../src/domain/snapshots";
import {
  SnapshotStorageUnavailableError,
  addSnapshot,
  createDailySnapshotIfNeeded,
  listSnapshots,
  type SnapshotRepository
} from "../../src/storage/snapshotRepository";

function memoryRepository(fail = false): SnapshotRepository & { records: SnapshotRecord[] } {
  return {
    records: [],
    async list() {
      if (fail) throw new Error("unavailable");
      return [...this.records];
    },
    async put(record) {
      if (fail) throw new Error("unavailable");
      this.records = [...this.records.filter((item) => item.id !== record.id), record];
    },
    async delete(id) {
      if (fail) throw new Error("unavailable");
      this.records = this.records.filter((item) => item.id !== id);
    }
  };
}

describe("snapshot repository service", () => {
  it("adds records and physically retains seven newest", async () => {
    const repository = memoryRepository();
    const state = createEmptyState("Tester", "2026-07-01T08:00:00.000Z");
    for (let day = 1; day <= 8; day += 1) {
      await addSnapshot(repository, state, "manual", new Date(`2026-07-${String(day).padStart(2, "0")}T08:00:00.000Z`), `s${day}`);
    }
    expect(repository.records).toHaveLength(7);
    expect((await listSnapshots(repository)).map((item) => item.id)).toEqual(["s8", "s7", "s6", "s5", "s4", "s3", "s2"]);
  });

  it("deduplicates daily snapshots", async () => {
    const repository = memoryRepository();
    const state = createEmptyState("Tester", "2026-07-13T08:00:00.000Z");
    expect(await createDailySnapshotIfNeeded(repository, state, new Date("2026-07-13T08:00:00.000Z"), "d1")).toBeDefined();
    expect(await createDailySnapshotIfNeeded(repository, state, new Date("2026-07-13T18:00:00.000Z"), "d2")).toBeUndefined();
    expect(repository.records).toHaveLength(1);
  });

  it("maps backend failures to a safe storage error", async () => {
    const repository = memoryRepository(true);
    const state = createEmptyState("Tester", "2026-07-13T08:00:00.000Z");
    await expect(addSnapshot(repository, state, "manual", new Date("2026-07-13T08:00:00.000Z"), "s1"))
      .rejects.toBeInstanceOf(SnapshotStorageUnavailableError);
  });
});
