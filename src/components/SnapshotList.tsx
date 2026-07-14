import type { SnapshotRecord, SnapshotReason } from "../domain/snapshots";

const REASON_LABELS: Record<SnapshotReason, string> = {
  daily: "Kopia dzienna",
  manual: "Kopia ręczna",
  preImport: "Przed importem",
  preRestore: "Przed przywróceniem"
};

export function SnapshotList(props: {
  snapshots: SnapshotRecord[];
  loading: boolean;
  unavailable: boolean;
  onCreateManual: () => void;
  onSelectRestore: (snapshot: SnapshotRecord) => void;
}) {
  return (
    <section className="panel wide snapshot-panel">
      <div className="panel-heading-row">
        <div>
          <h3>Lokalne snapshoty</h3>
          <p className="muted">Maksymalnie siedem kopii przechowywanych wyłącznie w tej przeglądarce.</p>
        </div>
        <button className="secondary-button" type="button" onClick={props.onCreateManual} disabled={props.loading || props.unavailable}>
          Utwórz snapshot teraz
        </button>
      </div>
      {props.unavailable ? <p role="alert" className="status-message error">Lokalne snapshoty są niedostępne. Przed importem pobierz ręczną kopię JSON.</p> : null}
      {!props.unavailable && props.loading ? <p className="muted">Ładowanie snapshotów…</p> : null}
      {!props.unavailable && !props.loading && props.snapshots.length === 0 ? <p className="muted">Nie ma jeszcze lokalnych snapshotów.</p> : null}
      <div className="snapshot-list">
        {props.snapshots.map((snapshot) => (
          <article className="snapshot-card" key={snapshot.id}>
            <div>
              <strong>{REASON_LABELS[snapshot.reason]}</strong>
              <p>{new Date(snapshot.createdAt).toLocaleString("pl-PL")}</p>
              <p className="muted">Cele: {snapshot.summary.goals} · Wykonania: {snapshot.summary.completions} · Check-iny: {snapshot.summary.checkIns}</p>
            </div>
            <button className="secondary-button" type="button" onClick={() => props.onSelectRestore(snapshot)}>Przywróć</button>
          </article>
        ))}
      </div>
    </section>
  );
}
