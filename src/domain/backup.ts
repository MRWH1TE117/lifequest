import type { AppState } from "./model";
import { importAppState } from "./exportImport";

export const BACKUP_FORMAT = "lifequest-backup" as const;
export const BACKUP_FORMAT_VERSION = 1 as const;

export type LifeQuestBackupV1 = {
  format: typeof BACKUP_FORMAT;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  exportedAt: string;
  appVersion: string;
  dataVersion: 4;
  state: AppState;
};

export type DataSummary = {
  goals: number;
  weeklyPlans: number;
  weeklyReviews: number;
  quests: number;
  habits: number;
  completions: number;
  checkIns: number;
  dailyPlans: number;
  experiments: number;
  experimentReviews: number;
  earliestActivityDate?: string;
  latestActivityDate?: string;
};

export type ImportWarning = "legacyFormat" | "dataMigration" | "noActivity";

export type ImportPreview = {
  sourceFormat: "backup-v1" | "legacy-state";
  exportedAt?: string;
  appVersion?: string;
  sourceDataVersion: 1 | 2 | 3 | 4;
  normalizedState: AppState;
  summary: DataSummary;
  warnings: ImportWarning[];
};

export function createBackupEnvelope(state: AppState, appVersion: string, exportedAt: string): LifeQuestBackupV1 {
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt,
    appVersion,
    dataVersion: state.settings.dataVersion,
    state
  };
}

export function serializeBackup(backup: LifeQuestBackupV1): string {
  return JSON.stringify(backup, null, 2);
}

export function buildBackupFileName(exportedAt: string): string {
  const date = new Date(exportedAt);
  if (Number.isNaN(date.getTime())) throw new Error("Nieprawidłowa data eksportu");
  const iso = date.toISOString();
  const day = iso.slice(0, 10);
  const time = iso.slice(11, 19).replaceAll(":", "");
  return `lifequest-backup-${day}-${time}.json`;
}

export function buildDataSummary(state: AppState): DataSummary {
  const dates = [
    ...state.dailyPlans.map((item) => item.localDate),
    ...state.dayStates.map((item) => item.localDate),
    ...state.completions.map((item) => item.completedAt.slice(0, 10)),
    ...state.checkIns.map((item) => item.localDate),
    ...state.weeklyPlans.map((item) => item.weekStart),
    ...state.weeklyReviews.map((item) => item.weekStart),
    ...state.experiments.map((item) => item.startDate)
  ].filter(isLocalDate).sort();
  return {
    goals: state.goals.length,
    weeklyPlans: state.weeklyPlans.length,
    weeklyReviews: state.weeklyReviews.length,
    quests: state.quests.length,
    habits: state.habits.length,
    completions: state.completions.length,
    checkIns: state.checkIns.length,
    dailyPlans: state.dailyPlans.length,
    experiments: state.experiments.length,
    experimentReviews: state.experimentReviews.length,
    ...(dates.length > 0 ? { earliestActivityDate: dates[0], latestActivityDate: dates[dates.length - 1] } : {})
  };
}

export function analyzeImport(rawJson: string): ImportPreview {
  const parsed = JSON.parse(rawJson) as Record<string, unknown>;
  let sourceFormat: ImportPreview["sourceFormat"];
  let exportedAt: string | undefined;
  let appVersion: string | undefined;
  let rawState: unknown;

  if (parsed?.format === BACKUP_FORMAT) {
    if (parsed.formatVersion !== BACKUP_FORMAT_VERSION) {
      throw new Error("Nieobsługiwana wersja kopii LifeQuest");
    }
    sourceFormat = "backup-v1";
    exportedAt = typeof parsed.exportedAt === "string" ? parsed.exportedAt : undefined;
    appVersion = typeof parsed.appVersion === "string" ? parsed.appVersion : undefined;
    rawState = parsed.state;
  } else {
    sourceFormat = "legacy-state";
    rawState = parsed;
  }

  const sourceDataVersion = getSourceDataVersion(rawState);
  const normalizedState = importAppState(JSON.stringify(rawState));
  const summary = buildDataSummary(normalizedState);
  const warnings: ImportWarning[] = [];
  if (sourceFormat === "legacy-state") warnings.push("legacyFormat");
  if (sourceDataVersion < 4) warnings.push("dataMigration");
  if (!summary.earliestActivityDate) warnings.push("noActivity");

  return {
    sourceFormat,
    exportedAt,
    appVersion,
    sourceDataVersion,
    normalizedState,
    summary,
    warnings
  };
}

function getSourceDataVersion(rawState: unknown): 1 | 2 | 3 | 4 {
  const version = (rawState as { settings?: { dataVersion?: unknown } } | undefined)?.settings?.dataVersion;
  if (version === 1 || version === 2 || version === 3 || version === 4) return version;
  // Delegate the user-facing validation message to the canonical importer.
  importAppState(JSON.stringify(rawState));
  throw new Error("Nieprawidlowy plik danych LifeQuest");
}

function isLocalDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
