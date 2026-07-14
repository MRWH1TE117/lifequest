import type { AppState } from "../domain/model";
import {
  createSnapshotRecord,
  retainNewestSnapshots,
  shouldCreateDailySnapshot,
  SNAPSHOT_LIMIT,
  type SnapshotReason,
  type SnapshotRecord
} from "../domain/snapshots";
import { exportAppState } from "../domain/exportImport";

const DATABASE_NAME = "lifequest-rpg-backups-v1";
const STORE_NAME = "snapshots";

export interface SnapshotRepository {
  list(): Promise<SnapshotRecord[]>;
  put(record: SnapshotRecord): Promise<void>;
  delete(id: string): Promise<void>;
}

export class SnapshotStorageUnavailableError extends Error {
  constructor() {
    super("Lokalne snapshoty są niedostępne w tej przeglądarce.");
    this.name = "SnapshotStorageUnavailableError";
  }
}

export function createIndexedDbSnapshotRepository(factory?: IDBFactory): SnapshotRepository {
  const resolvedFactory = factory ?? globalThis.indexedDB;
  if (!resolvedFactory) return unavailableRepository();

  return {
    async list() {
      const database = await openDatabase(resolvedFactory);
      return requestResult<SnapshotRecord[]>(database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll());
    },
    async put(record) {
      const database = await openDatabase(resolvedFactory);
      await transactionComplete(database, "readwrite", (store) => store.put(record));
    },
    async delete(id) {
      const database = await openDatabase(resolvedFactory);
      await transactionComplete(database, "readwrite", (store) => store.delete(id));
    }
  };
}

export async function addSnapshot(
  repository: SnapshotRepository,
  state: AppState,
  reason: SnapshotReason,
  now: Date,
  id: string = crypto.randomUUID()
): Promise<SnapshotRecord> {
  try {
    const record = createSnapshotRecord({ state, reason, nowIso: now.toISOString(), id });
    await repository.put(record);
    const all = await repository.list();
    const retained = retainNewestSnapshots(all, SNAPSHOT_LIMIT);
    const retainedIds = new Set(retained.map((item) => item.id));
    await Promise.all(all.filter((item) => !retainedIds.has(item.id)).map((item) => repository.delete(item.id)));
    return record;
  } catch (error) {
    if (error instanceof SnapshotStorageUnavailableError) throw error;
    throw new SnapshotStorageUnavailableError();
  }
}

export async function createDailySnapshotIfNeeded(
  repository: SnapshotRepository,
  state: AppState,
  now: Date,
  id: string = crypto.randomUUID()
): Promise<SnapshotRecord | undefined> {
  try {
    const records = await repository.list();
    const stateJson = exportAppState(state);
    const localDate = toLocalDateString(now);
    if (!shouldCreateDailySnapshot(records, stateJson, localDate)) return undefined;
    return addSnapshot(repository, state, "daily", now, id);
  } catch (error) {
    if (error instanceof SnapshotStorageUnavailableError) throw error;
    throw new SnapshotStorageUnavailableError();
  }
}

export async function listSnapshots(repository: SnapshotRepository): Promise<SnapshotRecord[]> {
  try {
    return retainNewestSnapshots(await repository.list());
  } catch {
    throw new SnapshotStorageUnavailableError();
  }
}

function unavailableRepository(): SnapshotRepository {
  const fail = async () => { throw new SnapshotStorageUnavailableError(); };
  return { list: fail, put: fail, delete: fail };
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionComplete(database: IDBDatabase, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    operation(transaction.objectStore(STORE_NAME));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
