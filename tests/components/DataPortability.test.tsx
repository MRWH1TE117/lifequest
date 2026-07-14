import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataPortability } from "../../src/components/DataPortability";
import { createEmptyState, exportAppState } from "../../src/domain/exportImport";
import type { SnapshotRecord } from "../../src/domain/snapshots";
import type { SnapshotRepository } from "../../src/storage/snapshotRepository";

function repository(failing = false): SnapshotRepository & { records: SnapshotRecord[] } {
  return {
    records: [],
    async list() { if (failing) throw new Error("fail"); return this.records; },
    async put(record) { if (failing) throw new Error("fail"); this.records.push(record); },
    async delete(id) { this.records = this.records.filter((item) => item.id !== id); }
  };
}

describe("DataPortability", () => {
  it("previews without mutation and snapshots before confirmed import", async () => {
    const user = userEvent.setup();
    const current = createEmptyState("Current", "2026-07-13T10:00:00.000Z");
    const imported = createEmptyState("Imported", "2026-07-13T11:00:00.000Z");
    const onReplaceState = vi.fn();
    const repo = repository();
    render(<DataPortability state={current} onReplaceState={onReplaceState} snapshotRepository={repo} />);

    fireEvent.change(screen.getByLabelText("Albo wklej JSON"), { target: { value: exportAppState(imported) } });
    await user.click(screen.getByRole("button", { name: "Przeanalizuj kopię" }));
    expect(await screen.findByRole("heading", { name: "Podgląd danych" })).toBeVisible();
    expect(onReplaceState).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Zastąp dane i zachowaj kopię" }));
    await waitFor(() => expect(onReplaceState).toHaveBeenCalledWith(expect.objectContaining({ profile: expect.objectContaining({ name: "Imported" }) })));
    expect(repo.records.some((item) => item.reason === "preImport")).toBe(true);
  });

  it("blocks import when the required snapshot is unavailable", async () => {
    const user = userEvent.setup();
    const current = createEmptyState("Current", "2026-07-13T10:00:00.000Z");
    const onReplaceState = vi.fn();
    render(<DataPortability state={current} onReplaceState={onReplaceState} snapshotRepository={repository(true)} />);
    fireEvent.change(screen.getByLabelText("Albo wklej JSON"), {
      target: { value: exportAppState(createEmptyState("Imported", "2026-07-13T11:00:00.000Z")) }
    });
    await user.click(screen.getByRole("button", { name: "Przeanalizuj kopię" }));
    await user.click(screen.getByRole("button", { name: "Zastąp dane i zachowaj kopię" }));
    expect(await screen.findByText(/Import został zablokowany/)).toBeVisible();
    expect(onReplaceState).not.toHaveBeenCalled();
  });
});
