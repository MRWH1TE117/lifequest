import { describe, expect, it } from "vitest";
import { readDataSafetyMetadata, updateDataSafetyMetadata } from "../../src/storage/dataSafetyMetadata";

describe("data safety metadata", () => {
  it("defaults malformed metadata safely", () => {
    const storage = memoryStorage();
    storage.setItem("lifequest-rpg-data-safety-meta-v1", "bad-json");
    expect(readDataSafetyMetadata(storage)).toEqual({ schemaVersion: 1 });
  });

  it("merges and persists metadata", () => {
    const storage = memoryStorage();
    updateDataSafetyMetadata({ lastExportAt: "2026-07-13T12:00:00.000Z", lastExportFileName: "backup.json" }, storage);
    updateDataSafetyMetadata({ lastSuccessfulSaveAt: "2026-07-13T12:01:00.000Z" }, storage);
    expect(readDataSafetyMetadata(storage)).toEqual({
      schemaVersion: 1,
      lastExportAt: "2026-07-13T12:00:00.000Z",
      lastExportFileName: "backup.json",
      lastSuccessfulSaveAt: "2026-07-13T12:01:00.000Z"
    });
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
