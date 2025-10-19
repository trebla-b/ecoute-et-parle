import { useEffect, useMemo, useState } from "react";
import AdminTable from "../components/AdminTable";
import ImportExport from "../components/ImportExport";
import { api } from "../lib/api";
import { Sentence } from "../lib/types";

type DifficultyFilter = "all" | "easy" | "medium" | "hard";

export function AdminView() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api.getSentences({ limit: 500 });
      setSentences(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const filteredSentences = useMemo(() => {
    if (difficultyFilter === "all") return sentences;
    return sentences.filter((sentence) => sentence.difficulty === difficultyFilter);
  }, [sentences, difficultyFilter]);

  const handleCreate = async (data: {
    fr_text: string;
    en_text?: string | null;
    difficulty: string;
    tags?: string;
  }) => {
    await api.createSentence(data);
    await refresh();
  };

  const handleUpdate = async (
    id: string,
    data: {
      fr_text: string;
      en_text?: string | null;
      difficulty: string;
      tags?: string;
    }
  ) => {
    await api.updateSentence(id, data);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette phrase ?")) return;
    await api.deleteSentence(id);
    await refresh();
  };

  const handleImport = async (file: File) => {
    await api.importSentences(file);
    await refresh();
  };

  const handleExport = async () => {
    const blob = await api.exportSentences();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sentences.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  return (
    <section className="admin-view">
      <header className="card admin-intro">
        <h1>Administration</h1>
        <p>
          Ajoutez, mettez à jour et exportez la banque de phrases. Toutes les données restent sur
          votre machine dans <code>data/sentences.csv</code>.
        </p>
        <div className="filters">
          <label>
            Filtrer par difficulté :
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}
            >
              <option value="all">Toutes</option>
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Difficile</option>
            </select>
          </label>
          <button type="button" onClick={refresh} disabled={loading}>
            🔄 Actualiser
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </header>

      <AdminTable
        sentences={filteredSentences}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        loading={loading}
      />

      <ImportExport onImport={handleImport} onExport={handleExport} busy={loading} />
    </section>
  );
}

export default AdminView;
