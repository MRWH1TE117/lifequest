import type { AppState } from "../domain/model";
import { createEmptyState, exportAppState, importAppState } from "../domain/exportImport";
import { updateDataSafetyMetadata } from "./dataSafetyMetadata";

const STORAGE_KEY = "lifequest-rpg-state-v1";

export type SaveStateFailureCode = "quota" | "blocked" | "unknown";
export type SaveStateResult =
  | { ok: true; savedAt: string }
  | { ok: false; code: SaveStateFailureCode; failedAt: string };

export function loadState(storage: Storage = globalThis.localStorage): AppState {
  const existing = storage.getItem(STORAGE_KEY);
  if (!existing) {
    return createEmptyState("Uzytkownik", new Date().toISOString());
  }
  return importAppState(existing);
}

export function saveState(state: AppState, now = new Date(), storage: Storage = globalThis.localStorage): SaveStateResult {
  const timestamp = now.toISOString();
  try {
    const serialized = exportAppState(state);
    storage.setItem(STORAGE_KEY, serialized);
    try { updateDataSafetyMetadata({ lastSuccessfulSaveAt: timestamp }, storage); } catch { /* metadata is best effort */ }
    return { ok: true, savedAt: timestamp };
  } catch (error) {
    try { updateDataSafetyMetadata({ lastSaveErrorAt: timestamp }, storage); } catch { /* storage may be unavailable */ }
    return { ok: false, code: mapStorageError(error), failedAt: timestamp };
  }
}

export function replaceState(rawJson: string, storage: Storage = globalThis.localStorage): AppState {
  const state = importAppState(rawJson);
  const result = saveState(state, new Date(), storage);
  if (!result.ok) throw new Error("Nie udało się zapisać zaimportowanych danych.");
  return state;
}

function mapStorageError(error: unknown): SaveStateFailureCode {
  if (error instanceof DOMException && error.name === "QuotaExceededError") return "quota";
  if (error instanceof DOMException && error.name === "SecurityError") return "blocked";
  return "unknown";
}
