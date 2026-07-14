import { useEffect, useState } from "react";
import type { DataSafetyMetadata } from "../storage/dataSafetyMetadata";
import { getBrowserStorageStatus, requestPersistentStorage, type BrowserStorageStatus } from "../storage/browserStorageStatus";

export function DataStorageStatus(props: { metadata: DataSafetyMetadata }) {
  const [status, setStatus] = useState<BrowserStorageStatus>({ persistence: "unsupported" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getBrowserStorageStatus().then((next) => { setStatus(next); setLoading(false); });
  }, []);

  async function requestPersistence() {
    setLoading(true);
    setStatus(await requestPersistentStorage());
    setLoading(false);
  }

  const persistenceCopy = loading
    ? "Sprawdzanie magazynu…"
    : status.persistence === "granted"
      ? "Trwały magazyn włączony."
      : status.persistence === "notGranted"
        ? "Przeglądarka może automatycznie usunąć dane przy braku miejsca."
        : "Status trwałego magazynu jest niedostępny w tej przeglądarce.";

  return (
    <section className="panel data-status-panel">
      <h3>Stan magazynu</h3>
      <p>{persistenceCopy}</p>
      <p className="muted">Trwały magazyn ogranicza ryzyko automatycznego usunięcia danych przez przeglądarkę, ale nie zastępuje kopii JSON.</p>
      {status.persistence === "notGranted" ? (
        <button type="button" className="secondary-button" onClick={() => void requestPersistence()} disabled={loading}>
          Poproś o trwały magazyn
        </button>
      ) : null}
      {typeof status.usage === "number" && typeof status.quota === "number" ? (
        <p className="muted">Użycie: {formatMegabytes(status.usage)} MB z {formatMegabytes(status.quota)} MB</p>
      ) : null}
      <dl className="data-meta-list">
        <div><dt>Ostatni udany zapis</dt><dd>{formatDateTime(props.metadata.lastSuccessfulSaveAt)}</dd></div>
        <div><dt>Ostatni eksport</dt><dd>{formatDateTime(props.metadata.lastExportAt)}</dd></div>
        {props.metadata.lastExportFileName ? <div><dt>Ostatni plik</dt><dd className="file-name">{props.metadata.lastExportFileName}</dd></div> : null}
      </dl>
    </section>
  );
}

function formatMegabytes(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 2 : 1);
}

function formatDateTime(value?: string): string {
  if (!value) return "Brak";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Brak" : date.toLocaleString("pl-PL");
}
