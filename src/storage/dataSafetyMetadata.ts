export const DATA_SAFETY_META_KEY = "lifequest-rpg-data-safety-meta-v1";

export type DataSafetyMetadata = {
  schemaVersion: 1;
  lastExportAt?: string;
  lastExportFileName?: string;
  lastSuccessfulSaveAt?: string;
  lastSaveErrorAt?: string;
};

export function readDataSafetyMetadata(storage: Storage = globalThis.localStorage): DataSafetyMetadata {
  try {
    const raw = storage.getItem(DATA_SAFETY_META_KEY);
    if (!raw) return { schemaVersion: 1 };
    const parsed = JSON.parse(raw) as Partial<DataSafetyMetadata>;
    if (parsed.schemaVersion !== 1) return { schemaVersion: 1 };
    return {
      schemaVersion: 1,
      ...(typeof parsed.lastExportAt === "string" ? { lastExportAt: parsed.lastExportAt } : {}),
      ...(typeof parsed.lastExportFileName === "string" ? { lastExportFileName: parsed.lastExportFileName } : {}),
      ...(typeof parsed.lastSuccessfulSaveAt === "string" ? { lastSuccessfulSaveAt: parsed.lastSuccessfulSaveAt } : {}),
      ...(typeof parsed.lastSaveErrorAt === "string" ? { lastSaveErrorAt: parsed.lastSaveErrorAt } : {})
    };
  } catch {
    return { schemaVersion: 1 };
  }
}

export function updateDataSafetyMetadata(
  patch: Partial<Omit<DataSafetyMetadata, "schemaVersion">>,
  storage: Storage = globalThis.localStorage
): DataSafetyMetadata {
  const next = { ...readDataSafetyMetadata(storage), ...patch, schemaVersion: 1 as const };
  storage.setItem(DATA_SAFETY_META_KEY, JSON.stringify(next));
  return next;
}
