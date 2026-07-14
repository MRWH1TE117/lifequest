export type BrowserStorageStatus = {
  persistence: "granted" | "notGranted" | "unsupported";
  usage?: number;
  quota?: number;
};

export async function getBrowserStorageStatus(storageManager?: StorageManager): Promise<BrowserStorageStatus> {
  const manager = storageManager ?? globalThis.navigator?.storage;
  if (!manager?.persisted || !manager.estimate) return { persistence: "unsupported" };
  try {
    const [persistent, estimate] = await Promise.all([manager.persisted(), manager.estimate()]);
    return {
      persistence: persistent ? "granted" : "notGranted",
      ...(typeof estimate.usage === "number" ? { usage: estimate.usage } : {}),
      ...(typeof estimate.quota === "number" ? { quota: estimate.quota } : {})
    };
  } catch {
    return { persistence: "unsupported" };
  }
}

export async function requestPersistentStorage(storageManager?: StorageManager): Promise<BrowserStorageStatus> {
  const manager = storageManager ?? globalThis.navigator?.storage;
  if (!manager?.persist || !manager.estimate) return { persistence: "unsupported" };
  try {
    const [persistent, estimate] = await Promise.all([manager.persist(), manager.estimate()]);
    return {
      persistence: persistent ? "granted" : "notGranted",
      ...(typeof estimate.usage === "number" ? { usage: estimate.usage } : {}),
      ...(typeof estimate.quota === "number" ? { quota: estimate.quota } : {})
    };
  } catch {
    return { persistence: "unsupported" };
  }
}
