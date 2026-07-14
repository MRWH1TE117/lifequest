import { describe, expect, it } from "vitest";
import { createEmptyState } from "../../src/domain/exportImport";
import { loadState, saveState } from "../../src/storage/storage";
import { readDataSafetyMetadata } from "../../src/storage/dataSafetyMetadata";

describe("state storage", () => {
  it("returns a successful save result and metadata", () => {
    const storage = memoryStorage();
    const state = createEmptyState("Tester", "2026-07-13T10:00:00.000Z");
    expect(saveState(state, new Date("2026-07-13T12:00:00.000Z"), storage)).toEqual({ ok: true, savedAt: "2026-07-13T12:00:00.000Z" });
    expect(loadState(storage).profile.name).toBe("Tester");
    expect(readDataSafetyMetadata(storage).lastSuccessfulSaveAt).toBe("2026-07-13T12:00:00.000Z");
  });

  it("maps quota and security failures without throwing", () => {
    const state = createEmptyState("Tester", "2026-07-13T10:00:00.000Z");
    const quotaStorage = { getItem: () => null, setItem: () => { throw new DOMException("full", "QuotaExceededError"); } } as unknown as Storage;
    const blockedStorage = { getItem: () => null, setItem: () => { throw new DOMException("blocked", "SecurityError"); } } as unknown as Storage;
    expect(saveState(state, new Date("2026-07-13T12:00:00.000Z"), quotaStorage)).toEqual({ ok: false, code: "quota", failedAt: "2026-07-13T12:00:00.000Z" });
    expect(saveState(state, new Date("2026-07-13T12:00:00.000Z"), blockedStorage)).toEqual({ ok: false, code: "blocked", failedAt: "2026-07-13T12:00:00.000Z" });
  });
});

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); }
  };
}
