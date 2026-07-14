import { Download, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppState } from "../domain/model";
import { analyzeImport, buildBackupFileName, createBackupEnvelope, serializeBackup, type ImportPreview } from "../domain/backup";
import type { SnapshotRecord } from "../domain/snapshots";
import { APP_VERSION } from "../version";
import {
  SnapshotStorageUnavailableError,
  addSnapshot,
  listSnapshots,
  type SnapshotRepository
} from "../storage/snapshotRepository";
import { readDataSafetyMetadata, updateDataSafetyMetadata, type DataSafetyMetadata } from "../storage/dataSafetyMetadata";
import { DataStorageStatus } from "./DataStorageStatus";
import { SnapshotList } from "./SnapshotList";

export function DataPortability(props: { state: AppState; onReplaceState: (state: AppState) => void; snapshotRepository: SnapshotRepository }) {
  const [rawJson, setRawJson] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<ImportPreview>();
  const [restore, setRestore] = useState<{ snapshot: SnapshotRecord; preview: ImportPreview }>();
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(true);
  const [snapshotsUnavailable, setSnapshotsUnavailable] = useState(false);
  const [manualBackupInitiated, setManualBackupInitiated] = useState(false);
  const [snapshotBlocked, setSnapshotBlocked] = useState(false);
  const [metadata, setMetadata] = useState<DataSafetyMetadata>(() => readDataSafetyMetadata());

  useEffect(() => { void refreshSnapshots(); }, []);

  async function refreshSnapshots() {
    setSnapshotsLoading(true);
    try {
      setSnapshots(await listSnapshots(props.snapshotRepository));
      setSnapshotsUnavailable(false);
    } catch {
      setSnapshotsUnavailable(true);
    } finally {
      setSnapshotsLoading(false);
    }
  }

  function exportJson() {
    const exportedAt = new Date().toISOString();
    const fileName = buildBackupFileName(exportedAt);
    const bundle = serializeBackup(createBackupEnvelope(props.state, APP_VERSION, exportedAt));
    downloadJson(bundle, fileName);
    const nextMetadata = updateDataSafetyMetadata({ lastExportAt: exportedAt, lastExportFileName: fileName });
    setMetadata(nextMetadata);
    setManualBackupInitiated(true);
    setMessage("Pobieranie kopii zostało uruchomione.");
  }

  async function importFile(file: File | null) {
    if (!file) return;
    try { analyze(await file.text()); } catch (error) { showError(error, "Analiza pliku nie powiodła się."); }
  }

  function analyze(raw: string = rawJson) {
    try {
      setPreview(analyzeImport(raw));
      setRestore(undefined);
      setSnapshotBlocked(false);
      setMessage("Kopia została przeanalizowana. Aktywne dane nie zostały zmienione.");
    } catch (error) {
      showError(error, "Analiza importu nie powiodła się.");
    }
  }

  async function confirmImport(withManualFallback = false) {
    if (!preview) return;
    if (!withManualFallback) {
      try {
        await addSnapshot(props.snapshotRepository, props.state, "preImport", new Date());
      } catch (error) {
        if (error instanceof SnapshotStorageUnavailableError) {
          setSnapshotBlocked(true);
          setMessage("Import został zablokowany: nie udało się utworzyć snapshotu bezpieczeństwa.");
          return;
        }
        throw error;
      }
    }
    props.onReplaceState(preview.normalizedState);
    setPreview(undefined);
    setRawJson("");
    setSnapshotBlocked(false);
    setMessage("Import zakończony. Poprzednie dane zostały zabezpieczone.");
    await refreshSnapshots();
  }

  async function createManualSnapshot() {
    try {
      await addSnapshot(props.snapshotRepository, props.state, "manual", new Date());
      setMessage("Snapshot ręczny został utworzony.");
      await refreshSnapshots();
    } catch (error) { showError(error, "Nie udało się utworzyć snapshotu."); }
  }

  function selectRestore(snapshot: SnapshotRecord) {
    try {
      setRestore({ snapshot, preview: analyzeImport(snapshot.stateJson) });
      setPreview(undefined);
      setMessage("Snapshot jest gotowy do przywrócenia. Dane nie zostały jeszcze zmienione.");
    } catch (error) { showError(error, "Snapshot jest uszkodzony i nie może zostać przywrócony."); }
  }

  async function confirmRestore() {
    if (!restore) return;
    try {
      await addSnapshot(props.snapshotRepository, props.state, "preRestore", new Date());
      props.onReplaceState(restore.preview.normalizedState);
      setRestore(undefined);
      setMessage("Snapshot został przywrócony. Stan sprzed operacji zapisano jako preRestore.");
      await refreshSnapshots();
    } catch (error) { showError(error, "Przywracanie zostało zablokowane, ponieważ nie udało się zapisać preRestore."); }
  }

  function showError(error: unknown, fallback: string) {
    setMessage(error instanceof Error ? error.message : fallback);
  }

  return (
    <section className="screen data-safety-screen">
      <div className="screen-header"><div><p className="eyebrow">Dane</p><h2>Bezpieczeństwo danych</h2></div></div>
      <div className="layout-grid data-safety-grid">
        <DataStorageStatus metadata={metadata} />
        <section className="panel">
          <h3>Eksport kopii</h3>
          <p className="muted">Pobierz wersjonowaną kopię z datą w nazwie i zapisz ją ręcznie w folderze synchronizowanym przez Syncthing.</p>
          <button className="primary-button full" type="button" onClick={exportJson}><Download size={17} /><span>Eksportuj kopię JSON</span></button>
        </section>
        <section className="panel wide import-panel">
          <h3>Import kopii</h3>
          <label className="field"><span>Wybierz plik JSON</span><input type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0] ?? null)} /></label>
          <label className="field"><span>Albo wklej JSON</span><textarea value={rawJson} onChange={(event) => setRawJson(event.target.value)} rows={7} placeholder="{ ... }" /></label>
          <button className="secondary-button" type="button" onClick={() => analyze()} disabled={!rawJson.trim()}><Upload size={17} /><span>Przeanalizuj kopię</span></button>
          {preview ? <PreviewPanel preview={preview} actionLabel="Zastąp dane i zachowaj kopię" onCancel={() => setPreview(undefined)} onConfirm={() => void confirmImport()} /> : null}
          {snapshotBlocked ? (
            <div className="danger-box" role="alert">
              <p>Snapshot IndexedDB jest niedostępny. Najpierw uruchom ręczny eksport bieżących danych.</p>
              <button className="secondary-button" type="button" onClick={exportJson}>Pobierz kopię bezpieczeństwa</button>
              <button className="danger-button" type="button" disabled={!manualBackupInitiated} onClick={() => void confirmImport(true)}>Importuj po ręcznej kopii</button>
            </div>
          ) : null}
        </section>
        <SnapshotList snapshots={snapshots} loading={snapshotsLoading} unavailable={snapshotsUnavailable} onCreateManual={() => void createManualSnapshot()} onSelectRestore={selectRestore} />
        {restore ? (
          <section className="panel wide restore-panel">
            <PreviewPanel preview={restore.preview} actionLabel="Przywróć snapshot i zachowaj obecny stan" onCancel={() => setRestore(undefined)} onConfirm={() => void confirmRestore()} />
          </section>
        ) : null}
      </div>
      {message ? <p className="status-message" role="status">{message}</p> : null}
    </section>
  );
}

function PreviewPanel(props: { preview: ImportPreview; actionLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const summary = props.preview.summary;
  return (
    <div className="import-preview" tabIndex={-1}>
      <h4>Podgląd danych</h4>
      <p><strong>Format:</strong> {props.preview.sourceFormat === "backup-v1" ? "Kopia LifeQuest v1" : "Starszy plik LifeQuest"}</p>
      <p><strong>Wersja danych:</strong> {props.preview.sourceDataVersion}</p>
      {props.preview.exportedAt ? <p><strong>Eksport:</strong> {new Date(props.preview.exportedAt).toLocaleString("pl-PL")}</p> : null}
      <dl className="data-summary-list">
        <div><dt>Cele</dt><dd>{summary.goals}</dd></div><div><dt>Plany tygodniowe</dt><dd>{summary.weeklyPlans}</dd></div>
        <div><dt>Eksperymenty</dt><dd>{summary.experiments}</dd></div><div><dt>Przeglądy eksperymentów</dt><dd>{summary.experimentReviews}</dd></div>
        <div><dt>Wykonania</dt><dd>{summary.completions}</dd></div><div><dt>Check-iny</dt><dd>{summary.checkIns}</dd></div>
        <div><dt>Zakres aktywności</dt><dd>{summary.earliestActivityDate ? `${summary.earliestActivityDate} – ${summary.latestActivityDate}` : "Brak"}</dd></div>
      </dl>
      {props.preview.warnings.includes("legacyFormat") ? <p className="muted">Starszy format zostanie znormalizowany podczas importu.</p> : null}
      {props.preview.warnings.includes("dataMigration") ? <p className="muted">Dane zostaną zmigrowane do bieżącej wersji.</p> : null}
      <p className="danger-copy">Ta operacja zastąpi wszystkie obecne dane.</p>
      <div className="button-row"><button type="button" className="secondary-button" onClick={props.onCancel}>Anuluj</button><button type="button" className="danger-button" onClick={props.onConfirm}>{props.actionLabel}</button></div>
    </div>
  );
}

function downloadJson(bundle: string, fileName: string) {
  const blob = new Blob([bundle], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
