import { describe, expect, it, vi } from "vitest";
import { getBrowserStorageStatus, requestPersistentStorage } from "../../src/storage/browserStorageStatus";

describe("browser storage status", () => {
  it("reads persistence and quota", async () => {
    const manager = {
      persisted: vi.fn().mockResolvedValue(true),
      estimate: vi.fn().mockResolvedValue({ usage: 1024, quota: 4096 })
    } as unknown as StorageManager;
    await expect(getBrowserStorageStatus(manager)).resolves.toEqual({ persistence: "granted", usage: 1024, quota: 4096 });
  });

  it("requests persistence and refreshes estimate", async () => {
    const manager = {
      persist: vi.fn().mockResolvedValue(false),
      estimate: vi.fn().mockResolvedValue({ usage: 10, quota: 100 })
    } as unknown as StorageManager;
    await expect(requestPersistentStorage(manager)).resolves.toEqual({ persistence: "notGranted", usage: 10, quota: 100 });
  });

  it("reports unsupported APIs", async () => {
    await expect(getBrowserStorageStatus(undefined)).resolves.toEqual({ persistence: "unsupported" });
  });
});
