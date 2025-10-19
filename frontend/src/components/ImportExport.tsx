import { ChangeEvent } from "react";

interface ImportExportProps {
  onImport: (file: File) => Promise<void>;
  onExport: () => Promise<void>;
  busy?: boolean;
}

export function ImportExport({ onImport, onExport, busy }: ImportExportProps) {
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onImport(file);
    // Reset input value to allow re-importing the same file
    event.target.value = "";
  };

  return (
    <section className="card import-export">
      <h2>Import / Export</h2>
      <div className="import-row">
        <label className="file-upload">
          <span>Importer un CSV</span>
          <input type="file" accept=".csv" onChange={handleFileChange} disabled={busy} />
        </label>
        <button type="button" onClick={onExport} disabled={busy}>
          ⬇️ Exporter
        </button>
      </div>
      <p className="muted">
        Les données sont stockées localement dans <code>data/sentences.csv</code> (colonnes :{" "}
        <code>sentence_text</code>, <code>target_lang</code>, <code>translation_text</code>,{" "}
        <code>translation_lang</code>…).
      </p>
    </section>
  );
}

export default ImportExport;
