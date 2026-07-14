import type { AppState } from "./model";
import { buildDataSummary, type DataSummary } from "./backup";
import { exportAppState } from "./exportImport";

export type SnapshotReason = "daily" | "manual" | "preImport" | "preRestore";

export type SnapshotRecord = {
  id: string;
  createdAt: string;
  localDate: string;
  reason: SnapshotReason;
  stateJson: string;
  dataVersion: 4;
  summary: DataSummary;
};

export const SNAPSHOT_LIMIT = 7;

export function createSnapshotRecord(input: {
  state: AppState;
  reason: SnapshotReason;
  nowIso: string;
  id: string;
}): SnapshotRecord {
  const date = new Date(input.nowIso);
  const localDate = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");

  return {
    id: input.id,
    createdAt: input.nowIso,
    localDate,
    reason: input.reason,
    stateJson: exportAppState(input.state),
    dataVersion: input.state.settings.dataVersion,
    summary: buildDataSummary(input.state)
  };
}

export function shouldCreateDailySnapshot(records: SnapshotRecord[], stateJson: string, localDate: string): boolean {
  if (records.some((record) => record.reason === "daily" && record.localDate === localDate)) return false;
  const newest = retainNewestSnapshots(records, records.length)[0];
  return newest?.stateJson !== stateJson;
}

export function retainNewestSnapshots(records: SnapshotRecord[], limit = SNAPSHOT_LIMIT): SnapshotRecord[] {
  return [...records].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, limit);
}
